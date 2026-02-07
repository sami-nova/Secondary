/**
 * Key Metrics Weekly Update - Sheet Template Setup and Testing
 *
 * QUICK START:
 * ============
 * 1. Run createKeyMetricsWeeklySheet() to create the template sheet
 * 2. Edit the data in the "Key Metrics Weekly" sheet with your actual values
 * 3. Run testKeyMetricsWeeklyUpdate() to preview the Slack message
 * 4. Set up automation to send automatically (see below)
 *
 * The template includes:
 * - Key Metrics Overview (rows 3-6)
 * - Net Churn by Region (rows 10-23)
 * - Sales Performance by Region (rows 27-40)
 * - Plan vs Fact by Category (rows 44-48)
 */

/**
 * Test function to preview the Key Metrics Weekly Update
 * Run this to see how your message will look in Slack
 */
function testKeyMetricsWeeklyUpdate() {
  const automation = {
    sheetName: "Key Metrics Weekly", // Your sheet name
    channelId: "C01234ABCDE",        // Your Slack channel ID (optional for testing)
    webhookUrl: ""                   // Leave empty for testing
  };

  const message = buildKeyMetricsWeeklyUpdate(automation);

  Logger.log("=== KEY METRICS WEEKLY UPDATE PREVIEW ===");
  Logger.log(JSON.stringify(message, null, 2));

  // Also log a text preview
  Logger.log("\n=== TEXT PREVIEW ===");
  if (message.blocks) {
    message.blocks.forEach(block => {
      if (block.type === "section" && block.text && block.text.text) {
        Logger.log(block.text.text);
        Logger.log("");
      } else if (block.type === "divider") {
        Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }
    });
  }

  Logger.log("✅ Test complete! Check the logs above to see your message preview.");
  Logger.log("\nTo view logs: Click 'View' > 'Logs' in the Apps Script editor");

  return message;
}

/**
 * Quick function to send a test message to Slack
 * Update the webhookUrl before running
 */
function sendTestKeyMetricsToSlack() {
  const automation = {
    sheetName: "Key Metrics Weekly",
    webhookUrl: "YOUR_WEBHOOK_URL_HERE" // ← UPDATE THIS
  };

  if (automation.webhookUrl === "YOUR_WEBHOOK_URL_HERE") {
    Browser.msgBox(
      'Webhook URL Required',
      'Please update the webhookUrl in the sendTestKeyMetricsToSlack() function before running.',
      Browser.Buttons.OK
    );
    return;
  }

  const message = buildKeyMetricsWeeklyUpdate(automation);

  // Send to Slack
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(message),
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(automation.webhookUrl, options);

  if (response.getResponseCode() === 200) {
    Logger.log("✅ Message sent to Slack successfully!");
    Browser.msgBox('Success!', 'Message sent to Slack successfully!', Browser.Buttons.OK);
  } else {
    Logger.log("❌ Error sending message: " + response.getContentText());
    Browser.msgBox('Error', 'Failed to send message. Check the logs for details.', Browser.Buttons.OK);
  }
}

/**
 * Function to verify your sheet structure
 * Run this to check if your data is being read correctly
 */
function verifyKeyMetricsSheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Key Metrics Weekly");

  if (!sheet) {
    Logger.log("❌ ERROR: Sheet 'Key Metrics Weekly' not found!");
    Logger.log("Run createKeyMetricsWeeklySheet() first to create the template.");
    Browser.msgBox(
      'Sheet Not Found',
      'The "Key Metrics Weekly" sheet was not found.\n\nRun createKeyMetricsWeeklySheet() first to create the template.',
      Browser.Buttons.OK
    );
    return;
  }

  Logger.log("✅ Sheet found: " + sheet.getName());
  Logger.log("\n=== VERIFYING DATA RANGES ===\n");

  // Check Overview section
  Logger.log("1. KEY METRICS OVERVIEW (A3:D6):");
  const overviewData = sheet.getRange("A3:D6").getValues();
  overviewData.forEach((row, i) => {
    if (row[0]) {
      Logger.log(`   ${row[0]}: ${row[1]} | Plan: ${row[2]} | Delta: ${row[3]}`);
    }
  });

  // Check Net Churn by Region
  Logger.log("\n2. NET CHURN BY REGION (A10:F23):");
  const netChurnData = sheet.getRange("A10:F23").getValues();
  let netChurnCount = 0;
  netChurnData.forEach((row, i) => {
    if (row[0]) {
      netChurnCount++;
      if (i < 5) { // Show first 5 rows as sample
        Logger.log(`   ${row[0]}: Today ${row[2]} | Plan ${row[4]} | Status ${row[5]}`);
      }
    }
  });
  Logger.log(`   Total regions found: ${netChurnCount}`);

  // Check Sales Performance
  Logger.log("\n3. SALES PERFORMANCE BY REGION (A27:H40):");
  const salesData = sheet.getRange("A27:H40").getValues();
  let salesCount = 0;
  salesData.forEach((row, i) => {
    if (row[0]) {
      salesCount++;
      if (i < 5) { // Show first 5 rows as sample
        Logger.log(`   ${row[0]}: Purch% ${row[4]} | Revenue ${row[5]} | Rev% ${row[7]}`);
      }
    }
  });
  Logger.log(`   Total regions found: ${salesCount}`);

  // Check Plan vs Fact by Category
  Logger.log("\n4. PLAN VS FACT BY CATEGORY (A44:G48):");
  const categoryData = sheet.getRange("A44:G48").getValues();
  let categoryCount = 0;
  categoryData.forEach((row, i) => {
    if (row[0]) {
      categoryCount++;
      Logger.log(`   ${row[0]}: Fact ${row[1]} | Plan ${row[2]} | Purch% ${row[4]}`);
    }
  });
  Logger.log(`   Total categories found: ${categoryCount}`);

  Logger.log("\n✅ Verification complete!");
  Logger.log("\nEverything looks good! Run testKeyMetricsWeeklyUpdate() to preview the Slack message.");

  Browser.msgBox(
    'Verification Complete',
    `Sheet structure verified successfully!\n\n` +
    `Found:\n` +
    `• ${netChurnCount} regions in Net Churn section\n` +
    `• ${salesCount} regions in Sales Performance section\n` +
    `• ${categoryCount} categories\n\n` +
    `Check the logs for detailed data. Next step: Run testKeyMetricsWeeklyUpdate()`,
    Browser.Buttons.OK
  );
}

/**
 * Add this automation to Slack Automation Settings
 * (If you're using the centralized automation system)
 */
function addKeyMetricsToAutomationSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName("Slack Automation Settings");

  if (!settingsSheet) {
    Logger.log("❌ 'Slack Automation Settings' sheet not found.");
    Browser.msgBox(
      'Settings Sheet Not Found',
      'The "Slack Automation Settings" sheet was not found.\n\nYou can manually set up a trigger or webhook to call buildKeyMetricsWeeklyUpdate().',
      Browser.Buttons.OK
    );
    return;
  }

  // Find the next empty row
  const lastRow = settingsSheet.getLastRow();
  const nextRow = lastRow + 1;

  // Add the automation
  settingsSheet.getRange(nextRow, 1, 1, 9).setValues([[
    "Key Metrics Weekly",            // Automation Name
    "Key Metrics Weekly",             // Sheet Name
    "buildKeyMetricsWeeklyUpdate",   // Builder Function
    "YOUR_CHANNEL_ID",                // Channel ID
    "YOUR_WEBHOOK_URL",               // Webhook URL
    "TRUE",                           // Enabled
    "Weekly",                         // Frequency
    "Monday",                         // Day
    "09:00"                           // Time
  ]]);

  Logger.log("✅ Added 'Key Metrics Weekly' automation to settings!");
  Browser.msgBox(
    'Automation Added',
    'The "Key Metrics Weekly" automation has been added to your Slack Automation Settings.\n\n' +
    '⚠️ Don\'t forget to update:\n' +
    '• Channel ID\n' +
    '• Webhook URL\n\n' +
    'Then enable the automation in your settings sheet.',
    Browser.Buttons.OK
  );
}
