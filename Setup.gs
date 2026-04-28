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
    var clearRange = sheet.getRange(CONFIG.HEADER_ROW, 1, rows, 20);
    clearRange.clearContent();
    clearRange.clearFormat();
    clearRange.clearDataValidations();
  }
}

function _setupHeaders(sheet) {
  var headers = [
    'Region', 'Segment', 'Scenario',
    'Discount %', 'Promo Code', 'Condition', 'Status', 'Start Date', 'End Date',
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
 * Color coding — batch RangeList API calls.
 *
 * Column A : per-region color (one call per region block)
 * Column B : segment badge (one RangeList call per segment type)
 * Cols D-P : status-based colors are handled by conditional format rules
 */
function _applyColorCodingToSheet(sheet) {
  var colB = columnToLetter(CONFIG.COLUMNS.SEGMENT);

  // ── Column A: region colors ───────────────────────────────────────────────
  CONFIG.REGIONS.forEach(function(region, r) {
    var firstRow = CONFIG.DATA_START_ROW + r * CONFIG.ROWS_PER_REGION;
    sheet.getRange(firstRow, CONFIG.COLUMNS.REGION, CONFIG.ROWS_PER_REGION, 1)
      .setBackground(CONFIG.REGION_COLORS[region] || '#FFFFFF')
      .setFontWeight('bold')
      .setFontColor('#333333');
  });

  // ── Column B: segment badge (one RangeList per segment type) ─────────────
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

  // Borders at each segment-group boundary within every region.
  // Placing the thick line on the LAST row of each segment group (not just the
  // last row of the whole region) ensures the separator stays visible when a
  // segment filter is active and those in-between rows are hidden.
  var segBoundaryOffsets = [];
  var prevSeg = null;
  CONFIG.REGION_ROW_TEMPLATE.forEach(function(tpl, t) {
    if (prevSeg !== null && tpl.segment !== prevSeg) {
      segBoundaryOffsets.push(t - 1); // last row of the previous segment group
    }
    prevSeg = tpl.segment;
  });
  segBoundaryOffsets.push(CONFIG.ROWS_PER_REGION - 1); // always include last region row

  CONFIG.REGIONS.forEach(function(region, r) {
    segBoundaryOffsets.forEach(function(offset) {
      var borderRow  = CONFIG.DATA_START_ROW + r * CONFIG.ROWS_PER_REGION + offset;
      var isRegionEnd = (offset === CONFIG.ROWS_PER_REGION - 1);
      sheet.getRange(borderRow, 1, 1, CONFIG.COLUMNS.NOTES)
        .setBorder(null, null, true, null, null, null,
                   isRegionEnd ? '#555555' : '#999999',
                   isRegionEnd ? SpreadsheetApp.BorderStyle.SOLID_MEDIUM
                               : SpreadsheetApp.BorderStyle.SOLID);
    });
  });

  _applyConditionalFormats(sheet);
}

/**
 * Conditional format rules — replaces all existing rules on every setup run.
 *
 * Priority order (first match wins per cell):
 *   1-2. Active + missing required field → amber warning on specific cell
 *   3.   End Date < Start Date → red on End Date cell
 *   4-8. Status value → pastel row color across all data columns (D-P)
 *   9.   Completely empty row → very light grey
 *
 * Uses columnToLetter() so formulas stay correct after any column renumber.
 */
function _applyConditionalFormats(sheet) {
  var s    = CONFIG.DATA_START_ROW;
  var n    = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  var stL  = columnToLetter(CONFIG.COLUMNS.STATUS);
  var dL   = columnToLetter(CONFIG.COLUMNS.DISCOUNT);
  var pL   = columnToLetter(CONFIG.COLUMNS.PROMO_CODE);
  var cndL = columnToLetter(CONFIG.COLUMNS.CONDITION);
  var sdL  = columnToLetter(CONFIG.COLUMNS.START_DATE);
  var edL  = columnToLetter(CONFIG.COLUMNS.END_DATE);

  // All data-entry columns (D-P, excludes A-C structure columns)
  var rowRange  = sheet.getRange(s, CONFIG.COLUMNS.DISCOUNT, n,
    CONFIG.COLUMNS.NOTES - CONFIG.COLUMNS.DISCOUNT + 1);
  var cndRange  = sheet.getRange(s, CONFIG.COLUMNS.CONDITION, n, 1);

  var rules = [];

  // ── Required field alerts (highest priority) ──────────────────────────────
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($' + stL + s + '="Active",$' + dL + s + '="")')
    .setBackground('#FFC107').setFontColor('#000000')
    .setRanges([sheet.getRange(s, CONFIG.COLUMNS.DISCOUNT, n, 1)]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($' + stL + s + '="Active",$' + pL + s + '="")')
    .setBackground('#FFC107').setFontColor('#000000')
    .setRanges([sheet.getRange(s, CONFIG.COLUMNS.PROMO_CODE, n, 1)]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(
      '=AND($' + edL + s + '<>"",$' + sdL + s + '<>"",$' + edL + s + '<$' + sdL + s + ')')
    .setBackground('#F8D7DA').setFontColor('#721C24')
    .setRanges([sheet.getRange(s, CONFIG.COLUMNS.END_DATE, n, 1)]).build());

  // ── Condition column indicator ────────────────────────────────────────────
  // Condition filled → teal highlight (row has been configured)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + cndL + s + '<>""')
    .setBackground('#80CBC4').setFontColor('#004D40')
    .setRanges([cndRange]).build());

  // Condition empty but row has campaign data → soft amber hint (needs attention)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($' + dL + s + '<>"",$' + cndL + s + '="")')
    .setBackground('#FFF9C4').setFontColor('#5D4037')
    .setRanges([cndRange]).build());

  // ── Status-based row coloring (data cols D-P) ─────────────────────────────
  [
    { status: 'Active',   bg: '#A5D6A7', fg: '#1B5E20' }, // strong green
    { status: 'Pending',  bg: '#FFE082', fg: '#5D4037' }, // strong amber
    { status: 'Inactive', bg: '#BDBDBD', fg: '#212121' }, // medium grey
    { status: 'Expired',  bg: '#EF9A9A', fg: '#7F0000' }, // strong red/pink
    { status: 'Draft',    bg: '#90CAF9', fg: '#0D47A1' }  // strong blue
  ].forEach(function(sr) {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$' + stL + s + '="' + sr.status + '"')
      .setBackground(sr.bg).setFontColor(sr.fg)
      .setRanges([rowRange]).build());
  });

  // Empty row (no discount + no status) → very light grey
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($' + dL + s + '="",$' + stL + s + '="")')
    .setBackground('#F5F5F5')
    .setRanges([rowRange]).build());

  sheet.setConditionalFormatRules(rules);
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

/**
 * Re-apply design to data rows (15+) WITHOUT touching rows 1-14.
 * Rows 1-14 hold the user's drawing buttons — they must not be rebuilt here.
 * Only data-area changes: headers, structure columns A-C, colors, formatting,
 * conditional formats, and dropdowns. Data in columns D-P is never cleared.
 */
function updateDesignOnly() {
  var sheet = getMainSheet();
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Main_Input not found. Run full setup first.');
    return;
  }
  _applySheetConfig();          // ensure CONFIG is fresh from Reference_Data
  _setupHeaders(sheet);         // row 15 header bar
  _fillDataRows(sheet);         // restore A-C structure labels (rows 16+)
  _applyColorCodingToSheet(sheet);
  _applySheetFormatting(sheet); // column widths, row heights, borders, conditional formats
  _setupDropdownsOnSheet(sheet);// scenario/status dropdowns + checkboxes (preserves TRUE values)
  SpreadsheetApp.getActiveSpreadsheet()
    .toast('Design updated — nav area and data preserved.', '🎨 Done', 4);
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
  // Use a wider range (20 cols) than CONFIG.COLUMNS.NOTES so any old merged
  // cells from before a column was removed are fully captured.
  sheet.getRange(1, 1, CONFIG.HEADER_ROW - 1, 20).breakApart();

  // Row 1 – Title (cols 1-12) + Last Saved indicator (cols 13-17)
  sheet.getRange(1, 1, 1, 12).merge();
  sheet.getRange(1, 1)
    .setValue('🗓️  MONTHLY DISCOUNT TRACKER')
    .setBackground('#2C3E6B').setFontColor('#FFFFFF')
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.getRange(1, 13, 1, 4).merge();
  sheet.getRange(1, 13)
    .setValue('Last saved: —')
    .setBackground('#1E2A4A').setFontColor('#7788AA')
    .setFontSize(9).setHorizontalAlignment('right').setVerticalAlignment('middle');
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
    { col: 11, label: 'PAID',     fn: 'filterPaidInAdvance',  bg: '#FF8A65' },
    { col: 13, label: 'USERS',    fn: 'filterActiveUsers',    bg: '#42A5F5' }
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

  // Row 13 – thin separator
  sheet.getRange(13, 1, 1, CONFIG.COLUMNS.NOTES).clearContent().clearFormat();
  sheet.getRange(13, 1, 1, CONFIG.COLUMNS.NOTES).setBackground('#EEF0F8');
  sheet.setRowHeight(13, 4);

  // Row 14 – column-group sub-header (directly above the data header)
  // A-C: structure  |  D-F: campaign data  |  G-I: status & dates  |  J-O: channels  |  P: notes
  sheet.getRange(14, 1, 1, 3).merge()
    .setValue('STRUCTURE')
    .setBackground('#3A3A7A').setFontColor('#8888BB')
    .setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.getRange(14, 4, 1, 3).merge()
    .setValue('CAMPAIGN DETAILS')
    .setBackground('#3A3A7A').setFontColor('#AAAADD')
    .setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.getRange(14, 7, 1, 3).merge()
    .setValue('STATUS & TIMELINE')
    .setBackground('#3A3A7A').setFontColor('#AAAADD')
    .setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.getRange(14, 10, 1, 6).merge()
    .setValue('📢  CHANNELS')
    .setBackground('#B34700').setFontColor('#FFFFFF')
    .setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.getRange(14, 16)
    .setValue('NOTES')
    .setBackground('#3A3A7A').setFontColor('#AAAADD')
    .setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(14, 20);
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

/**
 * Sets up Reference_Data with 6 sequential columns — no gaps.
 * Layout: A=Regions | B=Discount% | C=Promo Codes | D=Conditions | E=Scenarios | F=Status
 *
 * Only writes data rows that are currently empty (preserves user edits).
 * _applySheetConfig() reads Regions from A, Scenarios from E, Status from F.
 */
function setupReferenceData() {
  var sheet = getOrCreateSheet(CONFIG.SHEET_NAMES.REFERENCE);

  var sections = [
    { col: 1, title: 'Regions',     data: CONFIG.REGIONS },
    { col: 2, title: 'Discount %',  data: ['10%','15%','20%','25%','26%','30%','33%','35%','40%','45%','50%','60%'] },
    { col: 3, title: 'Promo Codes', data: [] },   // user fills
    { col: 4, title: 'Conditions',  data: ['all subs','all sub 2+','all sub 3+','all sub 4+','24w 2N/NN','24w 3N/NN','24w 4N/NN','24w 2N/NN installments','24w 3N/NN installments','24w 4N/NN installments','48w 2N/NN','48w 3N/NN','48w 4N/NN','48w 2N/NN installments','48w 3N/NN installments','48w 4N/NN installments'] },
    { col: 5, title: 'Scenarios',   data: CONFIG.SCENARIO_LIST },
    { col: 6, title: 'Status',      data: CONFIG.STATUS_LIST }
  ];

  // Style headers
  sheet.getRange(1, 1, 1, 6)
    .setBackground('#4B4B9B').setFontColor('#FFFFFF').setFontWeight('bold');

  sections.forEach(function(s) {
    sheet.getRange(1, s.col).setValue(s.title);

    if (s.data.length === 0) return; // user-maintained column

    var existingVals = sheet.getRange(2, s.col, Math.max(s.data.length, 1), 1).getValues()
      .map(function(r) { return r[0]; });
    var alreadyFilled = existingVals.some(function(v) { return v !== ''; });
    if (!alreadyFilled) {
      s.data.forEach(function(item, i) {
        sheet.getRange(2 + i, s.col).setValue(item);
      });
    }
  });

  // Widen columns for readability
  [1,2,3,4,5,6].forEach(function(c) { sheet.setColumnWidth(c, c <= 2 ? 90 : c === 4 ? 180 : 130); });

  try {
    sheet.getRange('A1').setNote(
      'Edit any list here, then:\n🎯 Discount Tracker → 🗃️ Maintenance → 🔄 Reload Config from Sheet'
    );
  } catch (ignore) {}

  SpreadsheetApp.getActiveSpreadsheet()
    .toast('Reference_Data ready — edit lists directly, then Reload Config', '📊 Done', 4);
}
