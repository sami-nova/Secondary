/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SLACK ADVANCED FEATURES INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file integrates all advanced features into the message sending flow
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * SEND ENHANCED SLACK MESSAGE - Main function with all advanced features
 * This wraps the original sendSlackMessage with advanced capabilities
 */
function sendEnhancedSlackMessage(automation, rowData, rowNumber, isBulk = false, allRows = null) {
  try {
    Logger.log("=== SENDING ENHANCED SLACK MESSAGE ===");
    Logger.log("Automation ID: " + automation.id);
    Logger.log("Automation Name: " + automation.name);
    Logger.log("Is Bulk: " + isBulk);
    Logger.log("Has allRows: " + (allRows ? "YES" : "NO"));

    // Log which advanced features are enabled
    Logger.log("\n=== ADVANCED FEATURES STATUS ===");
    Logger.log("Channel Notify: " + (automation.channelNotify && automation.channelNotify.enabled ? "ENABLED (" + automation.channelNotify.type + ")" : "DISABLED"));
    Logger.log("Auto-Reactions: " + (automation.reactions && automation.reactions.enabled ? "ENABLED" : "DISABLED"));
    Logger.log("Progress Bars: " + (automation.progressBars && automation.progressBars.enabled ? "ENABLED (value: " + (automation.progressBars.valueColumn || "?") + ", goal: " + (automation.progressBars.goalColumn || "?") + ")" : "DISABLED"));
    Logger.log("Color Alerts: " + (automation.colorAlerts && automation.colorAlerts.enabled ? "ENABLED" : "DISABLED"));
    Logger.log("User Mentions: " + (automation.mentions && automation.mentions.enabled ? "ENABLED" : "DISABLED"));
    Logger.log("Interactive Buttons: " + (automation.buttons && automation.buttons.enabled ? "ENABLED" : "DISABLED"));
    Logger.log("Message Update: " + (automation.messageUpdate && automation.messageUpdate.enabled ? "ENABLED" : "DISABLED"));
    Logger.log("Multi-Channel: " + (automation.multiChannel && automation.multiChannel.enabled ? "ENABLED" : "DISABLED"));
    Logger.log("File Attachments: " + (automation.fileAttachments && automation.fileAttachments.enabled ? "ENABLED" : "DISABLED"));
    Logger.log("Threading: " + (automation.threading && automation.threading.enabled ? "ENABLED" : "DISABLED"));
    Logger.log("=================================\n");

    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");
    const webhookUrl = automation.slackWebhookUrl || '';

    if (!botToken && !webhookUrl) {
      Logger.log("ERROR: No bot token or webhook URL");
      return { success: false, error: "Slack Bot Token or Webhook URL is missing." };
    }

    // Get primary channel
    const properties = PropertiesService.getScriptProperties();
    const channel = automation.slackChannel ||
                   properties.getProperty("SLACK_CHANNEL") ||
                   properties.getProperty("SlackChannel");

    if (botToken && !channel) {
      Logger.log("ERROR: No channel specified");
      return { success: false, error: "Slack channel is required when using bot token." };
    }

    Logger.log("Channel: " + channel);
    Logger.log("Using bot token: " + (botToken ? "YES" : "NO"));

    // STEP 1: Determine if we should update existing message or send new or reply to thread
    let updateExisting = false;
    let existingTs = null;
    let replyToThread = false;
    let threadTs = null;

    if (automation.messageUpdate && automation.messageUpdate.enabled) {
      const strategy = automation.messageUpdate.strategy || 'none';

      if (strategy === 'update_by_id' && automation.messageUpdate.messageId) {
        updateExisting = true;
        existingTs = automation.messageUpdate.messageId;
        Logger.log("Strategy: Update specific message by ID");
      } else if (strategy === 'update_last') {
        // Get last message sent by this automation
        const lastMessage = getLastMessageByAutomation(automation.id);
        if (lastMessage && lastMessage.timestamp) {
          updateExisting = true;
          existingTs = lastMessage.timestamp;
          Logger.log("Strategy: Update last message");
        }
      } else if (strategy === 'thread_daily') {
        // NEW: Reply to last message as thread (for daily updates in same conversation)
        const lastMessage = getLastMessageByAutomation(automation.id);
        if (lastMessage && lastMessage.timestamp) {
          replyToThread = true;
          threadTs = lastMessage.timestamp;
          Logger.log(`Strategy: Reply to thread ${threadTs}`);
        } else {
          Logger.log("Strategy: thread_daily but no previous message found - will send new parent message");
        }
      }
    }

    // STEP 2: Build base payload
    let payload = {};

    const useFormattedOutput = automation.messageFormat &&
                               automation.messageFormat !== "simple" &&
                               automation.messageFormat !== "rich";

    if (useFormattedOutput && (isBulk || !isBulk)) {
      // Build formatted message
      if (isBulk && allRows) {
        payload = buildBeautifulReport(automation, allRows);
      } else {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(automation.targetSheet);
        if (sheet) {
          const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
          const rowValues = Object.keys(rowData).map(key => rowData[key] || "");
          payload = buildBeautifulReport(automation, {
            headers: headers,
            data: [rowValues]
          });
        } else {
          const messageProcessor = SlackLib.createMessageProcessor();
          const messageText = messageProcessor.processMessageTemplate(
            automation.messageTemplate,
            rowData,
            rowNumber
          );
          payload = { text: messageText };
        }
      }
    } else {
      const messageProcessor = SlackLib.createMessageProcessor();
      const messageText = messageProcessor.processMessageTemplate(
        automation.messageTemplate,
        rowData,
        rowNumber
      );
      payload = { text: messageText };
    }

    // Initialize alertLevel for use in reactions later
    let alertLevel = { level: 'info', color: '#439FE0', icon: 'ℹ️', prefix: '' };

    // STEP 3: FEATURE 1 - Add Color-Coded Alert (only if enabled)
    try {
      if (automation.colorAlerts && automation.colorAlerts.enabled && typeof evaluateAlertLevel === 'function') {
        alertLevel = evaluateAlertLevel(automation, rowData);

        if (alertLevel.level !== 'info' && payload.blocks) {
          // Add color to message using attachment (for color sidebar)
          if (!payload.attachments) {
            payload.attachments = [];
          }

          payload.attachments.push({
            color: alertLevel.color,
            blocks: payload.blocks
          });

          // Move blocks to attachment
          delete payload.blocks;

          // Add prefix to text
          if (alertLevel.prefix) {
            payload.text = `${alertLevel.icon} *${alertLevel.prefix}* - ${payload.text || ''}`;
          }
        }
      }
    } catch (error) {
      Logger.log("Warning: Color alert feature error: " + error.message);
    }

    // STEP 4: FEATURE 2 & 3 - Add Mentions (@user and @channel) (only if enabled)
    try {
      if ((automation.mentions && automation.mentions.enabled) ||
          (automation.channelNotify && automation.channelNotify.enabled)) {

        Logger.log(`Checking mention functions: buildMentions=${typeof buildMentions}, formatMentions=${typeof formatMentions}`);

        if (typeof buildMentions !== 'function') {
          Logger.log("⚠ WARNING: buildMentions function not found! SlackAdvancedFeatures.gs may not be loaded.");
          // Fallback: Add @channel directly if enabled
          if (automation.channelNotify && automation.channelNotify.enabled && automation.channelNotify.type === 'always') {
            Logger.log("✓ Using fallback: Adding @channel directly");
            const mentionText = '<!channel>';
            if (payload.text) {
              payload.text = mentionText + '\n\n' + payload.text;
            } else {
              payload.text = mentionText;
            }
          }
        } else {
          const mentions = buildMentions(automation, rowData);
          Logger.log(`✓ Built ${mentions.length} mentions`);
          if (mentions.length > 0 && typeof formatMentions === 'function') {
            const mentionText = formatMentions(mentions);
            Logger.log(`✓ Mention text: "${mentionText}"`);
            if (payload.text) {
              payload.text = mentionText + '\n\n' + payload.text;
            } else {
              payload.text = mentionText;
            }
            Logger.log(`✓ Added mentions to payload.text`);
          } else {
            Logger.log(`⚠ No mentions generated (empty array returned from buildMentions)`);
          }
        }
      }
    } catch (error) {
      Logger.log("❌ Mentions feature error: " + error.message);
      Logger.log("Stack: " + error.stack);
    }

    // STEP 5: FEATURE 4 - Add Interactive Buttons (only if enabled)
    try {
      if (automation.buttons && automation.buttons.enabled && typeof buildActionButtons === 'function') {
        const buttonBlock = buildActionButtons(automation, rowData);
        if (buttonBlock) {
          if (payload.attachments && payload.attachments[0] && payload.attachments[0].blocks) {
            payload.attachments[0].blocks.push(buttonBlock);
          } else if (payload.blocks) {
            payload.blocks.push(buttonBlock);
          } else {
            payload.blocks = [buttonBlock];
          }
        }
      }
    } catch (error) {
      Logger.log("Warning: Buttons feature error: " + error.message);
    }

    // STEP 6: Add channel to payload
    if (botToken) {
      payload.channel = channel;
    }

    // Add thread_ts if replying to thread (NEW FEATURE)
    if (replyToThread && threadTs) {
      payload.thread_ts = threadTs;
      Logger.log(`✓ Adding to thread: ${threadTs}`);
    }

    // Add advanced Slack options
    if (automation.slackOptions) {
      if (automation.slackOptions.username) payload.username = automation.slackOptions.username;
      if (automation.slackOptions.icon_emoji) payload.icon_emoji = automation.slackOptions.icon_emoji;
      if (automation.slackOptions.icon_url) payload.icon_url = automation.slackOptions.icon_url;
    }

    // STEP 7: Send or Update Message or Reply to Thread
    let result;
    let messageTs;

    if (updateExisting && existingTs && botToken) {
      // FEATURE 5 - Update existing message
      Logger.log(`Updating existing message: ${existingTs}`);
      result = updateSlackMessage(automation, channel, existingTs, payload);
      messageTs = existingTs;
    } else {
      // Send new message
      const options = {
        method: "post",
        headers: botToken ? {
          "Authorization": "Bearer " + botToken,
          "Content-Type": "application/json"
        } : {
          "Content-Type": "application/json"
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const url = botToken ? "https://slack.com/api/chat.postMessage" : (webhookUrl || "");
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();

      if (responseCode !== 200) {
        throw new Error(`Slack returned error code ${responseCode}: ${response.getContentText()}`);
      }

      const apiResult = botToken ? JSON.parse(response.getContentText()) : { ok: true };

      if (botToken && !apiResult.ok) {
        throw new Error(`Slack API error: ${apiResult.error}`);
      }

      result = { success: true };
      messageTs = apiResult.ts;

      // Store message for future reference
      if (botToken && apiResult.ok && apiResult.ts && apiResult.channel) {
        storeSentMessage({
          automationId: automation.id,
          automationName: automation.name,
          timestamp: apiResult.ts,
          channel: apiResult.channel,
          sentAt: new Date().toISOString(),
          rowCount: (allRows && allRows.data) ? allRows.data.length : 1
        });

        // Save message ID to automation config if update strategy is enabled
        if (automation.messageUpdate && automation.messageUpdate.enabled) {
          if (automation.messageUpdate.strategy === 'update_by_id') {
            automation.messageUpdate.messageId = apiResult.ts;
            // Update automation in storage
            saveAutomationMessageId(automation.id, apiResult.ts);
          }
        }
      }
    }

    // STEP 8: FEATURE 6 - Add Auto-Reactions (only if enabled)
    try {
      if (botToken && messageTs && automation.reactions && automation.reactions.enabled &&
          typeof getReactionsForAlert === 'function' && typeof addReactions === 'function') {
        const reactions = getReactionsForAlert(alertLevel, automation);
        Logger.log(`✓ Got ${reactions.length} reactions for alert level: ${alertLevel.level}`);
        Logger.log(`✓ Reactions list: ${JSON.stringify(reactions)}`);
        if (reactions.length > 0) {
          Logger.log(`✓ Adding ${reactions.length} reactions to message ${messageTs}...`);
          const reactionResult = addReactions(channel, messageTs, reactions);
          Logger.log(`✓ Reaction result: ${JSON.stringify(reactionResult)}`);
        } else {
          Logger.log(`⚠ No reactions to add (empty list)`);
        }
      } else {
        Logger.log(`⚠ Skipping reactions: botToken=${!!botToken}, messageTs=${!!messageTs}, enabled=${!!(automation.reactions && automation.reactions.enabled)}`);
      }
    } catch (error) {
      Logger.log("Warning: Reactions feature error: " + error.message);
    }

    // STEP 9: FEATURE 8 - Send to Multiple Channels (only if enabled)
    try {
      if (automation.multiChannel && automation.multiChannel.enabled && typeof sendToMultipleChannels === 'function') {
        Logger.log("Sending to additional channels...");
        const multiResults = sendToMultipleChannels(automation, payload, channel);
        if (multiResults) {
          Logger.log(`Sent to ${multiResults.length} additional channels`);
        }
      }
    } catch (error) {
      Logger.log("Warning: Multi-channel feature error: " + error.message);
    }

    // STEP 10: FEATURE 9 - Attach Files (only if enabled)
    try {
      if (botToken && automation.fileAttachments && automation.fileAttachments.enabled &&
          typeof exportSheetAsFile === 'function' && typeof uploadFileToSlack === 'function') {
        Logger.log("Attaching files...");
        for (const attachment of automation.fileAttachments.files || []) {
          if (attachment.type === 'export_sheet') {
            const fileResult = exportSheetAsFile(attachment.sheetName || automation.targetSheet, attachment.format || 'xlsx');
            if (fileResult.success) {
              uploadFileToSlack(channel, fileResult.blob, fileResult.filename, attachment.comment || '');
            }
          }
        }
      }
    } catch (error) {
      Logger.log("Warning: File attachments feature error: " + error.message);
    }

    // STEP 11: FEATURE 10 - Send Threaded Updates (only if enabled)
    try {
      if (botToken && automation.threading && automation.threading.enabled && isBulk && allRows &&
          typeof sendThreadedMessage === 'function') {
        Logger.log("Creating threaded message...");
        sendThreadedMessage(automation, allRows, channel);
      }
    } catch (error) {
      Logger.log("Warning: Threading feature error: " + error.message);
    }

    Logger.log("✅ Enhanced message sent successfully!");
    return { success: true };

  } catch (error) {
    Logger.log("❌ Error sending enhanced message: " + error.message);
    Logger.log("Error stack: " + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * HELPER: Get last message sent by automation
 */
function getLastMessageByAutomation(automationId) {
  try {
    const messages = getSentMessages();
    const automationMessages = messages.filter(m => m.automationId === automationId);

    if (automationMessages.length > 0) {
      // Sort by sentAt descending
      automationMessages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
      return automationMessages[0];
    }

    return null;
  } catch (error) {
    Logger.log("Error getting last message: " + error.message);
    return null;
  }
}

/**
 * HELPER: Save message ID to automation config
 */
function saveAutomationMessageId(automationId, messageTs) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const automationsData = properties.getProperty("slackAutomations");

    if (!automationsData) return;

    const automations = JSON.parse(automationsData);
    const automation = automations.find(a => a.id === automationId);

    if (automation) {
      if (!automation.messageUpdate) {
        automation.messageUpdate = { enabled: false };
      }
      automation.messageUpdate.messageId = messageTs;

      properties.setProperty("slackAutomations", JSON.stringify(automations));
      Logger.log(`Saved message ID ${messageTs} for automation ${automationId}`);
    }
  } catch (error) {
    Logger.log("Error saving message ID: " + error.message);
  }
}

/**
 * DEFAULT CONFIGURATION - Add default advanced feature configs to new automations
 */
function getDefaultAdvancedConfig() {
  return {
    // Feature 1: Color-Coded Alerts
    colorAlerts: {
      enabled: false,
      rules: [
        {
          level: 'critical',
          color: 'danger',
          icon: '🚨',
          prefix: 'CRITICAL',
          condition: { field: 'Forecast', operator: '<', value: '4.0' }
        },
        {
          level: 'warning',
          color: 'warning',
          icon: '⚠️',
          prefix: 'WARNING',
          condition: { field: 'Forecast', operator: '<', value: 'Plan' }
        },
        {
          level: 'success',
          color: 'good',
          icon: '✅',
          prefix: 'ON TRACK',
          condition: { field: 'Forecast', operator: '>=', value: 'Plan' }
        }
      ]
    },

    // Feature 2: User Mentions
    mentions: {
      enabled: false,
      users: [
        // { userId: 'U12345', condition: { field: 'Forecast', operator: '<', value: '4.0' }, message: 'Please investigate!' }
      ]
    },

    // Feature 3: Channel Notifications
    channelNotify: {
      enabled: false,
      type: 'conditional', // 'always', 'conditional', 'never'
      condition: { field: 'Forecast', operator: '<', value: '4.0' },
      useHere: false
    },

    // Feature 4: Interactive Buttons
    buttons: {
      enabled: false,
      actions: [
        // { label: '📊 View Report', action: 'url', url: 'https://docs.google.com/spreadsheets/d/...', style: 'primary' }
      ]
    },

    // Feature 5: Message Update Strategy
    messageUpdate: {
      enabled: false,
      strategy: 'none', // 'none', 'update_last', 'update_by_id'
      messageId: null
    },

    // Feature 6: Auto-Reactions
    reactions: {
      enabled: false,
      always: ['📊'], // Always add these
      rules: {
        critical: ['🚨', '🔥', '❌'],
        warning: ['⚠️', '📉'],
        success: ['✅', '🎯', '📈'],
        info: ['ℹ️']
      }
    },

    // Feature 7: Progress Bars
    progressBars: {
      enabled: false,
      valueColumn: 'Forecast',
      goalColumn: 'Plan',
      width: 20,
      style: 'blocks' // 'blocks', 'shaded', 'ascii'
    },

    // Feature 8: Multi-Channel
    multiChannel: {
      enabled: false,
      channels: [
        // { channel: '#exec-team', customize: true, format: 'compact', notifyChannel: true }
      ]
    },

    // Feature 9: File Attachments
    fileAttachments: {
      enabled: false,
      files: [
        // { type: 'export_sheet', sheetName: 'Net Churn', format: 'xlsx', comment: 'Weekly Report' }
      ]
    },

    // Feature 10: Threading
    threading: {
      enabled: false,
      filterTotal: true, // Filter out "Total" row from threads
      sortBy: null
    }
  };
}
