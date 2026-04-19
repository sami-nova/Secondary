/**
 * Dashboard for Monthly Discount Tracker v2.0
 *
 * Sections:
 *   Row 1-2   : Title + month subtitle
 *   Row 4-5   : KPI row 1 — Total | Active | Avg Discount | Regions Active
 *   Row 7-8   : KPI row 2 — Zero Coverage Regions | Top Scenario | Rows Filled
 *   Row 10+   : Left = scenario/segment breakdown  |  Right = region list
 *   Row N+    : Channel utilization heatmap (14 regions × 6 channels)
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
  var totalRows   = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  var data        = mainSheet.getRange(CONFIG.DATA_START_ROW, 1, totalRows, CONFIG.COLUMNS.NOTES).getValues();

  var channelNames = ['Banner', 'PopUp', 'InApp', 'WA', 'Push', 'SMS'];
  var channelCols  = [
    CONFIG.COLUMNS.BANNER, CONFIG.COLUMNS.POPUP, CONFIG.COLUMNS.INAPP,
    CONFIG.COLUMNS.WA,     CONFIG.COLUMNS.PUSH,  CONFIG.COLUMNS.SMS
  ];

  var m = {
    currentMonth:    getCurrentMonthYear(),
    totalCampaigns:  0,
    activeCampaigns: 0,
    discountSum:     0,
    discountCount:   0,
    averageDiscount: 0,
    byScenario:      {},
    bySegment:       {},
    byRegion:        {},
    byChannel:       {}
  };

  CONFIG.SCENARIO_LIST.forEach(function(s) { m.byScenario[s] = 0; });
  ['Secondary MO', 'Secondary KO', 'PPC', 'CP', 'Paid in Advance'].forEach(function(s) {
    m.bySegment[s] = 0;
  });
  CONFIG.REGIONS.forEach(function(r) {
    m.byRegion[r]  = { total: 0, active: 0 };
    m.byChannel[r] = {};
    channelNames.forEach(function(ch) { m.byChannel[r][ch] = 0; });
  });

  data.forEach(function(row) {
    var region    = row[CONFIG.COLUMNS.REGION    - 1];
    var segment   = row[CONFIG.COLUMNS.SEGMENT   - 1];
    var scenario  = row[CONFIG.COLUMNS.SCENARIO  - 1];
    var promoCode = row[CONFIG.COLUMNS.PROMO_CODE - 1];
    var status    = row[CONFIG.COLUMNS.STATUS    - 1];
    var discount  = row[CONFIG.COLUMNS.DISCOUNT  - 1];

    if (!promoCode && !discount) return; // unfilled row

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

    // Channel checkbox counts (TRUE = checked)
    if (m.byChannel[region]) {
      channelCols.forEach(function(col, i) {
        if (row[col - 1] === true) m.byChannel[region][channelNames[i]]++;
      });
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

  // ── KPI row 1 (rows 4-5): 4 × 2-col KPIs
  var kpis1 = [
    { label: 'Total Campaigns',  value: m.totalCampaigns,        color: '#D4EDDA' },
    { label: 'Active Campaigns', value: m.activeCampaigns,       color: '#D1ECF1' },
    { label: 'Avg Discount',     value: m.averageDiscount + '%', color: '#FFF3CD' },
    { label: 'Regions Active',   value: _countActiveRegions(m),  color: '#F8D7DA' }
  ];
  kpis1.forEach(function(kpi, i) {
    var col = 1 + i * 2;
    _mergeSet(sheet, 4, col, 1, 2, kpi.label,
      { bg: '#4B4B9B', fg: '#FFFFFF', bold: true, align: 'center' });
    _mergeSet(sheet, 5, col, 1, 2, kpi.value,
      { bg: kpi.color, size: 22, bold: true, align: 'center' });
  });
  sheet.setRowHeight(5, 42);

  // ── KPI row 2 (rows 7-8): 3 × 3-col KPIs
  var zeroCoverage = CONFIG.REGIONS.filter(function(r) {
    return !m.byRegion[r] || m.byRegion[r].total === 0;
  }).length;
  var topScenario = _topKey(m.byScenario) || '—';
  var totalSlots  = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;

  var kpis2 = [
    { label: 'Zero Coverage Regions',
      value: zeroCoverage,
      color: zeroCoverage > 0 ? '#F8D7DA' : '#D4EDDA' },
    { label: 'Top Scenario',
      value: topScenario,
      color: '#E8EAFF' },
    { label: 'Rows Filled',
      value: m.totalCampaigns + ' / ' + totalSlots,
      color: '#FFF8E1' }
  ];
  kpis2.forEach(function(kpi, i) {
    var col = 1 + i * 3;
    _mergeSet(sheet, 7, col, 1, 3, kpi.label,
      { bg: '#5B5BAB', fg: '#FFFFFF', bold: true, align: 'center', size: 9 });
    var valSize = kpi.value.toString().length > 16 ? 9 : 15;
    _mergeSet(sheet, 8, col, 1, 3, kpi.value,
      { bg: kpi.color, size: valSize, bold: true, align: 'center' });
  });
  sheet.setRowHeight(8, 40);

  // ── Left column: scenario + segment breakdown (starts at row 10)
  var leftRow = 10;
  leftRow = _renderSection(sheet, leftRow, 1, 4, 'MO SCENARIOS', '#4ECDC4', [
    { name: 'CHURN PREVENTION (14-30 days)', color: '#D4EDDA' },
    { name: 'CHURN (180-30 days)',            color: '#FFF3CD' },
    { name: 'OLD CHURN (>180 days)',          color: '#F8D7DA' }
  ], m.byScenario);

  leftRow++;
  leftRow = _renderSection(sheet, leftRow, 1, 4, 'KO SCENARIOS', '#FF6B6B', [
    { name: 'The most loyal churn', color: '#D1ECF1' },
    { name: 'Loyal churn',          color: '#E2E3E5' },
    { name: 'Not loyal churn',      color: '#FADBD8' }
  ], m.byScenario);

  leftRow++;
  leftRow = _renderSection(sheet, leftRow, 1, 4, 'OTHER SEGMENTS', '#6B6BBB', [
    { name: 'PPC',             color: '#FFFFFF' },
    { name: 'CP',              color: '#FFFFFF' },
    { name: 'Paid in Advance', color: '#FFFFFF' }
  ], m.bySegment);

  // ── Right column: region breakdown (starts at row 10)
  var rRow = 10;
  _mergeSet(sheet, rRow, 6, 1, 4, 'BY REGION',
    { bg: '#4B4B9B', fg: '#FFFFFF', bold: true, align: 'center' });
  rRow++;

  CONFIG.REGIONS.forEach(function(region) {
    var rd    = m.byRegion[region] || { total: 0, active: 0 };
    var rowBg = rd.total === 0 ? '#FFF0F0' : (rRow % 2 === 0 ? '#F8F8F8' : '#FFFFFF');
    sheet.getRange(rRow, 6)
      .setValue(region).setFontWeight('bold').setFontSize(9).setBackground(rowBg);
    sheet.getRange(rRow, 7)
      .setValue(rd.total).setHorizontalAlignment('center').setFontWeight('bold').setBackground(rowBg);
    sheet.getRange(rRow, 8)
      .setValue(rd.active + ' active')
      .setFontColor(rd.active > 0 ? '#1D8348' : '#AAAAAA').setFontSize(8).setBackground(rowBg);
    rRow++;
  });

  // ── Channel heatmap (below both columns)
  var heatmapStart = Math.max(leftRow, rRow) + 2;
  _renderChannelHeatmap(sheet, m, heatmapStart);

  // ── Timestamp
  var tsRow = heatmapStart + 2 + CONFIG.REGIONS.length;
  sheet.getRange(tsRow, 1, 1, 9).merge();
  sheet.getRange(tsRow, 1)
    .setValue('Updated: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy HH:mm'))
    .setFontSize(8).setFontColor('#999999').setHorizontalAlignment('right');

  sheet.autoResizeColumns(1, 9);
}

// ─── Channel heatmap ──────────────────────────────────────────────────────────

function _renderChannelHeatmap(sheet, m, startRow) {
  var channels = ['Banner', 'PopUp', 'InApp', 'WA', 'Push', 'SMS'];

  // Find max value across all cells for color scaling
  var maxVal = 1;
  CONFIG.REGIONS.forEach(function(r) {
    channels.forEach(function(ch) {
      var v = (m.byChannel[r] || {})[ch] || 0;
      if (v > maxVal) maxVal = v;
    });
  });

  // Section header
  _mergeSet(sheet, startRow, 1, 1, 8, '📢  CHANNEL UTILIZATION HEATMAP',
    { bg: '#B34700', fg: '#FFFFFF', bold: true, align: 'center', size: 11 });

  // Column header row
  sheet.getRange(startRow + 1, 1)
    .setValue('Region').setBackground('#3A3A7A').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center').setFontSize(9);
  channels.forEach(function(ch, i) {
    sheet.getRange(startRow + 1, 2 + i)
      .setValue(ch).setBackground('#3A3A7A').setFontColor('#FFFFFF')
      .setFontWeight('bold').setHorizontalAlignment('center').setFontSize(9);
  });
  sheet.getRange(startRow + 1, 8)
    .setValue('Total').setBackground('#3A3A7A').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center').setFontSize(9);

  // Data rows — one per region
  CONFIG.REGIONS.forEach(function(region, r) {
    var dataRow  = startRow + 2 + r;
    var chData   = m.byChannel[region] || {};
    var rowTotal = channels.reduce(function(sum, ch) { return sum + (chData[ch] || 0); }, 0);
    var rowBg    = r % 2 === 0 ? '#F8F8FF' : '#FFFFFF';

    sheet.getRange(dataRow, 1)
      .setValue(region).setBackground(rowBg).setFontWeight('bold').setFontSize(9)
      .setHorizontalAlignment('right').setVerticalAlignment('middle');

    channels.forEach(function(ch, i) {
      var val       = chData[ch] || 0;
      var intensity = maxVal > 0 ? val / maxVal : 0;
      var bg        = _heatColor(intensity);
      var fg        = intensity > 0.55 ? '#FFFFFF' : '#333333';
      sheet.getRange(dataRow, 2 + i)
        .setValue(val > 0 ? val : '')
        .setBackground(bg).setFontColor(fg)
        .setHorizontalAlignment('center').setFontWeight('bold').setFontSize(9);
    });

    sheet.getRange(dataRow, 8)
      .setValue(rowTotal > 0 ? rowTotal : '')
      .setBackground(rowBg).setFontWeight('bold')
      .setHorizontalAlignment('center').setFontSize(9);
  });
}

/** Interpolate white-grey → dark teal-green based on 0-1 intensity. */
function _heatColor(intensity) {
  if (intensity <= 0) return '#F5F5F5';
  var r = Math.round(245 + (26  - 245) * intensity);
  var g = Math.round(245 + (122 - 245) * intensity);
  var b = Math.round(245 + (85  - 245) * intensity);
  var h = function(n) { return ('0' + Math.max(0, Math.min(255, n)).toString(16)).slice(-2); };
  return '#' + h(r) + h(g) + h(b);
}

/** Return the key with the highest value in a {key: count} map. */
function _topKey(map) {
  var top = null, max = 0;
  Object.keys(map).forEach(function(k) {
    if (map[k] > max) { max = map[k]; top = k; }
  });
  return top;
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function _renderSection(sheet, startRow, col, width, title, headerBg, items, dataMap) {
  _mergeSet(sheet, startRow, col, 1, width, title,
    { bg: headerBg, fg: '#FFFFFF', bold: true, align: 'center' });
  var row = startRow + 1;
  items.forEach(function(item) {
    var count = dataMap[item.name] || 0;
    _mergeSet(sheet, row, col, 1, width - 1, item.name, { bg: item.color, size: 9 });
    sheet.getRange(row, col + width - 1)
      .setValue(count).setFontWeight('bold').setHorizontalAlignment('center')
      .setBackground(item.color);
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
  return CONFIG.REGIONS.filter(function(r) {
    return (m.byRegion[r] || {}).total > 0;
  }).length;
}
