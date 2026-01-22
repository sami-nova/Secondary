/**
 * TEST MENTIONS OUTPUT
 * Run this to see exactly what mention text is being generated
 */
function testMentionsForLeaderboard() {
  Logger.log("=".repeat(80));
  Logger.log("TESTING MENTIONS FOR LEADERBOARD");
  Logger.log("=".repeat(80));

  // Get the actual automation configuration
  const properties = PropertiesService.getScriptProperties();
  const automationsJson = properties.getProperty("SlackAutomations") || "[]";
  const automations = JSON.parse(automationsJson);

  // Find leaderboard automation
  const leaderboardAuto = automations.find(a =>
    a.format === 'leaderboard_combined' ||
    (a.name && a.name.toLowerCase().includes('leaderboard'))
  );

  if (!leaderboardAuto) {
    Logger.log("❌ No leaderboard automation found");
    return;
  }

  Logger.log(`\n📊 Found automation: "${leaderboardAuto.name}"`);
  Logger.log(`   Format: ${leaderboardAuto.format}`);

  // Check mentions settings
  Logger.log("\n👥 MENTIONS SETTINGS:");
  if (leaderboardAuto.mentions) {
    Logger.log(`   Enabled: ${leaderboardAuto.mentions.enabled}`);
    if (leaderboardAuto.mentions.enabled && leaderboardAuto.mentions.users) {
      Logger.log(`   Users configured: ${leaderboardAuto.mentions.users.length}`);
      leaderboardAuto.mentions.users.forEach((user, i) => {
        Logger.log(`      User ${i + 1}:`);
        Logger.log(`         ID: "${user.userId || user.userEmail}"`);
        Logger.log(`         Condition: ${user.condition || 'always'}`);
      });
    }
  } else {
    Logger.log("   Not configured");
  }

  // Check channelNotify settings
  Logger.log("\n📢 CHANNEL NOTIFY SETTINGS:");
  if (leaderboardAuto.channelNotify) {
    Logger.log(`   Enabled: ${leaderboardAuto.channelNotify.enabled}`);
    if (leaderboardAuto.channelNotify.enabled) {
      Logger.log(`   Type: ${leaderboardAuto.channelNotify.type}`);
      Logger.log(`   Use @here: ${leaderboardAuto.channelNotify.useHere || false}`);
      Logger.log(`   Condition: ${leaderboardAuto.channelNotify.condition || 'always'}`);
    }
  } else {
    Logger.log("   Not configured");
  }

  // Test buildMentions function
  if (typeof buildMentions === 'function') {
    Logger.log("\n🧪 TESTING buildMentions() function:");
    const mentions = buildMentions(leaderboardAuto, null);
    Logger.log(`   Generated ${mentions.length} mentions:`);
    mentions.forEach((m, i) => {
      Logger.log(`      ${i + 1}. Type: ${m.type}, ID: "${m.id}"`);
    });

    if (mentions.length > 0 && typeof formatMentions === 'function') {
      const formatted = formatMentions(mentions);
      Logger.log(`\n   Formatted mention text: "${formatted}"`);
      Logger.log(`   Length: ${formatted.length} characters`);

      if (formatted.includes('private')) {
        Logger.log(`   ⚠️ WARNING: Contains "private" text!`);
      }
      if (formatted.includes('<@')) {
        Logger.log(`   ⚠️ Contains user mention tag`);
        // Extract user IDs
        const userIdMatches = formatted.match(/<@([^>]+)>/g);
        if (userIdMatches) {
          Logger.log(`   User IDs found: ${userIdMatches.join(', ')}`);
        }
      }
    }
  } else {
    Logger.log("\n❌ buildMentions function not found!");
  }

  Logger.log("\n" + "=".repeat(80));
  Logger.log("TEST COMPLETE");
  Logger.log("=".repeat(80));
}
