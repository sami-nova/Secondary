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
    Logger.log("Is Bulk: " + isBulk);
    Logger.log("Has allRows: " + (allRows ? "YES" : "NO"));

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

    // STEP 1: Determine if we should update existing message or send new
    let updateExisting = false;
    let existingTs = null;

    if (automation.messageUpdate && automation.messageUpdate.enabled) {
      const strategy = automation.messageUpdate.strategy || 'none';

      if (strategy === 'update_by_id' && automation.messageUpdate.messageId) {
        updateExisting = true;
        existingTs = automation.messageUpdate.messageId;
      } else if (strategy === 'update_last') {
        // Get last message sent by this automation
        const lastMessage = getLastMessageByAutomation(automation.id);
        if (lastMessage && lastMessage.timestamp) {
          updateExisting = true;
          existingTs = lastMessage.timestamp;
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

    // STEP 3: FEATURE 1 - Add Color-Coded Alert
    let alertLevel = evaluateAlertLevel(automation, rowData);

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

    // STEP 4: FEATURE 2 & 3 - Add Mentions (@user and @channel)
    const mentions = buildMentions(automation, rowData);
    if (mentions.length > 0) {
      const mentionText = formatMentions(mentions);
      if (payload.text) {
        payload.text = mentionText + '\n\n' + payload.text;
      } else {
        payload.text = mentionText;
      }
    }

    // STEP 5: FEATURE 4 - Add Interactive Buttons
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

    // STEP 6: Add channel to payload
    if (botToken) {
      payload.channel = channel;
    }

    // Add advanced Slack options
    if (automation.slackOptions) {
      if (automation.slackOptions.username) payload.username = automation.slackOptions.username;
      if (automation.slackOptions.icon_emoji) payload.icon_emoji = automation.slackOptions.icon_emoji;
      if (automation.slackOptions.icon_url) payload.icon_url = automation.slackOptions.icon_url;
    }

    // STEP 7: Send or Update Message
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

    // STEP 8: FEATURE 6 - Add Auto-Reactions
    if (botToken && messageTs && automation.reactions && automation.reactions.enabled) {
      const reactions = getReactionsForAlert(alertLevel, automation);
      if (reactions.length > 0) {
        Logger.log(`Adding ${reactions.length} reactions...`);
        addReactions(channel, messageTs, reactions);
      }
    }

    // STEP 9: FEATURE 8 - Send to Multiple Channels
    if (automation.multiChannel && automation.multiChannel.enabled) {
      Logger.log("Sending to additional channels...");
      const multiResults = sendToMultipleChannels(automation, payload, channel);
      if (multiResults) {
        Logger.log(`Sent to ${multiResults.length} additional channels`);
      }
    }

    // STEP 10: FEATURE 9 - Attach Files
    if (botToken && automation.fileAttachments && automation.fileAttachments.enabled) {
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

    // STEP 11: FEATURE 10 - Send Threaded Updates
    if (botToken && automation.threading && automation.threading.enabled && isBulk && allRows) {
      Logger.log("Creating threaded message...");
      sendThreadedMessage(automation, allRows, channel);
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
