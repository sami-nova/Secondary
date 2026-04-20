/**
 * Audit log — appends one row to Change_Log on every save / load / month switch.
 * All errors are swallowed so logging never breaks the main flow.
 */

var AUDIT_SHEET = 'Change_Log';

// ─── Internal logger (called by other modules) ────────────────────────────────

function _auditLog(action, details) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(AUDIT_SHEET) || ss.insertSheet(AUDIT_SHEET);

    if (sheet.getRange('A1').getValue() !== 'Timestamp') {
      sheet.getRange(1, 1, 1, 5)
        .setValues([['Timestamp', 'Action', 'Month', 'User', 'Details']])
        .setBackground('#4B4B9B').setFontColor('#FFFFFF').setFontWeight('bold');
      sheet.setColumnWidth(1, 145);
      sheet.setColumnWidth(2, 110);
      sheet.setColumnWidth(3, 110);
      sheet.setColumnWidth(4, 180);
      sheet.setColumnWidth(5, 300);
    }

    var user = '';
    try { user = Session.getActiveUser().getEmail(); } catch (ignore) {}

    sheet.insertRowBefore(2); // newest entry at the top
    sheet.getRange(2, 1, 1, 5).setValues([[
      new Date(), action, getCurrentMonthYear(), user, details || ''
    ]]);
    sheet.getRange(2, 1).setNumberFormat('dd/mm/yyyy HH:mm:ss');

  } catch (ignore) {}
}

// ─── Public: navigate to the log sheet ───────────────────────────────────────

function showChangeLog() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(AUDIT_SHEET);
  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      'ℹ️ No log yet',
      'The Change_Log sheet is created automatically on the first save.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  ss.setActiveSheet(sheet);
}

// ─── Public: trim the log to the N most recent entries ───────────────────────

function showTrimChangeLogDialog() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(AUDIT_SHEET);
  var ui    = SpreadsheetApp.getUi();

  if (!sheet || sheet.getLastRow() < 2) {
    ui.alert('ℹ️ Nothing to trim', 'Change_Log is empty or has no entries yet.', ui.ButtonSet.OK);
    return;
  }

  var current = sheet.getLastRow() - 1; // data rows (excludes header)
  var result  = ui.prompt(
    '✂️ Trim Change Log',
    'Change_Log has ' + current + ' entries.\n\n' +
    'How many recent entries should be kept?\n' +
    '(All older entries will be permanently deleted.)',
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;

  var keep = parseInt(result.getResponseText().trim(), 10);
  if (isNaN(keep) || keep < 1) {
    ui.alert('❌ Invalid input', 'Please enter a whole number greater than 0.', ui.ButtonSet.OK);
    return;
  }
  if (keep >= current) {
    ui.alert('ℹ️ Nothing to trim',
      'Log has ' + current + ' entries — fewer than or equal to ' + keep + '.', ui.ButtonSet.OK);
    return;
  }

  var removed = _trimChangeLog(keep);
  ui.alert('✅ Done',
    'Removed ' + removed + ' old entries.\nKept the ' + keep + ' most recent.', ui.ButtonSet.OK);
}

function _trimChangeLog(keepRows) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AUDIT_SHEET);
  if (!sheet) return 0;
  var lastRow  = sheet.getLastRow();
  var dataRows = lastRow - 1; // header is row 1
  if (dataRows <= keepRows) return 0;
  var deleteFrom  = keepRows + 2; // 1-based: row 1 = header, rows 2..keepRows+1 = kept
  var deleteCount = lastRow - deleteFrom + 1;
  sheet.deleteRows(deleteFrom, deleteCount);
  return deleteCount;
}
