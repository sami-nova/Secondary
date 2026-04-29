// ============================================================
//  DAILY MANAGER SCHEDULE TRACKER  v2.0
//  Single-file Google Apps Script
//  – Dropdown editing  – Vibrant CF  – Vacation status
//  – All functions in one file (fixes "function not found")
// ============================================================

// ─── CONFIG ──────────────────────────────────────────────────
var CFG = {
  SHEET_NAME    : 'Schedule',
  SLACK_WEBHOOK : 'YOUR_SLACK_WEBHOOK_URL_HERE',
  POST_HOUR     : 8,
  FROZEN_COLS   : 4,
  HEADER_ROW    : 2,
  DATA_START_ROW: 3,
};

// ─── DROPDOWN OPTIONS (shown in every day cell) ───────────────
var OPTS = ['09:00-18:00','10:00-19:00','08:00-17:00','07:00-16:00','12:00-21:00','DO','Vacation'];
var DEFAULT_HOURS = '09:00-18:00';
var DAY_OFF       = 'DO';
var VACATION      = 'Vacation';

// ─── COLOURS ─────────────────────────────────────────────────
var C = {
  TITLE_BG : '#1565C0', TITLE_FG : '#FFFFFF',
  HDR_BG   : '#1976D2', HDR_FG   : '#FFFFFF',
  WKND_BG  : '#455A64', WKND_FG  : '#FFFFFF',
  RGN_BG   : '#1976D2', RGN_FG   : '#FFFFFF',
  WORK_BG  : '#C8E6C9', WORK_FG  : '#1B5E20',
  OFF_BG   : '#FFCDD2', OFF_FG   : '#B71C1C',
  VAC_BG   : '#E1BEE7', VAC_FG   : '#6A1B9A',
  HOL_BG   : '#FFE082', HOL_FG   : '#E65100',
  TODAY_BG : '#FFA000', TODAY_FG : '#FFFFFF',
  ODD_BG   : '#F5F7FF', EVN_BG   : '#FFFFFF',
  BORDER   : '#BBDEFB',
};

// ─── SORT ORDERS ─────────────────────────────────────────────
var REGION_ORDER    = ['TR','ES','IL','RU','IT','CZ/SK','AE/ARAB/SA','FR','PL','RO'];
var PROCEDURE_ORDER = ['Churn Prevention','Killer Base','Active Retention'];
var DAY_ABBR        = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── MANAGER ROSTER (28 managers) ────────────────────────────
var MANAGERS = [
  {name:'Ahmet Yilmaz',      region:'TR',         procedure:'Churn Prevention', id:'MGR-TR-001'},
  {name:'Fatma Kaya',        region:'TR',         procedure:'Killer Base',       id:'MGR-TR-002'},
  {name:'Mehmet Demir',      region:'TR',         procedure:'Active Retention',  id:'MGR-TR-003'},
  {name:'Carlos García',     region:'ES',         procedure:'Churn Prevention', id:'MGR-ES-001'},
  {name:'María López',       region:'ES',         procedure:'Active Retention',  id:'MGR-ES-002'},
  {name:'Rodrigo Silva',     region:'ES',         procedure:'Killer Base',       id:'MGR-ES-003'},
  {name:'Avi Cohen',         region:'IL',         procedure:'Killer Base',       id:'MGR-IL-001'},
  {name:'Noa Levi',          region:'IL',         procedure:'Active Retention',  id:'MGR-IL-002'},
  {name:'Ivan Petrov',       region:'RU',         procedure:'Churn Prevention', id:'MGR-RU-001'},
  {name:'Anna Smirnova',     region:'RU',         procedure:'Active Retention',  id:'MGR-RU-002'},
  {name:'Dmitri Volkov',     region:'RU',         procedure:'Killer Base',       id:'MGR-RU-003'},
  {name:'Marco Rossi',       region:'IT',         procedure:'Churn Prevention', id:'MGR-IT-001'},
  {name:'Giulia Ferrari',    region:'IT',         procedure:'Active Retention',  id:'MGR-IT-002'},
  {name:'Hans Mueller',      region:'IT',         procedure:'Killer Base',       id:'MGR-IT-003'},
  {name:'Jan Novák',         region:'CZ/SK',      procedure:'Killer Base',       id:'MGR-CZ-001'},
  {name:'Eva Svoboda',       region:'CZ/SK',      procedure:'Churn Prevention', id:'MGR-CZ-002'},
  {name:'Omar Al-Rashid',    region:'AE/ARAB/SA', procedure:'Active Retention',  id:'MGR-AE-001'},
  {name:'Layla Khalid',      region:'AE/ARAB/SA', procedure:'Churn Prevention', id:'MGR-AE-002'},
  {name:'Yusuf Hassan',      region:'AE/ARAB/SA', procedure:'Killer Base',       id:'MGR-AE-003'},
  {name:'Pierre Dubois',     region:'FR',         procedure:'Churn Prevention', id:'MGR-FR-001'},
  {name:'Sophie Martin',     region:'FR',         procedure:'Active Retention',  id:'MGR-FR-002'},
  {name:'Lucie Bernard',     region:'FR',         procedure:'Killer Base',       id:'MGR-FR-003'},
  {name:'Piotr Kowalski',    region:'PL',         procedure:'Killer Base',       id:'MGR-PL-001'},
  {name:'Agnieszka Wojcik',  region:'PL',         procedure:'Churn Prevention', id:'MGR-PL-002'},
  {name:'Tomasz Wisniewski', region:'PL',         procedure:'Active Retention',  id:'MGR-PL-003'},
  {name:'Alexandru Popescu', region:'RO',         procedure:'Churn Prevention', id:'MGR-RO-001'},
  {name:'Elena Ionescu',     region:'RO',         procedure:'Active Retention',  id:'MGR-RO-002'},
  {name:'Mihai Constantin',  region:'RO',         procedure:'Killer Base',       id:'MGR-RO-003'},
];

// ─── PUBLIC HOLIDAYS ('YYYY-MM-DD') ──────────────────────────
var PUBLIC_HOLIDAYS = [
  // '2026-05-01',
];

// ─── MENU ────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Schedule Management')
    .addItem('Build / Rebuild This Month', 'buildScheduleSheet')
    .addItem('Update to Next Month',       'updateMonth')
    .addSeparator()
    .addItem('Post Today to Slack',        'postScheduleToSlack')
    .addSeparator()
    .addItem('Set Up Daily 8AM Trigger',   'createTimeDrivenTrigger')
    .addItem('Remove All Triggers',        'deleteAllTriggers')
    .addToUi();
}
// ─── BUILD SCHEDULE SHEET ────────────────────────────────────
function buildScheduleSheet(targetDate) {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var tz   = Session.getScriptTimeZone();
  var date = (targetDate instanceof Date) ? targetDate : new Date();
  var year        = date.getFullYear();
  var month       = date.getMonth();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var monthLabel  = Utilities.formatDate(date, tz, 'MMMM yyyy');
  var totalCols   = CFG.FROZEN_COLS + daysInMonth;

  // Build holiday lookup
  var holidays = {};
  for (var h = 0; h < PUBLIC_HOLIDAYS.length; h++) {
    holidays[PUBLIC_HOLIDAYS[h]] = true;
  }

  // Get or reset sheet
  var sheet = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CFG.SHEET_NAME, 0);
  } else {
    sheet.clearConditionalFormatRules();
    var f = sheet.getFilter();
    if (f) f.remove();
    sheet.clear();
  }

  // Sort managers by region then procedure
  var sorted = MANAGERS.slice().sort(function(a, b) {
    var ri = REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region);
    return ri !== 0 ? ri : PROCEDURE_ORDER.indexOf(a.procedure) - PROCEDURE_ORDER.indexOf(b.procedure);
  });
  var byRegion = {};
  for (var i = 0; i < REGION_ORDER.length; i++) byRegion[REGION_ORDER[i]] = [];
  for (var i = 0; i < sorted.length; i++) {
    if (byRegion[sorted[i].region]) byRegion[sorted[i].region].push(sorted[i]);
  }

  // ── ROW 1: Title ─────────────────────────────────────────
  sheet.getRange(1, 1, 1, totalCols).merge()
    .setValue('Daily Manager Schedule Tracker  —  ' + monthLabel)
    .setBackground(C.TITLE_BG).setFontColor(C.TITLE_FG)
    .setFontSize(15).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 46);

  // ── ROW 2: Column headers ─────────────────────────────────
  sheet.getRange(CFG.HEADER_ROW, 1, 1, CFG.FROZEN_COLS)
    .setValues([['Manager Name','Region','Procedure','Manager ID']])
    .setBackground(C.HDR_BG).setFontColor(C.HDR_FG)
    .setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  var dayLabels = [];
  for (var d = 1; d <= daysInMonth; d++) {
    var dow = new Date(year, month, d).getDay();
    dayLabels.push(DAY_ABBR[dow] + '\n' + (d < 10 ? '0' + d : '' + d));
  }
  sheet.getRange(CFG.HEADER_ROW, CFG.FROZEN_COLS + 1, 1, daysInMonth)
    .setValues([dayLabels])
    .setBackground(C.HDR_BG).setFontColor(C.HDR_FG)
    .setFontWeight('bold').setFontSize(9)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sheet.setRowHeight(CFG.HEADER_ROW, 50);

  // Weekend headers: blue-grey
  for (var d = 1; d <= daysInMonth; d++) {
    var dow = new Date(year, month, d).getDay();
    if (dow === 0 || dow === 6) {
      sheet.getRange(CFG.HEADER_ROW, CFG.FROZEN_COLS + d)
        .setBackground(C.WKND_BG).setFontColor(C.WKND_FG);
    }
  }

  // ── DATA ROWS ────────────────────────────────────────────
  var currentRow  = CFG.DATA_START_ROW;
  var managerRows = []; // track for data validation

  for (var ri = 0; ri < REGION_ORDER.length; ri++) {
    var region = REGION_ORDER[ri];
    var mgrs   = byRegion[region];
    if (!mgrs || mgrs.length === 0) continue;

    // Region separator row
    sheet.getRange(currentRow, 1)
      .setValue('  ' + region)
      .setBackground(C.RGN_BG).setFontColor(C.RGN_FG)
      .setFontWeight('bold').setFontSize(11)
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
    sheet.getRange(currentRow, 2)
      .setValue(region)
      .setBackground(C.RGN_BG).setFontColor(C.RGN_FG)
      .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.getRange(currentRow, 3, 1, CFG.FROZEN_COLS - 2 + daysInMonth)
      .setBackground(C.RGN_BG);
    sheet.getRange(currentRow, 1, 1, totalCols)
      .setBorder(true, false, true, false, false, false,
                 C.RGN_FG, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheet.setRowHeight(currentRow, 28);
    currentRow++;

    // Manager rows
    for (var mi = 0; mi < mgrs.length; mi++) {
      var mgr   = mgrs[mi];
      var rowBg = (mi % 2 === 0) ? C.ODD_BG : C.EVN_BG;
      managerRows.push(currentRow);

      sheet.getRange(currentRow, 1, 1, CFG.FROZEN_COLS)
        .setValues([[mgr.name, mgr.region, mgr.procedure, mgr.id]])
        .setBackground(rowBg).setVerticalAlignment('middle').setFontSize(10);
      sheet.getRange(currentRow, 1)
        .setFontWeight('bold').setHorizontalAlignment('left');
      sheet.getRange(currentRow, 2, 1, 3)
        .setHorizontalAlignment('center');
      sheet.getRange(currentRow, 4)
        .setFontSize(8).setFontColor('#78909C');

      // Day cells
      var dayVals = [];
      for (var d = 1; d <= daysInMonth; d++) {
        var dayDate = new Date(year, month, d);
        var dow2    = dayDate.getDay();
        var ds      = Utilities.formatDate(dayDate, tz, 'yyyy-MM-dd');
        dayVals.push((dow2 === 0 || dow2 === 6 || holidays[ds]) ? DAY_OFF : DEFAULT_HOURS);
      }
      sheet.getRange(currentRow, CFG.FROZEN_COLS + 1, 1, daysInMonth)
        .setValues([dayVals])
        .setBackground(rowBg).setFontSize(8)
        .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(false);

      sheet.setRowHeight(currentRow, 28);
      currentRow++;
    }
  }

  var lastDataRow = currentRow - 1;

  // ── Column widths ─────────────────────────────────────────
  sheet.setColumnWidth(1, 175);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 140);
  sheet.setColumnWidth(4, 105);
  for (var c = CFG.FROZEN_COLS + 1; c <= totalCols; c++) sheet.setColumnWidth(c, 66);

  // ── Borders ───────────────────────────────────────────────
  sheet.getRange(CFG.HEADER_ROW, 1, lastDataRow - CFG.HEADER_ROW + 1, totalCols)
    .setBorder(true, true, true, true, true, true,
               C.BORDER, SpreadsheetApp.BorderStyle.SOLID);

  // ── Freeze panes ─────────────────────────────────────────
  sheet.setFrozenRows(CFG.HEADER_ROW);
  sheet.setFrozenColumns(CFG.FROZEN_COLS);

  // ── Data validation (dropdown) on manager day cells ───────
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(OPTS, true)
    .setAllowInvalid(true)
    .setHelpText('Choose: shift hours, DO (Day Off), or Vacation')
    .build();
  for (var i = 0; i < managerRows.length; i++) {
    sheet.getRange(managerRows[i], CFG.FROZEN_COLS + 1, 1, daysInMonth)
      .setDataValidation(rule);
  }

  // ── Conditional formatting ────────────────────────────────
  applyCF_(sheet, lastDataRow, daysInMonth, year, month, holidays);

  // ── Filter on fixed columns ───────────────────────────────
  sheet.getRange(CFG.HEADER_ROW, 1, lastDataRow - CFG.HEADER_ROW + 1, CFG.FROZEN_COLS)
    .createFilter();

  // ── Today column highlight ────────────────────────────────
  var today = new Date();
  if (today.getFullYear() === year && today.getMonth() === month) {
    var tc = CFG.FROZEN_COLS + today.getDate();
    if (tc <= totalCols) {
      sheet.getRange(CFG.HEADER_ROW, tc)
        .setBackground(C.TODAY_BG).setFontColor(C.TODAY_FG).setFontWeight('bold')
        .setBorder(true, true, true, true, false, false,
                   '#E65100', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
  }

  sheet.setTabColor('#1565C0');
  SpreadsheetApp.flush();
  ss.setActiveSheet(sheet);
  sheet.setActiveSelection('A1');
  Logger.log('Schedule built: ' + monthLabel + ' | ' + sorted.length + ' managers | rows 3-' + lastDataRow);
}
// ─── CONDITIONAL FORMATTING ──────────────────────────────────
// Priority (rules[0] = highest):
//   Holiday columns  → amber
//   Vacation text    → purple
//   DO text          → red
//   Any text with ':' → green (catches all shift strings)
function applyCF_(sheet, lastDataRow, daysInMonth, year, month, holidays) {
  var startRow    = CFG.DATA_START_ROW;
  var numRows     = lastDataRow - startRow + 1;
  if (numRows <= 0) return;

  var dayColStart = CFG.FROZEN_COLS + 1;
  var fullRange   = sheet.getRange(startRow, dayColStart, numRows, daysInMonth);
  var rules       = [];

  // Working hours (any cell containing ':') → green
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains(':')
    .setBackground(C.WORK_BG).setFontColor(C.WORK_FG)
    .setRanges([fullRange]).build());

  // Day Off → red + bold
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(DAY_OFF)
    .setBackground(C.OFF_BG).setFontColor(C.OFF_FG).setFontWeight('bold')
    .setRanges([fullRange]).build());

  // Vacation → purple + bold
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(VACATION)
    .setBackground(C.VAC_BG).setFontColor(C.VAC_FG).setFontWeight('bold')
    .setRanges([fullRange]).build());

  // Holiday columns → amber override (prepended = highest priority)
  for (var h = 0; h < PUBLIC_HOLIDAYS.length; h++) {
    var hd = new Date(PUBLIC_HOLIDAYS[h] + 'T00:00:00');
    if (hd.getFullYear() !== year || hd.getMonth() !== month) continue;
    var col = dayColStart + hd.getDate() - 1;
    rules.unshift(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=TRUE')
      .setBackground(C.HOL_BG).setFontColor(C.HOL_FG)
      .setRanges([sheet.getRange(startRow, col, numRows, 1)]).build());
    sheet.getRange(CFG.HEADER_ROW, col)
      .setBackground(C.HOL_BG).setFontColor(C.HOL_FG).setFontWeight('bold');
  }

  sheet.setConditionalFormatRules(rules);
}

// ─── UPDATE MONTH ─────────────────────────────────────────────
function updateMonth() {
  var ui   = SpreadsheetApp.getUi();
  var next = new Date();
  next.setDate(1);
  next.setMonth(next.getMonth() + 1);
  var label = Utilities.formatDate(next, Session.getScriptTimeZone(), 'MMMM yyyy');
  var res = ui.alert('Rebuild for Next Month?',
    'Clear all data and rebuild for ' + label + '?', ui.ButtonSet.YES_NO);
  if (res !== ui.Button.YES) return;
  buildScheduleSheet(next);
  ui.alert('Done', 'Schedule rebuilt for ' + label + '.', ui.ButtonSet.OK);
}
// ─── POST SCHEDULE TO SLACK ───────────────────────────────────
function postScheduleToSlack() {
  if (CFG.SLACK_WEBHOOK === 'YOUR_SLACK_WEBHOOK_URL_HERE') {
    SpreadsheetApp.getUi().alert('Setup Required',
      'Replace CFG.SLACK_WEBHOOK with your Slack Incoming Webhook URL.',
      SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sheet) { ss.toast('Sheet not found. Run Build first.', 'Error', 5); return; }

  var tz          = Session.getScriptTimeZone();
  var today       = new Date();
  var displayDate = Utilities.formatDate(today, tz, 'EEEE, MMMM dd yyyy');
  var todayCol    = CFG.FROZEN_COLS + today.getDate();
  if (todayCol > sheet.getLastColumn()) {
    ss.toast('Today is outside the current schedule month.', 'Warning', 5); return;
  }

  var lastRow = sheet.getLastRow();
  var data    = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();

  // Build per-region status buckets
  var status = {};
  for (var i = 0; i < REGION_ORDER.length; i++) {
    status[REGION_ORDER[i]] = {working:[], off:[], vacation:[]};
  }
  for (var r = CFG.DATA_START_ROW - 1; r < lastRow; r++) {
    var row  = data[r];
    var name = String(row[0]||'').trim();
    var reg  = String(row[1]||'').trim();
    var proc = String(row[2]||'').trim();
    var id   = String(row[3]||'').trim();
    if (!name || !id || REGION_ORDER.indexOf(reg) < 0) continue;
    var val  = String(row[todayCol - 1]||'').trim();
    var tag  = '*' + name + '*  _(' + proc + ')_';
    if      (val === DAY_OFF)   status[reg].off.push('• ' + tag);
    else if (val === VACATION)  status[reg].vacation.push('• ' + tag);
    else if (val !== '')        status[reg].working.push('• ' + tag + '  `' + val + '`');
  }

  // Totals
  var tw = 0, to = 0, tv = 0;
  for (var i = 0; i < REGION_ORDER.length; i++) {
    var s = status[REGION_ORDER[i]];
    tw += s.working.length; to += s.off.length; tv += s.vacation.length;
  }

  // Build Block Kit blocks
  var blocks = [];
  blocks.push({type:'header',
    text:{type:'plain_text', text:'Manager Daily Schedule  —  ' + displayDate, emoji:true}});
  blocks.push({type:'divider'});
  blocks.push({type:'section', fields:[
    {type:'mrkdwn', text:'*Working today*\n✅  ' + tw + ' manager' + (tw!==1?'s':'')},
    {type:'mrkdwn', text:'*Day Off*\n🔴  ' + to  + ' manager' + (to!==1?'s':'')},
    {type:'mrkdwn', text:'*Vacation*\n🏖️  '  + tv + ' manager' + (tv!==1?'s':'')}
  ]});
  blocks.push({type:'divider'});

  for (var i = 0; i < REGION_ORDER.length; i++) {
    var region = REGION_ORDER[i];
    var s      = status[region];
    if (s.working.length + s.off.length + s.vacation.length === 0) continue;
    blocks.push({type:'section', text:{type:'mrkdwn', text:'*🌍  ' + region + '*'}});
    if (s.working.length)
      blocks.push({type:'section', text:{type:'mrkdwn', text:'✅  *Working:*\n' + s.working.join('\n')}});
    if (s.off.length)
      blocks.push({type:'section', text:{type:'mrkdwn', text:'🔴  *Day Off:*\n' + s.off.join('\n')}});
    if (s.vacation.length)
      blocks.push({type:'section', text:{type:'mrkdwn', text:'🏖️  *Vacation:*\n' + s.vacation.join('\n')}});
    blocks.push({type:'divider'});
  }
  blocks.push({type:'context', elements:[
    {type:'mrkdwn', text:'_Auto-posted from Google Sheets · ' + displayDate + '_'}
  ]});

  // Send (chunk to ≤50 blocks per request)
  var ok = true;
  for (var i = 0; i < blocks.length; i += 50) {
    var resp = UrlFetchApp.fetch(CFG.SLACK_WEBHOOK, {
      method:'post', contentType:'application/json',
      payload: JSON.stringify({blocks: blocks.slice(i, i + 50)}),
      muteHttpExceptions: true
    });
    Logger.log('Slack ' + resp.getResponseCode() + ': ' + resp.getContentText());
    if (resp.getResponseCode() !== 200) ok = false;
  }
  ss.toast(ok ? 'Posted to Slack!' : 'Slack error — check logs.', ok ? 'Success' : 'Error', 5);
}

// ─── TRIGGERS ─────────────────────────────────────────────────
function createTimeDrivenTrigger() {
  // Remove any existing postScheduleToSlack triggers first
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'postScheduleToSlack')
      ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('postScheduleToSlack')
    .timeBased().everyDays(1).atHour(CFG.POST_HOUR).create();
  SpreadsheetApp.getActiveSpreadsheet()
    .toast('Daily trigger set: ' + CFG.POST_HOUR + ':00 AM every day.', 'Trigger Created', 6);
}

function deleteAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) ScriptApp.deleteTrigger(triggers[i]);
  SpreadsheetApp.getActiveSpreadsheet()
    .toast(triggers.length + ' trigger(s) removed.', 'Done', 4);
}
