/**
 * Active Users segment for Monthly Discount Tracker v2.0
 *
 * "Active Users" is a regular segment row in REGION_ROW_TEMPLATE (the 13th slot),
 * filled monthly alongside PPC, CP, and other segments.
 * Use Segment_Config to add, remove, or reorder segments without code changes.
 *
 * One-time migration for existing sheets (already set up with 12 rows/region):
 *   Run migrateInsertActiveUsersRows() ONCE to physically insert the 13th row
 *   at the end of each region block.
 *
 * Button script:
 *   Assign filterActiveUsers to a drawing button to jump to Active Users rows.
 */

// ─── One-time migration ───────────────────────────────────────────────────────

/**
 * Inserts 1 blank row at the end of each region block (backwards, last region
 * first) then writes the Active Users structure values and refreshes formatting.
 * Safe to call multiple times — aborts early if Active Users already exists.
 */
function migrateInsertActiveUsersRows() {
  var sheet = getMainSheet();
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Main_Input not found. Run full setup first.');
    return;
  }

  _applySheetConfig();

  // Guard: if last slot of first region is already 'Active Users', we're done.
  var lastOffsetInRegion = CONFIG.ROWS_PER_REGION - 1;
  var checkRow = CONFIG.DATA_START_ROW + lastOffsetInRegion;
  var lastSeg  = sheet.getRange(checkRow, CONFIG.COLUMNS.SEGMENT).getValue().toString().trim();
  if (lastSeg === 'Active Users') {
    SpreadsheetApp.getUi().alert(
      'ℹ️ Already done',
      '"Active Users" row already exists in each region. No changes made.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  var ui       = SpreadsheetApp.getUi();
  var response = ui.alert(
    '➕ Insert Active Users Rows',
    'This inserts one "Active Users" row at the end of each of the ' +
    CONFIG.REGIONS.length + ' region blocks.\n\n' +
    'All existing campaign data is preserved.\n\n' +
    'Run this ONCE. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  // The sheet currently has ROWS_PER_REGION-1 rows per region (12 before migration).
  // Insert backwards so earlier region offsets stay valid.
  var oldRowsPerRegion = CONFIG.ROWS_PER_REGION - 1; // 12
  for (var r = CONFIG.REGIONS.length - 1; r >= 0; r--) {
    var lastRowOfRegion = CONFIG.DATA_START_ROW + r * oldRowsPerRegion + oldRowsPerRegion - 1;
    sheet.insertRowAfter(lastRowOfRegion);
  }

  // CONFIG.ROWS_PER_REGION is already 13, so _fillDataRows writes the full 13-row
  // structure including the new Active Users slot.
  _fillDataRows(sheet);
  _applyColorCodingToSheet(sheet);
  _applySheetFormatting(sheet);
  _setupDropdownsOnSheet(sheet);

  ui.alert(
    '✅ Migration complete',
    '"Active Users" row added to every region.\n\n' +
    'Fill in monthly user counts per region like any other segment,\n' +
    'or assign filterActiveUsers to a button for quick access.',
    ui.ButtonSet.OK
  );
  _auditLog('MIGRATE', 'Inserted Active Users segment row at end of each region block');
}

// ─── Button-assignable filter ─────────────────────────────────────────────────

/**
 * Assign this function name to a drawing button in Main_Input.
 * Filters to show only Active Users rows across all regions.
 */
function filterActiveUsers() {
  _setFilter('segment', 'Active Users');
  _applyFilters();
}
