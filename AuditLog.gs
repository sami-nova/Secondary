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
