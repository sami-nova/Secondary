/**
 * WEEKLY LEADERBOARD TEMPLATE & AUTOMATION
 *
 * This file contains:
 * 1. Sheet template structure
 * 2. Automated leaderboard formatting
 * 3. Slack message builder with visual enhancements
 *
 * SHEET STRUCTURE:
 * Create a sheet named "Weekly Leaderboard" with these columns:
 *
 * SECTION 1: Churn Prevention Leaderboard
 * Columns: Week | Manager Name | Wins | Change | Region
 *
 * SECTION 2: Killer Base Leaderboard
 * Columns: Week | Manager Name | Wins | Change | Region
 *
 * SECTION 3: Regional Performance
 * Columns: Week | Region | Total Wins | Churn Wins | Killer Wins | Top Manager
 */

/**
 * CREATE LEADERBOARD SHEET TEMPLATE
 * Run this once to create the template sheet structure
 */
function createLeaderboardTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check if sheet already exists
  let sheet = ss.getSheetByName("Weekly Leaderboard");
  if (sheet) {
    const response = SpreadsheetApp.getUi().alert(
      'Sheet Already Exists',
      'A sheet named "Weekly Leaderboard" already exists. Do you want to recreate it?\n\nWARNING: This will delete all existing data!',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );

    if (response === SpreadsheetApp.getUi().Button.YES) {
      ss.deleteSheet(sheet);
    } else {
      return;
    }
  }

  // Create new sheet
  sheet = ss.insertSheet("Weekly Leaderboard");

  // Set up the structure
  const currentWeek = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");

  // ============================================
  // SECTION 1: Churn Prevention Top 5
  // ============================================
  sheet.getRange("A1").setValue("🏆 CHURN PREVENTION LEADERBOARD - TOP 5");
  sheet.getRange("A1:F1").merge();
  sheet.getRange("A1:F1").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const churnHeaders = ["Week", "Rank", "Manager Name", "Wins", "Change vs Last Week", "Region"];
  sheet.getRange("A2:F2").setValues([churnHeaders]);
  sheet.getRange("A2:F2").setBackground("#E8F5E9").setFontWeight("bold");

  // Sample data for Churn Prevention
  const churnSampleData = [
    [currentWeek, 1, "John Smith", 45, "+5", "NA"],
    [currentWeek, 2, "Sarah Johnson", 42, "+8", "EMEA"],
    [currentWeek, 3, "Mike Chen", 38, "-2", "APAC"],
    [currentWeek, 4, "Emily Davis", 35, "+12", "LATAM"],
    [currentWeek, 5, "David Wilson", 33, "+3", "NA"]
  ];
  sheet.getRange("A3:F7").setValues(churnSampleData);

  // ============================================
  // SECTION 2: Killer Base Top 5
  // ============================================
  sheet.getRange("A9").setValue("💪 KILLER BASE LEADERBOARD - TOP 5");
  sheet.getRange("A9:F9").merge();
  sheet.getRange("A9:F9").setBackground("#2196F3").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const killerHeaders = ["Week", "Rank", "Manager Name", "Wins", "Change vs Last Week", "Region"];
  sheet.getRange("A10:F10").setValues([killerHeaders]);
  sheet.getRange("A10:F10").setBackground("#E3F2FD").setFontWeight("bold");

  // Sample data for Killer Base
  const killerSampleData = [
    [currentWeek, 1, "Lisa Anderson", 52, "+7", "EMEA"],
    [currentWeek, 2, "Tom Brown", 48, "+4", "NA"],
    [currentWeek, 3, "Anna Martinez", 44, "+6", "LATAM"],
    [currentWeek, 4, "James Lee", 41, "-1", "APAC"],
    [currentWeek, 5, "Rachel Green", 39, "+9", "EMEA"]
  ];
  sheet.getRange("A11:F15").setValues(killerSampleData);

  // ============================================
  // SECTION 3: Regional Performance
  // ============================================
  sheet.getRange("A17").setValue("🌍 REGIONAL PERFORMANCE SUMMARY");
  sheet.getRange("A17:F17").merge();
  sheet.getRange("A17:F17").setBackground("#FF9800").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const regionHeaders = ["Week", "Region", "Total Wins", "Churn Wins", "Killer Wins", "Top Manager"];
  sheet.getRange("A18:F18").setValues([regionHeaders]);
  sheet.getRange("A18:F18").setBackground("#FFF3E0").setFontWeight("bold");

  // Sample regional data
  const regionSampleData = [
    [currentWeek, "NA", 156, 78, 78, "John Smith"],
    [currentWeek, "EMEA", 143, 67, 76, "Lisa Anderson"],
    [currentWeek, "APAC", 128, 62, 66, "Mike Chen"],
    [currentWeek, "LATAM", 112, 54, 58, "Anna Martinez"]
  ];
  sheet.getRange("A19:F22").setValues(regionSampleData);

  // ============================================
  // Formatting and Instructions
  // ============================================

  // Set column widths
  sheet.setColumnWidth(1, 100); // Week
  sheet.setColumnWidth(2, 60);  // Rank
  sheet.setColumnWidth(3, 150); // Manager Name
  sheet.setColumnWidth(4, 80);  // Wins
  sheet.setColumnWidth(5, 150); // Change
  sheet.setColumnWidth(6, 100); // Region

  // Add borders
  sheet.getRange("A2:F7").setBorder(true, true, true, true, true, true);
  sheet.getRange("A10:F15").setBorder(true, true, true, true, true, true);
  sheet.getRange("A18:F22").setBorder(true, true, true, true, true, true);

  // Add instructions sheet
  const instructionSheet = ss.getSheetByName("Leaderboard Instructions") || ss.insertSheet("Leaderboard Instructions");

  const instructions = [
    ["📊 WEEKLY LEADERBOARD - INSTRUCTIONS"],
    [""],
    ["HOW TO UPDATE WEEKLY:"],
    ["1. Update the 'Week' column with current week (format: 2026-W04)"],
    ["2. Update Manager Names and their Wins in each section"],
    ["3. Update 'Change vs Last Week' (use +5, -2, etc.)"],
    ["4. Update Regional Performance data"],
    ["5. The Slack automation will automatically format and send"],
    [""],
    ["AUTOMATION SETUP:"],
    ["1. Go to Slack Automation Scheduler"],
    ["2. Create new automation with trigger: Bulk Criteria"],
    ["3. Select sheet: 'Weekly Leaderboard'"],
    ["4. For Churn Prevention: Filter rows 3-7 (Rank 1-5)"],
    ["5. For Killer Base: Filter rows 11-15 (Rank 1-5)"],
    ["6. For Regional: Filter rows 19-22 (all regions)"],
    ["7. Schedule: Weekly on Monday at 9:00 AM"],
    ["8. Use format: Custom Leaderboard (see script)"],
    [""],
    ["TIPS:"],
    ["- Keep rank ordering by sorting by Wins column"],
    ["- Use positive (+) and negative (-) signs for changes"],
    ["- Update all three sections together for consistency"],
    ["- The 'Week' column helps track historical data"]
  ];

  instructionSheet.getRange(1, 1, instructions.length, 1).setValues(instructions);
  instructionSheet.getRange("A1").setBackground("#673AB7").setFontColor("white").setFontWeight("bold").setFontSize(14);
  instructionSheet.setColumnWidth(1, 600);

  SpreadsheetApp.getUi().alert(
    '✅ Template Created!',
    'The "Weekly Leaderboard" sheet has been created with sample data.\n\n' +
    'Check the "Leaderboard Instructions" sheet for setup details.\n\n' +
    'Next steps:\n' +
    '1. Update sample data with your actual data\n' +
    '2. Set up Slack automation in the Scheduler',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * BUILD ENHANCED LEADERBOARD MESSAGE FOR SLACK
 * This formats the leaderboard data into a beautiful Slack message
 *
 * @param {Array} headers - Column headers
 * @param {Array} data - Row data
 * @param {Object} automation - Automation config
 * @param {String} leaderboardType - 'churn', 'killer', or 'regional'
 */
function buildLeaderboardMessage(headers, data, automation, leaderboardType = 'churn') {
  const blocks = [];

  // Get current week
  const currentWeek = data.length > 0 ? data[0][0] : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");

  // Header based on type
  let headerIcon = "🏆";
  let headerText = "";
  let headerColor = "#4CAF50";

  switch(leaderboardType) {
    case 'churn':
      headerIcon = "🏆";
      headerText = "CHURN PREVENTION LEADERBOARD";
      headerColor = "#4CAF50";
      break;
    case 'killer':
      headerIcon = "💪";
      headerText = "KILLER BASE LEADERBOARD";
      headerColor = "#2196F3";
      break;
    case 'regional':
      headerIcon = "🌍";
      headerText = "REGIONAL PERFORMANCE SUMMARY";
      headerColor = "#FF9800";
      break;
  }

  // Main header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `${headerIcon} ${headerText} - Week ${currentWeek}`,
      emoji: true
    }
  });

  blocks.push({ type: "divider" });

  // Build leaderboard based on type
  if (leaderboardType === 'regional') {
    // Regional format
    let regionalText = "";

    data.forEach((row, idx) => {
      const region = row[1] || `Region ${idx + 1}`;
      const totalWins = row[2] || 0;
      const churnWins = row[3] || 0;
      const killerWins = row[4] || 0;
      const topManager = row[5] || "N/A";

      // Region emoji
      const regionEmoji = getRegionSlackEmoji(region);

      regionalText += `*${regionEmoji} ${region}*\n`;
      regionalText += `├ Total Sales: *${totalWins}* (🏆 ${churnWins} Churn + 💪 ${killerWins} Killer)\n`;
      regionalText += `└ Top Performer: ${topManager}\n\n`;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: regionalText
      }
    });

  } else {
    // Manager leaderboard format (Churn or Killer)
    let leaderboardText = "";

    data.forEach((row, idx) => {
      const rank = row[1] || (idx + 1);
      const managerName = row[2] || `Manager ${idx + 1}`;
      const wins = row[3] || 0;
      const change = row[4] || "0";
      const region = row[5] || "N/A";

      // Rank emoji
      const rankEmoji = getRankEmoji(rank);

      // Change indicator
      const changeIndicator = getChangeIndicator(change);

      // Region emoji
      const regionEmoji = getRegionSlackEmoji(region);

      leaderboardText += `${rankEmoji} *#${rank} ${managerName}*\n`;
      leaderboardText += `   └ ${wins} sales ${changeIndicator} | ${regionEmoji} ${region}\n\n`;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: leaderboardText
      }
    });
  }

  // Add summary stats
  if (leaderboardType !== 'regional') {
    const totalWins = data.reduce((sum, row) => sum + (parseInt(row[3]) || 0), 0);
    const avgWins = (totalWins / data.length).toFixed(1);

    blocks.push({ type: "divider" });

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📊 *Total Sales:* ${totalWins} | *Average:* ${avgWins} | *Top Performers:* ${data.length}`
        }
      ]
    });
  }

  // Add footer with timestamp
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Updated: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM dd, yyyy 'at' HH:mm")}`
      }
    ]
  });

  return { blocks: blocks };
}

/**
 * HELPER: Get rank emoji
 */
function getRankEmoji(rank) {
  switch(parseInt(rank)) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    case 4: return "4️⃣";
    case 5: return "5️⃣";
    default: return `${rank}️⃣`;
  }
}

/**
 * HELPER: Get change indicator
 */
function getChangeIndicator(change) {
  const changeStr = String(change);
  const changeNum = parseInt(changeStr.replace(/[^0-9-]/g, ''));

  if (changeNum > 0) {
    return `📈 +${Math.abs(changeNum)}`;
  } else if (changeNum < 0) {
    return `📉 -${Math.abs(changeNum)}`;
  } else {
    return `➖ 0`;
  }
}

/**
 * HELPER: Get region emoji
 */
function getRegionSlackEmoji(region) {
  if (!region) return '';

  const regionStr = String(region).toUpperCase().trim();

  const regionMap = {
    'TR': ':flag-tr:',
    'ARAB': ':flag-sa:',
    'RU': ':ru:',
    'CZ': ':flag-cz:',
    'RO': ':flag-ro:',
    'ES': ':es:',
    'FR': ':fr:',
    'PL': ':flag-pl:',
    'DE': ':de:',
    'IL': ':flag-il:',
    'IT': ':flag-it:',
    'SA': ':flag-sa:',
    'NA': ':us:',
    'US': ':us:',
    'UK': ':flag-gb:',
    'JP': ':jp:',
    'KR': ':kr:',
    'CN': ':cn:',
    'IN': ':flag-in:',
    'BR': ':flag-br:',
    'MX': ':flag-mx:',
    'AU': ':flag-au:',
    'CA': ':flag-ca:',
    'EMEA': ':flag-eu:',
    'APAC': ':earth_asia:',
    'LATAM': ':earth_americas:'
  };

  return regionMap[regionStr] || '';
}

/**
 * SEND LEADERBOARD TO SLACK
 * Convenience function to send leaderboard with proper formatting
 *
 * @param {String} leaderboardType - 'churn', 'killer', or 'regional'
 * @param {String} channel - Slack channel ID
 */
function sendLeaderboardToSlack(leaderboardType, channel) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Weekly Leaderboard");

    if (!sheet) {
      throw new Error("Weekly Leaderboard sheet not found. Run createLeaderboardTemplate() first.");
    }

    let headers, data;

    // Get the right data based on type
    switch(leaderboardType) {
      case 'churn':
        headers = sheet.getRange("A2:F2").getValues()[0];
        data = sheet.getRange("A3:F7").getValues();
        break;
      case 'killer':
        headers = sheet.getRange("A10:F10").getValues()[0];
        data = sheet.getRange("A11:F15").getValues();
        break;
      case 'regional':
        headers = sheet.getRange("A18:F18").getValues()[0];
        data = sheet.getRange("A19:F22").getValues();
        break;
      default:
        throw new Error("Invalid leaderboard type. Use 'churn', 'killer', or 'regional'");
    }

    // Build message
    const payload = buildLeaderboardMessage(headers, data, {}, leaderboardType);

    // Get bot token
    const botToken = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
    if (!botToken) {
      throw new Error("Slack Bot Token not configured");
    }

    // Send to Slack
    payload.channel = channel;

    const options = {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + botToken },
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      Logger.log(`✅ ${leaderboardType} leaderboard sent successfully!`);
      return { success: true, timestamp: result.ts };
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    Logger.log(`❌ Error sending leaderboard: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * SEND ALL THREE LEADERBOARDS TO SLACK IN ONE COMBINED MESSAGE
 * This is the RECOMMENDED approach - sends all 3 sections in one beautiful message
 *
 * @param {String} channel - Slack channel ID
 */
function sendCombinedLeaderboard(channel) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Weekly Leaderboard");

    if (!sheet) {
      throw new Error("Weekly Leaderboard sheet not found. Run createLeaderboardTemplate() first.");
    }

    // Get all data sections
    const churnHeaders = sheet.getRange("A2:F2").getValues()[0];
    const churnData = sheet.getRange("A3:F7").getValues();

    const killerHeaders = sheet.getRange("A10:F10").getValues()[0];
    const killerData = sheet.getRange("A11:F15").getValues();

    const regionalHeaders = sheet.getRange("A18:F18").getValues()[0];
    const regionalData = sheet.getRange("A19:F22").getValues();

    // Build combined message
    const payload = buildCombinedLeaderboardMessage(
      churnHeaders, churnData,
      killerHeaders, killerData,
      regionalHeaders, regionalData
    );

    // Get bot token
    const botToken = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
    if (!botToken) {
      throw new Error("Slack Bot Token not configured");
    }

    // Send to Slack
    payload.channel = channel;

    const options = {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + botToken },
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      Logger.log(`✅ Combined leaderboard sent successfully!`);
      return { success: true, timestamp: result.ts };
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    Logger.log(`❌ Error sending combined leaderboard: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * BUILD COMBINED LEADERBOARD MESSAGE
 * Creates one message with all 3 leaderboard sections
 */
function buildCombinedLeaderboardMessage(churnHeaders, churnData, killerHeaders, killerData, regionalHeaders, regionalData) {
  const blocks = [];

  // Get current week from data
  const currentWeek = churnData.length > 0 ? churnData[0][0] : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");

  // Main header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `🏆 WEEKLY PERFORMANCE LEADERBOARD - Week ${currentWeek}`,
      emoji: true
    }
  });

  blocks.push({ type: "divider" });

  // ============================================
  // SECTION 1: CHURN PREVENTION LEADERBOARD
  // ============================================
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🏆 CHURN PREVENTION - TOP 5*"
    }
  });

  let churnText = "";
  churnData.forEach((row, idx) => {
    if (!row[1]) return; // Skip if no rank

    const rank = row[1];
    const managerName = row[2] || `Manager ${idx + 1}`;
    const wins = row[3] || 0;
    const change = row[4] || "0";
    const region = row[5] || "";

    const rankEmoji = getRankEmoji(rank);
    const changeIndicator = getChangeIndicator(change);
    const regionEmoji = region ? getRegionSlackEmoji(region) : "";

    churnText += `${rankEmoji} *#${rank} ${managerName}*\n`;
    churnText += `   └ ${wins} sales ${changeIndicator}`;
    if (region) {
      churnText += ` | ${regionEmoji} ${region}`;
    }
    churnText += `\n\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: churnText || "_No data available_"
    }
  });

  blocks.push({ type: "divider" });

  // ============================================
  // SECTION 2: KILLER BASE LEADERBOARD
  // ============================================
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*💪 KILLER BASE - TOP 5*"
    }
  });

  let killerText = "";
  killerData.forEach((row, idx) => {
    if (!row[1]) return; // Skip if no rank

    const rank = row[1];
    const managerName = row[2] || `Manager ${idx + 1}`;
    const wins = row[3] || 0;
    const change = row[4] || "0";
    const region = row[5] || "";

    const rankEmoji = getRankEmoji(rank);
    const changeIndicator = getChangeIndicator(change);
    const regionEmoji = region ? getRegionSlackEmoji(region) : "";

    killerText += `${rankEmoji} *#${rank} ${managerName}*\n`;
    killerText += `   └ ${wins} sales ${changeIndicator}`;
    if (region) {
      killerText += ` | ${regionEmoji} ${region}`;
    }
    killerText += `\n\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: killerText || "_No data available_"
    }
  });

  blocks.push({ type: "divider" });

  // ============================================
  // SECTION 3: REGIONAL PERFORMANCE
  // ============================================
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🌍 REGIONAL PERFORMANCE*"
    }
  });

  let regionalText = "";
  regionalData.forEach((row, idx) => {
    if (!row[1]) return; // Skip if no region

    const region = row[1];
    const totalWins = row[2] || 0;
    const churnWins = row[3] || 0;
    const killerWins = row[4] || 0;
    const topManager = row[5] || "N/A";

    const regionEmoji = getRegionSlackEmoji(region);

    regionalText += `*${regionEmoji} ${region}*\n`;
    regionalText += `├ Total Sales: *${totalWins}*`;

    if (churnWins || killerWins) {
      regionalText += ` (🏆 ${churnWins} Churn + 💪 ${killerWins} Killer)`;
    }

    regionalText += `\n└ Top Performer: ${topManager}\n\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: regionalText || "_No data available_"
    }
  });

  // Footer with stats and timestamp
  const totalChurnWins = churnData.reduce((sum, row) => sum + (parseInt(row[3]) || 0), 0);
  const totalKillerWins = killerData.reduce((sum, row) => sum + (parseInt(row[3]) || 0), 0);
  const grandTotal = totalChurnWins + totalKillerWins;

  blocks.push({ type: "divider" });

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `📊 *Grand Total:* ${grandTotal} sales (🏆 ${totalChurnWins} Churn + 💪 ${totalKillerWins} Killer) | Updated: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM dd, yyyy 'at' HH:mm")}`
      }
    ]
  });

  return { blocks: blocks };
}

/**
 * SEND ALL THREE LEADERBOARDS AS SEPARATE MESSAGES (OLD METHOD)
 * Not recommended - use sendCombinedLeaderboard() instead
 *
 * @param {String} channel - Slack channel ID
 */
function sendAllLeaderboards(channel) {
  const results = {
    churn: sendLeaderboardToSlack('churn', channel),
    killer: sendLeaderboardToSlack('killer', channel),
    regional: sendLeaderboardToSlack('regional', channel)
  };

  return results;
}
