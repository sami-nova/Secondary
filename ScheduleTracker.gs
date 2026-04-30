// ============================================================
//  MANAGER SCHEDULE TRACKER  — Command Center  v4.2
//  Single-file Google Apps Script
// ============================================================

// ─── CONFIGURATION ───────────────────────────────────────────
var CFG = {
  SHEET_NAME    : 'Schedule',
  SLACK_WEBHOOK : 'YOUR_SLACK_WEBHOOK_URL_HERE',
  SHEET_URL     : '',           // optional: paste your sheet URL for Slack button
  POST_HOUR     : 8,
  FROZEN_COLS   : 6,            // Name·Region·Procedure·Working·Off·Vac/Sick
  HEADER_ROW    : 2,
  DATA_START_ROW: 3,
  DAY_COL_START : 7,            // day columns begin at col 7 (G)
};

// ─── SCHEDULE OPTIONS (dropdown in every day cell) ────────────
var OPTS = ['09:00-18:00','10:00-19:00','08:00-17:00','07:00-16:00',
            '12:00-21:00','14:00-23:00','Half Day','DO','Vacation','Sick'];
var DEFAULT_HOURS = '09:00-18:00';
var DAY_OFF  = 'DO';
var VACATION = 'Vacation';
var SICK     = 'Sick';
var HALF_DAY = 'Half Day';

// ─── COLOUR PALETTE ──────────────────────────────────────────
var C = {
  TITLE_BG  : '#0D47A1', TITLE_FG  : '#FFFFFF',
  LEGEND_BG : '#E8EAF6', LEGEND_FG : '#283593',
  HDR_BG    : '#1565C0', HDR_FG    : '#FFFFFF',
  SUMHDR_BG : '#283593', SUMHDR_FG : '#FFFFFF',
  WKND_BG   : '#37474F', WKND_FG   : '#ECEFF1',
  WORK_BG   : '#A5D6A7', WORK_FG   : '#1B5E20',
  OFF_BG    : '#EF9A9A', OFF_FG    : '#B71C1C',
  VAC_BG    : '#CE93D8', VAC_FG    : '#4A148C',
  SICK_BG   : '#FFAB91', SICK_FG   : '#BF360C',
  HALF_BG   : '#FFF59D', HALF_FG   : '#F57F17',
  HOL_BG    : '#FFD54F', HOL_FG    : '#E65100',
  TODAY_BG  : '#FF6F00', TODAY_FG  : '#FFFFFF',
  TODAY_COL : '#FFF8E1',        // day-cell tint for today column
  BORDER_OUT: '#0D47A1',
  BORDER_IN : '#90CAF9',
  PROC_CHURN: '#E1F5FE',        // procedure tints
  PROC_KILL : '#FFF3E0',
  PROC_RETEN: '#E0F2F1',
};

// ─── PER-REGION ACCENT COLOURS ────────────────────────────────
var REGION_COLORS = {
  'TR'        : {hdr:'#1B5E20', hdrFg:'#FFFFFF', odd:'#F1F8E9', even:'#DCEDC8'},
  'ES'        : {hdr:'#E65100', hdrFg:'#FFFFFF', odd:'#FFF3E0', even:'#FFE0B2'},
  'IL'        : {hdr:'#0D47A1', hdrFg:'#FFFFFF', odd:'#E3F2FD', even:'#BBDEFB'},
  'RU'        : {hdr:'#B71C1C', hdrFg:'#FFFFFF', odd:'#FFEBEE', even:'#FFCDD2'},
  'IT'        : {hdr:'#4E342E', hdrFg:'#FFFFFF', odd:'#EFEBE9', even:'#D7CCC8'},
  'CZ/SK'     : {hdr:'#283593', hdrFg:'#FFFFFF', odd:'#E8EAF6', even:'#C5CAE9'},
  'AE/ARAB/SA': {hdr:'#F57F17', hdrFg:'#FFFFFF', odd:'#FFFDE7', even:'#FFF9C4'},
  'FR'        : {hdr:'#1565C0', hdrFg:'#FFFFFF', odd:'#E3F2FD', even:'#BBDEFB'},
  'PL'        : {hdr:'#880E4F', hdrFg:'#FFFFFF', odd:'#FCE4EC', even:'#F8BBD0'},
  'RO'        : {hdr:'#4A148C', hdrFg:'#FFFFFF', odd:'#F3E5F5', even:'#E1BEE7'},
  'DE'        : {hdr:'#212121', hdrFg:'#FDD835', odd:'#FAFAFA',  even:'#F0F0F0' },
};

// ─── REGIONAL FLAGS ───────────────────────────────────────────
var REGION_EMOJIS = {
  'TR':'🇹🇷','ES':'🇪🇸','IL':'🇮🇱','RU':'🇷🇺','IT':'🇮🇹',
  'CZ/SK':'🇨🇿','AE/ARAB/SA':'🇦🇪','FR':'🇫🇷','PL':'🇵🇱','RO':'🇷🇴','DE':'🇩🇪'
};

// ─── SORT ORDERS ─────────────────────────────────────────────
var REGION_ORDER    = ['TR','ES','IL','RU','IT','CZ/SK','AE/ARAB/SA','FR','PL','RO','DE'];
var PROCEDURE_ORDER = ['Churn Prevention','Killer Base','Active Retention'];
var DAY_ABBR        = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── PUBLIC HOLIDAYS ('YYYY-MM-DD') ──────────────────────────
var PUBLIC_HOLIDAYS = [
  // '2026-05-01',
];

// ─── DEFAULT MANAGER ROSTER (28 managers) ────────────────────
// Seeds the hidden _Managers_ sheet on first run.
// To rename managers after setup: Schedule Management → Edit Manager List,
// edit the sheet directly, then  Schedule Management → Refresh Schedule from List.
var MANAGERS = [
  // ── TR (6) ────────────────────────────────────────────
  {name:'Ahmet Yilmaz',        region:'TR',         procedure:'Churn Prevention'},
  {name:'Fatma Kaya',          region:'TR',         procedure:'Killer Base'      },
  {name:'Mehmet Demir',        region:'TR',         procedure:'Active Retention' },
  {name:'Zeynep Arslan',       region:'TR',         procedure:'Churn Prevention'},
  {name:'Mustafa Çelik',       region:'TR',         procedure:'Killer Base'      },
  {name:'Aylin Doğan',         region:'TR',         procedure:'Active Retention' },
  // ── ES (1) ────────────────────────────────────────────
  {name:'Carlos García',       region:'ES',         procedure:'Churn Prevention'},
  // ── IL (5) ────────────────────────────────────────────
  {name:'Avi Cohen',           region:'IL',         procedure:'Killer Base'      },
  {name:'Noa Levi',            region:'IL',         procedure:'Active Retention' },
  {name:'Yael Mizrahi',        region:'IL',         procedure:'Churn Prevention'},
  {name:'Daniel Ben-David',    region:'IL',         procedure:'Killer Base'      },
  {name:'Tamar Shapiro',       region:'IL',         procedure:'Active Retention' },
  // ── RU (1) ────────────────────────────────────────────
  {name:'Ivan Petrov',         region:'RU',         procedure:'Churn Prevention'},
  // ── IT (2) ────────────────────────────────────────────
  {name:'Marco Rossi',         region:'IT',         procedure:'Churn Prevention'},
  {name:'Giulia Ferrari',      region:'IT',         procedure:'Active Retention' },
  // ── CZ/SK (1) ─────────────────────────────────────────
  {name:'Jan Novak',           region:'CZ/SK',      procedure:'Killer Base'      },
  // ── AE/ARAB/SA (3) ────────────────────────────────────
  {name:'Omar Al-Rashid',      region:'AE/ARAB/SA', procedure:'Active Retention' },
  {name:'Layla Khalid',        region:'AE/ARAB/SA', procedure:'Churn Prevention'},
  {name:'Yusuf Hassan',        region:'AE/ARAB/SA', procedure:'Killer Base'      },
  // ── FR (1) ────────────────────────────────────────────
  {name:'Pierre Dubois',       region:'FR',         procedure:'Churn Prevention'},
  // ── PL (4) ────────────────────────────────────────────
  {name:'Piotr Kowalski',      region:'PL',         procedure:'Killer Base'      },
  {name:'Agnieszka Wojcik',    region:'PL',         procedure:'Churn Prevention'},
  {name:'Tomasz Wisniewski',   region:'PL',         procedure:'Active Retention' },
  {name:'Magdalena Kowalska',  region:'PL',         procedure:'Killer Base'      },
  // ── RO (2) ────────────────────────────────────────────
  {name:'Alexandru Popescu',   region:'RO',         procedure:'Churn Prevention'},
  {name:'Elena Ionescu',       region:'RO',         procedure:'Active Retention' },
  // ── DE (2) ────────────────────────────────────────────
  {name:'Klaus Weber',         region:'DE',         procedure:'Churn Prevention'},
  {name:'Heike Braun',         region:'DE',         procedure:'Killer Base'      },
];
// ─── UTILITY HELPERS ─────────────────────────────────────────

// Returns the spreadsheet whether called interactively or from a trigger.
function getSpreadsheet_() {
  try { return SpreadsheetApp.getActiveSpreadsheet(); } catch(e) {}
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : null;
}

// Converts a 1-based column number to a letter string (1→A, 27→AA, etc.)
function colLetter_(n) {
  var s = '';
  while (n > 0) { s = String.fromCharCode(64 + (n - 1) % 26 + 1) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// Returns the procedure-tint colour or null.
function procBg_(procedure) {
  if (procedure === 'Churn Prevention') return C.PROC_CHURN;
  if (procedure === 'Killer Base')      return C.PROC_KILL;
  if (procedure === 'Active Retention') return C.PROC_RETEN;
  return null;
}

// ─── MENU ────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Schedule Management')
    .addItem('Build / Rebuild This Month',    'buildScheduleSheet')
    .addItem('Update to Next Month',          'updateMonth')
    .addItem('Reset Day Cells Only',          'resetSheet')
    .addSeparator()
    .addItem('Edit Manager List',             'editManagersList')
    .addItem('Refresh Schedule from List',    'refreshFromManagerList')
    .addItem('Add New Manager',               'addNewManager')
    .addSeparator()
    .addItem('Post Today to Slack',           'postScheduleToSlack')
    .addSeparator()
    .addItem('Set Up Daily 8AM Trigger',      'createTimeDrivenTrigger')
    .addItem('Remove All Triggers',           'deleteAllTriggers')
    .addToUi();
}

// ─── MAIN BUILD ──────────────────────────────────────────────
function buildScheduleSheet(targetDate) {
  var ss   = getSpreadsheet_();
  var tz   = Session.getScriptTimeZone();
  var date = (targetDate instanceof Date) ? targetDate : new Date();
  var year        = date.getFullYear();
  var month       = date.getMonth();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var monthLabel  = Utilities.formatDate(date, tz, 'MMMM yyyy');
  var totalCols   = CFG.FROZEN_COLS + daysInMonth;

  // Store ID for trigger-context access
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());

  // Holiday lookup
  var holidays = {};
  for (var h = 0; h < PUBLIC_HOLIDAYS.length; h++) holidays[PUBLIC_HOLIDAYS[h]] = true;

  // Get or reset sheet
  var sheet = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sheet) { sheet = ss.insertSheet(CFG.SHEET_NAME, 0); }
  else {
    sheet.clearConditionalFormatRules();
    var ef = sheet.getFilter(); if (ef) ef.remove();
    sheet.clear();
  }

  // Load manager list (from _Managers_ sheet, or seed from defaults)
  var managers = getManagersList_(ss);

  // Sort by region order then procedure order
  var sorted = managers.slice().sort(function(a, b) {
    var ri = REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region);
    return ri !== 0 ? ri : PROCEDURE_ORDER.indexOf(a.procedure) - PROCEDURE_ORDER.indexOf(b.procedure);
  });
  var byRegion = {};
  for (var i = 0; i < REGION_ORDER.length; i++) byRegion[REGION_ORDER[i]] = [];
  for (var i = 0; i < sorted.length; i++) {
    if (byRegion[sorted[i].region]) byRegion[sorted[i].region].push(sorted[i]);
  }

  // ── ROW 1: Title (frozen pane A:F) + Legend (scrollable G:end) ──
  // Each merge stays within one pane so setFrozenColumns(6) succeeds.
  sheet.getRange(1, 1, 1, CFG.FROZEN_COLS).merge()
    .setValue('MANAGER SCHEDULE COMMAND CENTER   ·   ' + monthLabel.toUpperCase())
    .setBackground(C.TITLE_BG).setFontColor(C.TITLE_FG)
    .setFontSize(13).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange(1, CFG.DAY_COL_START, 1, daysInMonth).merge()
    .setValue('LEGEND:   🟢 Working   🔴 Day Off   🟣 Vacation   🟠 Sick   🟡 Half Day   🟧 Holiday   ◆ Today Column')
    .setBackground(C.LEGEND_BG).setFontColor(C.LEGEND_FG)
    .setFontSize(10).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 42);

  // ── ROW 2: Column headers ─────────────────────────────────
  var fixedHdrs = [['MANAGER NAME','REGION','PROCEDURE','📊 WORKING','🔴 OFF','🟣 VAC/SICK']];
  sheet.getRange(CFG.HEADER_ROW, 1, 1, CFG.FROZEN_COLS)
    .setValues(fixedHdrs)
    .setBackground(C.HDR_BG).setFontColor(C.HDR_FG)
    .setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  // Summary header columns get a darker shade (cols 4-6)
  sheet.getRange(CFG.HEADER_ROW, 4, 1, 3)
    .setBackground(C.SUMHDR_BG).setFontColor(C.SUMHDR_FG);

  // Day-of-month headers
  var dayLabels = [];
  for (var d = 1; d <= daysInMonth; d++) {
    var dow = new Date(year, month, d).getDay();
    dayLabels.push(DAY_ABBR[dow] + '\n' + (d < 10 ? '0'+d : ''+d));
  }
  sheet.getRange(CFG.HEADER_ROW, CFG.DAY_COL_START, 1, daysInMonth)
    .setValues([dayLabels])
    .setBackground(C.HDR_BG).setFontColor(C.HDR_FG)
    .setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sheet.setRowHeight(CFG.HEADER_ROW, 54);

  // Weekend day-header tint
  for (var d = 1; d <= daysInMonth; d++) {
    var dow = new Date(year, month, d).getDay();
    if (dow === 0 || dow === 6)
      sheet.getRange(CFG.HEADER_ROW, CFG.DAY_COL_START + d - 1)
        .setBackground(C.WKND_BG).setFontColor(C.WKND_FG);
  }
  // ── DATA ROWS ────────────────────────────────────────────
  var currentRow  = CFG.DATA_START_ROW;
  var managerRows = [];   // track for data validation
  var dayStartLtr = colLetter_(CFG.DAY_COL_START);
  var dayEndLtr   = colLetter_(CFG.DAY_COL_START + daysInMonth - 1);

  for (var ri = 0; ri < REGION_ORDER.length; ri++) {
    var region = REGION_ORDER[ri];
    var mgrs   = byRegion[region];
    if (!mgrs || mgrs.length === 0) continue;
    var rc = REGION_COLORS[region] || {hdr:'#455A64',hdrFg:'#FFFFFF',odd:'#F5F5F5',even:'#EEEEEE'};

    // ── Region separator row ─────────────────────────────
    var rEmoji = REGION_EMOJIS[region] || '';
    sheet.getRange(currentRow, 1)
      .setValue('  ' + rEmoji + '  ' + region)
      .setBackground(rc.hdr).setFontColor(rc.hdrFg)
      .setFontWeight('bold').setFontSize(12)
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
    sheet.getRange(currentRow, 2)
      .setValue(region)
      .setBackground(rc.hdr).setFontColor(rc.hdrFg)
      .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.getRange(currentRow, 3)
      .setValue(mgrs.length + ' managers')
      .setBackground(rc.hdr).setFontColor(rc.hdrFg)
      .setFontStyle('italic').setFontSize(10)
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
    sheet.getRange(currentRow, 4, 1, CFG.FROZEN_COLS - 3 + daysInMonth)
      .setBackground(rc.hdr);   // covers summary cols + day cols on separator row
    // Thick border top + bottom on separator
    sheet.getRange(currentRow, 1, 1, totalCols)
      .setBorder(true, true, true, true, false, false,
                 rc.hdr, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheet.setRowHeight(currentRow, 30);
    currentRow++;

    // ── Manager rows ─────────────────────────────────────
    for (var mi = 0; mi < mgrs.length; mi++) {
      var mgr    = mgrs[mi];
      var rowBg  = (mi % 2 === 0) ? rc.odd : rc.even;
      var pBg    = procBg_(mgr.procedure) || rowBg;
      managerRows.push(currentRow);

      // Fixed cols A-C
      var rowR   = currentRow;
      sheet.getRange(rowR, 1).setValue(mgr.name)
        .setBackground(rowBg).setFontWeight('bold').setFontSize(11)
        .setHorizontalAlignment('left').setVerticalAlignment('middle');
      sheet.getRange(rowR, 2).setValue(mgr.region)
        .setBackground(rowBg).setFontSize(10)
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      sheet.getRange(rowR, 3).setValue(mgr.procedure)
        .setBackground(pBg).setFontSize(10)
        .setHorizontalAlignment('center').setVerticalAlignment('middle');

      // Summary formula cols (D, E, F) — dynamic, update as cells change
      var rng = dayStartLtr + rowR + ':' + dayEndLtr + rowR;
      sheet.getRange(rowR, 4)
        .setFormula('=COUNTIF(' + rng + ',"*:*")+COUNTIF(' + rng + ',"Half Day")')
        .setBackground(rowBg).setFontWeight('bold').setFontSize(10)
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      sheet.getRange(rowR, 5)
        .setFormula('=COUNTIF(' + rng + ',"DO")')
        .setBackground(rowBg).setFontWeight('bold').setFontSize(10)
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      sheet.getRange(rowR, 6)
        .setFormula('=COUNTIF(' + rng + ',"Vacation")+COUNTIF(' + rng + ',"Sick")')
        .setBackground(rowBg).setFontWeight('bold').setFontSize(10)
        .setHorizontalAlignment('center').setVerticalAlignment('middle');

      // Day cells
      var dayVals = [];
      for (var d = 1; d <= daysInMonth; d++) {
        var dd  = new Date(year, month, d);
        var dow2 = dd.getDay();
        var ds  = Utilities.formatDate(dd, tz, 'yyyy-MM-dd');
        dayVals.push((dow2===0||dow2===6||holidays[ds]) ? DAY_OFF : DEFAULT_HOURS);
      }
      sheet.getRange(rowR, CFG.DAY_COL_START, 1, daysInMonth)
        .setValues([dayVals])
        .setBackground(rowBg).setFontSize(9)
        .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(false);

      sheet.setRowHeight(rowR, 32);
      currentRow++;
    }
  }
  var lastDataRow = currentRow - 1;

  // ── Column widths ─────────────────────────────────────────
  sheet.setColumnWidth(1, 210);   // Name
  sheet.setColumnWidth(2, 90);    // Region
  sheet.setColumnWidth(3, 170);   // Procedure
  sheet.setColumnWidth(4, 80);    // Working days
  sheet.setColumnWidth(5, 70);    // Off days
  sheet.setColumnWidth(6, 82);    // Vac/Sick
  for (var c = CFG.DAY_COL_START; c <= totalCols; c++) sheet.setColumnWidth(c, 74);

  // ── Data validation: day cells (dropdown) ─────────────────
  var dayRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(OPTS, true).setAllowInvalid(true)
    .setHelpText('Choose a shift, DO, Vacation, Sick, or Half Day').build();
  for (var i = 0; i < managerRows.length; i++)
    sheet.getRange(managerRows[i], CFG.DAY_COL_START, 1, daysInMonth).setDataValidation(dayRule);

  // ── Data validation: Region column (col B) ────────────────
  var regionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(REGION_ORDER, true).setAllowInvalid(false).build();
  for (var i = 0; i < managerRows.length; i++)
    sheet.getRange(managerRows[i], 2).setDataValidation(regionRule);

  // ── Data validation: Procedure column (col C) ────────────
  var procRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(PROCEDURE_ORDER, true).setAllowInvalid(false).build();
  for (var i = 0; i < managerRows.length; i++)
    sheet.getRange(managerRows[i], 3).setDataValidation(procRule);
  // ── Borders: thick outer frame, thin inner grid ───────────
  var fullBlock = sheet.getRange(CFG.HEADER_ROW, 1, lastDataRow - CFG.HEADER_ROW + 1, totalCols);
  // Inner thin grid first
  fullBlock.setBorder(false, false, false, false, true, true,
                      C.BORDER_IN, SpreadsheetApp.BorderStyle.SOLID);
  // Outer thick frame on top (overrides edges only)
  fullBlock.setBorder(true, true, true, true, false, false,
                      C.BORDER_OUT, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // ── Freeze panes (no merge crosses col 7) ─────────────────
  sheet.setFrozenRows(CFG.HEADER_ROW);
  sheet.setFrozenColumns(CFG.FROZEN_COLS);

  // ── Conditional formatting (setBold fixes the TypeError) ──
  applyCF_(sheet, lastDataRow, daysInMonth, year, month, holidays);

  // ── Filter on fixed columns (Region + Procedure dropdowns) ─
  sheet.getRange(CFG.HEADER_ROW, 1, lastDataRow - CFG.HEADER_ROW + 1, CFG.FROZEN_COLS)
    .createFilter();

  // ── Today column glow ─────────────────────────────────────
  var today = new Date();
  if (today.getFullYear() === year && today.getMonth() === month) {
    var tc = CFG.DAY_COL_START + today.getDate() - 1;
    if (tc <= totalCols) {
      // Header: amber background + bold + thick border
      sheet.getRange(CFG.HEADER_ROW, tc)
        .setBackground(C.TODAY_BG).setFontColor(C.TODAY_FG).setFontWeight('bold')
        .setBorder(true, true, true, true, false, false,
                   '#BF360C', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      // Data column: light-amber tint on every manager row
      for (var i = 0; i < managerRows.length; i++) {
        sheet.getRange(managerRows[i], tc)
          .setBackground(C.TODAY_COL)
          .setBorder(null, true, null, true, false, false,
                     '#FF6F00', SpreadsheetApp.BorderStyle.SOLID);
      }
    }
  }

  // ── Tab colour ────────────────────────────────────────────
  sheet.setTabColor('#0D47A1');

  SpreadsheetApp.flush();   // ensure all formatting renders before function exits
  ss.setActiveSheet(sheet);
  sheet.setActiveSelection('A1');
  Logger.log('✅ Built: ' + monthLabel + ' | ' + sorted.length + ' managers | rows 3-' + lastDataRow);
} // END buildScheduleSheet


// ─── CONDITIONAL FORMATTING ──────────────────────────────────
// KEY FIX: use .setBold(true) — NOT .setFontWeight('bold')
// setFontWeight() does not exist on ConditionalFormatRuleBuilder.
function applyCF_(sheet, lastDataRow, daysInMonth, year, month, holidays) {
  var startRow    = CFG.DATA_START_ROW;
  var numRows     = lastDataRow - startRow + 1;
  if (numRows <= 0) return;
  var dayColStart = CFG.DAY_COL_START;
  var fullRange   = sheet.getRange(startRow, dayColStart, numRows, daysInMonth);
  var tz          = Session.getScriptTimeZone();
  var rules       = [];

  // Working hours (any cell containing ':') → green
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains(':')
    .setBackground(C.WORK_BG).setFontColor(C.WORK_FG)
    .setRanges([fullRange]).build());

  // Day Off → red + bold
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(DAY_OFF)
    .setBackground(C.OFF_BG).setFontColor(C.OFF_FG).setBold(true)
    .setRanges([fullRange]).build());

  // Vacation → purple + bold
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(VACATION)
    .setBackground(C.VAC_BG).setFontColor(C.VAC_FG).setBold(true)
    .setRanges([fullRange]).build());

  // Sick → coral + bold
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(SICK)
    .setBackground(C.SICK_BG).setFontColor(C.SICK_FG).setBold(true)
    .setRanges([fullRange]).build());

  // Half Day → yellow + bold
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(HALF_DAY)
    .setBackground(C.HALF_BG).setFontColor(C.HALF_FG).setBold(true)
    .setRanges([fullRange]).build());

  // Public holidays → amber override (prepended = highest priority)
  for (var h = 0; h < PUBLIC_HOLIDAYS.length; h++) {
    var hd = new Date(PUBLIC_HOLIDAYS[h] + 'T00:00:00');
    if (hd.getFullYear() !== year || hd.getMonth() !== month) continue;
    var col = dayColStart + hd.getDate() - 1;
    rules.unshift(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=TRUE')
      .setBackground(C.HOL_BG).setFontColor(C.HOL_FG)
      .setRanges([sheet.getRange(startRow, col, numRows, 1)]).build());
    sheet.getRange(CFG.HEADER_ROW, col)
      .setBackground(C.HOL_BG).setFontColor(C.HOL_FG).setBold(true);
  }

  sheet.setConditionalFormatRules(rules);
}
// ─── MANAGER DATA PERSISTENCE ────────────────────────────────
// Managers are stored in a hidden sheet '_Managers_' so you can
// add / remove people without touching the script code.

function getManagersList_(ss) {
  var ms = ss.getSheetByName('_Managers_');
  if (!ms || ms.getLastRow() < 2) return initManagersSheet_(ss);

  // Auto-migrate from v4.0 (5 cols including ID) to v4.1 (4 cols, no ID).
  // We detect the old schema by looking for an "ID" header in column 4.
  var headerVals = ms.getRange(1, 1, 1, Math.max(4, ms.getLastColumn())).getValues()[0];
  if (String(headerVals[3] || '').toUpperCase() === 'ID') {
    var old = ms.getRange(2, 1, ms.getLastRow() - 1, 5).getValues();
    var migrated = old.filter(function(r){return String(r[0]).trim();})
                      .map(function(r){return [r[0], r[1], r[2], r[4] || ''];});
    ms.clear();
    ms.appendRow(['Name','Region','Procedure','SlackID']);
    if (migrated.length) ms.getRange(2, 1, migrated.length, 4).setValues(migrated);
  }

  var data = ms.getRange(2, 1, ms.getLastRow() - 1, 4).getValues();
  return data.filter(function(r){return String(r[0]).trim();}).map(function(r){
    return {name:String(r[0]),region:String(r[1]),procedure:String(r[2]),slackId:String(r[3])};
  });
}

function initManagersSheet_(ss) {
  var ms = ss.getSheetByName('_Managers_') || ss.insertSheet('_Managers_');
  ms.hideSheet();
  ms.clearContents();
  ms.appendRow(['Name','Region','Procedure','SlackID']);
  var rows = MANAGERS.map(function(m){return [m.name,m.region,m.procedure,''];});
  if (rows.length) ms.getRange(2,1,rows.length,4).setValues(rows);
  return MANAGERS;
}

// ─── ADD NEW MANAGER ─────────────────────────────────────────
function addNewManager() {
  var ui = SpreadsheetApp.getUi();
  var r1 = ui.prompt('New Manager (1/3)','Full name:',ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton()!==ui.Button.OK) return;
  var name = r1.getResponseText().trim(); if (!name) return;

  var r2 = ui.prompt('New Manager (2/3)','Region:\n'+REGION_ORDER.join(' / '),ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton()!==ui.Button.OK) return;
  var region = r2.getResponseText().trim().toUpperCase();
  if (REGION_ORDER.indexOf(region)<0){ui.alert('Invalid region: '+region); return;}

  var r3 = ui.prompt('New Manager (3/3)','Procedure:\n1. Churn Prevention\n2. Killer Base\n3. Active Retention',ui.ButtonSet.OK_CANCEL);
  if (r3.getSelectedButton()!==ui.Button.OK) return;
  var pt = r3.getResponseText().trim();
  var procedure = pt==='1'?'Churn Prevention':pt==='2'?'Killer Base':pt==='3'?'Active Retention':pt;
  if (PROCEDURE_ORDER.indexOf(procedure)<0){ui.alert('Invalid procedure: '+procedure); return;}

  var ss = getSpreadsheet_();
  var ms = ss.getSheetByName('_Managers_') || (initManagersSheet_(ss), ss.getSheetByName('_Managers_'));
  ms.appendRow([name,region,procedure,'']);

  var rebuild = ui.alert('Manager Added!',name+' ('+region+') added.\nRebuild schedule now?',ui.ButtonSet.YES_NO);
  if (rebuild===ui.Button.YES) buildScheduleSheet();
}

// ─── EDIT MANAGER LIST ───────────────────────────────────────
// Unhides the _Managers_ sheet and navigates the user to it.
// The user edits names/regions/procedures directly, then clicks
// "Refresh Schedule from List" to regenerate the schedule.
function editManagersList() {
  var ss = getSpreadsheet_();
  var ms = ss.getSheetByName('_Managers_');
  if (!ms) { initManagersSheet_(ss); ms = ss.getSheetByName('_Managers_'); }
  ms.showSheet();
  ss.setActiveSheet(ms);
  SpreadsheetApp.getUi().alert(
    'Manager List is now visible',
    'Edit names, regions, or procedures directly in this sheet.\n\n' +
    'Valid Regions: ' + REGION_ORDER.join(', ') + '\n' +
    'Valid Procedures: ' + PROCEDURE_ORDER.join(', ') + '\n\n' +
    'When finished, go to  Schedule Management → Refresh Schedule from List\n' +
    'to rebuild the schedule with your changes.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ─── REFRESH SCHEDULE FROM LIST ──────────────────────────────
// Rebuilds the schedule using the current _Managers_ sheet data.
// Call this after editing the manager list directly.
function refreshFromManagerList() {
  var ui  = SpreadsheetApp.getUi();
  var res = ui.alert(
    'Refresh Schedule?',
    'Rebuilds the schedule using the current Manager List.\nAll day-cell values will be reset to defaults. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;
  buildScheduleSheet();
  // Re-hide the _Managers_ sheet after rebuild
  var ss = getSpreadsheet_();
  var ms = ss.getSheetByName('_Managers_');
  if (ms) ms.hideSheet();
}

// ─── RESET DAY CELLS ONLY ────────────────────────────────────
// Clears day-cell values back to defaults; manager info is preserved.
function resetSheet() {
  var ui  = SpreadsheetApp.getUi();
  var res = ui.alert('Reset Day Cells?','Resets all day cells to defaults (working hours / DO for weekends). Manager names stay. Continue?',ui.ButtonSet.YES_NO);
  if (res!==ui.Button.YES) return;
  // Rebuild is the cleanest reset — it regenerates everything from scratch.
  buildScheduleSheet();
  ui.alert('Done','Sheet has been reset to defaults.',ui.ButtonSet.OK);
}

// ─── UPDATE MONTH ─────────────────────────────────────────────
function updateMonth() {
  var ui = SpreadsheetApp.getUi();
  var next = new Date(); next.setDate(1); next.setMonth(next.getMonth()+1);
  var label = Utilities.formatDate(next,Session.getScriptTimeZone(),'MMMM yyyy');
  var r = ui.alert('Next Month?','Clear all data and build for '+label+'?',ui.ButtonSet.YES_NO);
  if (r!==ui.Button.YES) return;
  buildScheduleSheet(next);
}

// ─── POST TO SLACK ────────────────────────────────────────────
function postScheduleToSlack() {
  if (CFG.SLACK_WEBHOOK==='YOUR_SLACK_WEBHOOK_URL_HERE') {
    SpreadsheetApp.getUi().alert('Setup Required','Set CFG.SLACK_WEBHOOK to your Slack Incoming Webhook URL.',SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  var ss    = getSpreadsheet_();
  var sheet = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sheet) { ss.toast('Sheet not found.','Error',4); return; }

  var tz          = Session.getScriptTimeZone();
  var today       = new Date();
  var displayDate = Utilities.formatDate(today,tz,'EEEE, MMMM dd yyyy');
  var todayCol    = CFG.DAY_COL_START + today.getDate() - 1;
  if (todayCol > sheet.getLastColumn()) { ss.toast('Today outside current month.','Warning',5); return; }

  var lastRow = sheet.getLastRow();
  var data    = sheet.getRange(1,1,lastRow,sheet.getLastColumn()).getValues();

  var status = {};
  for (var i=0;i<REGION_ORDER.length;i++) status[REGION_ORDER[i]]={w:[],o:[],v:[],s:[],h:[]};

  for (var r=CFG.DATA_START_ROW-1;r<lastRow;r++) {
    var row=data[r], name=String(row[0]||'').trim(), reg=String(row[1]||'').trim();
    var proc=String(row[2]||'').trim();
    // Manager rows have a valid procedure; separator rows do not.
    if (!name || REGION_ORDER.indexOf(reg)<0 || PROCEDURE_ORDER.indexOf(proc)<0) continue;
    var val=String(row[todayCol-1]||'').trim();
    var tag='*'+name+'*  _('+proc+')_';
    if (val===DAY_OFF) status[reg].o.push('• '+tag);
    else if (val===VACATION) status[reg].v.push('• '+tag);
    else if (val===SICK) status[reg].s.push('• '+tag);
    else if (val===HALF_DAY) status[reg].h.push('• '+tag);
    else if (val) status[reg].w.push('• '+tag+'  `'+val+'`');
  }

  var tw=0,to=0,tv=0,ts=0,th=0;
  for (var i=0;i<REGION_ORDER.length;i++){var s=status[REGION_ORDER[i]];tw+=s.w.length;to+=s.o.length;tv+=s.v.length;ts+=s.s.length;th+=s.h.length;}
  var total=tw+to+tv+ts+th;

  // Capacity bar (20 chars wide)
  var filled=total>0?Math.round(tw/total*20):0;
  var bar='`'+repeat_('█',filled)+repeat_('░',20-filled)+'`  '+tw+'/'+total+' active';

  var blocks=[];
  blocks.push({type:'header',text:{type:'plain_text',text:'📋  Manager Schedule  —  '+displayDate,emoji:true}});
  blocks.push({type:'divider'});
  blocks.push({type:'section',text:{type:'mrkdwn',text:'*Capacity Today:*\n'+bar}});
  blocks.push({type:'section',fields:[
    {type:'mrkdwn',text:'✅ *Working*\n'+tw},
    {type:'mrkdwn',text:'🔴 *Day Off*\n'+to},
    {type:'mrkdwn',text:'🟣 *Vacation*\n'+tv},
    {type:'mrkdwn',text:'🟠 *Sick*\n'+ts},
    {type:'mrkdwn',text:'🟡 *Half Day*\n'+th}
  ]});
  blocks.push({type:'divider'});

  for (var i=0;i<REGION_ORDER.length;i++){
    var reg=REGION_ORDER[i],s=status[reg];
    if (s.w.length+s.o.length+s.v.length+s.s.length+s.h.length===0) continue;
    var emoji=REGION_EMOJIS[reg]||'🌍';
    blocks.push({type:'section',text:{type:'mrkdwn',text:emoji+'  *'+reg+'*'}});
    if (s.w.length) blocks.push({type:'section',text:{type:'mrkdwn',text:'✅ *Working:*\n'+s.w.join('\n')}});
    if (s.o.length) blocks.push({type:'section',text:{type:'mrkdwn',text:'🔴 *Day Off:*\n'+s.o.join('\n')}});
    if (s.v.length) blocks.push({type:'section',text:{type:'mrkdwn',text:'🟣 *Vacation:*\n'+s.v.join('\n')}});
    if (s.s.length) blocks.push({type:'section',text:{type:'mrkdwn',text:'🟠 *Sick:*\n'+s.s.join('\n')}});
    if (s.h.length) blocks.push({type:'section',text:{type:'mrkdwn',text:'🟡 *Half Day:*\n'+s.h.join('\n')}});
    blocks.push({type:'divider'});
  }

  // Action button: open the sheet
  var sheetUrl = CFG.SHEET_URL || ss.getUrl();
  if (sheetUrl) blocks.push({type:'actions',elements:[{type:'button',text:{type:'plain_text',text:'📊 Open Schedule Sheet',emoji:true},url:sheetUrl,style:'primary'}]});
  blocks.push({type:'context',elements:[{type:'mrkdwn',text:'_Auto-posted · '+displayDate+'_'}]});

  // Send (chunk at 50-block Slack limit)
  var ok=true;
  for (var i=0;i<blocks.length;i+=50){
    var resp=UrlFetchApp.fetch(CFG.SLACK_WEBHOOK,{method:'post',contentType:'application/json',payload:JSON.stringify({blocks:blocks.slice(i,i+50)}),muteHttpExceptions:true});
    Logger.log('Slack '+resp.getResponseCode()+': '+resp.getContentText());
    if (resp.getResponseCode()!==200) ok=false;
  }
  ss.toast(ok?'Posted to Slack!':'Slack error — check logs.',ok?'Success':'Error',5);
}

function repeat_(ch,n){var s='';for(var i=0;i<n;i++)s+=ch;return s;}

// ─── TRIGGERS ─────────────────────────────────────────────────
function createTimeDrivenTrigger() {
  var triggers=ScriptApp.getProjectTriggers();
  for(var i=0;i<triggers.length;i++) if(triggers[i].getHandlerFunction()==='postScheduleToSlack') ScriptApp.deleteTrigger(triggers[i]);
  ScriptApp.newTrigger('postScheduleToSlack').timeBased().everyDays(1).atHour(CFG.POST_HOUR).create();
  getSpreadsheet_().toast('Daily trigger set for '+CFG.POST_HOUR+':00 AM.','Trigger Created',6);
}
function deleteAllTriggers() {
  var triggers=ScriptApp.getProjectTriggers();
  for(var i=0;i<triggers.length;i++) ScriptApp.deleteTrigger(triggers[i]);
  getSpreadsheet_().toast(triggers.length+' trigger(s) removed.','Done',4);
}
