/**
 * MULTI-FREQUENCY FORMAT OPTIONS
 *
 * Different leaderboard formats for different frequencies:
 * - DAILY: Simple top performer summary
 * - WEEKLY: Full comprehensive leaderboard (current format)
 * - MONTHLY: Champions edition with all-time stats
 *
 * All formats read from the same sheet, allowing manual updates
 */

/**
 * BUILD DAILY DIGEST FORMAT
 * Simpler, more concise for daily updates
 */
function buildDailyDigest(automation) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.targetSheet || "Weekly Leaderboard");

    if (!sheet) {
      return { text: "Sheet not found" };
    }

    const totalsData = sheet.getRange("A27:B34").getValues();
    const displayDate = totalsData.length > 0 && totalsData[0][1] ? String(totalsData[0][1]) : "Today";

    const blocks = [];

    // Compact header
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Daily Update - ${displayDate}`,
        emoji: true
      }
    });

    // Today's top performers - just show #1 from each category
    const churnCurrent = sheet.getRange("A3:F5").getValues();
    const killerCurrent = sheet.getRange("A15:F17").getValues();

    let topPerformers = "*🏆 Today's Leaders:*\n\n";

    // CP Leader
    if (churnCurrent[0][2]) {
      const name = String(churnCurrent[0][2]).trim();
      const sales = churnCurrent[0][3];
      const cash = churnCurrent[0][4];
      topPerformers += `*CP:* ${name} - ${sales} sales | ${cash}\n`;
    }

    // KB Leader
    if (killerCurrent[0][2]) {
      const name = String(killerCurrent[0][2]).trim();
      const sales = killerCurrent[0][3];
      const cash = killerCurrent[0][4];
      topPerformers += `*KB:* ${name} - ${sales} sales | ${cash}\n`;
    }

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: topPerformers
      }
    });

    // Quick stats
    const grandTotal = totalsData[1][1] || 0;
    const cpTotal = totalsData[2][1] || 0;
    const kbTotal = totalsData[5][1] || 0;

    blocks.push({
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: `📈 Total: ${grandTotal} | 🏆 CP: ${cpTotal} | 💪 KB: ${kbTotal}`
      }]
    });

    Logger.log("✓ Built daily digest format");
    return { blocks: blocks };

  } catch (error) {
    Logger.log(`Error building daily digest: ${error.message}`);
    return { text: `Error: ${error.message}` };
  }
}

/**
 * BUILD WEEKLY COMPREHENSIVE FORMAT
 * Full leaderboard (current implementation)
 */
function buildWeeklyComprehensive(automation) {
  // This is your current buildCombinedLeaderboardFromSheet function
  return buildCombinedLeaderboardFromSheet(automation);
}

/**
 * BUILD MONTHLY CHAMPIONS FORMAT
 * Special edition highlighting month's best performers
 */
function buildMonthlyChampions(automation) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.targetSheet || "Weekly Leaderboard");
    const streakSheet = ss.getSheetByName("Streak Tracking");

    if (!sheet) {
      return { text: "Sheet not found" };
    }

    const totalsData = sheet.getRange("A27:B34").getValues();
    const currentMonth = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM yyyy");

    const blocks = [];

    // Grand header
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `🏆 ${currentMonth} - CHAMPIONS EDITION`,
        emoji: true
      }
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Celebrating this month's top performers!*"
      }
    });

    blocks.push({ type: "divider" });

    // Month's MVP (current #1 in CP)
    const churnCurrent = sheet.getRange("A3:F5").getValues();
    if (churnCurrent[0][2]) {
      const mvpName = String(churnCurrent[0][2]).trim();
      const mvpSales = churnCurrent[0][3];
      const mvpCash = churnCurrent[0][4];
      const mvpRegion = churnCurrent[0][5];
      const regionEmoji = getRegionSlackEmoji(mvpRegion);

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🌟 MONTH'S MVP*\n\n🥇 *${mvpName}* ${regionEmoji}\n${mvpSales} CP sales | ${mvpCash} generated`
        }
      });
    }

    // Best Streaks
    if (streakSheet) {
      const topStreaks = getTopStreaks(3);

      if (topStreaks.length > 0) {
        let streaksText = "*🔥 LONGEST STREAKS*\n\n";

        topStreaks.forEach((streak, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
          streaksText += `${medal} ${streak.name} ${streak.badge} - ${streak.streak} weeks\n`;
        });

        blocks.push({ type: "divider" });
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: streaksText
          }
        });
      }
    }

    // Latest achievements
    const recentAchievements = getLatestAchievements(5);
    if (recentAchievements.length > 0) {
      let achievementsText = "*🏆 RECENT ACHIEVEMENTS*\n\n";

      recentAchievements.forEach(ach => {
        achievementsText += `${ach.badge} ${ach.name} - ${ach.achievement}\n`;
      });

      blocks.push({ type: "divider" });
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: achievementsText
        }
      });
    }

    // Month summary stats
    const grandTotal = totalsData[1][1] || 0;
    const cpTotal = totalsData[2][1] || 0;
    const kbTotal = totalsData[5][1] || 0;

    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📊 MONTH TOTALS*\n\n📈 Grand Total: *${grandTotal}* sales\n🏆 CP: ${cpTotal} | 💪 KB: ${kbTotal}`
      }
    });

    // Motivational footer
    blocks.push({
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: `🌟 Amazing work this month! Let's keep the momentum going! 🚀`
      }]
    });

    Logger.log("✓ Built monthly champions format");
    return { blocks: blocks };

  } catch (error) {
    Logger.log(`Error building monthly champions: ${error.message}`);
    return { text: `Error: ${error.message}` };
  }
}

/**
 * SELECT FORMAT BASED ON FREQUENCY
 */
function buildLeaderboardByFrequency(automation, frequency) {
  Logger.log(`Building leaderboard with frequency: ${frequency}`);

  switch (frequency) {
    case 'daily':
      return buildDailyDigest(automation);

    case 'monthly':
      return buildMonthlyChampions(automation);

    case 'weekly':
    default:
      return buildWeeklyComprehensive(automation);
  }
}

/**
 * TEST DIFFERENT FORMATS
 * Run this to see all format variations
 */
function testAllFormats() {
  const automation = {
    targetSheet: "Weekly Leaderboard",
    channel: "test"
  };

  Logger.log("\n=== TESTING DAILY FORMAT ===");
  const daily = buildDailyDigest(automation);
  Logger.log(`Daily blocks: ${daily.blocks ? daily.blocks.length : 0}`);

  Logger.log("\n=== TESTING WEEKLY FORMAT ===");
  const weekly = buildWeeklyComprehensive(automation);
  Logger.log(`Weekly blocks: ${weekly.blocks ? weekly.blocks.length : 0}`);

  Logger.log("\n=== TESTING MONTHLY FORMAT ===");
  const monthly = buildMonthlyChampions(automation);
  Logger.log(`Monthly blocks: ${monthly.blocks ? monthly.blocks.length : 0}`);

  Logger.log("\n✅ All formats tested successfully!");
}
