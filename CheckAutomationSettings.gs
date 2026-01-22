/**
 * CHECK AUTOMATION SETTINGS
 * Run this to see if mentions or channelNotify is enabled in your leaderboard automation
 */
function checkLeaderboardAutomationSettings() {
  const automationManager = SlackLib.createAutomationManager();
  const automations = automationManager.getAll();

  Logger.log("=".repeat(80));
  Logger.log("CHECKING ALL AUTOMATIONS FOR MENTIONS/CHANNELNOTIFY SETTINGS");
  Logger.log("=".repeat(80));

  automations.forEach((automation, idx) => {
    Logger.log(`\n📊 Automation ${idx + 1}: "${automation.name}"`);
    Logger.log(`   ID: ${automation.id}`);
    Logger.log(`   Format: ${automation.format || 'N/A'}`);
    Logger.log(`   Status: ${automation.enabled ? 'ENABLED' : 'DISABLED'}`);

    // Check if this is a leaderboard automation
    const isLeaderboard = automation.format === 'leaderboard' ||
                          automation.format === 'leaderboard_combined' ||
                          (automation.name && automation.name.toLowerCase().includes('leaderboard'));

    if (isLeaderboard) {
      Logger.log(`   ⚠️ THIS IS A LEADERBOARD AUTOMATION`);
    }

    // Check mentions settings
    if (automation.mentions) {
      Logger.log(`\n   👥 MENTIONS SETTINGS:`);
      Logger.log(`      Enabled: ${automation.mentions.enabled ? 'YES ⚠️' : 'NO'}`);
      if (automation.mentions.enabled) {
        Logger.log(`      Users configured: ${(automation.mentions.users || []).length}`);
        if (automation.mentions.users && automation.mentions.users.length > 0) {
          automation.mentions.users.forEach((user, i) => {
            Logger.log(`         User ${i + 1}: ID="${user.userId || user.userEmail}" Condition="${user.condition || 'always'}"`);
          });
        }
      }
    } else {
      Logger.log(`\n   👥 MENTIONS: Not configured`);
    }

    // Check channelNotify settings
    if (automation.channelNotify) {
      Logger.log(`\n   📢 CHANNEL NOTIFY SETTINGS:`);
      Logger.log(`      Enabled: ${automation.channelNotify.enabled ? 'YES ⚠️' : 'NO'}`);
      if (automation.channelNotify.enabled) {
        Logger.log(`      Type: ${automation.channelNotify.type || 'N/A'}`);
        Logger.log(`      Use @here: ${automation.channelNotify.useHere ? 'YES' : 'NO'}`);
        Logger.log(`      Condition: ${automation.channelNotify.condition || 'N/A'}`);
      }
    } else {
      Logger.log(`\n   📢 CHANNEL NOTIFY: Not configured`);
    }

    Logger.log("\n" + "-".repeat(80));
  });

  Logger.log("\n" + "=".repeat(80));
  Logger.log("RECOMMENDATION:");
  Logger.log("If you see mentions or channelNotify ENABLED for leaderboard automations,");
  Logger.log("and you don't want tagging, disable them in the Automation Scheduler UI.");
  Logger.log("=".repeat(80));
}
