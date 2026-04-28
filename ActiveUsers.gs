/**
 * Active Users column for Monthly Discount Tracker v2.0
 *
 * Active Users (col D) lives directly in Main_Input alongside each segment row.
 * Values persist across month switches because the column sits BEFORE the data
 * columns that get cleared on load (clearing starts at COLUMNS.DISCOUNT = col E).
 *
 * One-time migration:
 *   Run migrateInsertActiveUsersColumn() ONCE to physically insert col D
 *   and shift existing campaign data (was D-P) right to E-Q.
 *
 * Button script:
 *   Assign focusActiveUsers to a drawing button in Main_Input.
 *   It selects the entire Active Users column so the team can tab through and fill.
 */

// ─── One-time migration ───────────────────────────────────────────────────────

/**
 * Inserts a blank column at position D in Main_Input, shifting existing data
 * columns (was Discount %…Notes at D-P) right to E-Q.
 * Safe to call multiple times — checks whether the migration already happened.
 */
function migrateInsertActiveUsersColumn() {
  var sheet = getMainSheet();
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Main_Input not found. Run full setup first.');
    return;
  }

  // Guard: already migrated if col D header = 'Active Users'
  var headerD = sheet.getRange(CONFIG.HEADER_ROW, 4).getValue().toString().trim();
  if (headerD === 'Active Users') {
    SpreadsheetApp.getUi().alert(
      'ℹ️ Already done',
      '"Active Users" column already exists at column D. No changes made.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  var ui       = SpreadsheetApp.getUi();
  var response = ui.alert(
    '➕ Insert Active Users Column',
    'This inserts a blank "Active Users" column at column D.\n' +
    'Your existing Discount %, Promo Code, and all other data\n' +
    'will shift one column to the right (D→E, E→F, … P→Q).\n\n' +
    'Run this ONCE. Your data will be preserved.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  // Physically insert a blank column at position 4 (shifts cols 4+ right by 1)
  sheet.insertColumns(4, 1);

  // Now apply the updated headers and formatting (CONFIG already has ACTIVE_USERS=4)
  _applySheetConfig();
  _setupHeaders(sheet);
  _applySheetFormatting(sheet);
  _setupDropdownsOnSheet(sheet);

  ui.alert(
    '✅ Migration complete',
    '"Active Users" is now column D.\n' +
    'All previous data has shifted one column right.\n\n' +
    'Fill in user counts for each segment row,\n' +
    'or assign focusActiveUsers to a button for quick access.',
    ui.ButtonSet.OK
  );
  _auditLog('MIGRATE', 'Inserted Active Users column at D; data cols shifted to E-Q');
}

// ─── Button-assignable script ─────────────────────────────────────────────────

/**
 * Assign this function name to a drawing button in Main_Input.
 * Selects the entire Active Users column so the team can tab through and fill.
 */
function focusActiveUsers() {
  var sheet = getMainSheet();
  if (!sheet) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setActiveSheet(sheet);
  var totalRows = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  sheet.setActiveRange(
    sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLUMNS.ACTIVE_USERS, totalRows, 1)
  );
  ss.toast(
    'Column D — enter active user counts per segment. Values stay when you switch months.',
    '👥 Active Users', 5
  );
}
