/**
 * CREATE MANAGER TAGS SHEET
 * Creates a sheet where you can map manager names to Slack user IDs for tagging
 */
function createManagerTagsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check if sheet already exists
  let sheet = ss.getSheetByName("Manager Tags");
  if (sheet) {
    const response = SpreadsheetApp.getUi().alert(
      'Sheet Exists',
      'A sheet named "Manager Tags" already exists. Do you want to recreate it?\n\nWARNING: This will delete all existing data!',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );

    if (response === SpreadsheetApp.getUi().Button.YES) {
      ss.deleteSheet(sheet);
    } else {
      return;
    }
  }

  // Create new sheet
  sheet = ss.insertSheet("Manager Tags");

  // Header
  sheet.getRange("A1").setValue("👥 MANAGER SLACK ID MAPPING");
  sheet.getRange("A1:B1").merge();
  sheet.getRange("A1:B1").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(14);

  // Column headers
  const headers = ["Manager Name", "Slack User ID"];
  sheet.getRange("A2:B2").setValues([headers]);
  sheet.getRange("A2:B2").setBackground("#81C784").setFontColor("white").setFontWeight("bold");

  // Sample data with instructions
  const sampleData = [
    ["John Smith", "U1234567890"],
    ["Sarah Johnson", "U0987654321"],
    ["Sami", "U1122334455"],
    ["", ""],
    ["INSTRUCTIONS:", ""],
    ["1. Enter manager names EXACTLY as they appear in your leaderboard sheet", ""],
    ["2. Get Slack User IDs: Right-click user in Slack → View profile → More → Copy member ID", ""],
    ["3. Slack User IDs start with 'U' and are 11 characters long", ""],
    ["4. Use @ManagerName in your leaderboard Manager Name column to enable tagging", ""],
    ["5. Example: Enter '@Sami' in the sheet, it will tag the Slack user", ""]
  ];
  sheet.getRange("A3:B12").setValues(sampleData);

  // Formatting
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 200);
  sheet.getRange("A2:B12").setBorder(true, true, true, true, true, true);

  // Highlight instruction rows
  sheet.getRange("A7:B12").setBackground("#E8F5E9");

  Logger.log("✓ Manager Tags sheet created successfully!");

  SpreadsheetApp.getUi().alert(
    'Success!',
    'The "Manager Tags" sheet has been created!\n\n' +
    'To enable tagging:\n' +
    '1. Add manager names and their Slack User IDs to this sheet\n' +
    '2. In your leaderboard, use @ManagerName (e.g., @Sami) in the Manager Name column\n' +
    '3. The automation will automatically tag them in Slack!',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
