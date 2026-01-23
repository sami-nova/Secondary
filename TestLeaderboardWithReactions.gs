/**
 * TEST FUNCTION: Send Weekly Leaderboard with Fire Reaction
 *
 * This function sends your leaderboard with auto-reactions enabled.
 * It bypasses the automation scheduler and directly sends with reactions.
 *
 * USAGE:
 * 1. Replace YOUR_CHANNEL_ID with your actual Slack channel ID
 * 2. Run this function: testLeaderboardWithReactions()
 * 3. Check your Slack channel for the message with 🔥 reaction
 */

function testLeaderboardWithReactions() {
  // CONFIGURE THIS: Replace with your Slack channel ID (e.g., "C1234567890")
  const channel = "YOUR_CHANNEL_ID"; // ← CHANGE THIS!

  Logger.log("🚀 Starting leaderboard test with reactions...");

  // Create a mock automation object with reactions enabled
  const automation = {
    id: "test-leaderboard-" + Date.now(),
    name: "Test Weekly Leaderboard with Reactions",
    format: "leaderboard_combined",
    targetSheet: "Weekly Leaderboard",
    channel: channel,

    // REACTIONS CONFIGURATION - Fire emoji always added
    reactions: {
      enabled: true,
      always: ["fire"], // Always add fire emoji
      rules: {
        critical: ["rotating_light", "fire", "x"],
        warning: ["warning", "fire"],
        success: ["fire", "white_check_mark", "dart"],
        info: []
      }
    }
  };

  Logger.log("✓ Automation config created");
  Logger.log(`✓ Channel: ${channel}`);
  Logger.log(`✓ Reactions enabled: ${automation.reactions.enabled}`);
  Logger.log(`✓ Always reactions: ${automation.reactions.always.join(', ')}`);

  // Build the leaderboard message
  Logger.log("\n📊 Building leaderboard...");
  const payload = buildCombinedLeaderboardFromSheet(automation);

  if (!payload || !payload.blocks) {
    Logger.log("❌ Failed to build leaderboard");
    return;
  }

  Logger.log(`✓ Leaderboard built with ${payload.blocks.length} blocks`);

  // Send using advanced integration (which includes reactions)
  Logger.log("\n📤 Sending to Slack with reactions...");

  if (typeof sendAdvancedSlackMessage === 'function') {
    const result = sendAdvancedSlackMessage(automation, payload, null);
    Logger.log("\n✅ DONE! Check your Slack channel.");
    Logger.log(`Result: ${JSON.stringify(result)}`);
  } else {
    Logger.log("❌ sendAdvancedSlackMessage function not found");
    Logger.log("Falling back to basic send...");

    // Fallback: send without advanced features
    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");
    if (!botToken) {
      Logger.log("❌ No bot token found. Set SLACK_BOT_TOKEN in Script Properties.");
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

    if (result.ok && result.ts) {
      Logger.log(`✅ Message sent! Timestamp: ${result.ts}`);

      // Manually add reaction
      Logger.log("\n🔥 Adding fire reaction...");
      if (typeof addReactions === 'function') {
        const reactionResult = addReactions(channel, result.ts, ["fire"]);
        Logger.log(`Reaction result: ${JSON.stringify(reactionResult)}`);
      }
    } else {
      Logger.log(`❌ Failed to send: ${result.error}`);
    }
  }
}


/**
 * SIMPLE VERSION: Just send leaderboard with fire reaction
 * This version is more straightforward and easier to debug
 */
function simpleLeaderboardWithFire() {
  // STEP 1: Get your channel ID
  const channel = "YOUR_CHANNEL_ID"; // ← CHANGE THIS!

  Logger.log("Step 1: Building leaderboard blocks...");

  // Build leaderboard (without automation object)
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Weekly Leaderboard");

  if (!sheet) {
    Logger.log("❌ Sheet 'Weekly Leaderboard' not found!");
    return;
  }

  // Create minimal automation for building
  const tempAutomation = {
    targetSheet: "Weekly Leaderboard",
    format: "leaderboard_combined"
  };

  const payload = buildCombinedLeaderboardFromSheet(tempAutomation);

  if (!payload || !payload.blocks) {
    Logger.log("❌ Failed to build leaderboard");
    return;
  }

  Logger.log(`✓ Built leaderboard with ${payload.blocks.length} blocks`);

  // STEP 2: Send message
  Logger.log("\nStep 2: Sending to Slack...");

  const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");
  if (!botToken) {
    Logger.log("❌ Bot token not found! Add SLACK_BOT_TOKEN to Script Properties");
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

  if (!result.ok) {
    Logger.log(`❌ Send failed: ${result.error}`);
    return;
  }

  Logger.log(`✅ Message sent! Timestamp: ${result.ts}`);

  // STEP 3: Add fire reaction
  Logger.log("\nStep 3: Adding 🔥 reaction...");

  const reactionOptions = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + botToken,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({
      channel: channel,
      timestamp: result.ts,
      name: "fire"
    }),
    muteHttpExceptions: true
  };

  const reactionResponse = UrlFetchApp.fetch("https://slack.com/api/reactions.add", reactionOptions);
  const reactionResult = JSON.parse(reactionResponse.getContentText());

  if (reactionResult.ok) {
    Logger.log("✅ Fire reaction added successfully! 🔥");
  } else {
    Logger.log(`❌ Reaction failed: ${reactionResult.error}`);
    if (reactionResult.error === "missing_scope") {
      Logger.log("   → Your bot needs 'reactions:write' scope");
      Logger.log("   → Go to: https://api.slack.com/apps → Your App → OAuth & Permissions");
    }
  }

  Logger.log("\n🎉 DONE! Check your Slack channel!");
}
