import React, { useState } from "react";
import {
  useGlobalConfig,
  Switch,
  useBase,
  Text,
  ConfirmationDialog,
} from "@airtable/blocks/ui";
import Logger from "./logger";

export default function TableListComponent() {
  const base = useBase();

  const globalConfig = useGlobalConfig();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmTableName, setConfirmTableName] = useState(false);
  const [confirmTableId, setConfirmTableId] = useState(false);
  const configPermission = globalConfig.checkPermissionsForSet();

  return (
    <div>
      {!configPermission.hasPermission && (
        <Text textColor="red">{configPermission.reasonDisplayString}</Text>
      )}

      <TableTrackerList
        hasSetConfigPermission={configPermission.hasPermission}
      />

      {isDialogOpen && (
        <ConfirmationDialog
          isConfirmActionDangerous={true}
          title={`Are you sure you want to turn off tracking for ${confirmTableName}?`}
          body="Warning: All activity log for this table will be deleted."
          onConfirm={() => {
            // Delete activity data
            Logger.logInfo(
              `Disabling tracking and clearing activity for table ${confirmTableId}`
            );
            globalConfig.setAsync(`activity_${confirmTableId}`, null);

            // Update table tracking settings
            globalConfig.setAsync(`track_${confirmTableId}`, false);

            // Close confirmation dialog
            setConfirmTableName(null);
            setConfirmTableId(null);
            setIsDialogOpen(false);
          }}
          onCancel={() => {
            // Close confirmation dialog
            setConfirmTableName(null);
            setConfirmTableId(null);
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );

  function TableTrackerList(props) {
    const tableTrackerList = base.tables.map((table) => {
      let trackTable = globalConfig.get(`track_${table.id}`);
      let isTrackingTable = trackTable == undefined ? true : trackTable;

      return (
        <TableTracker
          key={table.id}
          tableId={table.id}
          tableName={table.name}
          isTrackingEnabled={isTrackingTable}
          hasSetConfigPermission={props.hasSetConfigPermission}
        />
      );
    });

    return tableTrackerList;
  }

  function TableTracker(props) {
    return (
      <Switch
        disabled={!props.hasSetConfigPermission}
        value={props.isTrackingEnabled}
        label={props.tableName}
        size="large"
        backgroundColor="transparent"
        onChange={(newValue) => {
          if (newValue == false) {
            setConfirmTableName(props.tableName);
            setConfirmTableId(props.tableId);
            setIsDialogOpen(true);
          } else {
            // Update table tracking settings
            globalConfig.setAsync(`track_${props.tableId}`, true);
          }
        }}
      />
    );
  }
}
