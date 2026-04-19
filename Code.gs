/**
 * Monthly Discount Tracker v2.0 - Main Configuration & Entry Point
 *
 * Structure: 14 regions × 12 rows/region = 168 total data rows
 * New: Scenario column (C) inserted between Segment and Discount %
 * New: Per-region color on column A persists through filtering
 */

var CONFIG = {
  SHEET_NAMES: {
    MAIN: 'Main_Input',
    DATA_STORE: 'Data_Store',
    DASHBOARD: 'Dashboard',
    REFERENCE: 'Reference_Data'
  },

  DATA_START_ROW: 16,
  HEADER_ROW: 15,
  ROWS_PER_REGION: 12,

  REGIONS: [
    'Poland', 'Italy', 'Spain', 'France', 'Germany',
    'Russia', 'Romania', 'Czech', 'ARAB', 'Turkey',
    'Israel', 'Korea', 'Japan', 'GLOBAL'
  ],

  // 12 rows per region: 4 MO + 4 KO + 1 PPC + 1 CP + 2 Paid
  REGION_ROW_TEMPLATE: [
    { segment: 'Secondary MO',    scenario: 'CHURN PREVENTION (14-30 days)', color: '#D4EDDA' },
    { segment: 'Secondary MO',    scenario: 'CHURN (180-30 days)',            color: '#FFF3CD' },
    { segment: 'Secondary MO',    scenario: 'OLD CHURN (>180 days)',          color: '#F8D7DA' },
    { segment: 'Secondary MO',    scenario: '',                                color: '#FFFFFF' },
    { segment: 'Secondary KO',    scenario: 'The most loyal churn',           color: '#D1ECF1' },
    { segment: 'Secondary KO',    scenario: 'Loyal churn',                    color: '#E2E3E5' },
    { segment: 'Secondary KO',    scenario: 'Not loyal churn',                color: '#FADBD8' },
    { segment: 'Secondary KO',    scenario: '',                                color: '#FFFFFF' },
    { segment: 'PPC',             scenario: 'Regular Campaign',               color: '#FFFFFF' },
    { segment: 'CP',              scenario: 'Regular Campaign',               color: '#FFFFFF' },
    { segment: 'Paid in Advance', scenario: 'Regular Campaign',               color: '#FFFFFF' },
    { segment: 'Paid in Advance', scenario: '',                                color: '#FFFFFF' }
  ],

  // Unique background color per region – applied to column A only, persists after filtering
  REGION_COLORS: {
    'Poland':   '#DDEEFF',
    'Italy':    '#DDFFDD',
    'Spain':    '#FFEECC',
    'France':   '#FFE5E5',
    'Germany':  '#EEDDFF',
    'Russia':   '#FFDDCC',
    'Romania':  '#DDFFFF',
    'Czech':    '#FFE5CC',
    'ARAB':     '#E5FFE8',
    'Turkey':   '#FFCCCC',
    'Israel':   '#CCE5FF',
    'Korea':    '#FFCCFF',
    'Japan':    '#FFEEBB',
    'GLOBAL':   '#E8E8E8'
  },

  // Column positions (1-indexed)
  COLUMNS: {
    REGION:     1,   // A
    SEGMENT:    2,   // B
    SCENARIO:   3,   // C
    DISCOUNT:   4,   // D
    PROMO_CODE: 5,   // E
    CONDITION:  6,   // F
    STATUS:     7,   // G
    START_DATE: 8,   // H
    END_DATE:   9,   // I
    BANNER:    10,   // J
    POPUP:     11,   // K
    INAPP:     12,   // L
    WA:        13,   // M
    PUSH:      14,   // N
    SMS:       15,   // O
    NOTES:     16    // P
  },

  SCENARIO_LIST: [
    'CHURN PREVENTION (14-30 days)',
    'CHURN (180-30 days)',
    'OLD CHURN (>180 days)',
    'The most loyal churn',
    'Loyal churn',
    'Not loyal churn',
    'Regular Campaign',
    'Custom'
  ],

  STATUS_LIST: ['Active', 'Inactive', 'Pending', 'Expired', 'Draft'],

  MONTHS: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  SEGMENT_COLORS: {
    'Secondary MO':    { bg: '#FF6B6B', text: '#FFFFFF' },
    'Secondary KO':    { bg: '#4ECDC4', text: '#FFFFFF' },
    'PPC':             { bg: '#FFB300', text: '#FFFFFF' },
    'CP':              { bg: '#66BB6A', text: '#FFFFFF' },
    'Paid in Advance': { bg: '#FF8A65', text: '#FFFFFF' }
  }
};

// ─── onOpen ──────────────────────────────────────────────────────────────────

function onOpen() {
  _applySheetConfig(); // patch CONFIG from Reference_Data before building menus
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🎯 Discount Tracker')
    .addItem('📅 Switch Month', 'showMonthSwitcher')
    .addSeparator()
    .addItem('💾 Save Current Month', 'saveCurrentToDataStore')
    .addItem('📂 Load Month Data', 'showLoadMonthDialog')
    .addSeparator()
    .addItem('🔍 Filter Data', 'showFilterDialog')
    .addItem('✅ Show All Rows', 'filterShowAll')
    .addSeparator()
    .addItem('🔄 Update Dashboard', 'updateDashboard')
    .addSeparator()
    .addSubMenu(ui.createMenu('🔧 Setup & Tools')
      .addItem('🏗️ Initialize Full Structure', 'setupSheetStructure')
      .addItem('🔁 Restore Structure Columns (A-C)', 'populateStructure')
      .addItem('🎨 Re-apply Color Coding', 'applyColorCoding')
      .addItem('📋 Setup Dropdowns', 'setupDropdowns')
      .addItem('📊 Setup Reference Data', 'setupReferenceData')
      .addSeparator()
      .addItem('⏱️ Enable Auto-Save', 'setupAutoSaveTrigger')
      .addItem('⏹️ Disable Auto-Save', 'removeAutoSaveTrigger')
      .addSeparator()
      .addItem('📤 Export Current Month CSV', 'exportCurrentMonthCSV')
      .addItem('📤 Export All Data CSV', 'exportAllDataCSV')
    )
    .addSubMenu(ui.createMenu('🗃️ Maintenance')
      .addItem('📦 Archive Old Months', 'showArchiveDialog')
      .addItem('🧹 Clean Orphaned Keys', 'showCleanupDialog')
      .addItem('📋 View Change Log', 'showChangeLog')
      .addSeparator()
      .addItem('🔄 Reload Config from Sheet', 'reloadConfigFromSheet')
    )
    .addToUi();
}

// ─── Sheet helpers ────────────────────────────────────────────────────────────

function getMainSheet()      { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.MAIN); }
function getDataStore()      { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.DATA_STORE); }
function getDashboardSheet() { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.DASHBOARD); }
function getReferenceSheet() { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.REFERENCE); }

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// ─── Month helpers ────────────────────────────────────────────────────────────

function getCurrentMonthYear() {
  var sheet = getMainSheet();
  if (!sheet) return getDefaultMonthYear();
  // A2 is the dedicated "Current Month: XXXX YYYY" display cell (row 1 is the static title)
  var val = sheet.getRange('A2').getValue().toString().replace('Current Month: ', '').trim();
  return val || getDefaultMonthYear();
}

function getDefaultMonthYear() {
  var d = new Date();
  return CONFIG.MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

function setCurrentMonthYear(monthYear) {
  var sheet = getMainSheet();
  if (!sheet) return;
  var display = 'Current Month: ' + monthYear;
  // Always update A2 (dedicated month display row in new layout)
  sheet.getRange('A2').setValue(display);
  // Also update A1 if it currently contains a month string (handles old layout gracefully)
  var a1 = sheet.getRange('A1').getValue().toString();
  if (a1.indexOf('Current Month:') !== -1) {
    sheet.getRange('A1').setValue(display);
  }
}

// ─── Row calculation ──────────────────────────────────────────────────────────

function getRowForRegionAndOffset(regionIndex, rowOffset) {
  return CONFIG.DATA_START_ROW + (regionIndex * CONFIG.ROWS_PER_REGION) + rowOffset;
}

// ─── Shared utilities ─────────────────────────────────────────────────────────

/**
 * Normalize "june 2026" → "June 2026", "APRIL 2025" → "April 2025".
 * Returns the original string unchanged if it can't be parsed.
 */
function normalizeMonthYear(input) {
  if (!input) return getDefaultMonthYear();
  var parts = input.toString().trim().split(/\s+/);
  if (parts.length < 2) return input.toString().trim();
  var month = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  var year  = parts[parts.length - 1];
  return CONFIG.MONTHS.indexOf(month) !== -1 ? month + ' ' + year : input.toString().trim();
}

/** Parse "May 2026" → Date(2026, 4, 1). Returns null if unparseable. */
function parseMonthYear(str) {
  if (!str) return null;
  var parts = str.toString().trim().split(/\s+/);
  if (parts.length < 2) return null;
  var month = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  var idx   = CONFIG.MONTHS.indexOf(month);
  var year  = parseInt(parts[parts.length - 1]);
  return (idx !== -1 && !isNaN(year)) ? new Date(year, idx, 1) : null;
}

/** Convert 1-based column number to A1 letter(s): 1→'A', 28→'AB'. */
function columnToLetter(col) {
  var s = '';
  for (; col > 0; col = Math.floor((col - 1) / 26))
    s = String.fromCharCode(65 + (col - 1) % 26) + s;
  return s;
}

// ─── Config-driven regions & scenarios ───────────────────────────────────────

/**
 * Patch CONFIG.REGIONS, CONFIG.SCENARIO_LIST, and CONFIG.STATUS_LIST from the
 * Reference_Data sheet so users can add/remove regions or scenarios without
 * editing script code. Safe to call when the sheet doesn't exist yet.
 */
function _applySheetConfig() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEET_NAMES.REFERENCE);
  if (!sheet || sheet.getLastRow() < 2) return;

  // Auto-detect data start row: new layout has an instruction header in row 1
  var a1val = sheet.getRange('A1').getValue().toString();
  var dataRow = (a1val === 'Regions' || a1val === '') ? 2 : 2; // both layouts start data at row 2

  var lastRow = sheet.getLastRow();
  if (lastRow < dataRow) return;

  var data = sheet.getRange(dataRow, 1, lastRow - dataRow + 1, 6).getValues();

  // Col A: Regions — skip values that look like numbers or percentages
  var regions = data.map(function(r) { return r[0]; }).filter(function(v) {
    if (!v) return false;
    var s = v.toString().trim();
    return s && isNaN(parseFloat(s.replace('%', '')));
  });
  // Col E (index 4): Scenarios
  var scenarios = data.map(function(r) { return r[4]; }).filter(Boolean);
  // Col F (index 5): Status
  var statuses  = data.map(function(r) { return r[5]; }).filter(Boolean);

  if (regions.length   > 0) CONFIG.REGIONS       = regions;
  if (scenarios.length > 0) CONFIG.SCENARIO_LIST = scenarios;
  if (statuses.length  > 0) CONFIG.STATUS_LIST   = statuses;
}

/** Public menu item: reload config and confirm. */
function reloadConfigFromSheet() {
  _applySheetConfig();
  SpreadsheetApp.getActiveSpreadsheet()
    .toast('CONFIG reloaded from Reference_Data sheet', '🔄 Done', 3);
}
