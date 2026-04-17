/**
 * Setup functions – initializes the 196-row structure, colors, dropdowns, and filter area.
 */

// ─── Master setup ─────────────────────────────────────────────────────────────

function setupSheetStructure() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '🏗️ Initialize Sheet Structure',
    'This will rebuild Main_Input rows 15+ with the complete 168-row scenario structure.\n\n' +
    '⚠️  Existing data in those rows will be cleared.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  // Ensure required sheets exist before sidebar opens
  getOrCreateSheet(CONFIG.SHEET_NAMES.MAIN);
  getOrCreateSheet(CONFIG.SHEET_NAMES.DATA_STORE);

  // Open progress sidebar — it drives each step via runSetupStep()
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile('SetupProgress')
      .setTitle('🏗️ Setting Up Sheet…')
  );
}

/**
 * Called by SetupProgress.html for each numbered step.
 * Keeps individual steps small so progress updates feel responsive.
 */
function runSetupStep(step) {
  var sheet = getOrCreateSheet(CONFIG.SHEET_NAMES.MAIN);
  switch (step) {
    case 1: _clearDataArea(sheet);           break;
    case 2: _setupHeaders(sheet);            break;
    case 3: _fillDataRows(sheet);            break;
    case 4: _applyColorCodingToSheet(sheet); break;
    case 5: _applySheetFormatting(sheet);    break;
    case 6: _setupDropdownsOnSheet(sheet);   break;
    case 7: _setupFilterArea(sheet);         break;
    case 8: setupReferenceData();            break;
    default: throw new Error('Unknown setup step: ' + step);
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _clearDataArea(sheet) {
  var lastRow = Math.max(sheet.getLastRow(), CONFIG.HEADER_ROW + 1);
  var rows = lastRow - CONFIG.HEADER_ROW + 1;
  if (rows > 0) {
    sheet.getRange(CONFIG.HEADER_ROW, 1, rows, CONFIG.COLUMNS.NOTES)
      .clearContent()
      .clearFormat();
  }
}

function _setupHeaders(sheet) {
  var headers = [
    'Region', 'Segment', 'Scenario', 'Discount %', 'Promo Code',
    'Condition', 'Code Effect', 'Status', 'Start Date', 'End Date',
    'Banner', 'PopUp', 'InApp', 'WA', 'Push', 'SMS', 'Notes'
  ];

  var r = sheet.getRange(CONFIG.HEADER_ROW, 1, 1, headers.length);
  r.setValues([headers]);
  r.setBackground('#4B4B9B')
   .setFontColor('#FFFFFF')
   .setFontWeight('bold')
   .setHorizontalAlignment('center')
   .setVerticalAlignment('middle')
   .setFontSize(10);
  sheet.setRowHeight(CONFIG.HEADER_ROW, 36);

  sheet.setFrozenRows(CONFIG.HEADER_ROW);
  // Note: setFrozenColumns is intentionally omitted — it conflicts with the
  // full-row merges in the filter area (rows 1-14) on re-runs.
}

function _fillDataRows(sheet) {
  // Write ONLY the 3 structure columns (A-C). Data columns D-Q start empty.
  // Writing 196×3 instead of 196×17 is simpler and avoids any batch-write issues.
  var batch = [];
  CONFIG.REGIONS.forEach(function(region) {
    CONFIG.REGION_ROW_TEMPLATE.forEach(function(tpl) {
      batch.push([region, tpl.segment, tpl.scenario]);
    });
  });
  sheet.getRange(CONFIG.DATA_START_ROW, 1, batch.length, 3).setValues(batch);
}

/**
 * Public: re-write Region / Segment / Scenario from CONFIG into the sheet.
 * Safe to call at any time – never touches data columns D-Q.
 */
function populateStructure() {
  var sheet = getMainSheet();
  if (!sheet) { SpreadsheetApp.getUi().alert('Main_Input not found. Run full setup first.'); return; }
  _fillDataRows(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Structure columns A-C restored!', '✅ Done', 3);
}

/**
 * Batch color coding using RangeList — ~25 API calls instead of ~500+.
 *
 * Column A  : per-region color (14 contiguous range calls, one per region block)
 * Cols B-Q  : per-scenario color (one getRangeList per unique non-white color)
 * Column B  : segment badge (one getRangeList per segment type)
 */
function _applyColorCodingToSheet(sheet) {
  var colA = columnToLetter(CONFIG.COLUMNS.REGION);
  var colB = columnToLetter(CONFIG.COLUMNS.SEGMENT);
  var colQ = columnToLetter(CONFIG.COLUMNS.NOTES);

  // ── 1. Column A: region colors (14 contiguous block calls) ───────────────
  CONFIG.REGIONS.forEach(function(region, r) {
    var firstRow = CONFIG.DATA_START_ROW + r * CONFIG.ROWS_PER_REGION;
    sheet.getRange(firstRow, CONFIG.COLUMNS.REGION, CONFIG.ROWS_PER_REGION, 1)
      .setBackground(CONFIG.REGION_COLORS[region] || '#FFFFFF')
      .setFontWeight('bold')
      .setFontColor('#333333');
  });

  // ── 2. Cols B-Q: scenario row colors (one RangeList per unique color) ────
  var scenarioColorGroups = {}; // color → [A1 range strings]
  CONFIG.REGION_ROW_TEMPLATE.forEach(function(tpl, t) {
    if (!tpl.color || tpl.color === '#FFFFFF') return; // white is the default, skip
    if (!scenarioColorGroups[tpl.color]) scenarioColorGroups[tpl.color] = [];
    CONFIG.REGIONS.forEach(function(region, r) {
      var row = getRowForRegionAndOffset(r, t);
      scenarioColorGroups[tpl.color].push(colB + row + ':' + colQ + row);
    });
  });
  Object.keys(scenarioColorGroups).forEach(function(color) {
    sheet.getRangeList(scenarioColorGroups[color]).setBackground(color);
  });

  // ── 3. Column B: segment badge (one RangeList per segment type) ───────────
  var segGroups = {}; // segment → { style, ranges[] }
  CONFIG.REGION_ROW_TEMPLATE.forEach(function(tpl, t) {
    if (!segGroups[tpl.segment]) {
      segGroups[tpl.segment] = {
        style:  CONFIG.SEGMENT_COLORS[tpl.segment] || { bg: '#CCCCCC', text: '#000000' },
        ranges: []
      };
    }
    CONFIG.REGIONS.forEach(function(region, r) {
      var row = getRowForRegionAndOffset(r, t);
      segGroups[tpl.segment].ranges.push(colB + row);
    });
  });
  Object.keys(segGroups).forEach(function(seg) {
    var g = segGroups[seg];
    sheet.getRangeList(g.ranges)
      .setBackground(g.style.bg)
      .setFontColor(g.style.text)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
  });
}

function _applySheetFormatting(sheet) {
  var totalRows = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;

  // Column widths
  var widths = {
    [CONFIG.COLUMNS.REGION]:      80,
    [CONFIG.COLUMNS.SEGMENT]:    125,
    [CONFIG.COLUMNS.SCENARIO]:   215,
    [CONFIG.COLUMNS.DISCOUNT]:    75,
    [CONFIG.COLUMNS.PROMO_CODE]: 110,
    [CONFIG.COLUMNS.CONDITION]:  155,
    [CONFIG.COLUMNS.CODE_EFFECT]:135,
    [CONFIG.COLUMNS.STATUS]:      80,
    [CONFIG.COLUMNS.START_DATE]:  95,
    [CONFIG.COLUMNS.END_DATE]:    95,
    [CONFIG.COLUMNS.BANNER]:      60,
    [CONFIG.COLUMNS.POPUP]:       60,
    [CONFIG.COLUMNS.INAPP]:       60,
    [CONFIG.COLUMNS.WA]:          50,
    [CONFIG.COLUMNS.PUSH]:        50,
    [CONFIG.COLUMNS.SMS]:         50,
    [CONFIG.COLUMNS.NOTES]:      200
  };
  Object.keys(widths).forEach(function(col) {
    sheet.setColumnWidth(parseInt(col), widths[col]);
  });

  // Row heights and base formatting
  var dataRange = sheet.getRange(CONFIG.DATA_START_ROW, 1, totalRows, CONFIG.COLUMNS.NOTES);
  dataRange.setFontSize(9).setVerticalAlignment('middle');
  dataRange.setBorder(true, true, true, true, true, true, '#CCCCCC', SpreadsheetApp.BorderStyle.SOLID);

  for (var i = 0; i < totalRows; i++) {
    sheet.setRowHeight(CONFIG.DATA_START_ROW + i, 25);
  }

  // Discount column – centre-aligned
  sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLUMNS.DISCOUNT, totalRows, 1).setHorizontalAlignment('center');

  // Date columns – format
  ['START_DATE', 'END_DATE'].forEach(function(key) {
    sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLUMNS[key], totalRows, 1).setNumberFormat('dd/mm/yyyy');
  });

  // Thick bottom border after each region's last row for easy visual separation
  CONFIG.REGIONS.forEach(function(region, r) {
    var lastRow = CONFIG.DATA_START_ROW + ((r + 1) * CONFIG.ROWS_PER_REGION) - 1;
    sheet.getRange(lastRow, 1, 1, CONFIG.COLUMNS.NOTES)
      .setBorder(null, null, true, null, null, null,
                 '#555555', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  });
}

// ─── Public wrappers ──────────────────────────────────────────────────────────

function applyColorCoding() {
  var sheet = getMainSheet();
  if (!sheet) { SpreadsheetApp.getUi().alert('Main_Input not found. Run full setup first.'); return; }
  _applyColorCodingToSheet(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Color coding applied!', '🎨 Done', 3);
}

function setupDropdowns() {
  var sheet = getMainSheet();
  if (!sheet) { SpreadsheetApp.getUi().alert('Main_Input not found. Run full setup first.'); return; }
  _setupDropdownsOnSheet(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Dropdowns applied!', '📋 Done', 3);
}

function _setupDropdownsOnSheet(sheet) {
  var totalRows = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;

  // Scenario dropdown
  sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLUMNS.SCENARIO, totalRows, 1)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(CONFIG.SCENARIO_LIST, true)
        .setAllowInvalid(true).build()
    );

  // Status dropdown
  sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLUMNS.STATUS, totalRows, 1)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(CONFIG.STATUS_LIST, true)
        .setAllowInvalid(true).build()
    );

  // Checkboxes: Banner, PopUp, InApp, WA, Push, SMS
  // Save existing TRUE values first — insertCheckboxes() resets everything to FALSE on re-runs
  var checkboxCols = [CONFIG.COLUMNS.BANNER, CONFIG.COLUMNS.POPUP, CONFIG.COLUMNS.INAPP,
                      CONFIG.COLUMNS.WA, CONFIG.COLUMNS.PUSH, CONFIG.COLUMNS.SMS];
  var saved = {};
  checkboxCols.forEach(function(col) {
    var vals = sheet.getRange(CONFIG.DATA_START_ROW, col, totalRows, 1).getValues();
    if (vals.some(function(r) { return r[0] === true; })) saved[col] = vals;
  });

  checkboxCols.forEach(function(col) {
    sheet.getRange(CONFIG.DATA_START_ROW, col, totalRows, 1).insertCheckboxes();
  });

  // Restore any TRUE values that were overwritten
  Object.keys(saved).forEach(function(col) {
    sheet.getRange(CONFIG.DATA_START_ROW, parseInt(col), totalRows, 1).setValues(saved[col]);
  });
}

// ─── Filter / navigation area (rows 1-14) ────────────────────────────────────

function _setupFilterArea(sheet) {
  // Break apart any merged cells from a previous setup run before re-merging.
  // This prevents the "can't freeze columns inside a merged cell" error.
  sheet.getRange(1, 1, CONFIG.HEADER_ROW - 1, CONFIG.COLUMNS.NOTES).breakApart();

  // Row 1 – Static spreadsheet title (never updated by script)
  sheet.getRange(1, 1, 1, CONFIG.COLUMNS.NOTES).merge();
  sheet.getRange(1, 1)
    .setValue('🗓️  MONTHLY DISCOUNT TRACKER')
    .setBackground('#2C3E6B').setFontColor('#FFFFFF')
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);

  // Row 2 left (A2:F2) – Current month display ← updated by setCurrentMonthYear()
  sheet.getRange(2, 1, 1, 6).merge();
  sheet.getRange(2, 1)
    .setValue('Current Month: ' + getDefaultMonthYear())
    .setBackground('#4B5D99').setFontColor('#FFFFFF')
    .setFontSize(11).setFontWeight('bold')
    .setHorizontalAlignment('left').setVerticalAlignment('middle');

  // Rows 2-3 – month buttons row 1 (APR–AUG)  (cols 7+ in row 2)
  var months1 = [
    { col: 7,  label: 'APR', fn: 'switchToApril'     },
    { col: 9,  label: 'MAY', fn: 'switchToMay'       },
    { col: 11, label: 'JUN', fn: 'switchToJune'      },
    { col: 13, label: 'JUL', fn: 'switchToJuly'      },
    { col: 15, label: 'AUG', fn: 'switchToAugust'    }
  ];
  _writeButtonRow(sheet, 2, 3, months1, '#6B6BBB', '#FFFFFF');

  // Rows 4-5 – month buttons row 2 (SEP–DEC)
  var months2 = [
    { col: 7,  label: 'SEP', fn: 'switchToSeptember' },
    { col: 9,  label: 'OCT', fn: 'switchToOctober'   },
    { col: 11, label: 'NOV', fn: 'switchToNovember'  },
    { col: 13, label: 'DEC', fn: 'switchToDecember'  }
  ];
  _writeButtonRow(sheet, 4, 5, months2, '#6B6BBB', '#FFFFFF');

  // Row 6 – info banner
  sheet.getRange(6, 1, 1, CONFIG.COLUMNS.NOTES).merge();
  sheet.getRange(6, 1)
    .setValue('✨ Click month to switch | Data auto-saved | Previous months preserved in Data_Store!')
    .setBackground('#28A745').setFontColor('#FFFFFF')
    .setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.setRowHeight(6, 28);

  // Rows 7-8 – segment filter buttons
  sheet.getRange(7, 1).setValue('SEGMENT FILTERS:').setFontWeight('bold').setFontSize(10);
  var segBtns = [
    { col: 2,  label: 'SHOW ALL', fn: 'filterShowAll',        bg: '#6B6BBB' },
    { col: 3,  label: 'KO',       fn: 'filterSecondaryKO',    bg: '#FF6B6B' },
    { col: 4,  label: 'MO',       fn: 'filterSecondaryMO',    bg: '#4ECDC4' },
    { col: 6,  label: 'PPC',      fn: 'filterPPC',            bg: '#FFB300' },
    { col: 9,  label: 'CP',       fn: 'filterCP',             bg: '#66BB6A' },
    { col: 11, label: 'PAID',     fn: 'filterPaidInAdvance',  bg: '#FF8A65' }
  ];
  _writeButtonRow(sheet, 7, 8, segBtns, null, '#FFFFFF'); // bg from each item

  // Rows 9-10 – region filter row 1
  sheet.getRange(9, 1).setValue('REGION FILTERS:').setFontWeight('bold').setFontSize(10);
  var reg1 = [
    { col: 2,  label: 'Poland',  fn: 'filterPoland',  bg: '#FFB347' },
    { col: 3,  label: 'Italy',   fn: 'filterItaly',   bg: '#FF6B6B' },
    { col: 4,  label: 'Spain',   fn: 'filterSpain',   bg: '#FFE66D' },
    { col: 6,  label: 'France',  fn: 'filterFrance',  bg: '#A8E6CF' },
    { col: 9,  label: 'Germany', fn: 'filterGermany', bg: '#DDA0DD' },
    { col: 11, label: 'Russia',  fn: 'filterRussia',  bg: '#87CEEB' },
    { col: 13, label: 'Romania', fn: 'filterRomania', bg: '#FFB6C1' }
  ];
  _writeButtonRow(sheet, 9, 10, reg1, null, '#FFFFFF');

  // Rows 11-12 – region filter row 2
  var reg2 = [
    { col: 2,  label: 'Czech',  fn: 'filterCzech',         bg: '#CD853F' },
    { col: 3,  label: 'ARAB',   fn: 'filterArab',          bg: '#20B2AA' },
    { col: 4,  label: 'Turkey', fn: 'filterTurkey',        bg: '#DC143C' },
    { col: 6,  label: 'Israel', fn: 'filterIsrael',        bg: '#4169E1' },
    { col: 9,  label: 'Korea',  fn: 'filterKorea',         bg: '#8B008B' },
    { col: 11, label: 'Japan',  fn: 'filterJapan',         bg: '#FF4500' },
    { col: 13, label: 'GLOBAL', fn: 'filterGlobal',        bg: '#2E8B57' },
    { col: 15, label: 'ALL',    fn: 'filterShowAllRegions', bg: '#228B22' }
  ];
  _writeButtonRow(sheet, 11, 12, reg2, null, '#FFFFFF');

  // Row 13 – button instructions
  sheet.getRange(13, 1, 1, CONFIG.COLUMNS.NOTES).merge();
  sheet.getRange(13, 1)
    .setValue('● CREATE BUTTONS: Insert → Drawing | Match colors & text | Position over colored cells | Assign script names | See Button_Guide')
    .setBackground('#DC3545').setFontColor('#FFFFFF')
    .setFontSize(9).setHorizontalAlignment('center');

  // Row 14 – spacer
  sheet.setRowHeight(14, 8);
}

function _writeButtonRow(sheet, labelRow, scriptRow, buttons, defaultBg, textColor) {
  buttons.forEach(function(btn) {
    var bg = btn.bg || defaultBg;
    sheet.getRange(labelRow, btn.col)
      .setValue(btn.label)
      .setBackground(bg)
      .setFontColor(textColor || '#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    sheet.getRange(scriptRow, btn.col)
      .setValue(btn.fn)
      .setFontSize(7)
      .setFontColor('#777777')
      .setHorizontalAlignment('center');
  });
  sheet.setRowHeight(labelRow, 28);
  sheet.setRowHeight(scriptRow, 14);
}

// ─── Reference_Data ───────────────────────────────────────────────────────────

function setupReferenceData() {
  var sheet = getOrCreateSheet(CONFIG.SHEET_NAMES.REFERENCE);

  var sections = [
    { col: 1, title: 'Regions',   data: CONFIG.REGIONS },
    { col: 3, title: 'Segments',  data: ['Secondary MO', 'Secondary KO', 'PPC', 'CP', 'Paid in Advance'] },
    { col: 5, title: 'Scenarios', data: CONFIG.SCENARIO_LIST },
    { col: 7, title: 'Status',    data: CONFIG.STATUS_LIST }
  ];

  sections.forEach(function(s) {
    sheet.getRange(1, s.col).setValue(s.title)
      .setBackground('#4B4B9B').setFontColor('#FFFFFF').setFontWeight('bold');
    s.data.forEach(function(item, i) {
      sheet.getRange(2 + i, s.col).setValue(item);
    });
  });

  SpreadsheetApp.getActiveSpreadsheet().toast('Reference_Data updated!', '📊 Done', 3);
}
