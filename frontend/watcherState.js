class WatcherState {
  watchingTableId = null;
  currentRecordIds = [];
  currentRecords = []; //TODO: remove this for block memory optimization
  selectedTableId = null;
  selectedViewId = null;
  selectedRecordIds = [];
  selectedRecordIdPrimaryValues = [];
  selectedFieldIds = [];
  modifiedRecords = null;
  modifiedCells = null;
  isModifying = false;
  isWatcherLoadComplete = false;
  createdRecordIds = [];
  lastDeletedRecordId = null;
}

module.exports = new WatcherState();
