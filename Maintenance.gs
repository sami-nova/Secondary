/**
 * Maintenance functions for Monthly Discount Tracker v2.0
 *
 * - archiveOldMonths  : move Data_Store rows older than N months to Data_Archive
 * - cleanDataStore    : remove orphaned keys that no longer match CONFIG structure
 */

var ARCHIVE_COLS = 19; // Key | Month | Region | Segment | Scenario | D..Q

// ─── Archive ──────────────────────────────────────────────────────────────────

function showArchiveDialog() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    '📦 Archive Old Data',
    'How many recent months should stay in Data_Store?\n\n' +
    'Example: enter "3" to keep the last 3 months.\n' +
    'Everything older will move to a Data_Archive sheet.',
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;

  var n = parseInt(result.getResponseText().trim(), 10);
  if (isNaN(n) || n < 1) {
    ui.alert('❌ Invalid input', 'Please enter a whole number greater than 0.', ui.ButtonSet.OK);
    return;
  }

  var count = archiveOldMonths(n);
  if (count === 0) {
    ui.alert('ℹ️ Nothing to Archive',
      'All Data_Store rows are within the last ' + n + ' month(s).', ui.ButtonSet.OK);
  } else {
    ui.alert('✅ Archive Complete',
      'Moved ' + count + ' row(s) to Data_Archive.\n' +
      'Kept the last ' + n + ' month(s) in Data_Store.', ui.ButtonSet.OK);
  }
}

/**
 * Move rows older than `monthsToKeep` from Data_Store → Data_Archive.
 * Returns the number of rows archived.
 */
function archiveOldMonths(monthsToKeep) {
  var dsSheet = getDataStore();
  if (!dsSheet || dsSheet.getLastRow() < 2) return 0;

  var cutoff  = _archiveCutoffDate(monthsToKeep);
  var lastRow = dsSheet.getLastRow();
  var data    = dsSheet.getRange(2, 1, lastRow - 1, ARCHIVE_COLS).getValues();

  var toKeep    = [];
  var toArchive = [];

  data.forEach(function(row) {
    var d = parseMonthYear(row[1]); // Column B = Month string
    (d && d < cutoff ? toArchive : toKeep).push(row);
  });

  if (toArchive.length === 0) return 0;

  // Write to archive sheet
  var archSheet = getOrCreateSheet('Data_Archive');
  _ensureArchiveHeaders(archSheet);
  var appendAt = Math.max(archSheet.getLastRow() + 1, 2);
  archSheet.getRange(appendAt, 1, toArchive.length, ARCHIVE_COLS).setValues(toArchive);

  // Rewrite Data_Store with only kept rows
  dsSheet.getRange(2, 1, lastRow - 1, ARCHIVE_COLS).clearContent();
  if (toKeep.length > 0) {
    dsSheet.getRange(2, 1, toKeep.length, ARCHIVE_COLS).setValues(toKeep);
  }

  return toArchive.length;
}

function _archiveCutoffDate(monthsToKeep) {
  var d = new Date();
  // First day of the month that is (monthsToKeep) months ago
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsToKeep + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function _ensureArchiveHeaders(sheet) {
  if (sheet.getRange('A1').getValue() === 'Key') return;
  var headers = [
    'Key', 'Month', 'Region', 'Segment', 'Scenario',
    'Discount %', 'Promo Code', 'Condition', 'Code Effect',
    'Status', 'Start Date', 'End Date',
    'Banner', 'PopUp', 'InApp', 'WA', 'Push', 'SMS', 'Notes'
  ];
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground('#7B3F9B').setFontColor('#FFFFFF').setFontWeight('bold');
}

// ─── Data_Store deduplication ─────────────────────────────────────────────────

function showCleanupDialog() {
  var orphaned = _countOrphanedKeys();
  var ui = SpreadsheetApp.getUi();

  if (orphaned === 0) {
    ui.alert('✅ Data_Store is Clean', 'No orphaned keys found.', ui.ButtonSet.OK);
    return;
  }

  var response = ui.alert(
    '🧹 Clean Data_Store',
    orphaned + ' orphaned row(s) found — keys whose segment/scenario combination\n' +
    'no longer exists in the current sheet structure (e.g. from a layout change).\n\n' +
    'Remove them now?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  var removed = cleanDataStore();
  ui.alert('✅ Done', 'Removed ' + removed + ' orphaned row(s) from Data_Store.', ui.ButtonSet.OK);
}

/**
 * Delete Data_Store rows whose Segment|Scenario pair is no longer in CONFIG.
 * Uses read → filter → rewrite (3 API calls) instead of one deleteRow per orphan.
 * Returns the number of rows removed.
 */
function cleanDataStore() {
  var dsSheet = getDataStore();
  if (!dsSheet || dsSheet.getLastRow() < 2) return 0;

  var valid   = _validCombos();
  var lastRow = dsSheet.getLastRow();
  var data    = dsSheet.getRange(2, 1, lastRow - 1, ARCHIVE_COLS).getValues();

  var kept    = data.filter(function(row) {
    return valid[row[3] + '||' + row[4]]; // Segment || Scenario
  });

  var removed = data.length - kept.length;
  if (removed === 0) return 0;

  dsSheet.getRange(2, 1, lastRow - 1, ARCHIVE_COLS).clearContent();
  if (kept.length > 0) {
    dsSheet.getRange(2, 1, kept.length, ARCHIVE_COLS).setValues(kept);
  }

  return removed;
}

function _countOrphanedKeys() {
  var dsSheet = getDataStore();
  if (!dsSheet || dsSheet.getLastRow() < 2) return 0;
  var valid = _validCombos();
  var data  = dsSheet.getRange(2, 1, dsSheet.getLastRow() - 1, 5).getValues();
  return data.filter(function(r) { return !valid[r[3] + '||' + r[4]]; }).length;
}

function _validCombos() {
  var map = {};
  CONFIG.REGION_ROW_TEMPLATE.forEach(function(tpl) {
    map[tpl.segment + '||' + tpl.scenario] = true;
  });
  return map;
}
