/**
 * CHANNEL TAGS SETUP
 * Creates and manages the Channel Tags sheet for channel mentions
 */

/**
 * CREATE CHANNEL TAGS SHEET
 * Run this once to create the Channel Tags sheet
 */
function createChannelTagsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check if sheet already exists
  let sheet = ss.getSheetByName("Channel Tags");

  if (sheet) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Sheet Already Exists',
      'The "Channel Tags" sheet already exists. Do you want to recreate it?\n\nWARNING: This will delete all existing data!',
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      ss.deleteSheet(sheet);
    } else {
      Logger.log("❌ Setup cancelled - sheet already exists");
      return;
    }
  }

  // Create new sheet
  sheet = ss.insertSheet("Channel Tags");

  // ============================================
  // HEADER
  // ============================================
  sheet.getRange("A1").setValue("📺 CHANNEL TAGS - SLACK CHANNEL MENTION MAPPINGS");
  sheet.getRange("A1:B1").merge();
  sheet.getRange("A1:B1").setBackground("#5865F2").setFontColor("white").setFontWeight("bold").setFontSize(14);

  // ============================================
  // COLUMN HEADERS
  // ============================================
  const headers = ["Channel Name", "Slack Channel ID"];
  sheet.getRange("A2:B2").setValues([headers]);
  sheet.getRange("A2:B2").setBackground("#7289DA").setFontColor("white").setFontWeight("bold");

  // ============================================
  // SAMPLE DATA
  // ============================================
  const sampleData = [
    ["general", "C01234ABCDE"],
    ["announcements", "C56789FGHIJ"],
    ["sales-team", "C98765KLMNO"],
    ["leaderboard", "C11111PQRST"]
  ];

  sheet.getRange("A3:B6").setValues(sampleData);

  // ============================================
  // FORMATTING
  // ============================================
  sheet.setColumnWidth(1, 200);  // Channel Name
  sheet.setColumnWidth(2, 200);  // Slack Channel ID

  // Add borders
  sheet.getRange("A2:B6").setBorder(true, true, true, true, true, true);

  // Freeze header rows
  sheet.setFrozenRows(2);

  // ============================================
  // INSTRUCTIONS
  // ============================================
  sheet.getRange("A8").setValue("📋 INSTRUCTIONS:");
  sheet.getRange("A8").setFontWeight("bold").setBackground("#E8F4F8");

  const instructions = [
    [""],
    ["1. Replace sample data with your actual Slack channels"],
    ["2. Channel Name: The name you want to type (e.g., 'general', 'sales-team')"],
    ["3. Slack Channel ID: The channel's ID starting with 'C'"],
    [""],
    ["HOW TO GET SLACK CHANNEL ID:"],
    ["• Open Slack, right-click on the channel name"],
    ["• Select 'Copy link'"],
    ["• The ID is at the end of the URL (starts with C, like C01234ABCDE)"],
    ["• Or: Click channel name → More → Copy channel ID"],
    [""],
    ["USAGE IN LEADERBOARD:"],
    ["• Type #channel-name in your sheet (e.g., #general, #sales-team)"],
    ["• It will automatically convert to a clickable channel mention in Slack"],
    ["• Example: 'Check #general for updates' → clickable channel link"],
    [""],
    ["NOTES:"],
    ["• Channel IDs must start with 'C' and be at least 9 characters"],
    ["• Channel names are case-insensitive (general = General = GENERAL)"],
    ["• Use hyphens or underscores in channel names (e.g., 'sales-team')"]
  ];

  sheet.getRange(9, 1, instructions.length, 1).setValues(instructions);
  sheet.getRange("A9:A27").setWrap(true);

  Logger.log("✅ Channel Tags sheet created successfully!");

  SpreadsheetApp.getUi().alert(
    '✅ Channel Tags Sheet Created!',
    'The "Channel Tags" sheet has been created.\n\n' +
    'Next steps:\n' +
    '1. Replace sample data with your actual Slack channels\n' +
    '2. Get Channel IDs from Slack (right-click channel → Copy link)\n' +
    '3. Use #channel-name in your leaderboard to create mentions\n\n' +
    'Now you can tag both managers (@name) and channels (#name)!',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * TEST CHANNEL MENTIONS
 * Test if channel mentions are working
 */
function testChannelMentions() {
  const testText = "Check out #general for updates! Also see #sales-team and message @John Smith";

  Logger.log("Original text: " + testText);

  const processed = processManagerMentions(testText);

  Logger.log("Processed text: " + processed);
  Logger.log("\n✅ Test complete! Check the logs to see if channels and managers were converted.");
}
