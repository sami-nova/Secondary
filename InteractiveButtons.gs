/**
 * INTERACTIVE BUTTONS FOR LEADERBOARD
 *
 * Adds clickable buttons to leaderboard messages:
 * - 📊 View Full Stats - Shows detailed breakdown
 * - 📈 Compare with Last Week - Week-over-week comparison
 * - 🏆 View Achievements - Shows all badges and achievements
 * - 💾 Export to PDF - Generate PDF report (future enhancement)
 *
 * Note: Buttons require Slack App with interactive components enabled
 */

/**
 * ADD INTERACTIVE BUTTONS TO LEADERBOARD
 * Call this to add buttons to the payload
 */
function addInteractiveButtons(blocks, automation) {
  try {
    // Create actions block with buttons
    const actionBlock = {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📊 View Full Stats",
            emoji: true
          },
          style: "primary",
          value: "view_full_stats",
          action_id: "button_full_stats"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📈 Compare Last Week",
            emoji: true
          },
          value: "compare_last_week",
          action_id: "button_compare"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "🏆 Achievements",
            emoji: true
          },
          value: "view_achievements",
          action_id: "button_achievements"
        }
      ]
    };

    // Add button block before the final footer
    blocks.push(actionBlock);

    Logger.log("✅ Added interactive buttons to leaderboard");

    return blocks;

  } catch (error) {
    Logger.log(`⚠️ Error adding buttons: ${error.message}`);
    return blocks; // Return original blocks if error
  }
}

/**
 * HANDLE BUTTON CLICK - WEB APP ENDPOINT
 * This function handles Slack interactive button callbacks
 *
 * Setup instructions:
 * 1. Deploy this script as a web app
 * 2. Copy the web app URL
 * 3. Go to Slack App settings → Interactivity & Shortcuts
 * 4. Enable Interactivity
 * 5. Paste web app URL as Request URL
 */
function doPost(e) {
  try {
    // Parse Slack payload
    const payload = JSON.parse(e.parameter.payload);
    const action = payload.actions[0];
    const responseUrl = payload.response_url;
    const user = payload.user.name;

    Logger.log(`Button clicked: ${action.action_id} by ${user}`);

    // Handle different button actions
    let responseMessage = null;

    switch (action.action_id) {
      case "button_full_stats":
        responseMessage = buildFullStatsResponse();
        break;

      case "button_compare":
        responseMessage = buildComparisonResponse();
        break;

      case "button_achievements":
        responseMessage = buildAchievementsResponse();
        break;

      default:
        responseMessage = {
          text: "Unknown action"
        };
    }

    // Send response back to Slack
    if (responseMessage && responseUrl) {
      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(responseMessage),
        muteHttpExceptions: true
      };

      UrlFetchApp.fetch(responseUrl, options);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(`Error handling button click: ${error.message}`);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * BUILD FULL STATS RESPONSE
 * Shows detailed statistics when "View Full Stats" is clicked
 */
function buildFullStatsResponse() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Weekly Leaderboard");

    if (!sheet) {
      return { text: "Leaderboard sheet not found" };
    }

    const totalsData = sheet.getRange("A27:B34").getValues();

    const grandTotal = totalsData[1][1] || 0;
    const cpTotal = totalsData[2][1] || 0;
    const cpCurrent = totalsData[3][1] || 0;
    const cpOld = totalsData[4][1] || 0;
    const kbTotal = totalsData[5][1] || 0;
    const kbCurrent = totalsData[6][1] || 0;
    const kbOld = totalsData[7][1] || 0;

    // Get top streaks
    const topStreaks = getTopStreaks(5);
    let streaksText = "";
    if (topStreaks.length > 0) {
      streaksText = "\n\n*🔥 Top Streaks:*\n";
      topStreaks.forEach((streak, idx) => {
        streaksText += `${idx + 1}. ${streak.name} ${streak.badge} - ${streak.streak} weeks\n`;
      });
    }

    const statsText = `*📊 DETAILED STATISTICS*\n\n` +
      `*Overall Performance:*\n` +
      `• Grand Total: *${grandTotal}* sales\n\n` +
      `*🏆 Churn Prevention (CP):*\n` +
      `• Total: ${cpTotal} sales\n` +
      `• Current Base: ${cpCurrent}\n` +
      `• Old Base: ${cpOld}\n\n` +
      `*💪 Killer Base (KB):*\n` +
      `• Total: ${kbTotal} sales\n` +
      `• Current Base: ${kbCurrent}\n` +
      `• Old Base: ${kbOld}` +
      streaksText;

    return {
      replace_original: false,
      response_type: "ephemeral", // Only visible to user who clicked
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: statsText
          }
        }
      ]
    };

  } catch (error) {
    Logger.log(`Error building full stats: ${error.message}`);
    return { text: "Error loading statistics" };
  }
}

/**
 * BUILD COMPARISON RESPONSE
 * Shows week-over-week comparison (requires historical data)
 */
function buildComparisonResponse() {
  // This is a placeholder - you would need to store historical data
  // For now, show current week stats with a note

  const comparisonText = `*📈 WEEK-OVER-WEEK COMPARISON*\n\n` +
    `_Historical tracking coming soon!_\n\n` +
    `To enable comparisons:\n` +
    `1. Archive each week's data\n` +
    `2. Store in "Historical Data" sheet\n` +
    `3. Auto-calculate % changes\n\n` +
    `For now, check the current week stats with "View Full Stats" 📊`;

  return {
    replace_original: false,
    response_type: "ephemeral",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: comparisonText
        }
      }
    ]
  };
}

/**
 * BUILD ACHIEVEMENTS RESPONSE
 * Shows all achievements and badges
 */
function buildAchievementsResponse() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const achievementSheet = ss.getSheetByName("Achievements");

    if (!achievementSheet) {
      return {
        text: "Achievements tracking not enabled. Run createAchievementsSheet() to set it up!"
      };
    }

    const data = achievementSheet.getDataRange().getValues();
    let achievementsText = "*🏆 ACHIEVEMENTS EARNED*\n\n";

    // Skip header rows
    for (let i = 2; i < data.length; i++) {
      const name = data[i][0] ? String(data[i][0]).trim() : '';
      const badges = data[i][1] ? String(data[i][1]) : '';
      const totalBadges = data[i][4] || 0;

      if (name && badges) {
        achievementsText += `*${name}* ${badges} (${totalBadges} badges)\n`;
      }
    }

    if (achievementsText === "*🏆 ACHIEVEMENTS EARNED*\n\n") {
      achievementsText += "_No achievements earned yet. Keep pushing!_";
    }

    return {
      replace_original: false,
      response_type: "ephemeral",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: achievementsText
          }
        }
      ]
    };

  } catch (error) {
    Logger.log(`Error building achievements response: ${error.message}`);
    return { text: "Error loading achievements" };
  }
}

/**
 * TEST BUTTONS LOCALLY
 * Simulate button responses without Slack
 */
function testButtonResponses() {
  Logger.log("\n=== TESTING BUTTON RESPONSES ===\n");

  Logger.log("1. Full Stats Response:");
  const fullStats = buildFullStatsResponse();
  Logger.log(JSON.stringify(fullStats, null, 2));

  Logger.log("\n2. Comparison Response:");
  const comparison = buildComparisonResponse();
  Logger.log(JSON.stringify(comparison, null, 2));

  Logger.log("\n3. Achievements Response:");
  const achievements = buildAchievementsResponse();
  Logger.log(JSON.stringify(achievements, null, 2));

  Logger.log("\n✅ All button responses tested");
}

/**
 * GET WEB APP URL FOR SLACK SETUP
 * Run this to get the URL for Slack interactivity settings
 */
function getWebAppUrl() {
  const url = ScriptApp.getService().getUrl();
  Logger.log("\n📋 WEB APP SETUP INSTRUCTIONS:\n");
  Logger.log("1. Copy this URL:");
  Logger.log(`   ${url}`);
  Logger.log("\n2. Go to: https://api.slack.com/apps");
  Logger.log("3. Select your app");
  Logger.log("4. Go to: Interactivity & Shortcuts");
  Logger.log("5. Turn ON Interactivity");
  Logger.log("6. Paste the URL in 'Request URL'");
  Logger.log("7. Save Changes");
  Logger.log("\n✅ After setup, buttons will work in Slack!");

  return url;
}
