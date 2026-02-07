/**
 * Key Metrics Weekly Update - Sheet Template Setup
 *
 * This file helps you set up the sheet structure for the Key Metrics Weekly Update
 *
 * CONFIGURATION GUIDE:
 * ====================
 *
 * The automation reads from a sheet named "Net Churn Weekly" (configurable)
 *
 * IMPORTANT: You need to adjust the cell ranges in KeyMetricsWeeklyBuilder.gs
 * to match your actual sheet structure!
 *
 * Current default ranges (CHANGE THESE to match your sheet):
 * -----------------------------------------------------------
 *
 * 1. KEY METRICS OVERVIEW (Section 1):
 *    - Net Churn Total (Today): C2
 *    - Net Churn Plan: D2
 *    - ARPU Secondary: C3
 *    - ARPU WoW: D3
 *    - Purchase %: C4
 *    - Total Revenue: C5
 *
 * 2. NET CHURN BY REGION (Section 2):
 *    - Data Range: A2:F15
 *    - Columns: A=Region, B=Last week, C=Today, D=Forecast, E=Plan, F=Status Icon (optional)
 *
 * 3. SALES PERFORMANCE BY REGION (Section 3):
 *    - Data Range: A20:J35
 *    - Columns: A=region_code, E=Purch%, F=fact_revenue, G=plan_revenue, I=Revenue%
 *
 * 4. PLAN VS FACT BY CATEGORY (Section 4):
 *    - Data Range: A40:J45
 *    - Columns: A=category, B=fact_purchase, C=plan_purchase, E=Purch%, F=fact_revenue, G=plan_revenue
 *
 * HOW TO CUSTOMIZE:
 * =================
 *
 * 1. Open KeyMetricsWeeklyBuilder.gs
 * 2. Find the functions:
 *    - readKeyMetricsOverview()
 *    - readNetChurnByRegion()
 *    - readSalesPerformanceByRegion()
 *    - readPlanFactByCategory()
 * 3. Update the cell ranges to match YOUR sheet structure
 * 4. Test using testKeyMetricsWeeklyUpdate()
 */

/**
 * Test function to preview the Key Metrics Weekly Update
 * Run this to see how your message will look in Slack
 */
function testKeyMetricsWeeklyUpdate() {
  const automation = {
    sheetName: "Net Churn Weekly", // Change this to your sheet name
    channelId: "C01234ABCDE",      // Your Slack channel ID (optional for testing)
    webhookUrl: ""                 // Leave empty for testing
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
      }
    });
  }

  Logger.log("✅ Test complete! Check the logs above to see your message preview.");
  return message;
}

/**
 * Function to verify your sheet structure
 * Run this to check if your ranges are correct
 */
function verifySheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Net Churn Weekly"); // Change to your sheet name

  if (!sheet) {
    Logger.log("❌ ERROR: Sheet 'Net Churn Weekly' not found!");
    Logger.log("Available sheets:");
    ss.getSheets().forEach(s => Logger.log("  - " + s.getName()));
    return;
  }

  Logger.log("✅ Sheet found: " + sheet.getName());
  Logger.log("\n=== VERIFYING DATA RANGES ===\n");

  // Check Overview section
  Logger.log("1. KEY METRICS OVERVIEW:");
  Logger.log("   Net Churn Total (C2): " + sheet.getRange("C2").getValue());
  Logger.log("   Net Churn Plan (D2): " + sheet.getRange("D2").getValue());
  Logger.log("   ARPU Secondary (C3): " + sheet.getRange("C3").getValue());
  Logger.log("   Purchase % (C4): " + sheet.getRange("C4").getValue());
  Logger.log("   Total Revenue (C5): " + sheet.getRange("C5").getValue());

  // Check Net Churn by Region
  Logger.log("\n2. NET CHURN BY REGION (A2:F15):");
  const netChurnData = sheet.getRange("A2:F15").getValues();
  let netChurnCount = 0;
  netChurnData.forEach((row, i) => {
    if (row[0] && row[0] !== "Region") {
      netChurnCount++;
      if (i < 3) { // Show first 3 rows as sample
        Logger.log(`   Row ${i + 2}: ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]}`);
      }
    }
  });
  Logger.log(`   Total regions found: ${netChurnCount}`);

  // Check Sales Performance
  Logger.log("\n3. SALES PERFORMANCE BY REGION (A20:J35):");
  const salesData = sheet.getRange("A20:J35").getValues();
  let salesCount = 0;
  salesData.forEach((row, i) => {
    if (row[0] && row[0] !== "region_code" && row[0] !== "Total") {
      salesCount++;
      if (i < 3) { // Show first 3 rows as sample
        Logger.log(`   Row ${i + 20}: ${row[0]} | Purch%: ${row[4]} | Revenue: ${row[5]}`);
      }
    }
  });
  Logger.log(`   Total regions found: ${salesCount}`);

  // Check Plan vs Fact by Category
  Logger.log("\n4. PLAN VS FACT BY CATEGORY (A40:J45):");
  const categoryData = sheet.getRange("A40:J45").getValues();
  let categoryCount = 0;
  categoryData.forEach((row, i) => {
    if (row[0] && row[0] !== "category" && row[0] !== "Total") {
      categoryCount++;
      Logger.log(`   Row ${i + 40}: ${row[0]} | Fact: ${row[1]} | Plan: ${row[2]} | %: ${row[4]}`);
    }
  });
  Logger.log(`   Total categories found: ${categoryCount}`);

  Logger.log("\n✅ Verification complete!");
  Logger.log("\nIf any ranges look incorrect, update them in KeyMetricsWeeklyBuilder.gs");
}

/**
 * Quick setup function to add this automation to your Slack Automation Settings
 * (If you're using the centralized automation system from SlackAutomationBuilder.gs)
 */
function addKeyMetricsToAutomationSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName("Slack Automation Settings");

  if (!settingsSheet) {
    Logger.log("❌ 'Slack Automation Settings' sheet not found.");
    Logger.log("You'll need to manually set up the automation trigger.");
    return;
  }

  // Find the next empty row
  const lastRow = settingsSheet.getLastRow();
  const nextRow = lastRow + 1;

  // Add the automation
  settingsSheet.getRange(nextRow, 1, 1, 9).setValues([[
    "Key Metrics Weekly",           // Automation Name
    "Net Churn Weekly",              // Sheet Name
    "buildKeyMetricsWeeklyUpdate",  // Builder Function
    "YOUR_CHANNEL_ID",               // Channel ID
    "YOUR_WEBHOOK_URL",              // Webhook URL
    "TRUE",                          // Enabled
    "Weekly",                        // Frequency
    "Monday",                        // Day
    "09:00"                          // Time
  ]]);

  Logger.log("✅ Added 'Key Metrics Weekly' automation to settings!");
  Logger.log("⚠️ Don't forget to update the Channel ID and Webhook URL!");
}
