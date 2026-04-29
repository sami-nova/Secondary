// ============================================================
//  DAILY MANAGER SCHEDULE TRACKER — Google Apps Script v1.0
//  File 2 of 4: Sheet Builder + Conditional Formatting
// ============================================================

// ═════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT — builds (or rebuilds) the Schedule sheet
//  Pass a Date object to target a specific month; omit for today.
// ═════════════════════════════════════════════════════════════
function buildScheduleSheet(targetDate) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const tz   = Session.getScriptTimeZone();
  const date = (targetDate instanceof Date) ? targetDate : new Date();

  const year        = date.getFullYear();
  const month       = date.getMonth();           // 0-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel  = Utilities.formatDate(date, tz, 'MMMM yyyy');
  const holidays    = new Set(PUBLIC_HOLIDAYS);
  const totalCols   = CFG.FROZEN_COLS + daysInMonth;

  // ── Get or create sheet ───────────────────────────────────
  let sheet = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CFG.SHEET_NAME, 0);
  } else {
    sheet.clearConditionalFormatRules();
    const existingFilter = sheet.getFilter();
    if (existingFilter) existingFilter.remove();
    sheet.clear();
  }

  // ── Sort managers: by region order, then procedure order ──
  const sorted = [...MANAGERS].sort((a, b) => {
    const ri = REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region);
    return ri !== 0 ? ri : PROCEDURE_ORDER.indexOf(a.procedure) - PROCEDURE_ORDER.indexOf(b.procedure);
  });

  // ── ROW 1: Title bar ─────────────────────────────────────
  sheet.getRange(1, 1, 1, totalCols)
    .merge()
    .setValue('📋  Daily Manager Schedule Tracker  —  ' + monthLabel)
    .setBackground(C.TITLE_BG)
    .setFontColor(C.TITLE_FG)
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 44);

  // ── ROW 2: Column headers ─────────────────────────────────
  sheet.getRange(CFG.HEADER_ROW, 1, 1, CFG.FROZEN_COLS)
    .setValues([['Manager Name', 'Region', 'Procedure', 'Manager ID']])
    .setBackground(C.HDR_BG)
    .setFontColor(C.HDR_FG)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // Day-of-month headers: "Mon\n01", "Tue\n02", …
  const dayLabels = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    dayLabels.push(DAY_ABBR[dow] + '\n' + String(d).padStart(2, '0'));
  }
  sheet.getRange(CFG.HEADER_ROW, CFG.FROZEN_COLS + 1, 1, daysInMonth)
    .setValues([dayLabels])
    .setBackground(C.HDR_BG)
    .setFontColor(C.HDR_FG)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setRowHeight(CFG.HEADER_ROW, 48);

  // Colour weekend day-header cells differently
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow === 0 || dow === 6) {
      sheet.getRange(CFG.HEADER_ROW, CFG.FROZEN_COLS + d)
        .setBackground(C.WKND_BG)
        .setFontColor(C.WKND_FG);
    }
  }

  // ── DATA ROWS — region separators + manager rows ──────────
  // Group managers by region (preserving REGION_ORDER)
  const byRegion = {};
  REGION_ORDER.forEach(r => (byRegion[r] = []));
  sorted.forEach(m => { if (byRegion[m.region]) byRegion[m.region].push(m); });

  let currentRow = CFG.DATA_START_ROW;

  REGION_ORDER.forEach(function(region) {
    const mgrs = byRegion[region];
    if (!mgrs || mgrs.length === 0) return;

    // ── Region separator row ──────────────────────────────
    // No full merge — keep col B with the region value so
    // native sheet filters work correctly on that column.
    sheet.getRange(currentRow, 1)
      .setValue('   ◉  ' + region)
      .setBackground(C.RGN_BG)
      .setFontColor(C.RGN_FG)
      .setFontWeight('bold')
      .setFontSize(11)
      .setHorizontalAlignment('left')
      .setVerticalAlignment('middle');
    sheet.getRange(currentRow, 2)
      .setValue(region)                        // filterable region value
      .setBackground(C.RGN_BG)
      .setFontColor(C.RGN_FG)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    sheet.getRange(currentRow, 3, 1, 2)        // Procedure + ID — blank
      .setBackground(C.RGN_BG);
    sheet.getRange(currentRow, CFG.FROZEN_COLS + 1, 1, daysInMonth)
      .setBackground(C.RGN_BG);               // extend tint across day cols
    sheet.setRowHeight(currentRow, 26);
    currentRow++;

    // ── Manager rows ─────────────────────────────────────
    mgrs.forEach(function(mgr, idx) {
      const rowBg = (idx % 2 === 0) ? C.ODD_BG : C.EVN_BG;

      // Fixed columns (A-D)
      sheet.getRange(currentRow, 1, 1, CFG.FROZEN_COLS)
        .setValues([[mgr.name, mgr.region, mgr.procedure, mgr.id]])
        .setBackground(rowBg)
        .setFontSize(10)
        .setVerticalAlignment('middle');
      sheet.getRange(currentRow, 1)
        .setFontWeight('bold')
        .setHorizontalAlignment('left');
      sheet.getRange(currentRow, 2, 1, 3)
        .setHorizontalAlignment('center');

      // Day cells: default to working hours; weekends & holidays → DO
      const dayVals = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(year, month, d);
        const dow     = dayDate.getDay();
        const dateStr = Utilities.formatDate(dayDate, tz, 'yyyy-MM-dd');
        dayVals.push(
          (dow === 0 || dow === 6 || holidays.has(dateStr))
            ? CFG.DAY_OFF
            : CFG.WORKING_HOURS
        );
      }
      sheet.getRange(currentRow, CFG.FROZEN_COLS + 1, 1, daysInMonth)
        .setValues([dayVals])
        .setBackground(rowBg)
        .setFontSize(9)
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setWrap(false);

      sheet.setRowHeight(currentRow, 30);
      currentRow++;
    });
  });

  const lastDataRow = currentRow - 1;

  // ── Column widths ─────────────────────────────────────────
  sheet.setColumnWidth(1, 185);   // Manager Name
  sheet.setColumnWidth(2, 82);    // Region
  sheet.setColumnWidth(3, 148);   // Procedure
  sheet.setColumnWidth(4, 112);   // Manager ID
  for (let c = CFG.FROZEN_COLS + 1; c <= totalCols; c++) {
    sheet.setColumnWidth(c, 72);
  }

  // ── Borders across header + data area ────────────────────
  sheet.getRange(CFG.HEADER_ROW, 1, lastDataRow - CFG.HEADER_ROW + 1, totalCols)
    .setBorder(true, true, true, true, true, true,
               C.BORDER, SpreadsheetApp.BorderStyle.SOLID);

  // ── Freeze first 2 rows and first 4 columns ───────────────
  sheet.setFrozenRows(CFG.HEADER_ROW);
  sheet.setFrozenColumns(CFG.FROZEN_COLS);

  // ── Conditional formatting ────────────────────────────────
  applyConditionalFormatting_(sheet, lastDataRow, daysInMonth, year, month, holidays);

  // ── Native filter on fixed columns (Region / Procedure) ───
  // Dropdown arrows appear only on cols A-D; filtering still
  // hides/shows entire rows including day columns.
  sheet.getRange(CFG.HEADER_ROW, 1, lastDataRow - CFG.HEADER_ROW + 1, CFG.FROZEN_COLS)
    .createFilter();

  // ── Highlight today's column with an amber border ─────────
  const today = new Date();
  if (today.getFullYear() === year && today.getMonth() === month) {
    const todayCol = CFG.FROZEN_COLS + today.getDate();
    if (todayCol <= totalCols) {
      sheet.getRange(CFG.HEADER_ROW, todayCol)
        .setBorder(true, true, true, true, false, false,
                   C.TODAY_BDR, SpreadsheetApp.BorderStyle.SOLID_MEDIUM)
        .setFontWeight('bold');
    }
  }

  SpreadsheetApp.flush();
  ss.setActiveSheet(sheet);
  sheet.setActiveSelection('A1');

  Logger.log('✅ Schedule built for ' + monthLabel +
             ' (' + sorted.length + ' managers, ' + daysInMonth + ' days, rows 3–' + lastDataRow + ')');
}


// ─────────────────────────────────────────────────────────────
//  CONDITIONAL FORMATTING (private)
//
//  Rule priority (index 0 = highest):
//    0+  Holiday column rules   → orange override
//    N+  "DO" text rule         → light red
//    N+1 Working-hours text rule → light green
//
//  Weekend cells are pre-filled with "DO" at build time, so the
//  DO rule handles their colour automatically.
// ─────────────────────────────────────────────────────────────
function applyConditionalFormatting_(sheet, lastDataRow, daysInMonth, year, month, holidays) {
  const startRow = CFG.DATA_START_ROW;
  const numRows  = lastDataRow - startRow + 1;
  if (numRows <= 0) return;

  const tz          = Session.getScriptTimeZone();
  const dayColStart = CFG.FROZEN_COLS + 1;
  const allDayRange = sheet.getRange(startRow, dayColStart, numRows, daysInMonth);
  const rules       = [];

  // ── Base rules (appended first, lowest priority) ──────────

  // Working-hours text → light green
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(CFG.WORKING_HOURS)
      .setBackground(C.WORK_BG)
      .setFontColor(C.WORK_FG)
      .setRanges([allDayRange])
      .build()
  );

  // "DO" text → light red + bold
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(CFG.DAY_OFF)
      .setBackground(C.OFF_BG)
      .setFontColor(C.OFF_FG)
      .setFontWeight('bold')
      .setRanges([allDayRange])
      .build()
  );

  // ── Holiday column overrides (prepended → highest priority) ─
  // Entire data column for each holiday date gets orange,
  // regardless of cell text (covers both DO and custom shifts).
  PUBLIC_HOLIDAYS.forEach(function(ds) {
    const hd = new Date(ds + 'T00:00:00'); // parse as local date
    if (hd.getFullYear() !== year || hd.getMonth() !== month) return;
    const col   = dayColStart + hd.getDate() - 1;
    const range = sheet.getRange(startRow, col, numRows, 1);
    rules.unshift(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=TRUE')
        .setBackground(C.HOL_BG)
        .setFontColor(C.HOL_FG)
        .setRanges([range])
        .build()
    );
    // Also colour the day-header cell for the holiday
    sheet.getRange(CFG.HEADER_ROW, col)
      .setBackground(C.HOL_BG)
      .setFontColor(C.HOL_FG);
  });

  sheet.setConditionalFormatRules(rules);
}


// ═════════════════════════════════════════════════════════════
//  UPDATE MONTH — rebuilds the sheet for NEXT month
// ═════════════════════════════════════════════════════════════
function updateMonth() {
  const ui   = SpreadsheetApp.getUi();
  const next = new Date();
  next.setDate(1);
  next.setMonth(next.getMonth() + 1);
  const label = Utilities.formatDate(next, Session.getScriptTimeZone(), 'MMMM yyyy');

  const res = ui.alert(
    '🔄  Rebuild for Next Month?',
    'This will clear ALL current schedule data and rebuild the sheet for ' + label + '.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;

  buildScheduleSheet(next);
  ui.alert('✅  Done', 'Schedule rebuilt for ' + label + '.', ui.ButtonSet.OK);
}
