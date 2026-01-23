/**
 * DIAGNOSTIC TOOL FOR AUTO-REACTIONS
 * Run this to check if your auto-reactions are configured correctly
 */

function diagnoseAutoReactions() {
  try {
    Logger.log("\n=================================");
    Logger.log("AUTO-REACTIONS DIAGNOSTIC TOOL");
    Logger.log("=================================\n");

    // Step 1: Check bot token
    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");
    if (!botToken) {
      Logger.log("❌ CRITICAL: SLACK_BOT_TOKEN not found in Script Properties");
      Logger.log("   → Go to Project Settings > Script Properties");
      Logger.log("   → Add property: SLACK_BOT_TOKEN = xoxb-your-token");
      return;
    } else {
      Logger.log("✅ Bot token found (length: " + botToken.length + " chars)");
      Logger.log("   → Starts with: " + botToken.substring(0, 8) + "...");
    }

    // Step 2: Check automations
    const properties = PropertiesService.getScriptProperties();
    const automationsJson = properties.getProperty("SlackAutomations") || "[]";
    const automations = JSON.parse(automationsJson);

    Logger.log("\n📋 Found " + automations.length + " automation(s)");

    if (automations.length === 0) {
      Logger.log("⚠️ No automations configured");
      return;
    }

    // Step 3: Check each automation's reactions config
    automations.forEach((auto, idx) => {
      Logger.log("\n" + "─".repeat(50));
      Logger.log(`Automation ${idx + 1}: ${auto.name || 'Unnamed'}`);
      Logger.log("─".repeat(50));

      Logger.log(`Format: ${auto.format}`);
      Logger.log(`Target Channel: ${auto.channel}`);

      if (!auto.reactions) {
        Logger.log("❌ NO reactions configuration found");
        return;
      }

      Logger.log(`\nReactions Enabled: ${auto.reactions.enabled ? '✅ YES' : '❌ NO'}`);

      if (!auto.reactions.enabled) {
        Logger.log("   → Enable reactions in the automation settings");
        return;
      }

      // Check "always" reactions
      Logger.log("\n📌 Always Add These Reactions:");
      if (auto.reactions.always && auto.reactions.always.length > 0) {
        Logger.log(`   ✅ Configured: ${auto.reactions.always.join(', ')}`);
        Logger.log(`   → These will be added to every message`);
      } else {
        Logger.log("   ⚠️ None configured");
      }

      // Check conditional reactions
      Logger.log("\n🎯 Conditional Reactions (based on alert level):");
      if (auto.reactions.rules) {
        ['critical', 'warning', 'success', 'info'].forEach(level => {
          const emojis = auto.reactions.rules[level];
          if (emojis && emojis.length > 0) {
            Logger.log(`   ${level}: ${emojis.join(', ')}`);
          } else {
            Logger.log(`   ${level}: (none)`);
          }
        });
      } else {
        Logger.log("   ⚠️ No conditional rules configured");
      }

      // For leaderboards, show what will be used
      const isLeaderboard = auto.format === 'leaderboard' ||
                           auto.format === 'leaderboard_combined' ||
                           (auto.messageFormat && auto.messageFormat.includes('leaderboard'));

      if (isLeaderboard) {
        Logger.log("\n🏆 LEADERBOARD DETECTED");
        Logger.log("   → Alert level will be set to: 'success'");

        const expectedReactions = [];

        // Add always reactions
        if (auto.reactions.always) {
          expectedReactions.push(...auto.reactions.always);
        }

        // Add success-level reactions
        if (auto.reactions.rules && auto.reactions.rules.success) {
          expectedReactions.push(...auto.reactions.rules.success);
        }

        if (expectedReactions.length > 0) {
          Logger.log(`   → Expected reactions: ${expectedReactions.join(', ')}`);
          Logger.log(`   → Total: ${expectedReactions.length} emoji(s)`);
        } else {
          Logger.log("   ❌ WARNING: No reactions will be added!");
          Logger.log("   → Configure 'always' reactions OR 'success' reactions");
        }
      }
    });

    Logger.log("\n" + "=".repeat(50));
    Logger.log("DIAGNOSTIC COMPLETE");
    Logger.log("=".repeat(50));

    // Step 4: Test the getReactionsForAlert function
    Logger.log("\n🧪 TESTING getReactionsForAlert()...");

    const testAuto = automations[0];
    if (testAuto && testAuto.reactions && testAuto.reactions.enabled) {
      const testAlertLevel = { level: 'success' };

      if (typeof getReactionsForAlert === 'function') {
        const result = getReactionsForAlert(testAlertLevel, testAuto);
        Logger.log(`   Input: alertLevel = ${testAlertLevel.level}`);
        Logger.log(`   Output: ${JSON.stringify(result)}`);
        Logger.log(`   Count: ${result.length} emoji(s)`);

        if (result.length === 0) {
          Logger.log("   ❌ WARNING: Function returned empty array");
          Logger.log("   → Check that 'success' level has reactions configured");
        } else {
          Logger.log("   ✅ Function is working correctly");
        }
      } else {
        Logger.log("   ❌ ERROR: getReactionsForAlert function not found");
      }
    }

    Logger.log("\n💡 NEXT STEPS:");
    Logger.log("1. If bot token is missing, add it to Script Properties");
    Logger.log("2. If reactions config is empty, configure in automation UI");
    Logger.log("3. Run your leaderboard automation");
    Logger.log("4. Check execution logs for detailed reaction debugging");

  } catch (error) {
    Logger.log("\n❌ ERROR during diagnostic:");
    Logger.log(error.message);
    Logger.log(error.stack);
  }
}

/**
 * Quick test to manually add a reaction to a message
 * Usage: testAddReaction('C1234567890', '1234567890.123456', 'fire')
 */
function testAddReaction(channel, timestamp, emojiName) {
  Logger.log("\n🧪 MANUAL REACTION TEST");
  Logger.log(`Channel: ${channel}`);
  Logger.log(`Timestamp: ${timestamp}`);
  Logger.log(`Emoji: ${emojiName}`);

  if (typeof addReactions === 'function') {
    const result = addReactions(channel, timestamp, [emojiName]);
    Logger.log("\nResult: " + JSON.stringify(result));
  } else {
    Logger.log("❌ addReactions function not found");
  }
}
