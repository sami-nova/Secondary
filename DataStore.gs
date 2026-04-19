/**
 * Data persistence for Monthly Discount Tracker v2.0
 *
 * Key format: "Month | Region | Segment | Scenario"
 * (4-field composite key vs. old 3-field key)
 */

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * @param {boolean=} opt_silent  When true (auto-save context) suppresses toasts
 *   and UI alerts that would throw inside a time-based trigger.
 */
function saveCurrentToDataStore(opt_silent) {
  var mainSheet = getMainSheet();
  var dsSheet   = getDataStore();

  if (!mainSheet || !dsSheet) {
    if (!opt_silent) SpreadsheetApp.getUi().alert('Required sheets not found. Run Setup first.');
    return;
  }

  _ensureDataStoreHeaders(dsSheet);

  var currentMonth  = getCurrentMonthYear();
  var numDataCols   = CONFIG.COLUMNS.NOTES - CONFIG.COLUMNS.DISCOUNT + 1; // D..Q = 14 cols

  // Read ALL data columns D-Q at once (faster than per-row reads)
  var totalRows = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  var dataBlock = mainSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLUMNS.DISCOUNT, totalRows, numDataCols).getValues();

  // Build map of existing keys → row numbers in Data_Store
  var dsLastRow = dsSheet.getLastRow();
  var existingRowMap = {};
  if (dsLastRow >= 2) {
    var keys = dsSheet.getRange(2, 1, dsLastRow - 1, 1).getValues();
    keys.forEach(function(k, i) {
      if (k[0]) existingRowMap[k[0]] = i + 2;
    });
  }

  var newRows = [];

  // Use CONFIG to get region/segment/scenario – never read from sheet columns A-C
  // (they may be empty if setup wasn't run; CONFIG is always authoritative)
  CONFIG.REGIONS.forEach(function(region, r) {
    CONFIG.REGION_ROW_TEMPLATE.forEach(function(tpl, t) {
      var rowIdx     = r * CONFIG.ROWS_PER_REGION + t;
      var dataValues = dataBlock[rowIdx];
      var key        = [currentMonth, region, tpl.segment, tpl.scenario].join(' | ');

      var storeRow = [key, currentMonth, region, tpl.segment, tpl.scenario].concat(dataValues);

      if (existingRowMap[key]) {
        dsSheet.getRange(existingRowMap[key], 1, 1, storeRow.length).setValues([storeRow]);
      } else {
        newRows.push(storeRow);
      }
    });
  });

  if (newRows.length > 0) {
    var appendAt = Math.max(dsSheet.getLastRow() + 1, 2);
    dsSheet.getRange(appendAt, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  if (!opt_silent) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Saved ' + totalRows + ' rows for ' + currentMonth, '💾 Saved', 4
    );
  }

  // Always update the "Last saved" timestamp in the header (N1:Q1 band)
  var ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy HH:mm');
  mainSheet.getRange(1, 14).setValue('Last saved: ' + ts);

  // Audit log
  _auditLog('SAVE', 'Saved ' + totalRows + ' rows');

  // Auto-refresh Dashboard if the sheet already exists (don't create it implicitly)
  if (SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.DASHBOARD)) {
    try { updateDashboard(); } catch (ignore) {}
  }
}

function _ensureDataStoreHeaders(dsSheet) {
  if (dsSheet.getRange('A1').getValue() === 'Key') return;
  var headers = [
    'Key', 'Month', 'Region', 'Segment', 'Scenario',
    'Discount %', 'Promo Code', 'Condition', 'Code Effect',
    'Status', 'Start Date', 'End Date',
    'Banner', 'PopUp', 'InApp', 'WA', 'Push', 'SMS', 'Notes'
  ];
  dsSheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground('#4B4B9B').setFontColor('#FFFFFF').setFontWeight('bold');
}

// ─── Load ─────────────────────────────────────────────────────────────────────

/**
 * Load campaign data for targetMonth from Data_Store into Main_Input.
 * Matches on all 4 key fields: month, region, segment, scenario.
 * Returns true if any rows were loaded.
 */
function loadMonthFromDataStore(targetMonth) {
  targetMonth = normalizeMonthYear(targetMonth);
  var mainSheet = getMainSheet();
  var dsSheet   = getDataStore();

  if (!mainSheet || !dsSheet) {
    SpreadsheetApp.getUi().alert('Required sheets not found. Run Setup first.');
    return false;
  }

  var dsLastRow = dsSheet.getLastRow();
  if (dsLastRow < 2) {
    SpreadsheetApp.getActiveSpreadsheet().toast('No stored data found.', '⚠️ Warning', 3);
    return false;
  }

  // Read every stored row
  // Layout: Key(0) | Month(1) | Region(2) | Segment(3) | Scenario(4) | data(5+)
  var stored = dsSheet.getRange(2, 1, dsLastRow - 1, 5 + (CONFIG.COLUMNS.NOTES - CONFIG.COLUMNS.DISCOUNT + 1)).getValues();

  // Build lookup keyed by "Month | Region | Segment | Scenario"
  var lookup = {};
  stored.forEach(function(row) {
    var key = row[0];
    if (key && key.toString().startsWith(targetMonth + ' | ')) {
      lookup[key] = row.slice(5); // data columns only
    }
  });

  if (Object.keys(lookup).length === 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast('No data found for ' + targetMonth, '⚠️ Warning', 3);
    return false;
  }

  // Clear existing data columns (D-Q) in Main_Input
  var totalDataRows = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  var numDataCols   = CONFIG.COLUMNS.NOTES - CONFIG.COLUMNS.DISCOUNT + 1;
  mainSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLUMNS.DISCOUNT, totalDataRows, numDataCols).clearContent();

  // Use CONFIG to calculate target rows – never depends on sheet columns A-C being populated
  var filled = 0;
  CONFIG.REGIONS.forEach(function(region, r) {
    CONFIG.REGION_ROW_TEMPLATE.forEach(function(tpl, t) {
      var key    = [targetMonth, region, tpl.segment, tpl.scenario].join(' | ');
      var rowNum = CONFIG.DATA_START_ROW + (r * CONFIG.ROWS_PER_REGION) + t;

      if (lookup[key]) {
        mainSheet.getRange(rowNum, CONFIG.COLUMNS.DISCOUNT, 1, lookup[key].length)
          .setValues([lookup[key]]);
        filled++;
      }
    });
  });

  // Always restore structure columns A-C from CONFIG after loading
  _fillDataRows(mainSheet);

  setCurrentMonthYear(targetMonth);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Loaded ' + filled + ' rows for ' + targetMonth, '📂 Loaded', 4
  );
  _auditLog('LOAD', targetMonth + ' — ' + filled + ' rows');
  return true;
}

// ─── Dialogs ──────────────────────────────────────────────────────────────────

function showLoadMonthDialog() {
  var ui = SpreadsheetApp.getUi();

  var result = ui.prompt(
    '📂 Load Month Data',
    'Enter the month to load (e.g. "May 2026"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;

  var targetMonth = normalizeMonthYear(result.getResponseText());
  if (!targetMonth) return;

  var save = ui.alert(
    '💾 Save current first?',
    'Save "' + getCurrentMonthYear() + '" before loading "' + targetMonth + '"?',
    ui.ButtonSet.YES_NO_CANCEL
  );
  if (save === ui.Button.CANCEL) return;
  if (save === ui.Button.YES) saveCurrentToDataStore();

  loadMonthFromDataStore(targetMonth);
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportCurrentMonthCSV() {
  var mainSheet = getMainSheet();
  if (!mainSheet) return;

  var currentMonth = getCurrentMonthYear();
  var totalRows    = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  var headers      = mainSheet.getRange(CONFIG.HEADER_ROW, 1, 1, CONFIG.COLUMNS.NOTES).getValues()[0];
  var data         = mainSheet.getRange(CONFIG.DATA_START_ROW, 1, totalRows, CONFIG.COLUMNS.NOTES).getValues();

  var csv = [headers].concat(data).map(function(row) {
    return row.map(function(cell) {
      return '"' + (cell || '').toString().replace(/"/g, '""') + '"';
    }).join(',');
  }).join('\n');

  var filename = 'DiscountTracker_' + currentMonth.replace(' ', '_') + '.csv';
  var file = DriveApp.createFile(Utilities.newBlob(csv, 'text/csv', filename));

  SpreadsheetApp.getUi().alert('✅ Exported', 'Saved to Drive: ' + file.getName() + '\n' + file.getUrl(), SpreadsheetApp.getUi().ButtonSet.OK);
}

function exportAllDataCSV() {
  var dsSheet = getDataStore();
  if (!dsSheet || dsSheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('No data in Data_Store to export.');
    return;
  }

  var data = dsSheet.getRange(1, 1, dsSheet.getLastRow(), 19).getValues();
  var csv = data.map(function(row) {
    return row.map(function(cell) {
      return '"' + (cell || '').toString().replace(/"/g, '""') + '"';
    }).join(',');
  }).join('\n');

  var file = DriveApp.createFile(Utilities.newBlob(csv, 'text/csv', 'DiscountTracker_AllData.csv'));
  SpreadsheetApp.getUi().alert('✅ Exported', 'Saved to Drive: ' + file.getName(), SpreadsheetApp.getUi().ButtonSet.OK);
}
