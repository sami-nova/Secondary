/**
 * TEST ALL ENHANCED FEATURES
 *
 * Run these functions to test the new leaderboard features
 */

/**
 * COMPLETE SETUP - Run this first!
 * Creates all tracking sheets
 */
function setupAllNewFeatures() {
  Logger.log("🚀 SETTING UP ALL NEW FEATURES\n");
  Logger.log("This will create 3 new sheets:\n");
  Logger.log("1. Streak Tracking");
  Logger.log("2. Achievements");
  Logger.log("3. Insights\n");

  // Create sheets
  createStreakTrackingSheet();
  Utilities.sleep(1000);

  createAchievementsSheet();
  Utilities.sleep(1000);

  createInsightsSheet();

  Logger.log("\n✅ ALL SHEETS CREATED!");
  Logger.log("\n📋 Next steps:");
  Logger.log("1. Check the new sheets in your spreadsheet");
  Logger.log("2. Run: testEnhancedLeaderboard()");
  Logger.log("3. Check your Slack channel!");
}

/**
 * TEST ENHANCED LEADERBOARD
 * Builds and displays enhanced leaderboard with all features
 */
function testEnhancedLeaderboard() {
  Logger.log("\n" + "=".repeat(60));
  Logger.log("TESTING ENHANCED LEADERBOARD WITH ALL FEATURES");
  Logger.log("=".repeat(60) + "\n");

  const automation = {
    id: "test-enhanced",
    name: "Test Enhanced Leaderboard",
    format: "leaderboard_combined",
    targetSheet: "Weekly Leaderboard",
    channel: "test",

    // Enable all features
    interactiveButtons: {
      enabled: false  // Set to true after deploying as web app
    },
    mobileFormat: {
      enabled: false  // Set to true to test mobile format
    }
  };

  // Build enhanced leaderboard
  const result = buildEnhancedLeaderboardWithFeatures(automation);

  Logger.log("\n📊 LEADERBOARD BUILD RESULT:");
  Logger.log(`Blocks created: ${result.blocks ? result.blocks.length : 0}`);

  if (result.blocks) {
    Logger.log("\n📋 BLOCK BREAKDOWN:");
    result.blocks.forEach((block, idx) => {
      Logger.log(`  [${idx + 1}] ${block.type}`);
      if (block.text && block.text.text) {
        const preview = block.text.text.substring(0, 80).replace(/\n/g, ' ');
        Logger.log(`      ${preview}...`);
      }
    });
  }

  Logger.log("\n✅ TEST COMPLETE!");
  Logger.log("\n💡 To send to Slack:");
  Logger.log("   Use: simpleLeaderboardWithFire()");
  Logger.log("   (Don't forget to set your channel ID!)");

  return result;
}

/**
 * TEST INDIVIDUAL FEATURES
 * Run to verify each feature works
 */
function testIndividualFeatures() {
  Logger.log("\n" + "=".repeat(60));
  Logger.log("TESTING INDIVIDUAL FEATURES");
  Logger.log("=".repeat(60));

  const currentWeek = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");

  // Test 1: Streaks
  Logger.log("\n1️⃣ TESTING STREAK TRACKING");
  Logger.log("─".repeat(60));
  updateStreaks(currentWeek);
  const topStreaks = getTopStreaks(3);
  Logger.log(`Top ${topStreaks.length} streaks:`);
  topStreaks.forEach((s, i) => {
    Logger.log(`   ${i + 1}. ${s.name} ${s.badge} - ${s.streak} weeks`);
  });

  // Test 2: Achievements
  Logger.log("\n2️⃣ TESTING ACHIEVEMENT BADGES");
  Logger.log("─".repeat(60));
  const newAchievements = checkAchievements(currentWeek);
  Logger.log(`New achievements: ${newAchievements.length}`);
  newAchievements.forEach(a => {
    Logger.log(`   ${a.badge} ${a.manager} - ${a.name}`);
  });

  // Test 3: Insights
  Logger.log("\n3️⃣ TESTING AUTOMATIC INSIGHTS");
  Logger.log("─".repeat(60));
  const insights = generateInsights();
  Logger.log(`Generated ${insights.length} insights:`);
  insights.forEach((insight, i) => {
    Logger.log(`   ${i + 1}. ${insight}`);
  });

  // Test 4: Multi-Frequency
  Logger.log("\n4️⃣ TESTING MULTI-FREQUENCY FORMATS");
  Logger.log("─".repeat(60));
  const automation = { targetSheet: "Weekly Leaderboard", channel: "test" };

  const daily = buildDailyDigest(automation);
  Logger.log(`Daily format: ${daily.blocks ? daily.blocks.length : 0} blocks`);

  const weekly = buildWeeklyComprehensive(automation);
  Logger.log(`Weekly format: ${weekly.blocks ? weekly.blocks.length : 0} blocks`);

  const monthly = buildMonthlyChampions(automation);
  Logger.log(`Monthly format: ${monthly.blocks ? monthly.blocks.length : 0} blocks`);

  // Test 5: Buttons
  Logger.log("\n5️⃣ TESTING INTERACTIVE BUTTONS");
  Logger.log("─".repeat(60));
  testButtonResponses();

  // Test 6: Mobile
  Logger.log("\n6️⃣ TESTING MOBILE OPTIMIZATION");
  Logger.log("─".repeat(60));
  const mobile = buildMobileOptimizedLeaderboard(automation);
  Logger.log(`Mobile format: ${mobile.blocks ? mobile.blocks.length : 0} blocks`);

  Logger.log("\n" + "=".repeat(60));
  Logger.log("✅ ALL FEATURES TESTED SUCCESSFULLY!");
  Logger.log("=".repeat(60));
}

/**
 * SEND TEST LEADERBOARD TO SLACK
 * Actually posts to your Slack channel
 */
function sendTestEnhancedLeaderboard() {
  // CONFIGURE THIS
  const channel = "YOUR_CHANNEL_ID"; // ← CHANGE THIS!

  if (channel === "YOUR_CHANNEL_ID") {
    Logger.log("❌ Please set your Slack channel ID first!");
    Logger.log("   Edit line 111 in TestEnhancedFeatures.gs");
    return;
  }

  Logger.log("📤 Sending enhanced leaderboard to Slack...\n");

  const automation = {
    id: "test-enhanced-" + Date.now(),
    name: "Test Enhanced Leaderboard",
    format: "leaderboard_combined",
    targetSheet: "Weekly Leaderboard",
    channel: channel,
    interactiveButtons: { enabled: false },

    // ENABLE REACTIONS
    reactions: {
      enabled: true,
      always: ["fire"],
      rules: {
        success: ["fire", "white_check_mark", "dart"]
      }
    }
  };

  // Build enhanced leaderboard
  const payload = buildEnhancedLeaderboardWithFeatures(automation);

  if (!payload || !payload.blocks) {
    Logger.log("❌ Failed to build leaderboard");
    return;
  }

  // Send to Slack
  const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");

  if (!botToken) {
    Logger.log("❌ Bot token not found!");
    Logger.log("   Set SLACK_BOT_TOKEN in Script Properties");
    return;
  }

  const options = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + botToken,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({
      channel: channel,
      blocks: payload.blocks
    }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch("https://slack.com/api/chat.postMessage", options);
  const result = JSON.parse(response.getContentText());

  if (result.ok) {
    Logger.log(`✅ Message sent! Timestamp: ${result.ts}`);

    // Add fire reaction
    Logger.log("\n🔥 Adding fire reaction...");
    const reactionResult = addReactions(channel, result.ts, ["fire"]);
    Logger.log(`Reaction result: ${JSON.stringify(reactionResult)}`);

    Logger.log("\n🎉 DONE! Check your Slack channel!");
  } else {
    Logger.log(`❌ Failed: ${result.error}`);
  }
}

/**
 * COMPARE ALL FORMATS SIDE BY SIDE
 * See differences between daily/weekly/monthly/mobile
 */
function compareAllFormats() {
  const automation = {
    targetSheet: "Weekly Leaderboard",
    channel: "test"
  };

  Logger.log("\n" + "=".repeat(70));
  Logger.log("FORMAT COMPARISON");
  Logger.log("=".repeat(70));

  const formats = [
    { name: "📱 Mobile", result: buildMobileOptimizedLeaderboard(automation) },
    { name: "📅 Daily", result: buildDailyDigest(automation) },
    { name: "📊 Weekly", result: buildWeeklyComprehensive(automation) },
    { name: "🏆 Monthly", result: buildMonthlyChampions(automation) }
  ];

  formats.forEach(format => {
    const blockCount = format.result.blocks ? format.result.blocks.length : 0;
    Logger.log(`\n${format.name.padEnd(20)} ${blockCount} blocks`);

    if (format.result.blocks) {
      format.result.blocks.slice(0, 3).forEach((block, idx) => {
        Logger.log(`   [${idx + 1}] ${block.type}`);
      });
      if (blockCount > 3) {
        Logger.log(`   ... and ${blockCount - 3} more`);
      }
    }
  });

  Logger.log("\n" + "=".repeat(70));
  Logger.log("📊 SUMMARY:");
  formats.forEach(format => {
    const blockCount = format.result.blocks ? format.result.blocks.length : 0;
    Logger.log(`   ${format.name}: ${blockCount} blocks`);
  });
  Logger.log("=".repeat(70));
}
