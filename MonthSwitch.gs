/**
 * Month-switching for Monthly Discount Tracker v2.0
 * Auto-saves current month before loading target month.
 */

// ─── UI entry point ───────────────────────────────────────────────────────────

function showMonthSwitcher() {
  var ui = SpreadsheetApp.getUi();
  var current = getCurrentMonthYear();

  var result = ui.prompt(
    '📅 Switch Month',
    'Current month: ' + current + '\n\n' +
    'Enter target month (e.g. "July 2026"):\n' +
    '(Current data will be saved automatically before switching)',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) return;

  var target = normalizeMonthYear(result.getResponseText());
  if (!target || target === current) return;

  switchToMonth(target);
}

// ─── Core switch logic ────────────────────────────────────────────────────────

function switchToMonth(targetMonth) {
  // Always save current state first
  saveCurrentToDataStore();

  var loaded = loadMonthFromDataStore(targetMonth);

  if (!loaded) {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '📅 New Month',
      'No saved data found for "' + targetMonth + '".\n\nStart with a blank sheet for this month?',
      ui.ButtonSet.YES_NO
    );
    if (response === ui.Button.YES) {
      _clearDataColumns();
      setCurrentMonthYear(targetMonth);
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Ready for ' + targetMonth + '!', '📅 New Month', 3
      );
    }
  }
}

function _clearDataColumns() {
  var sheet = getMainSheet();
  if (!sheet) return;
  var totalRows   = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  var numDataCols = CONFIG.COLUMNS.NOTES - CONFIG.COLUMNS.DISCOUNT + 1;
  sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLUMNS.DISCOUNT, totalRows, numDataCols).clearContent();
}

// ─── Button-assigned month functions ─────────────────────────────────────────
// These are assigned to drawing buttons positioned over the month cells.
// Year is derived from the current header value to allow cross-year use.

function _currentYear() {
  var monthYear = getCurrentMonthYear(); // e.g. "June 2026"
  var parts = monthYear.split(' ');
  return parts.length >= 2 ? parts[parts.length - 1] : new Date().getFullYear().toString();
}

function switchToJanuary()   { switchToMonth('January '   + _currentYear()); }
function switchToFebruary()  { switchToMonth('February '  + _currentYear()); }
function switchToMarch()     { switchToMonth('March '     + _currentYear()); }
function switchToApril()     { switchToMonth('April '     + _currentYear()); }
function switchToMay()       { switchToMonth('May '       + _currentYear()); }
function switchToJune()      { switchToMonth('June '      + _currentYear()); }
function switchToJuly()      { switchToMonth('July '      + _currentYear()); }
function switchToAugust()    { switchToMonth('August '    + _currentYear()); }
function switchToSeptember() { switchToMonth('September ' + _currentYear()); }
function switchToOctober()   { switchToMonth('October '   + _currentYear()); }
function switchToNovember()  { switchToMonth('November '  + _currentYear()); }
function switchToDecember()  { switchToMonth('December '  + _currentYear()); }
