/**
 * Monthly Discount Tracker v2.0 - Main Configuration & Entry Point
 *
 * Structure: 14 regions × 12 rows/region = 168 total data rows
 * New: Scenario column (C) inserted between Segment and Discount %
 * New: Per-region color on column A persists through filtering
 */

const CONFIG = {
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
    SCENARIO:   3,   // C  ← NEW
    DISCOUNT:   4,   // D
    PROMO_CODE: 5,   // E
    CONDITION:  6,   // F
    CODE_EFFECT:7,   // G
    STATUS:     8,   // H
    START_DATE: 9,   // I
    END_DATE:   10,  // J
    BANNER:     11,  // K
    POPUP:      12,  // L
    INAPP:      13,  // M
    WA:         14,  // N
    PUSH:       15,  // O
    SMS:        16,  // P
    NOTES:      17   // Q
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
  SpreadsheetApp.getUi()
    .createMenu('🎯 Discount Tracker')
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
    .addSubMenu(SpreadsheetApp.getUi().createMenu('🔧 Setup & Tools')
      .addItem('🏗️ Initialize Full Structure (196 rows)', 'setupSheetStructure')
      .addItem('🔁 Restore Structure Columns (A-C)', 'populateStructure')
      .addItem('🎨 Re-apply Color Coding', 'applyColorCoding')
      .addItem('📋 Setup Dropdowns', 'setupDropdowns')
      .addItem('📊 Setup Reference Data', 'setupReferenceData')
      .addItem('📤 Export Current Month CSV', 'exportCurrentMonthCSV')
      .addItem('📤 Export All Data CSV', 'exportAllDataCSV')
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
