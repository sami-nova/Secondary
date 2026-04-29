// ============================================================
//  DAILY MANAGER SCHEDULE TRACKER — Google Apps Script v1.0
//  File 4 of 4: Custom Menu + Time-Driven Triggers
// ============================================================

// ═════════════════════════════════════════════════════════════
//  CUSTOM MENU — added to the Sheets UI on open
// ═════════════════════════════════════════════════════════════
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📅  Schedule Management')
    .addItem('🏗️   Build / Rebuild This Month',      'buildScheduleSheet')
    .addItem('🔄   Update to Next Month',             'updateMonth')
    .addSeparator()
    .addItem('📤   Post Today\'s Schedule → Slack',   'postScheduleToSlack')
    .addSeparator()
    .addItem('⏰   Create Daily 8 AM Slack Trigger',  'createTimeDrivenTrigger')
    .addItem('🗑️   Remove All Triggers',              'deleteAllTriggers')
    .addToUi();
}


// ═════════════════════════════════════════════════════════════
//  DAILY TRIGGER — posts schedule to Slack every morning
// ═════════════════════════════════════════════════════════════

/**
 * Creates a time-driven trigger that calls postScheduleToSlack()
 * every day at CFG.POST_HOUR (default 8 AM) in the script's timezone.
 *
 * Run this ONCE from the menu or manually; the trigger persists
 * until you call deleteAllTriggers() or remove it from the
 * Apps Script "Triggers" dashboard.
 */
function createTimeDrivenTrigger() {
  // Remove stale triggers for the same function first
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'postScheduleToSlack') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('postScheduleToSlack')
    .timeBased()
    .everyDays(1)
    .atHour(CFG.POST_HOUR)
    .create();

  const tz  = Session.getScriptTimeZone();
  const msg = '⏰  Daily trigger created: postScheduleToSlack fires every day at ' +
              CFG.POST_HOUR + ':00 (' + tz + ').';
  Logger.log(msg);
  SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Trigger Created', 7);
}


/**
 * Removes ALL project triggers (not just the Slack one).
 * Use this to cleanly reset before re-creating triggers.
 */
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) { ScriptApp.deleteTrigger(t); });

  const msg = '🗑️  ' + triggers.length + ' trigger(s) removed.';
  Logger.log(msg);
  SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Triggers Cleared', 5);
}
