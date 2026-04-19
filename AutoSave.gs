/**
 * Auto-save: debounced save driven by onEdit + a 1-minute installable trigger.
 *
 * Flow:
 *   onEdit (simple trigger)     – stamps "dirty" + timestamp in ScriptProperties.
 *   _autoSavePending (timer)    – saves if dirty AND 30 s have elapsed since last edit.
 *
 * Install the timer with setupAutoSaveTrigger(); remove with removeAutoSaveTrigger().
 * Without the timer installed, onEdit marks dirty but nothing is saved automatically.
 */

// ─── Simple trigger ───────────────────────────────────────────────────────────

function onEdit(e) {
  var sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAMES.MAIN) return;
  if (e.range.getRow() < CONFIG.DATA_START_ROW) return; // ignore nav / header edits

  var p = PropertiesService.getScriptProperties();
  p.setProperty('autosave_dirty',     'true');
  p.setProperty('autosave_last_edit', Date.now().toString());
}

// ─── Installable timer (every 1 minute) ──────────────────────────────────────

function _autoSavePending() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('autosave_dirty') !== 'true') return;

  var lastEdit = parseInt(p.getProperty('autosave_last_edit') || '0', 10);
  if (Date.now() - lastEdit < 30000) return; // user still editing — wait

  p.setProperty('autosave_dirty', 'false');
  saveCurrentToDataStore(true); // silent = skip toast & UI alerts
}

// ─── Trigger management ───────────────────────────────────────────────────────

function setupAutoSaveTrigger() {
  // Remove any existing copy to prevent duplicates
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === '_autoSavePending') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('_autoSavePending').timeBased().everyMinutes(1).create();
  SpreadsheetApp.getActiveSpreadsheet()
    .toast('Auto-save enabled — saves 30 s after you stop editing', '⏱️ Auto-Save On', 4);
}

function removeAutoSaveTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === '_autoSavePending') ScriptApp.deleteTrigger(t);
  });
  PropertiesService.getScriptProperties().deleteProperty('autosave_dirty');
  SpreadsheetApp.getActiveSpreadsheet().toast('Auto-save disabled', '⏹️ Auto-Save Off', 3);
}
