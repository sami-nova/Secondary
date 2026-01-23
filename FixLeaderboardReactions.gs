/**
 * FIX AUTO-REACTIONS FOR LEADERBOARD
 *
 * This script will:
 * 1. Check if you have a leaderboard automation
 * 2. If not, create one with reactions enabled
 * 3. If yes, update it to enable reactions
 *
 * Run this once to fix the issue, then your scheduled leaderboard will have reactions!
 */

function fixLeaderboardReactions() {
  Logger.log("🔧 FIXING LEADERBOARD REACTIONS\n");

  // Get existing automations
  const properties = PropertiesService.getScriptProperties();
  const automationsJson = properties.getProperty("SlackAutomations") || "[]";
  let automations = JSON.parse(automationsJson);

  Logger.log(`Found ${automations.length} existing automation(s)`);

  // Find leaderboard automation
  let leaderboardAuto = automations.find(a =>
    a.format === 'leaderboard_combined' ||
    a.format === 'leaderboard' ||
    (a.messageFormat && a.messageFormat.includes('leaderboard'))
  );

  if (leaderboardAuto) {
    Logger.log(`\n✓ Found leaderboard automation: "${leaderboardAuto.name}"`);

    // Update reactions
    leaderboardAuto.reactions = {
      enabled: true,
      always: ["fire"],
      rules: {
        critical: ["rotating_light", "fire", "x"],
        warning: ["warning", "fire"],
        success: ["fire", "white_check_mark", "dart"],
        info: []
      }
    };

    Logger.log("✓ Updated reactions configuration");
    Logger.log("  - Always: fire");
    Logger.log("  - Success: fire, white_check_mark, dart");

  } else {
    Logger.log("\n⚠️ No leaderboard automation found. Creating one...");

    // Create new leaderboard automation
    leaderboardAuto = {
      id: "leaderboard-" + Date.now(),
      name: "Weekly Leaderboard with Reactions",
      enabled: true,
      format: "leaderboard_combined",
      targetSheet: "Weekly Leaderboard",
      channel: "YOUR_CHANNEL_ID", // ← User needs to update this

      // Reactions enabled
      reactions: {
        enabled: true,
        always: ["fire"],
        rules: {
          critical: ["rotating_light", "fire", "x"],
          warning: ["warning", "fire"],
          success: ["fire", "white_check_mark", "dart"],
          info: []
        }
      },

      // Other features disabled
      colorAlerts: { enabled: false },
      mentions: { enabled: false },
      channelNotify: { enabled: false },
      progressBars: { enabled: false },
      buttons: { enabled: false },
      messageUpdate: { enabled: false },
      multiChannel: { enabled: false }
    };

    automations.push(leaderboardAuto);
    Logger.log("✓ Created new leaderboard automation");
    Logger.log("⚠️ IMPORTANT: Update the 'channel' field with your Slack channel ID!");
  }

  // Save back to properties
  properties.setProperty("SlackAutomations", JSON.stringify(automations));
  Logger.log("\n✅ SAVED! Reactions are now enabled.");

  Logger.log("\n📋 Current configuration:");
  Logger.log(`  Name: ${leaderboardAuto.name}`);
  Logger.log(`  Channel: ${leaderboardAuto.channel}`);
  Logger.log(`  Reactions enabled: ${leaderboardAuto.reactions.enabled}`);
  Logger.log(`  Always reactions: ${leaderboardAuto.reactions.always.join(', ')}`);

  Logger.log("\n🎯 Next steps:");
  Logger.log("1. If you created a new automation, update the channel ID in the UI");
  Logger.log("2. Run your leaderboard function");
  Logger.log("3. The fire emoji will be added automatically!");

  return leaderboardAuto;
}


/**
 * CHECK CURRENT REACTIONS CONFIG
 * Run this to see what's currently configured
 */
function checkReactionsConfig() {
  const properties = PropertiesService.getScriptProperties();
  const automationsJson = properties.getProperty("SlackAutomations") || "[]";
  const automations = JSON.parse(automationsJson);

  Logger.log("=".repeat(50));
  Logger.log("CURRENT REACTIONS CONFIGURATION");
  Logger.log("=".repeat(50));

  if (automations.length === 0) {
    Logger.log("\n❌ NO AUTOMATIONS FOUND");
    Logger.log("   → Run fixLeaderboardReactions() to create one");
    return;
  }

  automations.forEach((auto, idx) => {
    Logger.log(`\n[${idx + 1}] ${auto.name || 'Unnamed'}`);
    Logger.log(`    Format: ${auto.format}`);
    Logger.log(`    Channel: ${auto.channel}`);

    if (auto.reactions && auto.reactions.enabled) {
      Logger.log(`    Reactions: ✅ ENABLED`);
      Logger.log(`      Always: ${auto.reactions.always ? auto.reactions.always.join(', ') : 'none'}`);

      if (auto.reactions.rules) {
        Logger.log(`      Success: ${auto.reactions.rules.success ? auto.reactions.rules.success.join(', ') : 'none'}`);
      }
    } else {
      Logger.log(`    Reactions: ❌ DISABLED`);
    }
  });

  Logger.log("\n" + "=".repeat(50));
}


/**
 * ENABLE REACTIONS FOR ALL LEADERBOARDS
 * Finds all leaderboard automations and enables fire reaction
 */
function enableReactionsForAllLeaderboards() {
  const properties = PropertiesService.getScriptProperties();
  const automationsJson = properties.getProperty("SlackAutomations") || "[]";
  let automations = JSON.parse(automationsJson);

  let updated = 0;

  automations.forEach(auto => {
    const isLeaderboard = auto.format === 'leaderboard_combined' ||
                         auto.format === 'leaderboard' ||
                         (auto.messageFormat && auto.messageFormat.includes('leaderboard'));

    if (isLeaderboard) {
      Logger.log(`Updating: ${auto.name}`);

      auto.reactions = {
        enabled: true,
        always: ["fire"],
        rules: {
          critical: ["rotating_light", "fire", "x"],
          warning: ["warning", "fire"],
          success: ["fire", "white_check_mark", "dart"],
          info: []
        }
      };

      updated++;
    }
  });

  if (updated > 0) {
    properties.setProperty("SlackAutomations", JSON.stringify(automations));
    Logger.log(`\n✅ Updated ${updated} leaderboard automation(s)`);
  } else {
    Logger.log("\n⚠️ No leaderboard automations found");
  }
}
