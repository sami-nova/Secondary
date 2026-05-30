// ============================================================
//  MANAGER SCHEDULE TRACKER  — Command Center  v4.4
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

// ─── COLOUR THEMES ───────────────────────────────────────────
// Themes override the structural palette (headers, borders, title).
// Status colours (working=green, off=red, etc.) never change — they carry
// semantic meaning across every theme.
var THEMES = {
  'Classic': {
    TITLE_BG  :'#0D47A1', TITLE_FG  :'#FFFFFF',
    LEGEND_BG :'#E8EAF6', LEGEND_FG :'#283593',
    HDR_BG    :'#1565C0', HDR_FG    :'#FFFFFF',
    SUMHDR_BG :'#283593', SUMHDR_FG :'#FFFFFF',
    WKND_BG   :'#37474F', WKND_FG   :'#ECEFF1',
    BORDER_OUT:'#0D47A1', BORDER_IN :'#90CAF9',
    TAB_COLOR :'#0D47A1',
    DASH_HDR  :'#0D47A1', DASH_HDR_FG:'#FFFFFF',
    DASH_SUB  :'#E8EAF6', DASH_SUB_FG:'#283593',
    DASH_CARD :'#BBDEFB', DASH_CARD_FG:'#0D47A1',
    DASH_ALT  :'#E3F2FD', DASH_TAB  :'#1565C0',
  },
  'Forest': {
    TITLE_BG  :'#1B5E20', TITLE_FG  :'#FFFFFF',
    LEGEND_BG :'#F1F8E9', LEGEND_FG :'#2E7D32',
    HDR_BG    :'#2E7D32', HDR_FG    :'#FFFFFF',
    SUMHDR_BG :'#388E3C', SUMHDR_FG :'#FFFFFF',
    WKND_BG   :'#33691E', WKND_FG   :'#CCFF90',
    BORDER_OUT:'#1B5E20', BORDER_IN :'#A5D6A7',
    TAB_COLOR :'#2E7D32',
    DASH_HDR  :'#1B5E20', DASH_HDR_FG:'#FFFFFF',
    DASH_SUB  :'#F1F8E9', DASH_SUB_FG:'#2E7D32',
    DASH_CARD :'#C8E6C9', DASH_CARD_FG:'#1B5E20',
    DASH_ALT  :'#DCEDC8', DASH_TAB  :'#2E7D32',
  },
  'Slate': {
    TITLE_BG  :'#263238', TITLE_FG  :'#ECEFF1',
    LEGEND_BG :'#ECEFF1', LEGEND_FG :'#37474F',
    HDR_BG    :'#37474F', HDR_FG    :'#ECEFF1',
    SUMHDR_BG :'#455A64', SUMHDR_FG :'#ECEFF1',
    WKND_BG   :'#1C313A', WKND_FG   :'#CFD8DC',
    BORDER_OUT:'#263238', BORDER_IN :'#90A4AE',
    TAB_COLOR :'#263238',
    DASH_HDR  :'#263238', DASH_HDR_FG:'#ECEFF1',
    DASH_SUB  :'#ECEFF1', DASH_SUB_FG:'#37474F',
    DASH_CARD :'#CFD8DC', DASH_CARD_FG:'#263238',
    DASH_ALT  :'#B0BEC5', DASH_TAB  :'#37474F',
  },
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

// Returns the stored theme object (defaults to Classic).
function getActiveTheme_() {
  var name = PropertiesService.getScriptProperties().getProperty('THEME') || 'Classic';
  return THEMES[name] || THEMES['Classic'];
}

// Writes the structural theme colours into the global C palette so all
// downstream code (headers, borders, tab) picks up the active theme.
function applyThemeToPalette_() {
  var t = getActiveTheme_();
  C.TITLE_BG   = t.TITLE_BG;   C.TITLE_FG   = t.TITLE_FG;
  C.LEGEND_BG  = t.LEGEND_BG;  C.LEGEND_FG  = t.LEGEND_FG;
  C.HDR_BG     = t.HDR_BG;     C.HDR_FG     = t.HDR_FG;
  C.SUMHDR_BG  = t.SUMHDR_BG;  C.SUMHDR_FG  = t.SUMHDR_FG;
  C.WKND_BG    = t.WKND_BG;    C.WKND_FG    = t.WKND_FG;
  C.BORDER_OUT = t.BORDER_OUT; C.BORDER_IN  = t.BORDER_IN;
}

// Linear blend of two 6-digit hex colours. ratio 0 = hex1, 1 = hex2.
function blendHex_(hex1, hex2, ratio) {
  function p(h) { return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
  function x(n) { return ('0'+Math.round(n).toString(16)).slice(-2); }
  var a = p(hex1), b = p(hex2), r = 1 - ratio;
  return '#'+x(a[0]*r+b[0]*ratio)+x(a[1]*r+b[1]*ratio)+x(a[2]*r+b[2]*ratio);
}

// ─── MENU ────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Schedule Management')
    .addItem('Build / Rebuild This Month',    'buildScheduleSheet')
    .addItem('Update to Next Month',          'updateMonth')
    .addItem('Reset Day Cells Only',          'resetSheet')
    .addItem('Copy Week Pattern to Month',    'copyWeekPattern')
    .addSeparator()
    .addItem('Edit Manager List',             'editManagersList')
    .addItem('Refresh Schedule from List',    'refreshFromManagerList')
    .addItem('Add New Manager',               'addNewManager')
    .addSeparator()
    .addItem('Post Today to Slack',           'postScheduleToSlack')
    .addSeparator()
    .addItem('Refresh Dashboard',             'buildDashboard')
    .addItem('Change Colour Theme',           'selectTheme')
    .addSeparator()
    .addItem('Set Up Daily 8AM Trigger',      'createTimeDrivenTrigger')
    .addItem('Remove All Triggers',           'deleteAllTriggers')
    .addToUi();
}

// ─── MAIN BUILD ──────────────────────────────────────────────
function buildScheduleSheet(targetDate) {
  applyThemeToPalette_();   // load active theme into C before any rendering
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

  // ── Tab colour (theme-driven) ─────────────────────────────
  sheet.setTabColor(getActiveTheme_().TAB_COLOR || '#0D47A1');

  SpreadsheetApp.flush();   // ensure all formatting renders before function exits
  buildDashboard();         // auto-refresh analytics dashboard after every build
  ss.setActiveSheet(sheet); // return focus to Schedule
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
  var ui    = SpreadsheetApp.getUi();
  var ss    = getSpreadsheet_();
  var next  = new Date(); next.setDate(1); next.setMonth(next.getMonth()+1);
  var label = Utilities.formatDate(next, Session.getScriptTimeZone(), 'MMMM yyyy');

  var r = ui.alert(
    'Update to ' + label,
    'How should the new month be populated?\n\n' +
    'YES  — Copy this month\'s schedule values into ' + label + '\n' +
    '         (weekends & holidays are still forced to Day Off)\n\n' +
    'NO   — Reset all day cells to defaults\n\n' +
    'CANCEL — Do nothing',
    ui.ButtonSet.YES_NO_CANCEL
  );
  if (r === ui.Button.CANCEL) return;

  var copyPrev = (r === ui.Button.YES);
  if (copyPrev) saveCurrentMonthData_(ss);   // snapshot BEFORE the clear

  buildScheduleSheet(next);

  if (copyPrev) {
    var ny = next.getFullYear(), nm = next.getMonth();
    var ndim = new Date(ny, nm+1, 0).getDate();
    applyLastMonthData_(ss, ny, nm, ndim);
    SpreadsheetApp.flush();
    ss.toast('This month\'s schedule copied forward into ' + label + '.', 'Done', 6);
  }
}

// ─── SAVE CURRENT MONTH DATA ─────────────────────────────────
// Writes a snapshot of every manager's day-cell values to the hidden
// '_LastMonth_' sheet so applyLastMonthData_ can replay them next month.
function saveCurrentMonthData_(ss) {
  var sched = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sched || sched.getLastRow() < CFG.DATA_START_ROW) return;

  var lastRow  = sched.getLastRow();
  var lastCol  = sched.getLastColumn();
  var raw      = sched.getRange(1, 1, lastRow, lastCol).getValues();

  var rows = [['__META__', new Date().getFullYear(), new Date().getMonth()]];
  for (var r = CFG.DATA_START_ROW - 1; r < lastRow; r++) {
    var name = String(raw[r][0]||'').trim();
    var reg  = String(raw[r][1]||'').trim();
    var proc = String(raw[r][2]||'').trim();
    if (!name || REGION_ORDER.indexOf(reg)<0 || PROCEDURE_ORDER.indexOf(proc)<0) continue;
    var entry = [name, reg, proc];
    for (var ci = CFG.DAY_COL_START - 1; ci < lastCol; ci++) entry.push(String(raw[r][ci]||'').trim());
    rows.push(entry);
  }

  var maxLen = 0;
  for (var i=0;i<rows.length;i++) maxLen = Math.max(maxLen, rows[i].length);
  for (var i=0;i<rows.length;i++) { while(rows[i].length<maxLen) rows[i].push(''); }

  var lm = ss.getSheetByName('_LastMonth_') || ss.insertSheet('_LastMonth_');
  lm.hideSheet();
  lm.clearContents();
  if (rows.length > 0) lm.getRange(1, 1, rows.length, maxLen).setValues(rows);
}

// ─── APPLY LAST MONTH DATA ────────────────────────────────────
// Reads the '_LastMonth_' snapshot and overlays those values onto the
// current schedule. Holidays in the new month are always forced to DO.
function applyLastMonthData_(ss, year, month, daysInMonth) {
  var lm = ss.getSheetByName('_LastMonth_');
  if (!lm || lm.getLastRow() < 2) return;

  var lmRaw = lm.getRange(1, 1, lm.getLastRow(), lm.getLastColumn()).getValues();
  // Build name → [val_day0, val_day1, ...] map (row 0 is metadata, skip it)
  var prevMap = {};
  for (var r=1;r<lmRaw.length;r++) {
    var n = String(lmRaw[r][0]||'').trim();
    if (n) prevMap[n] = lmRaw[r].slice(3); // skip name, region, procedure cols
  }

  var tz = Session.getScriptTimeZone();
  var holidays = {};
  for (var h=0;h<PUBLIC_HOLIDAYS.length;h++) holidays[PUBLIC_HOLIDAYS[h]] = true;

  var sched    = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sched) return;
  var lastRow  = sched.getLastRow();
  var totalCol = CFG.DAY_COL_START + daysInMonth - 1;
  var raw      = sched.getRange(CFG.DATA_START_ROW, 1, lastRow-CFG.DATA_START_ROW+1, totalCol).getValues();

  for (var ri=0;ri<raw.length;ri++) {
    var name = String(raw[ri][0]||'').trim();
    var reg  = String(raw[ri][1]||'').trim();
    var proc = String(raw[ri][2]||'').trim();
    if (!name || REGION_ORDER.indexOf(reg)<0 || PROCEDURE_ORDER.indexOf(proc)<0) continue;

    var prev = prevMap[name];
    if (!prev || !prev.length) continue;  // manager not in last month → keep defaults

    var newDays = [];
    for (var d=0;d<daysInMonth;d++) {
      var pv   = d<prev.length ? String(prev[d]||'').trim() : '';
      var dObj = new Date(year, month, d+1);
      var ds   = Utilities.formatDate(dObj, tz, 'yyyy-MM-dd');
      if      (holidays[ds])             newDays.push(DAY_OFF);
      else if (pv)                       newDays.push(pv);
      else if (dObj.getDay()===0||dObj.getDay()===6) newDays.push(DAY_OFF);
      else                               newDays.push(DEFAULT_HOURS);
    }
    sched.getRange(CFG.DATA_START_ROW+ri, CFG.DAY_COL_START, 1, daysInMonth).setValues([newDays]);
  }
}

// ─── COPY WEEK PATTERN ────────────────────────────────────────
// Reads one week's schedule for a manager and copies it (day-position
// to day-position within each 7-day block) to every other week in the month.
function copyWeekPattern() {
  var ui    = SpreadsheetApp.getUi();
  var ss    = getSpreadsheet_();
  var sched = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sched) { ui.alert('Build the schedule first.'); return; }

  var lastRow  = sched.getLastRow();
  var nameData = sched.getRange(CFG.DATA_START_ROW, 1, lastRow-CFG.DATA_START_ROW+1, 3).getValues();

  // ── Step 1: find the manager ──────────────────────────────
  // Try detecting from currently active row first
  var mgrRow = -1, mgrName = '';
  try {
    var sel = ss.getActiveSheet().getActiveCell();
    if (sel && sel.getRow() >= CFG.DATA_START_ROW) {
      var ri0 = sel.getRow() - CFG.DATA_START_ROW;
      if (ri0 >= 0 && ri0 < nameData.length) {
        var n0 = String(nameData[ri0][0]||'').trim();
        var p0 = String(nameData[ri0][2]||'').trim();
        if (n0 && PROCEDURE_ORDER.indexOf(p0)>=0) { mgrRow=sel.getRow(); mgrName=n0; }
      }
    }
  } catch(e) {}

  if (mgrRow > 0) {
    var ok = ui.alert('Copy Week Pattern','Use selected manager: "'+mgrName+'"?', ui.ButtonSet.YES_NO);
    if (ok !== ui.Button.YES) { mgrRow=-1; mgrName=''; }
  }

  if (mgrRow < 0) {
    var r1 = ui.prompt('Copy Week Pattern (1/2)', 'Enter manager name (or part of it):', ui.ButtonSet.OK_CANCEL);
    if (r1.getSelectedButton() !== ui.Button.OK) return;
    var search = r1.getResponseText().trim().toLowerCase();
    var matches = [];
    for (var ri=0;ri<nameData.length;ri++) {
      var n = String(nameData[ri][0]||'').trim();
      var p = String(nameData[ri][2]||'').trim();
      if (n.toLowerCase().indexOf(search)>=0 && PROCEDURE_ORDER.indexOf(p)>=0) matches.push({row:CFG.DATA_START_ROW+ri, name:n});
    }
    if (matches.length===0) { ui.alert('"'+r1.getResponseText().trim()+'" not found in the schedule.'); return; }
    if (matches.length===1) {
      mgrRow=matches[0].row; mgrName=matches[0].name;
    } else {
      var pickStr = matches.map(function(m,i){return (i+1)+'. '+m.name;}).join('\n');
      var rp = ui.prompt('Multiple matches','Choose:\n'+pickStr+'\n\nEnter number:', ui.ButtonSet.OK_CANCEL);
      if (rp.getSelectedButton()!==ui.Button.OK) return;
      var idx = parseInt(rp.getResponseText().trim(),10)-1;
      if (isNaN(idx)||idx<0||idx>=matches.length){ui.alert('Invalid choice.');return;}
      mgrRow=matches[idx].row; mgrName=matches[idx].name;
    }
  }

  // ── Step 2: pick the source week ─────────────────────────
  var tz   = Session.getScriptTimeZone();
  var now  = new Date();
  var year = now.getFullYear(), month = now.getMonth();
  var dim  = new Date(year, month+1, 0).getDate();
  var numWeeks = Math.ceil(dim/7);

  var wkList = [];
  for (var w=1;w<=numWeeks;w++) {
    var sd=(w-1)*7+1, ed=Math.min(w*7,dim);
    wkList.push(w + '  (days '+sd+'–'+ed+')');
  }
  var r2 = ui.prompt(
    'Copy Week Pattern (2/2)',
    'Manager: ' + mgrName + '\n\n' +
    'Which week to use as the template?\n\n' + wkList.join('\n') + '\n\nEnter week number (1–'+numWeeks+'):',
    ui.ButtonSet.OK_CANCEL
  );
  if (r2.getSelectedButton()!==ui.Button.OK) return;
  var weekNum = parseInt(r2.getResponseText().trim(),10);
  if (isNaN(weekNum)||weekNum<1||weekNum>numWeeks){ui.alert('Invalid week number.');return;}

  // ── Step 3: read source week (7 day slots) ───────────────
  var srcStart = (weekNum-1)*7;  // 0-based day index
  var srcLen   = Math.min(7, dim-srcStart);
  var srcVals  = sched.getRange(mgrRow, CFG.DAY_COL_START+srcStart, 1, srcLen).getValues()[0];
  while (srcVals.length<7) srcVals.push(''); // pad to full 7-slot week

  // Holiday lookup
  var holidays={};
  for(var h=0;h<PUBLIC_HOLIDAYS.length;h++) holidays[PUBLIC_HOLIDAYS[h]]=true;

  // ── Step 4: write to every other week ────────────────────
  var changes=0;
  for (var w=1;w<=numWeeks;w++) {
    if (w===weekNum) continue;
    var wVals=[];
    for (var d=0;d<7;d++) {
      var dayIdx=(w-1)*7+d;
      if (dayIdx>=dim) break;
      var sv = String(srcVals[d]||'').trim();
      if (!sv) { wVals.push((new Date(year,month,dayIdx+1).getDay()===0||new Date(year,month,dayIdx+1).getDay()===6)?DAY_OFF:DEFAULT_HOURS); continue; }
      var dObj=new Date(year,month,dayIdx+1);
      var ds=Utilities.formatDate(dObj,tz,'yyyy-MM-dd');
      wVals.push(holidays[ds]?DAY_OFF:sv);
      changes++;
    }
    if (wVals.length>0) sched.getRange(mgrRow, CFG.DAY_COL_START+(w-1)*7, 1, wVals.length).setValues([wVals]);
  }
  ui.alert('Done',
    'Week '+weekNum+' pattern applied to the other '+(numWeeks-1)+' week(s).\n'+
    changes+' cells updated for "'+mgrName+'".',
    ui.ButtonSet.OK);
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

// ─── ANALYTICS DASHBOARD ─────────────────────────────────────
// Builds (or fully rebuilds) a 'Dashboard' sheet with:
//   • Today's snapshot summary cards
//   • Monthly performance table per manager (attendance %, days worked/off/vac/sick/half)
//   • Regional overview table
//   • Daily capacity heatmap across all days of the month
// Called automatically at the end of buildScheduleSheet and via the menu.
function buildDashboard() {
  var ss = getSpreadsheet_();
  var sched = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sched) { Logger.log('buildDashboard: Schedule sheet not found.'); return; }

  var tz          = Session.getScriptTimeZone();
  var today       = new Date();
  var year        = today.getFullYear();
  var month       = today.getMonth();
  var dim         = new Date(year, month + 1, 0).getDate(); // days in month
  var monthLabel  = Utilities.formatDate(today, tz, 'MMMM yyyy');
  var lastUpdated = Utilities.formatDate(today, tz, 'dd MMM yyyy  HH:mm');
  var t = getActiveTheme_();

  // ── Get / reset Dashboard sheet ──────────────────────────
  var dash = ss.getSheetByName('Dashboard');
  if (!dash) { dash = ss.insertSheet('Dashboard', 1); }
  else       { dash.clearConditionalFormatRules(); dash.clear(); }
  dash.setTabColor(t.DASH_TAB);

  // ── Read all schedule rows in one call ───────────────────
  var sLastRow = sched.getLastRow();
  var sLastCol = sched.getLastColumn();
  if (sLastRow < CFG.DATA_START_ROW || sLastCol < CFG.DAY_COL_START) {
    dash.getRange(1,1).setValue('No schedule data. Build the schedule first.');
    return;
  }
  var raw = sched.getRange(1, 1, sLastRow, sLastCol).getValues();

  // Today's day index (0-based); -1 if we're outside this month
  var todayDayIdx = (today.getFullYear()===year && today.getMonth()===month)
                    ? today.getDate() - 1 : -1;

  // ── Single pass: collect manager stats + per-day totals ──
  var mgrStats  = [];
  var dayTotals = []; // [{w,o,v,s,h}] length = dim
  for (var dd = 0; dd < dim; dd++) dayTotals.push({w:0,o:0,v:0,s:0,h:0});

  for (var r = CFG.DATA_START_ROW - 1; r < sLastRow; r++) {
    var row  = raw[r];
    var name = String(row[0]||'').trim();
    var reg  = String(row[1]||'').trim();
    var proc = String(row[2]||'').trim();
    if (!name || REGION_ORDER.indexOf(reg)<0 || PROCEDURE_ORDER.indexOf(proc)<0) continue;

    var ms = {name:name, region:reg, procedure:proc, w:0, o:0, v:0, s:0, h:0, todayVal:''};
    for (var dd = 0; dd < dim; dd++) {
      var ci  = CFG.DAY_COL_START - 1 + dd;
      if (ci >= sLastCol) break;
      var val = String(row[ci]||'').trim();
      if      (val===DAY_OFF)              { ms.o++; dayTotals[dd].o++; }
      else if (val===VACATION)             { ms.v++; dayTotals[dd].v++; }
      else if (val===SICK)                 { ms.s++; dayTotals[dd].s++; }
      else if (val===HALF_DAY)             { ms.h++; dayTotals[dd].h++; }
      else if (val.indexOf(':')>=0)        { ms.w++; dayTotals[dd].w++; }
      if (dd === todayDayIdx) ms.todayVal = val;
    }
    mgrStats.push(ms);
  }

  // Today's global headline figures
  var todayW=0,todayO=0,todayV=0,todayS=0,todayH=0;
  if (todayDayIdx>=0 && todayDayIdx<dim) {
    var dt=dayTotals[todayDayIdx];
    todayW=dt.w; todayO=dt.o; todayV=dt.v; todayS=dt.s; todayH=dt.h;
  }
  var totalMgrs = mgrStats.length;

  // Regional aggregates
  var regStats = {};
  for (var ri=0;ri<REGION_ORDER.length;ri++) regStats[REGION_ORDER[ri]]={count:0,w:0,o:0,v:0,s:0,h:0};
  for (var mi=0;mi<mgrStats.length;mi++) {
    var ms2=mgrStats[mi], rs=regStats[ms2.region];
    if (!rs) continue;
    rs.count++; rs.w+=ms2.w; rs.o+=ms2.o; rs.v+=ms2.v; rs.s+=ms2.s; rs.h+=ms2.h;
  }

  // Days elapsed this month (for attendance %)
  var daysElapsed = (today.getFullYear()===year && today.getMonth()===month)
                    ? today.getDate() : dim;

  // ── Layout helpers ────────────────────────────────────────
  var TOTAL_COLS = 14; // width of the fixed-column sections
  var cr = 1;          // current row pointer

  function titleRow(text, bg, fg, size, height) {
    dash.getRange(cr, 1, 1, TOTAL_COLS).merge()
      .setValue(text).setBackground(bg).setFontColor(fg)
      .setFontSize(size||11).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    dash.setRowHeight(cr, height||32); cr++;
  }

  // ── Row 1: Main title ────────────────────────────────────
  titleRow('MANAGER ANALYTICS DASHBOARD   ·   ' + monthLabel.toUpperCase(),
           t.DASH_HDR, t.DASH_HDR_FG, 15, 54);

  // ── Row 2: Subtitle ──────────────────────────────────────
  dash.getRange(cr, 1, 1, TOTAL_COLS).merge()
    .setValue('Last updated: ' + lastUpdated + '   ·   ' + totalMgrs + ' managers across ' + REGION_ORDER.length + ' regions')
    .setBackground(t.DASH_SUB).setFontColor(t.DASH_SUB_FG)
    .setFontSize(10).setFontStyle('italic')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(cr, 26); cr++;
  cr++; // spacer

  // ── TODAY'S SNAPSHOT CARDS ───────────────────────────────
  titleRow("TODAY'S SNAPSHOT   ·   " +
    Utilities.formatDate(today, tz, 'EEEE, d MMMM yyyy').toUpperCase(),
    t.DASH_HDR, t.DASH_HDR_FG, 11, 30);

  var cards = [
    {label:'👥 TOTAL MANAGERS', val:totalMgrs, bg:t.DASH_CARD,  fg:t.DASH_CARD_FG},
    {label:'✅ WORKING',         val:todayW,     bg:'#C8E6C9',   fg:'#1B5E20'},
    {label:'🔴 DAY OFF',         val:todayO,     bg:'#FFCDD2',   fg:'#B71C1C'},
    {label:'🟣 VACATION',        val:todayV,     bg:'#E1BEE7',   fg:'#4A148C'},
    {label:'🟠 SICK',            val:todayS,     bg:'#FFE0B2',   fg:'#BF360C'},
    {label:'🟡 HALF DAY',        val:todayH,     bg:'#FFF9C4',   fg:'#F57F17'},
  ];
  // Label row (2 cols per card)
  for (var ci=0;ci<cards.length;ci++) {
    dash.getRange(cr, ci*2+1, 1, 2).merge()
      .setValue(cards[ci].label).setBackground(cards[ci].bg).setFontColor(cards[ci].fg)
      .setFontSize(9).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  }
  dash.setRowHeight(cr, 28); cr++;
  // Value row
  for (var ci=0;ci<cards.length;ci++) {
    dash.getRange(cr, ci*2+1, 1, 2).merge()
      .setValue(cards[ci].val).setBackground(cards[ci].bg).setFontColor(cards[ci].fg)
      .setFontSize(36).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  }
  dash.setRowHeight(cr, 68); cr++;
  // Capacity bar (full width)
  var capFilled = totalMgrs>0 ? Math.round(todayW/totalMgrs*20) : 0;
  dash.getRange(cr, 1, 1, TOTAL_COLS).merge()
    .setValue('CAPACITY   ' + repeat_('█',capFilled) + repeat_('░',20-capFilled) +
              '   ' + todayW + ' of ' + totalMgrs + ' managers active today')
    .setBackground(t.DASH_SUB).setFontColor(t.DASH_SUB_FG)
    .setFontFamily('Courier New').setFontSize(11).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(cr, 30); cr++;
  cr++; // spacer

  // ── MONTHLY PERFORMANCE BY MANAGER ───────────────────────
  titleRow('MONTHLY PERFORMANCE BY MANAGER', t.DASH_HDR, t.DASH_HDR_FG, 11, 32);

  var mHdrs = ['MANAGER NAME','REGION','PROCEDURE',
               'WORKING\nDAYS','DAYS\nOFF','VACATION\nDAYS','SICK\nDAYS','HALF\nDAYS','ATTENDANCE %'];
  dash.getRange(cr, 1, 1, mHdrs.length).setValues([mHdrs])
    .setBackground(t.DASH_CARD).setFontColor(t.DASH_HDR).setFontSize(9).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  dash.setRowHeight(cr, 44); cr++;

  // Sort by region order then procedure order
  var sorted = mgrStats.slice().sort(function(a,b){
    var ri = REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region);
    return ri!==0 ? ri : PROCEDURE_ORDER.indexOf(a.procedure) - PROCEDURE_ORDER.indexOf(b.procedure);
  });

  for (var mi=0;mi<sorted.length;mi++) {
    var m = sorted[mi];
    var altBg = mi%2===0 ? '#FFFFFF' : t.DASH_ALT;
    var att   = daysElapsed>0 ? Math.round((m.w + m.h*0.5)/daysElapsed*100) : 0;
    var attFg = att>=75 ? '#1B5E20' : att>=50 ? '#E65100' : '#B71C1C';

    dash.getRange(cr, 1, 1, 9).setValues([[m.name,m.region,m.procedure,m.w,m.o,m.v,m.s,m.h,att+'%']])
      .setBackground(altBg).setFontSize(10).setHorizontalAlignment('center').setVerticalAlignment('middle');
    dash.getRange(cr,1).setFontWeight('bold').setHorizontalAlignment('left');
    dash.getRange(cr,4).setFontColor('#1B5E20').setFontWeight('bold');
    dash.getRange(cr,5).setFontColor('#B71C1C');
    dash.getRange(cr,6).setFontColor('#4A148C');
    dash.getRange(cr,7).setFontColor('#BF360C');
    dash.getRange(cr,8).setFontColor('#F57F17');
    dash.getRange(cr,9).setFontWeight('bold').setFontColor(attFg);
    dash.setRowHeight(cr, 26); cr++;
  }
  cr++; // spacer

  // ── REGIONAL OVERVIEW ─────────────────────────────────────
  titleRow('REGIONAL OVERVIEW', t.DASH_HDR, t.DASH_HDR_FG, 11, 32);

  dash.getRange(cr, 1, 1, 9).setValues([['REGION','','MANAGERS',
    'WORKING\nDAYS','DAYS\nOFF','VACATION','SICK\nDAYS','HALF\nDAYS','ATTENDANCE %']])
    .setBackground(t.DASH_CARD).setFontColor(t.DASH_HDR).setFontSize(9).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  dash.setRowHeight(cr, 44); cr++;

  var altToggle = 0;
  for (var ri=0;ri<REGION_ORDER.length;ri++) {
    var reg2 = REGION_ORDER[ri], rs2 = regStats[reg2];
    if (!rs2 || rs2.count===0) continue;
    var rc3  = REGION_COLORS[reg2] || {hdr:'#455A64',hdrFg:'#FFFFFF'};
    var altBg2 = altToggle%2===0 ? '#FFFFFF' : t.DASH_ALT;
    var regAtt = (rs2.count*dim)>0 ? Math.round((rs2.w+rs2.h*0.5)/(rs2.count*dim)*100) : 0;
    var regFg  = regAtt>=75 ? '#1B5E20' : regAtt>=50 ? '#E65100' : '#B71C1C';

    dash.getRange(cr,1).setValue(reg2).setBackground(rc3.hdr).setFontColor(rc3.hdrFg||'#FFFFFF')
      .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center').setVerticalAlignment('middle');
    dash.getRange(cr,2).setValue(REGION_EMOJIS[reg2]||'').setBackground(altBg2)
      .setFontSize(16).setHorizontalAlignment('center').setVerticalAlignment('middle');
    dash.getRange(cr,3).setValue(rs2.count).setBackground(altBg2).setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
    dash.getRange(cr,4).setValue(rs2.w).setBackground(altBg2).setFontColor('#1B5E20').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');
    dash.getRange(cr,5).setValue(rs2.o).setBackground(altBg2).setFontColor('#B71C1C').setFontSize(10).setHorizontalAlignment('center');
    dash.getRange(cr,6).setValue(rs2.v).setBackground(altBg2).setFontColor('#4A148C').setFontSize(10).setHorizontalAlignment('center');
    dash.getRange(cr,7).setValue(rs2.s).setBackground(altBg2).setFontColor('#BF360C').setFontSize(10).setHorizontalAlignment('center');
    dash.getRange(cr,8).setValue(rs2.h).setBackground(altBg2).setFontColor('#F57F17').setFontSize(10).setHorizontalAlignment('center');
    dash.getRange(cr,9).setValue(regAtt+'%').setBackground(altBg2).setFontColor(regFg).setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');
    dash.setRowHeight(cr, 30); cr++;
    altToggle++;
  }
  cr++; // spacer

  // ── DAILY CAPACITY HEATMAP ────────────────────────────────
  // Section spans cols 1..(dim+1) so it can be wider than the tables above.
  var hmCols = dim + 1;
  dash.getRange(cr, 1, 1, hmCols).merge()
    .setValue('DAILY CAPACITY HEATMAP   ·   ' + monthLabel.toUpperCase())
    .setBackground(t.DASH_HDR).setFontColor(t.DASH_HDR_FG)
    .setFontSize(11).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(cr, 32); cr++;

  // Day-number header
  var dayNumVals = ['DAY'];
  var dayNameVals = [''];
  for (var dd=0;dd<dim;dd++) {
    var dObj = new Date(year, month, dd+1);
    dayNumVals.push(dd+1);
    dayNameVals.push(DAY_ABBR[dObj.getDay()]);
  }
  dash.getRange(cr, 1, 1, hmCols).setValues([dayNumVals])
    .setBackground(t.DASH_CARD).setFontColor(t.DASH_HDR)
    .setFontSize(9).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(cr, 24); cr++;
  dash.getRange(cr, 1, 1, hmCols).setValues([dayNameVals])
    .setBackground(t.DASH_ALT).setFontColor(t.DASH_SUB_FG)
    .setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(cr, 22); cr++;

  var heatMetrics = [
    {label:'✅ Working',  key:'w', fg:'#1B5E20', bg:'#C8E6C9'},
    {label:'🔴 Day Off',  key:'o', fg:'#B71C1C', bg:'#FFCDD2'},
    {label:'🟣 Vacation', key:'v', fg:'#4A148C', bg:'#E1BEE7'},
    {label:'🟠 Sick',     key:'s', fg:'#BF360C', bg:'#FFE0B2'},
    {label:'🟡 Half Day', key:'h', fg:'#F57F17', bg:'#FFF9C4'},
  ];

  for (var hmi=0;hmi<heatMetrics.length;hmi++) {
    var hm = heatMetrics[hmi];
    var rowVals = [hm.label];
    var maxVal  = 0;
    for (var dd=0;dd<dim;dd++) {
      var v = dayTotals[dd][hm.key];
      rowVals.push(v);
      if (v>maxVal) maxVal=v;
    }
    dash.getRange(cr, 1, 1, hmCols).setValues([rowVals])
      .setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');
    // Label cell
    dash.getRange(cr,1).setBackground(hm.bg).setFontColor(hm.fg).setFontWeight('bold').setHorizontalAlignment('left');
    // Value cells — intensity shading + today highlight
    for (var dd=0;dd<dim;dd++) {
      var v2   = dayTotals[dd][hm.key];
      var cell = dash.getRange(cr, dd+2);
      var shade;
      if      (v2===0)           shade = '#F8F9FA';
      else if (maxVal===0)       shade = hm.bg;
      else if (v2<maxVal*0.35)   shade = blendHex_(hm.bg,'#FFFFFF',0.65);
      else if (v2<maxVal*0.70)   shade = blendHex_(hm.bg,'#FFFFFF',0.35);
      else                       shade = hm.bg;
      cell.setBackground(shade).setFontColor(v2===0 ? '#BDBDBD' : hm.fg);
      if (dd===todayDayIdx)
        cell.setBorder(true,true,true,true,false,false,'#FF6F00',SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
    dash.setRowHeight(cr, 28); cr++;
  }
  cr++; // spacer

  // ── Footer note ───────────────────────────────────────────
  dash.getRange(cr, 1, 1, hmCols).merge()
    .setValue('Attendance % = (working days + 0.5 × half days) ÷ days elapsed × 100.  ' +
              'Heatmap: darker cell = more managers in that status.  ' +
              'Refresh: Schedule Management → Refresh Dashboard.')
    .setBackground(t.DASH_SUB).setFontColor(t.DASH_SUB_FG)
    .setFontSize(8).setFontStyle('italic')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(cr, 22);

  // ── Column widths ─────────────────────────────────────────
  dash.setColumnWidth(1, 190);           // Name / metric label
  dash.setColumnWidth(2, 76);            // emoji / region
  for (var c=3;c<=9;c++)  dash.setColumnWidth(c, 76);   // table data cols
  for (var c=10;c<=hmCols;c++) dash.setColumnWidth(c, 36); // heatmap day cols

  // ── Freeze title + subtitle rows ─────────────────────────
  dash.setFrozenRows(2);

  SpreadsheetApp.flush();
  Logger.log('✅ Dashboard built: ' + totalMgrs + ' managers | ' + monthLabel);
}

// ─── COLOUR THEME SELECTOR ───────────────────────────────────
function selectTheme() {
  var ui      = SpreadsheetApp.getUi();
  var names   = Object.keys(THEMES);
  var current = PropertiesService.getScriptProperties().getProperty('THEME') || 'Classic';
  var r = ui.prompt(
    'Change Colour Theme',
    'Current theme: ' + current + '\n\n' +
    'Available:\n' +
    '  1. Classic  —  deep corporate blue\n' +
    '  2. Forest   —  dark forest green\n' +
    '  3. Slate    —  charcoal professional\n\n' +
    'Enter the theme name or its number (1-3):',
    ui.ButtonSet.OK_CANCEL
  );
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var input = r.getResponseText().trim();
  var idx   = parseInt(input, 10);
  var raw   = (!isNaN(idx) && idx>=1 && idx<=names.length) ? names[idx-1] : input;
  // Case-insensitive match
  var chosen = '';
  for (var i=0;i<names.length;i++) {
    if (names[i].toLowerCase()===raw.toLowerCase()) { chosen=names[i]; break; }
  }
  if (!chosen) {
    ui.alert('Unknown theme: "' + input + '".\nValid options: ' + names.join(', '));
    return;
  }
  PropertiesService.getScriptProperties().setProperty('THEME', chosen);
  var rebuild = ui.alert(
    'Theme changed to "' + chosen + '"',
    'Rebuild the schedule now to apply the new colours?',
    ui.ButtonSet.YES_NO
  );
  if (rebuild === ui.Button.YES) buildScheduleSheet();
}

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
