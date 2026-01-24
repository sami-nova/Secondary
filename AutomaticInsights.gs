/**
 * AUTOMATIC INSIGHTS & COMMENTARY
 *
 * Analyzes leaderboard data and generates intelligent insights:
 * - Performance trends and changes
 * - Record breaking achievements
 * - Comeback stories
 * - Regional performance highlights
 * - Notable improvements
 *
 * All insights are generated automatically but can be manually edited in the sheet
 */

/**
 * GENERATE INSIGHTS FOR LEADERBOARD
 * Returns array of insight strings to display
 */
function generateInsights(options = {}) {
  const insights = [];

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const leaderboard = ss.getSheetByName("Weekly Leaderboard");

    if (!leaderboard) {
      Logger.log("⚠️ Leaderboard sheet not found");
      return insights;
    }

    Logger.log("\n🔍 GENERATING INSIGHTS...\n");

    // 1. Check for new achievements
    const latestAchievements = getLatestAchievements(2);
    if (latestAchievements.length > 0) {
      latestAchievements.forEach(ach => {
        insights.push(`🎉 *${ach.name}* earned ${ach.badge} ${ach.achievement}!`);
      });
    }

    // 2. Check for hot streaks
    const topStreaks = getTopStreaks(2);
    if (topStreaks.length > 0) {
      topStreaks.forEach(streak => {
        if (streak.streak >= 5) {
          insights.push(`${streak.badge} *${streak.name}* is on fire with a ${streak.streak}-week streak!`);
        }
      });
    }

    // 3. Analyze regional performance
    const kbPaidRate = leaderboard.getRange("A38:F40").getValues();
    const cpPaidRate = leaderboard.getRange("A44:F46").getValues();

    // Find top performing regions
    let bestKBRegion = null;
    let bestKBRate = 0;

    kbPaidRate.forEach(row => {
      const region = row[2] ? String(row[2]).trim() : '';
      let paidRate = row[3];

      if (typeof paidRate === 'string') {
        paidRate = parseFloat(paidRate.replace('%', '')) / 100;
      }
      if (typeof paidRate === 'number' && paidRate < 1) {
        paidRate = paidRate;
      }

      if (paidRate > bestKBRate) {
        bestKBRate = paidRate;
        bestKBRegion = region;
      }
    });

    if (bestKBRegion && bestKBRate > 0) {
      const regionEmoji = getRegionSlackEmoji(bestKBRegion);
      insights.push(`🌟 ${regionEmoji} *${bestKBRegion}* region leads KB with ${(bestKBRate * 100).toFixed(1)}% paid rate!`);
    }

    // 4. Check for high performers in leaderboard
    const churnCurrent = leaderboard.getRange("A3:F5").getValues();
    const topChurnManager = churnCurrent[0][2] ? String(churnCurrent[0][2]).trim() : '';
    const topChurnSales = churnCurrent[0][3] || 0;

    if (topChurnManager && topChurnSales > 0) {
      // Check if this is a record (simplified - you can add historical tracking)
      if (topChurnSales >= 50) {
        insights.push(`🏆 *${topChurnManager}* crushed it with ${topChurnSales} CP sales!`);
      }
    }

    // 5. Check killer base performance
    const killerCurrent = leaderboard.getRange("A15:F17").getValues();
    const topKillerManager = killerCurrent[0][2] ? String(killerCurrent[0][2]).trim() : '';
    const topKillerSales = killerCurrent[0][3] || 0;

    if (topKillerManager && topKillerSales > 0) {
      if (topKillerSales >= 55) {
        insights.push(`💪 *${topKillerManager}* dominated KB with ${topKillerSales} sales!`);
      }
    }

    // 6. Check for perfect weeks (100%+ target achievement)
    const perfectPerformers = [];

    [...kbPaidRate, ...cpPaidRate].forEach(row => {
      const region = row[2] ? String(row[2]).trim() : '';
      let paidRate = row[3];
      let target = row[4];

      // Convert percentages
      if (typeof paidRate === 'string') {
        paidRate = parseFloat(paidRate.replace('%', '')) / 100;
      }
      if (typeof target === 'string') {
        target = parseFloat(target.replace('%', '')) / 100;
      }

      if (typeof paidRate === 'number' && paidRate < 1) {
        // Already decimal
      } else if (typeof paidRate === 'number' && paidRate > 1) {
        paidRate = paidRate / 100;
      }

      if (typeof target === 'number' && target < 1) {
        // Already decimal
      } else if (typeof target === 'number' && target > 1) {
        target = target / 100;
      }

      if (region && paidRate >= target && target > 0) {
        const achievement = ((paidRate / target) * 100).toFixed(0);
        perfectPerformers.push({ region, achievement });
      }
    });

    if (perfectPerformers.length > 0) {
      const best = perfectPerformers.sort((a, b) => b.achievement - a.achievement)[0];
      const regionEmoji = getRegionSlackEmoji(best.region);
      insights.push(`🎯 ${regionEmoji} *${best.region}* hit ${best.achievement}% of target!`);
    }

    // 7. Check totals for records
    const totals = leaderboard.getRange("A27:B34").getValues();
    const grandTotal = totals[1][1] || 0;
    const cpTotal = totals[2][1] || 0;
    const kbTotal = totals[5][1] || 0;

    // Simplified record detection (you can add historical tracking)
    if (grandTotal >= 500) {
      insights.push(`📊 New milestone: *${grandTotal} total sales* this week!`);
    }

    // 8. Add motivational insight if few insights generated
    if (insights.length < 2) {
      insights.push(`💫 Great work team! Keep pushing toward your targets!`);
    }

    // Limit to max 5 insights
    const finalInsights = insights.slice(0, 5);

    Logger.log(`✅ Generated ${finalInsights.length} insights:`);
    finalInsights.forEach((insight, idx) => {
      Logger.log(`   ${idx + 1}. ${insight}`);
    });

    return finalInsights;

  } catch (error) {
    Logger.log(`❌ Error generating insights: ${error.message}`);
    return insights;
  }
}

/**
 * CREATE INSIGHTS OVERRIDE SHEET
 * Allows manual editing of insights before posting
 */
function createInsightsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Insights");

  if (sheet) {
    const response = SpreadsheetApp.getUi().alert(
      'Sheet Exists',
      'Insights sheet already exists. Recreate it?',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );

    if (response === SpreadsheetApp.getUi().Button.YES) {
      ss.deleteSheet(sheet);
    } else {
      return;
    }
  }

  sheet = ss.insertSheet("Insights");

  // Header
  sheet.getRange("A1").setValue("💡 AUTOMATIC INSIGHTS");
  sheet.getRange("A1:C1").merge();
  sheet.getRange("A1:C1").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(14);

  // Instructions
  sheet.getRange("A2").setValue("📝 Edit these insights before posting, or leave blank to use auto-generated ones");
  sheet.getRange("A2:C2").merge();
  sheet.getRange("A2:C2").setFontSize(10).setFontStyle("italic");

  // Column headers
  const headers = ["Week", "Insight #", "Insight Text"];
  sheet.getRange("A3:C3").setValues([headers]);
  sheet.getRange("A3:C3").setBackground("#C8E6C9").setFontWeight("bold");

  // Current week placeholder
  const currentWeek = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");

  const sampleData = [
    [currentWeek, 1, ""],
    [currentWeek, 2, ""],
    [currentWeek, 3, ""],
    [currentWeek, 4, ""],
    [currentWeek, 5, ""]
  ];
  sheet.getRange("A4:C8").setValues(sampleData);

  // Set column widths
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 600);

  // Borders
  sheet.getRange("A3:C8").setBorder(true, true, true, true, true, true);

  Logger.log("✅ Insights sheet created!");

  SpreadsheetApp.getUi().alert(
    '✅ Created!',
    'Insights sheet created.\n\n' +
    'How it works:\n' +
    '1. Insights are auto-generated when posting\n' +
    '2. You can manually edit them in this sheet BEFORE posting\n' +
    '3. If a cell is empty, auto-generated insight is used\n' +
    '4. If you write custom text, it will be used instead',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * GET INSIGHTS FOR DISPLAY
 * Checks manual overrides first, then uses auto-generated
 */
function getInsightsForDisplay(currentWeek) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const insightsSheet = ss.getSheetByName("Insights");

    // Check for manual overrides
    const manualInsights = [];

    if (insightsSheet) {
      const data = insightsSheet.getDataRange().getValues();

      // Skip header rows (0, 1, 2 are headers/instructions)
      for (let i = 3; i < data.length; i++) {
        const week = data[i][0] ? String(data[i][0]) : '';
        const text = data[i][2] ? String(data[i][2]).trim() : '';

        if (week === currentWeek && text) {
          manualInsights.push(text);
        }
      }
    }

    // If manual insights exist, use them
    if (manualInsights.length > 0) {
      Logger.log(`✓ Using ${manualInsights.length} manual insights`);
      return manualInsights;
    }

    // Otherwise generate automatic insights
    Logger.log("No manual insights found, generating automatically...");
    return generateInsights();

  } catch (error) {
    Logger.log(`Error getting insights: ${error.message}`);
    return generateInsights();
  }
}

/**
 * FORMAT INSIGHTS AS SLACK BLOCK
 * Returns a formatted block for display
 */
function createInsightsBlock(insights) {
  if (!insights || insights.length === 0) {
    return null;
  }

  const insightsText = insights.map((insight, idx) => `${idx + 1}. ${insight}`).join('\n');

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*📊 WEEKLY INSIGHTS*\n${insightsText}`
    }
  };
}
