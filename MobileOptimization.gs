/**
 * MOBILE-OPTIMIZED FORMAT
 *
 * Adapts leaderboard for better mobile display:
 * - Shorter blocks (less scrolling)
 * - Clearer hierarchy
 * - Collapsible sections
 * - Essential info first
 * - Touch-friendly buttons
 *
 * Automatically detects if user prefers mobile format
 */

/**
 * BUILD MOBILE-OPTIMIZED LEADERBOARD
 * Compact version with essential information
 */
function buildMobileOptimizedLeaderboard(automation) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.targetSheet || "Weekly Leaderboard");

    if (!sheet) {
      return { text: "Sheet not found" };
    }

    // Get data
    const totalsData = sheet.getRange("A27:B34").getValues();
    const displayDate = totalsData.length > 0 && totalsData[0][1] ? String(totalsData[0][1]) : "Jan 26th";

    const blocks = [];

    // COMPACT HEADER - single line
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `🏆 ${displayDate}`,
        emoji: true
      }
    });

    // INSIGHTS - Mobile version (max 2 insights)
    const currentWeek = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");
    const insights = getInsightsForDisplay(currentWeek).slice(0, 2);

    if (insights.length > 0) {
      const insightsText = insights.map(i => `• ${i}`).join('\n');
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `💡 ${insightsText}`
        }
      });
    }

    blocks.push({ type: "divider" });

    // TOP 3 COMBINED - All categories in one compact block
    const churnCurrent = sheet.getRange("A3:F5").getValues();
    const killerCurrent = sheet.getRange("A15:F17").getValues();

    // CP Top 3 - Compact format
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🏆 CP - Top 3*"
      }
    });

    let cpText = "";
    churnCurrent.forEach((row, idx) => {
      const rank = row[1];
      const name = row[2] ? String(row[2]).trim() : '';
      const sales = row[3];
      const cash = row[4];

      if (name) {
        const rankEmoji = getRankEmoji(rank);
        const streakInfo = getManagerStreak(name);
        const streakBadge = streakInfo.badge || '';

        // Compact format: Emoji Name Badge - Sales
        cpText += `${rankEmoji} ${name} ${streakBadge} - ${sales} sales\n`;
      }
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: cpText || "_No data_"
      }
    });

    // KB Top 3 - Compact format
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*💪 KB - Top 3*"
      }
    });

    let kbText = "";
    killerCurrent.forEach((row, idx) => {
      const rank = row[1];
      const name = row[2] ? String(row[2]).trim() : '';
      const sales = row[3];

      if (name) {
        const rankEmoji = getRankEmoji(rank);
        const streakInfo = getManagerStreak(name);
        const streakBadge = streakInfo.badge || '';

        kbText += `${rankEmoji} ${name} ${streakBadge} - ${sales} sales\n`;
      }
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: kbText || "_No data_"
      }
    });

    blocks.push({ type: "divider" });

    // TOTALS - Compact one-liner
    const grandTotal = totalsData[1][1] || 0;
    const cpTotal = totalsData[2][1] || 0;
    const kbTotal = totalsData[5][1] || 0;

    blocks.push({
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: `📊 Total: *${grandTotal}* | CP: ${cpTotal} | KB: ${kbTotal}`
      }]
    });

    // BUTTONS - Larger, touch-friendly (if interactive buttons enabled)
    if (automation.interactiveButtons && automation.interactiveButtons.enabled) {
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "📊 Full Stats",
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
              text: "🏆 Badges",
              emoji: true
            },
            value: "view_achievements",
            action_id: "button_achievements"
          }
        ]
      });
    }

    Logger.log("✅ Built mobile-optimized leaderboard");
    return { blocks: blocks };

  } catch (error) {
    Logger.log(`Error building mobile leaderboard: ${error.message}`);
    return { text: `Error: ${error.message}` };
  }
}

/**
 * CHECK IF MOBILE FORMAT SHOULD BE USED
 * Can be based on automation settings or time of day
 */
function shouldUseMobileFormat(automation) {
  // Check if explicitly set
  if (automation.mobileFormat && automation.mobileFormat.enabled) {
    return true;
  }

  // Could add logic like:
  // - Always use mobile for daily digests
  // - Use mobile if posting during off-hours
  // - Use mobile for certain channels

  if (automation.frequency === 'daily') {
    return true;
  }

  return false;
}

/**
 * BUILD FORMAT BASED ON DEVICE PREFERENCE
 * Smart selection between full and mobile
 */
function buildSmartLeaderboard(automation) {
  if (shouldUseMobileFormat(automation)) {
    Logger.log("📱 Using mobile-optimized format");
    return buildMobileOptimizedLeaderboard(automation);
  } else {
    Logger.log("💻 Using full desktop format");
    return buildEnhancedLeaderboardWithFeatures(automation);
  }
}

/**
 * CREATE SIDE-BY-SIDE COMPARISON
 * Test both formats to see the difference
 */
function compareMobileVsDesktop() {
  const automation = {
    targetSheet: "Weekly Leaderboard",
    channel: "test"
  };

  Logger.log("\n" + "=".repeat(60));
  Logger.log("MOBILE FORMAT");
  Logger.log("=".repeat(60));

  const mobile = buildMobileOptimizedLeaderboard(automation);
  Logger.log(`Blocks: ${mobile.blocks ? mobile.blocks.length : 0}`);
  if (mobile.blocks) {
    mobile.blocks.forEach((block, idx) => {
      Logger.log(`\n[${idx + 1}] ${block.type}`);
      if (block.text && block.text.text) {
        Logger.log(block.text.text.substring(0, 100) + "...");
      }
    });
  }

  Logger.log("\n" + "=".repeat(60));
  Logger.log("DESKTOP FORMAT");
  Logger.log("=".repeat(60));

  const desktop = buildCombinedLeaderboardFromSheet(automation);
  Logger.log(`Blocks: ${desktop.blocks ? desktop.blocks.length : 0}`);

  Logger.log("\n📊 COMPARISON:");
  Logger.log(`Mobile: ${mobile.blocks ? mobile.blocks.length : 0} blocks (compact)`);
  Logger.log(`Desktop: ${desktop.blocks ? desktop.blocks.length : 0} blocks (full)`);
  Logger.log(`Reduction: ${desktop.blocks && mobile.blocks ? Math.round(((desktop.blocks.length - mobile.blocks.length) / desktop.blocks.length) * 100) : 0}%`);
}
