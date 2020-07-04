import {
  useBase,
  useRecords,
  useLoadable,
  useWatchable,
} from "@airtable/blocks/ui";
import { cursor } from "@airtable/blocks";
import WatcherState from "./watcherState";

class Watcher {
  watch(
    onViewSelectionChanged,
    onCellSelectionChanged,
    onCellModifying,
    onRecordCreated,
    onRecordUpdated,
    onRecordDeleted
  ) {
    // cannot detect multiple delete if watchRecords fires after watchCellSelection
    // cannot detect create if watchRecords fires before watchCellSelection
    this.watchViewSelection(onViewSelectionChanged);
    this.watchRecords(onRecordCreated, onRecordDeleted);
    this.watchCellSelection(
      onCellSelectionChanged,
      onRecordCreated,
      onRecordUpdated
    );
    this.watchCells(onCellModifying);
  }

  watchViewSelection(onViewSelectionChanged) {
    useWatchable(cursor, ["activeTableId", "activeViewId"]);

    // Check for change
    if (
      WatcherState.selectedTableId != cursor.activeTableId ||
      WatcherState.selectedViewId != cursor.activeViewId
    ) {
      WatcherState.tableId = cursor.activeTableId;
      WatcherState.selectedTableId = cursor.activeTableId;
      WatcherState.selectedViewId = cursor.activeViewId;
      onViewSelectionChanged(
        WatcherState.selectedTableId,
        WatcherState.selectedViewId
      );
    }
  }

  watchCellSelection(onCellSelectionChanged, onRecordCreated, onRecordUpdated) {
    useLoadable(cursor);
    useWatchable(cursor, ["selectedRecordIds", "selectedFieldIds"]);

    if (
      WatcherState.selectedRecordIds.join(",") !=
        cursor.selectedRecordIds.join(",") ||
      WatcherState.selectedFieldIds.join(",") !=
        cursor.selectedFieldIds.join(",")
    ) {
      WatcherState.selectedRecordIds = cursor.selectedRecordIds;
      WatcherState.selectedFieldIds = cursor.selectedFieldIds;
      onCellSelectionChanged(
        WatcherState.selectedRecordIds,
        WatcherState.selectedFieldIds
      );

      // Store selected record id and primary values
      WatcherState.selectedRecordIdPrimaryValues = [];
      WatcherState.selectedRecordIds.map((recordId) => {
        let primaryValue = this.getRecordPrimaryValue(recordId);
        if (primaryValue) {
          WatcherState.selectedRecordIdPrimaryValues.push({
            recordId: recordId,
            primaryValue: primaryValue,
          });
        }
      });

      // Fire record created callback
      for (let i = 0; i < WatcherState.selectedRecordIds.length; i++) {
        let recordId = WatcherState.selectedRecordIds[i];
        if (WatcherState.createdRecordIds.includes(recordId)) {
          onRecordCreated({
            tableId: WatcherState.selectedTableId,
            viewId: WatcherState.selectedViewId,
            recordPrimaryValue: this.getRecordPrimaryValue(recordId),
            recordId: recordId,
          });
        }
      }

      // Fire record updated callbacks when selection ends
      if (WatcherState.isModifying) {
        WatcherState.isModifying = false;

        for (let i = 0; i < WatcherState.modifiedCells.fieldIds.length; i++) {
          let recordId = WatcherState.modifiedCells.recordIds[i];
          let fieldId = WatcherState.modifiedCells.fieldIds[i];

          onRecordUpdated({
            tableId: WatcherState.selectedTableId,
            viewId: WatcherState.selectedViewId,
            recordPrimaryValue: this.getRecordPrimaryValue(recordId),
            recordId: recordId,
            fieldId: fieldId,
          });
        }
      }
    }
  }

  watchRecords(onRecordCreated, onRecordDeleted) {
    const base = useBase();
    const table = base.getTableById(WatcherState.tableId);
    const records = useRecords(table);

    // Get new records snapshot
    let recordIds = [];
    recordIds = records
      ? records.map((record) => {
          return record.id;
        })
      : [];

    if (WatcherState.isWatcherLoadComplete) {
      // Check for new records
      WatcherState.createdRecordIds = [];
      if (recordIds.length > 0) {
        recordIds.map((recordId) => {
          if (!WatcherState.currentRecordIds.includes(recordId)) {
            WatcherState.createdRecordIds.push(recordId);
          }
        });
      }
    }

    // Update current snapshot state
    WatcherState.currentRecordIds = recordIds; //TODO: can be remove once currentRecords is working
    WatcherState.currentRecords = records;

    // Check for deleted records
    if (WatcherState.selectedRecordIds.length > 0) {
      WatcherState.selectedRecordIds.map((recordId) => {
        if (!WatcherState.currentRecordIds.includes(recordId)) {
          let values = WatcherState.selectedRecordIdPrimaryValues.filter(
            function (item) {
              return item.recordId === recordId;
            }
          );

          if (WatcherState.lastDeletedRecordId != recordId) {
            // Quick fix to prevent infinite re-render
            WatcherState.lastDeletedRecordId = recordId;
            onRecordDeleted({
              tableId: WatcherState.selectedTableId,
              viewId: WatcherState.selectedViewId,
              recordPrimaryValue:
                values.length > 0 ? values[0].primaryValue : "",
              recordId: recordId,
            });
          }
        }
      });
    }

    WatcherState.isWatcherLoadComplete = true;
  }

  watchCells(onCellModifying) {
    const base = useBase();
    const table = base.getTableById(WatcherState.tableId);
    const queryResult = table.selectRecords();

    useLoadable(queryResult);
    useWatchable(queryResult, "cellValues", (model, key, details) => {
      if (
        JSON.stringify(WatcherState.modifiedCells) != JSON.stringify(details)
      ) {
        // Set modified records
        WatcherState.modifiedRecords = model;
        WatcherState.modifiedCells = details;
        WatcherState.isModifying = true;

        // Fire cell modifying callback
        for (let i = 0; i < WatcherState.modifiedCells.fieldIds.length; i++) {
          onCellModifying(
            WatcherState.modifiedCells.recordIds[i],
            WatcherState.modifiedCells.fieldIds[i]
          );
        }
      }
    });
  }

  getRecordPrimaryValue(recordId) {
    var record = WatcherState.currentRecords.filter(function (item) {
      return item.id === recordId;
    });
    if (record && record.length > 0) {
      return record[0].primaryCellValueAsString;
    } else {
      return null;
    }
  }

  getRecordPrimaryValues(recordIds) {
    let primaryValues = [];
    recordIds.map((recordId) => {
      var record = WatcherState.currentRecords.filter(function (item) {
        return item.id === recordId;
      });
      if (record && record.length > 0) {
        primaryValues.push(record[0].primaryCellValueAsString);
      }
    });
    return primaryValues;
  }
}

module.exports = new Watcher();
