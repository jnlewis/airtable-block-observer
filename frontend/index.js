import {
  initializeBlock,
  expandRecord,
  useBase,
  useSettingsButton,
  useGlobalConfig,
  Heading,
  Text,
  TablePicker,
  Box,
  FormField,
  Button,
  Dialog,
} from "@airtable/blocks/ui";
import React, { useState } from "react";
import { session, viewport } from "@airtable/blocks";
import Logger from "./logger";
import Watcher from "./watcher";
import SettingsForm from "./SettingsForm";

var eventsList = [];

let base;
let globalConfig;
let table;
let view;
let viewingTableId;
let hasSetConfigPermission;

function WatcherBlock() {
  // States
  const [isSelectorExpanded, setIsSelectorExpanded] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);

  globalConfig = useGlobalConfig();
  hasSetConfigPermission = globalConfig.checkPermissionsForSet().hasPermission;
  let tableId;
  if (hasSetConfigPermission) {
    tableId = globalConfig.get(`selectedTableId_${getUserId()}`);
  } else {
    tableId = selectedTableId;
  }
  //const viewId = globalConfig.get(`selectedViewId_${getUserId()}`);

  base = useBase();
  table = base.getTableByIdIfExists(tableId);
  //view = table && table.getViewByIdIfExists(viewId);

  // Settings
  useSettingsButton(() => {
    setIsSettingsVisible(!isSettingsVisible);
  });

  // Get events listing
  eventsList = getEvents(tableId);

  // Monitor for changes
  Watcher.watch(
    onViewSelectionChanged,
    onCellSelectionChanged,
    onCellModifying,
    onRecordCreated,
    onRecordUpdated,
    onRecordDeleted
  );

  // Display change messages
  const messages = eventsList.map((event) => {
    return (
      <Message
        key={event.id}
        event={event}
        setDialogMessage={setDialogMessage}
        setIsDialogOpen={setIsDialogOpen}
      />
    );
  });

  return (
    <div>
      {isDialogOpen && (
        <Dialog onClose={() => setIsDialogOpen(false)} width="320px">
          <Dialog.CloseButton />
          <Heading>Switch View</Heading>
          <Text variant="paragraph">{dialogMessage}</Text>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
        </Dialog>
      )}

      {!isSettingsVisible && (
        <div>
          <TableViewSelector
            isSelectorExpanded={isSelectorExpanded}
            setIsSelectorExpanded={setIsSelectorExpanded}
            table={table}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            dialogMessage={dialogMessage}
            hasSetConfigPermission={hasSetConfigPermission}
            setSelectedTableId={setSelectedTableId}
          />

          {messages}

          {messages.length == 0 && (
            <Heading
              variant="caps"
              textColor="light"
              marginBottom={3}
              marginTop={5}
              textAlign="center"
            >
              No activity yet
            </Heading>
          )}
        </div>
      )}

      {isSettingsVisible && (
        <SettingsForm setIsSettingsVisible={setIsSettingsVisible} />
      )}
    </div>
  );
}

function TableViewSelector({
  isSelectorExpanded,
  setIsSelectorExpanded,
  table,
  hasSetConfigPermission,
  setSelectedTableId,
}) {
  let expandLabel = "Select table to view activity";
  if (table) {
    expandLabel = `Activities for ${table.name}`;
    if (view) {
      expandLabel += ` (${view.name})`;
    }
  }

  return (
    <div>
      {isSelectorExpanded && (
        <Box padding={3} borderBottom="thick">
          {/* <FormField label="Table">
              <TablePickerSynced globalConfigKey={`selectedTableId_${getUserId()}`} />
          </FormField>
          <FormField label="View">
              <ViewPickerSynced table={table} globalConfigKey={`selectedViewId_${getUserId()}`} />
          </FormField> */}
          <FormField label="Table">
            {hasSetConfigPermission && (
              <TablePicker
                table={table}
                onChange={(newTable) => {
                  globalConfig.setAsync(
                    `selectedTableId_${getUserId()}`,
                    newTable.id
                  );
                }}
              />
            )}
            {!hasSetConfigPermission && (
              <TablePicker
                table={table}
                onChange={(newTable) => {
                  setSelectedTableId(newTable.id);
                }}
              />
            )}
          </FormField>
        </Box>
      )}
      <div>
        <Button
          onClick={() => {
            setIsSelectorExpanded(!isSelectorExpanded);
          }}
          icon={isSelectorExpanded ? "up" : "down"}
          width="100%"
        >
          {expandLabel}
        </Button>
      </div>
    </div>
  );
}

function Message({ event, setDialogMessage, setIsDialogOpen }) {
  const getMessageDesc = (event) => {
    if (event.action === "create") {
      return (
        <span>
          has created{" "}
          <a
            style={{ cursor: "pointer" }}
            onClick={() => {
              showEventDetails(
                event.recordId,
                setDialogMessage,
                setIsDialogOpen
              );
            }}
          >
            <u>a record</u>
          </a>
        </span>
      );
    }
    if (event.action === "update") {
      return (
        <span>
          has updated{" "}
          <a
            style={{ cursor: "pointer" }}
            onClick={() => {
              showEventDetails(
                event.recordId,
                setDialogMessage,
                setIsDialogOpen
              );
            }}
          >
            <u>{event.primaryValue}</u>
          </a>
        </span>
      );
    }
    if (event.action === "delete") {
      return <span>has deleted {event.primaryValue}</span>;
    }
    return <span></span>;
  };

  const getTimestampDisplay = (event) => {
    let date = new Date(event.timestamp);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div style={{ fontSize: 14, padding: 10, borderBottom: "1px solid #ddd" }}>
      <b>{event.actor}</b> {getMessageDesc(event)}
      <div style={{ paddingTop: 6, fontSize: 11 }}>
        {getTimestampDisplay(event)}
      </div>
    </div>
  );
}

function showEventDetails(recordId, setDialogMessage, setIsDialogOpen) {
  Logger.logInfo(`showEventDetails ${recordId}`);

  if (viewingTableId != table.id) {
    setDialogMessage(
      `Please switch to ${table.name} tab to view details of this activity.`
    );
    setIsDialogOpen(true);
  } else {
    const queryResult = table.selectRecords();
    var record = queryResult.getRecordById(recordId);
    if (record) {
      expandRecord(record);
    }
  }
}

function onViewSelectionChanged(selectedTableId, selectedViewId) {
  viewingTableId = selectedTableId;
}

function onCellSelectionChanged(selectedRecordIds, selectedFieldIds) {}

function onCellModifying(recordId, fieldId) {}

// Record Created
function onRecordCreated(event) {
  Logger.logInfo(`onRecordCreated: recordId:${event.recordId}`);

  pushEvent({
    id: new Date().getTime(),
    timestamp: new Date().getTime(),
    tableId: event.tableId,
    viewId: event.viewId,
    actor: getUserName(),
    recordId: event.recordId,
    action: "create",
    primaryValue: "",
    message: `has created a new record.`,
  });
}

// Record Updated
function onRecordUpdated(event) {
  Logger.logInfo(
    `onRecordUpdated: tableId:${event.tableId} viewId:${event.viewId} recordPrimaryValue:${event.recordPrimaryValue} recordId:${event.recordId} fieldId:${event.fieldId}`
  );

  pushEvent({
    id: new Date().getTime(),
    timestamp: new Date().getTime(),
    tableId: event.tableId,
    viewId: event.viewId,
    actor: getUserName(),
    recordId: event.recordId,
    action: "update",
    primaryValue: event.recordPrimaryValue,
    message: `has updated record ${event.recordPrimaryValue}`,
  });
}

// Record Deleted
function onRecordDeleted(event) {
  Logger.logInfo(
    `onRecordDeleted: tableId:${event.tableId} viewId:${event.viewId} recordPrimaryValue:${event.recordPrimaryValue} recordId:${event.recordId}`
  );

  pushEvent({
    id: new Date().getTime(),
    timestamp: new Date().getTime(),
    tableId: event.tableId,
    viewId: event.viewId,
    actor: getUserName(),
    recordId: event.recordId,
    action: "delete",
    primaryValue: event.recordPrimaryValue,
    message: `has deleted record ${event.recordPrimaryValue}`,
  });
}

function getEvents(tableId) {
  if (!tableId) {
    return [];
  }

  let events = globalConfig.get(`activity_${tableId}`);
  if (!events) {
    return [];
  }

  return events;
}

function pushEvent(event) {
  Logger.logInfo("Pushing event...");

  if (!hasSetConfigPermission) {
    Logger.logWarning(`User does not have set config permission.`);
    return;
  }

  // Check if this tableId is set to to track
  let trackTable = globalConfig.get(`track_${event.tableId}`);
  if (trackTable != undefined && trackTable == false) {
    Logger.logInfo(`Table tracking is off for ${event.tableId}`);
    return;
  }

  // Get existing activities
  let activities = globalConfig.get(`activity_${event.tableId}`);
  if (!activities) {
    activities = [];
  }

  // Insert new activity
  activities.unshift(event);

  // Update activity list in persistence
  globalConfig.setAsync(`activity_${event.tableId}`, activities);
}

function getUserName() {
  return session.currentUser ? session.currentUser.name : "Public";
}
function getUserId() {
  return session.currentUser ? session.currentUser.id : null;
}

initializeBlock(() => <WatcherBlock />);
