/**
 * Active Users sheet for Monthly Discount Tracker v2.0
 *
 * A Region × Segment matrix the team fills in manually to track
 * how many active users belong to each segment per region.
 * Values are reference-only and do not affect campaign data.
 *
 * Public:
 *   showActiveUsersSheet()   — navigate to the sheet; assign THIS to a button
 *   setupActiveUsersSheet()  — create or fully refresh the sheet layout
 */

var ACTIVE_USERS_SHEET = 'Active_Users';

// ─── Button-assignable navigation function ────────────────────────────────────

/**
 * Assign this function to a drawing button in Main_Input to jump directly
 * to the Active_Users sheet. If the sheet doesn't exist yet it offers to
 * create it on the spot.
 */
function showActiveUsersSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ACTIVE_USERS_SHEET);
  if (!sheet) {
    var resp = SpreadsheetApp.getUi().alert(
      '👥 Active Users',
      'The Active_Users sheet hasn\'t been set up yet.\nCreate it now?',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    if (resp === SpreadsheetApp.getUi().Button.YES) setupActiveUsersSheet();
    return;
  }
  ss.setActiveSheet(sheet);
}

// ─── Setup / refresh ─────────────────────────────────────────────────────────

function setupActiveUsersSheet() {
  _applySheetConfig();
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ACTIVE_USERS_SHEET);

  // Build unique ordered segment list from the current template
  var uniqueSegments = [];
  CONFIG.REGION_ROW_TEMPLATE.forEach(function(tpl) {
    if (tpl.segment && uniqueSegments.indexOf(tpl.segment) < 0) {
      uniqueSegments.push(tpl.segment);
    }
  });

  var colCount = uniqueSegments.length + 1; // +1 for the Region label column

  // Snapshot existing values before clearing (preserve data user already entered)
  var existingVals = {};
  if (sheet.getLastRow() >= 4) {
    var snapshot = sheet.getRange(4, 1, Math.max(sheet.getLastRow() - 3, 1), colCount).getValues();
    snapshot.forEach(function(row) {
      var region = row[0] ? row[0].toString().trim() : '';
      if (!region) return;
      uniqueSegments.forEach(function(seg, s) {
        var key = region + '||' + seg;
        if (row[s + 1] !== '' && row[s + 1] !== 0) existingVals[key] = row[s + 1];
      });
    });
  }

  sheet.clearContents();
  sheet.clearFormats();

  // ── Row 1: title
  sheet.getRange(1, 1, 1, colCount).merge()
    .setValue('👥  ACTIVE USERS BY REGION & SEGMENT')
    .setBackground('#4B4B9B').setFontColor('#FFFFFF')
    .setFontSize(13).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);

  // ── Row 2: instruction strip
  sheet.getRange(2, 1, 1, colCount).merge()
    .setValue('Enter active user counts per region & segment — used for reference only, does not affect campaign data.')
    .setBackground('#E8EAF6').setFontColor('#555').setFontSize(9)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(2, 22);

  // ── Row 3: column headers (Region + one per segment)
  var headers = ['Region'].concat(uniqueSegments);
  var hdrRange = sheet.getRange(3, 1, 1, colCount);
  hdrRange.setValues([headers])
    .setBackground('#6B6BBB').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center')
    .setFontSize(10).setVerticalAlignment('middle');
  sheet.setRowHeight(3, 30);

  // Apply segment badge colour to each header cell
  uniqueSegments.forEach(function(seg, s) {
    var style = CONFIG.SEGMENT_COLORS[seg] || { bg: '#7B7BBB', text: '#FFFFFF' };
    sheet.getRange(3, s + 2).setBackground(style.bg).setFontColor(style.text);
  });

  // ── Rows 4+: one row per region
  CONFIG.REGIONS.forEach(function(region, r) {
    var rowNum = r + 4;
    var regionBg = CONFIG.REGION_COLORS[region] || '#FFFFFF';

    sheet.getRange(rowNum, 1)
      .setValue(region)
      .setBackground(regionBg).setFontWeight('bold').setFontSize(10)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.setRowHeight(rowNum, 28);

    uniqueSegments.forEach(function(seg, s) {
      var cell     = sheet.getRange(rowNum, s + 2);
      var key      = region + '||' + seg;
      var val      = existingVals[key] !== undefined ? existingVals[key] : 0;
      var cellBg   = r % 2 === 0 ? '#FFFFFF' : '#F0F0F8';
      cell.setValue(val)
        .setHorizontalAlignment('center').setVerticalAlignment('middle')
        .setNumberFormat('#,##0').setFontSize(11)
        .setBackground(cellBg);
    });
  });

  // ── Column widths
  sheet.setColumnWidth(1, 90);
  uniqueSegments.forEach(function(seg, s) {
    sheet.setColumnWidth(s + 2, Math.max(90, Math.round(seg.length * 7.5)));
  });

  // ── Freeze header rows
  sheet.setFrozenRows(3);

  ss.setActiveSheet(sheet);
  ss.toast(
    'Active_Users sheet ready — fill in user counts. Assign showActiveUsersSheet to your button.',
    '👥 Done', 6
  );
}
