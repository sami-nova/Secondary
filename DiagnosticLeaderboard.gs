/**
 * DIAGNOSTIC FUNCTION - Shows EXACT cell contents from Weekly Leaderboard sheet
 * Run this to see what's actually in your sheet cells
 */
function diagnoseLeaderboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Weekly Leaderboard");

  if (!sheet) {
    Logger.log("ERROR: Weekly Leaderboard sheet not found!");
    return;
  }

  Logger.log("=".repeat(80));
  Logger.log("DIAGNOSTIC: Reading EXACT cell contents from Weekly Leaderboard");
  Logger.log("=".repeat(80));

  // Read all data sections
  const churnCurrentData = sheet.getRange("A3:F5").getValues();
  const churnOldData = sheet.getRange("A9:F11").getValues();
  const killerCurrentData = sheet.getRange("A15:F17").getValues();
  const killerOldData = sheet.getRange("A21:F23").getValues();

  Logger.log("\n📋 CHURN PREVENTION - CURRENT BASE (A3:F5):");
  churnCurrentData.forEach((row, idx) => {
    Logger.log(`\nRow ${idx + 1}:`);
    Logger.log(`  Week: "${row[0]}"`);
    Logger.log(`  Rank: "${row[1]}"`);
    Logger.log(`  Manager Name (COLUMN C): "${row[2]}"`);
    Logger.log(`  Sales: "${row[3]}"`);
    Logger.log(`  Cash: "${row[4]}"`);
    Logger.log(`  Region: "${row[5]}"`);

    // Show character codes to detect hidden characters
    if (row[2]) {
      const managerName = String(row[2]);
      Logger.log(`  Manager Name LENGTH: ${managerName.length} characters`);
      Logger.log(`  Manager Name CHAR CODES: ${Array.from(managerName).map(c => c.charCodeAt(0)).join(', ')}`);

      // Check for specific problematic text
      if (managerName.toLowerCase().includes('private')) {
        Logger.log(`  ⚠️ WARNING: Contains "private"!`);
      }
      if (managerName.toLowerCase().includes('channel')) {
        Logger.log(`  ⚠️ WARNING: Contains "channel"!`);
      }
      if (managerName.includes('🔒')) {
        Logger.log(`  ⚠️ WARNING: Contains lock emoji 🔒!`);
      }
    }
  });

  Logger.log("\n📋 CHURN PREVENTION - OLD BASE (A9:F11):");
  churnOldData.forEach((row, idx) => {
    Logger.log(`\nRow ${idx + 1}:`);
    Logger.log(`  Week: "${row[0]}"`);
    Logger.log(`  Rank: "${row[1]}"`);
    Logger.log(`  Manager Name (COLUMN C): "${row[2]}"`);
    Logger.log(`  Sales: "${row[3]}"`);
    Logger.log(`  Cash: "${row[4]}"`);
    Logger.log(`  Region: "${row[5]}"`);

    if (row[2]) {
      const managerName = String(row[2]);
      Logger.log(`  Manager Name LENGTH: ${managerName.length} characters`);

      if (managerName.toLowerCase().includes('private')) {
        Logger.log(`  ⚠️ WARNING: Contains "private"!`);
      }
      if (managerName.toLowerCase().includes('channel')) {
        Logger.log(`  ⚠️ WARNING: Contains "channel"!`);
      }
    }
  });

  Logger.log("\n📋 KILLER BASE - CURRENT BASE (A15:F17):");
  killerCurrentData.forEach((row, idx) => {
    Logger.log(`\nRow ${idx + 1}:`);
    Logger.log(`  Manager Name (COLUMN C): "${row[2]}"`);

    if (row[2]) {
      const managerName = String(row[2]);
      if (managerName.toLowerCase().includes('private') || managerName.toLowerCase().includes('channel')) {
        Logger.log(`  ⚠️ WARNING: Contains problematic text!`);
      }
    }
  });

  Logger.log("\n📋 KILLER BASE - OLD BASE (A21:F23):");
  killerOldData.forEach((row, idx) => {
    Logger.log(`\nRow ${idx + 1}:`);
    Logger.log(`  Manager Name (COLUMN C): "${row[2]}"`);

    if (row[2]) {
      const managerName = String(row[2]);
      if (managerName.toLowerCase().includes('private') || managerName.toLowerCase().includes('channel')) {
        Logger.log(`  ⚠️ WARNING: Contains problematic text!`);
      }
    }
  });

  Logger.log("\n" + "=".repeat(80));
  Logger.log("DIAGNOSTIC COMPLETE - Check output above");
  Logger.log("If you see 'private channel' in any Manager Name fields, it IS in your sheet!");
  Logger.log("If you DON'T see it, then the problem is in the message building code.");
  Logger.log("=".repeat(80));
}

/**
 * DIAGNOSTIC FUNCTION 2 - Test the actual message building
 * This will show you EXACTLY what gets sent to Slack
 */
function diagnoseMessageBuilding() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Weekly Leaderboard");

  if (!sheet) {
    Logger.log("ERROR: Weekly Leaderboard sheet not found!");
    return;
  }

  Logger.log("=".repeat(80));
  Logger.log("DIAGNOSTIC: Testing message building code");
  Logger.log("=".repeat(80));

  // Read first row of data
  const churnCurrentData = sheet.getRange("A3:F5").getValues();
  const firstRow = churnCurrentData[0];

  Logger.log("\nRAW DATA from sheet:");
  Logger.log(`  row[2] (Manager Name): "${firstRow[2]}"`);

  // Test cleanSheetData function
  Logger.log("\nTesting cleanSheetData function:");
  const cleaned = cleanSheetData(firstRow[2]);
  Logger.log(`  After cleaning: "${cleaned}"`);

  // Build the actual text that goes to Slack
  const rank = firstRow[1];
  const managerName = cleanSheetData(firstRow[2]);
  const sales = firstRow[3];
  const cashGenerated = firstRow[4];
  const region = cleanSheetData(firstRow[5]);

  const rankEmoji = getRankEmoji(rank);
  const regionEmoji = region ? getRegionSlackEmoji(region) : "";

  let slackText = `${rankEmoji} *#${rank} ${managerName}*\n`;
  slackText += `   └ ${sales} sales | 💰 ${cashGenerated}`;
  if (region) {
    slackText += ` | ${regionEmoji} ${region}`;
  }

  Logger.log("\nFINAL SLACK TEXT:");
  Logger.log(slackText);

  Logger.log("\n" + "=".repeat(80));
  Logger.log("Check if 'private channel' appears in the FINAL SLACK TEXT above");
  Logger.log("=".repeat(80));
}
