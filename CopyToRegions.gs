/**
 * Copy a single row's campaign data from one region to all (or selected) other regions.
 * Opens an HTML sidebar with dropdowns for source region, segment/scenario, and target checkboxes.
 */

function showCopyToAllRegionsDialog() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile('CopyToRegions')
      .setTitle('📋 Copy Campaign to Regions')
      .setWidth(300)
  );
}

/** Called by the sidebar on load — returns all config options needed to populate the UI. */
function getCopyToRegionsOptions() {
  _applySheetConfig();
  return {
    regions: CONFIG.REGIONS,
    rows: CONFIG.REGION_ROW_TEMPLATE.map(function(tpl, t) {
      return {
        index:    t,
        segment:  tpl.segment,
        scenario: tpl.scenario,
        label:    tpl.scenario
          ? tpl.segment + ' — ' + tpl.scenario
          : tpl.segment + ' — (blank row)'
      };
    })
  };
}

/**
 * Execute the copy.
 * @param {string}   sourceRegion   Region to copy data FROM
 * @param {number}   rowIndex       REGION_ROW_TEMPLATE index of the row to copy
 * @param {string[]} targetRegions  Regions to copy data INTO
 * @param {boolean}  overwrite      If false, skip target rows that already have data
 * @returns {{ filled, skipped, error }}
 */
function executeCopyToAllRegions(sourceRegion, rowIndex, targetRegions, overwrite) {
  _applySheetConfig();
  var mainSheet   = getMainSheet();
  if (!mainSheet) return { error: 'Main_Input sheet not found.' };

  var numDataCols = CONFIG.COLUMNS.NOTES - CONFIG.COLUMNS.DISCOUNT + 1;
  var totalRows   = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  var tpl         = CONFIG.REGION_ROW_TEMPLATE[rowIndex];
  if (!tpl) return { error: 'Invalid row index: ' + rowIndex };

  var srcRegionIdx = CONFIG.REGIONS.indexOf(sourceRegion);
  if (srcRegionIdx < 0) return { error: 'Source region not found.' };

  // Read source row data
  var srcRow  = CONFIG.DATA_START_ROW + srcRegionIdx * CONFIG.ROWS_PER_REGION + rowIndex;
  var srcData = mainSheet.getRange(srcRow, CONFIG.COLUMNS.DISCOUNT, 1, numDataCols).getValues()[0];
  if (!srcData[0] && !srcData[1]) {
    return { error: 'Source row is empty — nothing to copy.' };
  }

  // Snapshot current data to detect already-filled rows
  var currentData = mainSheet.getRange(
    CONFIG.DATA_START_ROW, CONFIG.COLUMNS.DISCOUNT, totalRows, numDataCols
  ).getValues();

  var filled  = 0;
  var skipped = 0;

  targetRegions.forEach(function(targetRegion) {
    if (targetRegion === sourceRegion) return;
    var tgtIdx = CONFIG.REGIONS.indexOf(targetRegion);
    if (tgtIdx < 0) return;

    var rowOffset = tgtIdx * CONFIG.ROWS_PER_REGION + rowIndex;
    var existing  = currentData[rowOffset];

    if (!overwrite && (existing[0] || existing[1])) {
      skipped++;
      return;
    }

    mainSheet.getRange(
      CONFIG.DATA_START_ROW + rowOffset, CONFIG.COLUMNS.DISCOUNT, 1, numDataCols
    ).setValues([srcData]);
    filled++;
  });

  if (filled > 0) {
    _auditLog('COPY_TO_REGIONS',
      tpl.segment + ' / ' + (tpl.scenario || '(blank)') +
      ': ' + sourceRegion + ' → ' + targetRegions.join(', '));
  }

  return { filled: filled, skipped: skipped };
}
