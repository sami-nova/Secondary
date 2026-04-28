/**
 * Segment_Config sheet — lets users define REGION_ROW_TEMPLATE from the sheet
 * so segments can be added, removed, or reordered without touching code.
 *
 * Layout: A=Segment | B=Scenario
 *   One row per slot per region. Leave Scenario blank for spacer rows.
 *   After editing: Maintenance → Reload Config, then Setup & Tools → Update Design Only.
 *
 * Public:
 *   setupSegmentConfig()  — create/navigate to the config sheet
 *   (config is READ automatically by _applySheetConfig() on every onOpen/Reload)
 */

var SEGMENT_CONFIG_SHEET = 'Segment_Config';

function setupSegmentConfig() {
  _applySheetConfig(); // make sure CONFIG reflects the current state first
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(SEGMENT_CONFIG_SHEET);

  // Only write defaults if this is the first time (no header yet)
  if (sheet.getRange('A1').getValue() !== 'Segment') {
    var hdr = sheet.getRange(1, 1, 1, 2);
    hdr.setValues([['Segment', 'Scenario']])
       .setBackground('#7B3F9B').setFontColor('#FFFFFF')
       .setFontWeight('bold').setHorizontalAlignment('center')
       .setFontSize(10);
    sheet.setRowHeight(1, 30);

    var defaults = CONFIG.REGION_ROW_TEMPLATE.map(function(tpl) {
      return [tpl.segment, tpl.scenario || ''];
    });
    sheet.getRange(2, 1, defaults.length, 2).setValues(defaults);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 280);

    // Colour every segment cell in column A with its badge colour for clarity
    defaults.forEach(function(row, i) {
      var style = CONFIG.SEGMENT_COLORS[row[0]] || { bg: '#CCCCCC', text: '#333333' };
      sheet.getRange(i + 2, 1)
        .setBackground(style.bg).setFontColor(style.text).setFontWeight('bold');
    });

    sheet.getRange('A1').setNote(
      'How to change segments:\n\n' +
      '• Add a row  → new slot appears in every region\n' +
      '• Delete a row → slot removed (run Clean Orphaned Keys after)\n' +
      '• Leave Scenario blank → spacer / empty row\n\n' +
      'After editing:\n' +
      '1. 🎯 Discount Tracker → 🗃️ Maintenance → 🔄 Reload Config from Sheet\n' +
      '2. 🔧 Setup & Tools → 🎨 Update Design Only (keeps existing data)'
    );
  }

  ss.setActiveSheet(sheet);
  ss.toast(
    'Edit rows here, then Reload Config → Update Design Only to apply.',
    '⚙️ Segment Config', 6
  );
}
