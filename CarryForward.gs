/**
 * Carry-forward active campaigns for Monthly Discount Tracker v2.0
 *
 * When a campaign has an End Date that reaches into the next month,
 * this feature copies those rows into the new month's sheet (empty rows only).
 *
 * Public entry points:
 *   showCarryForwardDialog()  — menu item, targets the currently active month
 *   _offerCarryForward(month) — called automatically from switchToMonth on new blank month
 */

// ─── Public: menu entry point ─────────────────────────────────────────────────

function showCarryForwardDialog() {
  var targetMonth = getCurrentMonthYear();
  var result      = _findCarryForwardCandidates(targetMonth);

  var ui = SpreadsheetApp.getUi();

  if (result.candidates.length === 0) {
    ui.alert(
      '📋 Carry Forward',
      'No campaigns from previous months have end dates extending into ' + targetMonth + '.',
      ui.ButtonSet.OK
    );
    return;
  }

  // Group candidates by source month for a clear summary
  var byMonth = {};
  result.candidates.forEach(function(c) {
    byMonth[c.sourceMonth] = (byMonth[c.sourceMonth] || 0) + 1;
  });
  var summary = Object.keys(byMonth).map(function(m) {
    return '  • ' + m + ': ' + byMonth[m] + ' campaign(s)';
  }).join('\n');

  var response = ui.alert(
    '📋 Carry Forward Active Campaigns',
    result.candidates.length + ' campaign(s) found whose end dates extend into ' + targetMonth + ':\n\n' +
    summary + '\n\n' +
    'Copy these into empty rows for ' + targetMonth + '?\n' +
    '(Rows that already have data will be skipped.)',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  var count = _applyCarryForward(targetMonth, result.candidates);
  ui.alert(
    '✅ Carry Forward Complete',
    'Filled ' + count.filled + ' row(s) for ' + targetMonth + '.' +
    (count.skipped > 0 ? '\n' + count.skipped + ' row(s) skipped (already had data).' : ''),
    ui.ButtonSet.OK
  );
}

// ─── Internal: called from switchToMonth on a fresh blank month ───────────────

/**
 * Offer to carry forward only if there are matching candidates.
 * Keeps the dialog chain short — does nothing when no candidates exist.
 */
function _offerCarryForward(targetMonth) {
  var result = _findCarryForwardCandidates(targetMonth);
  if (result.candidates.length === 0) return;

  var ui       = SpreadsheetApp.getUi();
  var response = ui.alert(
    '📋 Carry Forward Active Campaigns?',
    result.candidates.length + ' campaign(s) from previous months have end dates\n' +
    'that extend into ' + targetMonth + '.\n\n' +
    'Pre-fill those empty rows now?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  var count = _applyCarryForward(targetMonth, result.candidates);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Carried forward ' + count.filled + ' campaign(s)' +
    (count.skipped > 0 ? ' · ' + count.skipped + ' already filled' : '') + '.',
    '📋 Done', 5
  );
}

// ─── Core: find candidates ────────────────────────────────────────────────────

/**
 * Scan Data_Store for rows (not from targetMonth) whose End Date >= first of targetMonth.
 * For each Region|Segment|Scenario combo that matches multiple stored months,
 * keep the most recently stored version so the latest campaign config is used.
 *
 * Returns { candidates: [ { region, segment, scenario, data, sourceMonth } ] }
 */
function _findCarryForwardCandidates(targetMonth) {
  var dsSheet = getDataStore();
  if (!dsSheet || dsSheet.getLastRow() < 2) return { candidates: [] };

  var targetDate = parseMonthYear(targetMonth);
  if (!targetDate) return { candidates: [] };

  var numDataCols  = CONFIG.COLUMNS.NOTES - CONFIG.COLUMNS.DISCOUNT + 1; // D-P = 13 cols
  var stored       = dsSheet.getRange(2, 1, dsSheet.getLastRow() - 1, 5 + numDataCols).getValues();
  // Row layout: Key(0) | Month(1) | Region(2) | Segment(3) | Scenario(4) | data[5+]
  // data slice offsets (0-based from DISCOUNT column):
  //   0=Discount  1=PromoCode  2=Condition  3=Status  4=StartDate  5=EndDate  6-11=Channels  12=Notes

  var endDateOffset  = CONFIG.COLUMNS.END_DATE   - CONFIG.COLUMNS.DISCOUNT; // = 5
  var discountOffset = 0;
  var promoOffset    = 1;

  // best[comboKey] = { sourceDate, sourceMonth, data, region, segment, scenario }
  var best = {};

  stored.forEach(function(row) {
    var month    = row[1] ? row[1].toString().trim() : '';
    var region   = row[2] ? row[2].toString().trim() : '';
    var segment  = row[3] ? row[3].toString().trim() : '';
    var scenario = row[4] ? row[4].toString().trim() : '';

    if (!month || !region) return;
    if (month === targetMonth) return; // skip target month's own rows

    var data    = row.slice(5);
    var endDate = data[endDateOffset];

    // Require a valid end date that reaches into targetMonth
    if (!endDate) return;
    var endD = endDate instanceof Date ? endDate : new Date(endDate);
    if (isNaN(endD.getTime())) return;
    if (endD < targetDate) return;

    // Require at least Discount % or Promo Code to be filled
    if (!data[discountOffset] && !data[promoOffset]) return;

    var comboKey   = region + '||' + segment + '||' + scenario;
    var sourceDate = parseMonthYear(month);
    if (!sourceDate) return;

    // Keep the most recent source month so we get the latest version of the campaign
    if (!best[comboKey] || sourceDate > best[comboKey].sourceDate) {
      best[comboKey] = {
        sourceDate:  sourceDate,
        sourceMonth: month,
        data:        data,
        region:      region,
        segment:     segment,
        scenario:    scenario
      };
    }
  });

  return { candidates: Object.keys(best).map(function(k) { return best[k]; }) };
}

// ─── Core: apply carry-forward ────────────────────────────────────────────────

/**
 * Write carry-forward data into empty rows of Main_Input.
 * A row is considered empty if both Discount % AND Promo Code are blank.
 * Returns { filled: N, skipped: M }
 */
function _applyCarryForward(targetMonth, candidates) {
  var mainSheet   = getMainSheet();
  var numDataCols = CONFIG.COLUMNS.NOTES - CONFIG.COLUMNS.DISCOUNT + 1;
  var totalRows   = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;

  // Snapshot current data columns to detect pre-filled rows
  var currentData = mainSheet.getRange(
    CONFIG.DATA_START_ROW, CONFIG.COLUMNS.DISCOUNT, totalRows, numDataCols
  ).getValues();

  var filled  = 0;
  var skipped = 0;

  candidates.forEach(function(c) {
    var regionIdx = CONFIG.REGIONS.indexOf(c.region);
    if (regionIdx < 0) return;

    var tplIdx = -1;
    CONFIG.REGION_ROW_TEMPLATE.forEach(function(tpl, t) {
      if (tpl.segment === c.segment && tpl.scenario === c.scenario && tplIdx < 0) tplIdx = t;
    });
    if (tplIdx < 0) return;

    var rowOffset = regionIdx * CONFIG.ROWS_PER_REGION + tplIdx;
    var existing  = currentData[rowOffset];

    // Skip if Discount % OR Promo Code already has a value
    if (existing[0] || existing[1]) {
      skipped++;
      return;
    }

    var rowNum = CONFIG.DATA_START_ROW + rowOffset;
    mainSheet.getRange(rowNum, CONFIG.COLUMNS.DISCOUNT, 1, c.data.length).setValues([c.data]);
    filled++;
  });

  if (filled > 0) {
    _auditLog('CARRY_FORWARD',
      targetMonth + ' — ' + filled + ' row(s) copied from previous months');
  }

  return { filled: filled, skipped: skipped };
}
