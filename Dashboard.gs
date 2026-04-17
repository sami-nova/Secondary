/**
 * Dashboard for Monthly Discount Tracker v2.0
 * Renders scenario / segment / region breakdown metrics.
 */

// ─── Entry point ──────────────────────────────────────────────────────────────

function updateDashboard() {
  var mainSheet = getMainSheet();
  if (!mainSheet) {
    SpreadsheetApp.getUi().alert('Main_Input sheet not found. Run Setup first.');
    return;
  }

  var dashSheet = getOrCreateSheet(CONFIG.SHEET_NAMES.DASHBOARD);
  var metrics   = _calculateMetrics(mainSheet);
  _renderDashboard(dashSheet, metrics);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Dashboard updated for ' + metrics.currentMonth, '🔄 Done', 3
  );
}

// ─── Metric calculation ───────────────────────────────────────────────────────

function _calculateMetrics(mainSheet) {
  var totalRows = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  var data      = mainSheet.getRange(CONFIG.DATA_START_ROW, 1, totalRows, CONFIG.COLUMNS.NOTES).getValues();

  var m = {
    currentMonth:    getCurrentMonthYear(),
    totalCampaigns:  0,
    activeCampaigns: 0,
    discountSum:     0,
    discountCount:   0,
    averageDiscount: 0,
    byScenario:  {},
    bySegment:   {},
    byRegion:    {}
  };

  CONFIG.SCENARIO_LIST.forEach(function(s) { m.byScenario[s] = 0; });
  ['Secondary MO', 'Secondary KO', 'PPC', 'CP', 'Paid in Advance'].forEach(function(s) { m.bySegment[s] = 0; });
  CONFIG.REGIONS.forEach(function(r) { m.byRegion[r] = { total: 0, active: 0 }; });

  data.forEach(function(row) {
    var region    = row[CONFIG.COLUMNS.REGION - 1];
    var segment   = row[CONFIG.COLUMNS.SEGMENT - 1];
    var scenario  = row[CONFIG.COLUMNS.SCENARIO - 1];
    var promoCode = row[CONFIG.COLUMNS.PROMO_CODE - 1];
    var status    = row[CONFIG.COLUMNS.STATUS - 1];
    var discount  = row[CONFIG.COLUMNS.DISCOUNT - 1];

    // Only count rows that have been filled
    if (!promoCode && !discount) return;

    m.totalCampaigns++;

    if (status === 'Active') {
      m.activeCampaigns++;
      if (m.byRegion[region]) m.byRegion[region].active++;
    }

    if (m.byScenario[scenario] !== undefined) m.byScenario[scenario]++;
    if (m.bySegment[segment]   !== undefined) m.bySegment[segment]++;
    if (m.byRegion[region])                   m.byRegion[region].total++;

    var discVal = parseFloat((discount || '').toString().replace('%', ''));
    if (!isNaN(discVal) && discVal > 0) {
      m.discountSum += discVal;
      m.discountCount++;
    }
  });

  m.averageDiscount = m.discountCount > 0
    ? Math.round((m.discountSum / m.discountCount) * 10) / 10
    : 0;

  return m;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function _renderDashboard(sheet, m) {
  sheet.clearContents();
  sheet.clearFormats();

  // ── Title
  _mergeSet(sheet, 1, 1, 1, 9, '📊 Monthly Discount Tracker – Dashboard',
    { bg: '#4B4B9B', fg: '#FFFFFF', size: 16, bold: true, align: 'center' });
  sheet.setRowHeight(1, 40);

  _mergeSet(sheet, 2, 1, 1, 9, 'Month: ' + m.currentMonth,
    { bg: '#6B6BBB', fg: '#FFFFFF', size: 12, align: 'center' });

  // ── KPI row (row 4-5)
  var kpis = [
    { label: 'Total Campaigns',  value: m.totalCampaigns,         color: '#D4EDDA' },
    { label: 'Active Campaigns', value: m.activeCampaigns,        color: '#D1ECF1' },
    { label: 'Avg Discount',     value: m.averageDiscount + '%',   color: '#FFF3CD' },
    { label: 'Regions Active',   value: _countActiveRegions(m),   color: '#F8D7DA' }
  ];

  kpis.forEach(function(kpi, i) {
    var col = 1 + i * 2;
    _mergeSet(sheet, 4, col, 1, 2, kpi.label,
      { bg: '#4B4B9B', fg: '#FFFFFF', bold: true, align: 'center' });
    _mergeSet(sheet, 5, col, 1, 2, kpi.value,
      { bg: kpi.color, size: 22, bold: true, align: 'center' });
  });
  sheet.setRowHeight(5, 42);

  // ── Left column: scenario + segment breakdown
  var row = 7;
  row = _renderSection(sheet, row, 1, 4, 'MO SCENARIOS', '#4ECDC4', [
    { name: 'CHURN PREVENTION (14-30 days)', color: '#D4EDDA' },
    { name: 'CHURN (180-30 days)',            color: '#FFF3CD' },
    { name: 'OLD CHURN (>180 days)',          color: '#F8D7DA' }
  ], m.byScenario);

  row++;
  row = _renderSection(sheet, row, 1, 4, 'KO SCENARIOS', '#FF6B6B', [
    { name: 'The most loyal churn', color: '#D1ECF1' },
    { name: 'Loyal churn',          color: '#E2E3E5' },
    { name: 'Not loyal churn',      color: '#FADBD8' }
  ], m.byScenario);

  row++;
  row = _renderSection(sheet, row, 1, 4, 'OTHER SEGMENTS', '#6B6BBB', [
    { name: 'PPC',             color: '#FFFFFF' },
    { name: 'CP',              color: '#FFFFFF' },
    { name: 'Paid in Advance', color: '#FFFFFF' }
  ], m.bySegment);

  // ── Right column: region breakdown
  var rRow = 7;
  _mergeSet(sheet, rRow, 6, 1, 4, 'BY REGION',
    { bg: '#4B4B9B', fg: '#FFFFFF', bold: true, align: 'center' });
  rRow++;

  CONFIG.REGIONS.forEach(function(region) {
    var rd = m.byRegion[region] || { total: 0, active: 0 };
    sheet.getRange(rRow, 6).setValue(region).setFontWeight('bold').setFontSize(9);
    sheet.getRange(rRow, 7).setValue(rd.total).setHorizontalAlignment('center').setFontWeight('bold');
    sheet.getRange(rRow, 8).setValue(rd.active + ' active').setFontColor('#666666').setFontSize(8);
    rRow++;
  });

  // ── Timestamp
  sheet.getRange(rRow + 1, 6, 1, 4).merge();
  sheet.getRange(rRow + 1, 6)
    .setValue('Updated: ' + new Date().toLocaleString())
    .setFontSize(8).setFontColor('#999999').setHorizontalAlignment('right');

  sheet.autoResizeColumns(1, 9);
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function _renderSection(sheet, startRow, col, width, title, headerBg, items, dataMap) {
  _mergeSet(sheet, startRow, col, 1, width, title,
    { bg: headerBg, fg: '#FFFFFF', bold: true, align: 'center' });
  var row = startRow + 1;

  items.forEach(function(item) {
    var count = dataMap[item.name] || 0;
    _mergeSet(sheet, row, col, 1, width - 1, item.name,
      { bg: item.color, size: 9 });
    sheet.getRange(row, col + width - 1)
      .setValue(count).setFontWeight('bold').setHorizontalAlignment('center').setBackground(item.color);
    row++;
  });
  return row;
}

function _mergeSet(sheet, r, c, rows, cols, value, style) {
  var range = sheet.getRange(r, c, rows, cols);
  if (rows > 1 || cols > 1) range.merge();
  range.setValue(value);
  if (style.bg)    range.setBackground(style.bg);
  if (style.fg)    range.setFontColor(style.fg);
  if (style.bold)  range.setFontWeight('bold');
  if (style.size)  range.setFontSize(style.size);
  if (style.align) range.setHorizontalAlignment(style.align);
  range.setVerticalAlignment('middle');
}

function _countActiveRegions(m) {
  return CONFIG.REGIONS.filter(function(r) { return (m.byRegion[r] || {}).total > 0; }).length;
}
