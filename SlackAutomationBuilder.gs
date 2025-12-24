/**
 * SCHEDULED BULK AUTOMATION - Executes saved automations on schedule
 */
function executeBulkSlackAutomation() {
  try {
    const automations = getSlackAutomations();

    // Find all enabled bulk automations
    const bulkAutomations = automations.filter(a =>
      a.enabled && a.triggerType === "bulkCriteria"
    );

    if (bulkAutomations.length === 0) {
      Logger.log("No enabled bulk automations found.");
      return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    bulkAutomations.forEach(automation => {
      try {
        // GET THE CORRECT SHEET (from automation config, not active sheet)
        const sheet = ss.getSheetByName(automation.targetSheet);

        if (!sheet) {
          Logger.log(`❌ Sheet "${automation.targetSheet}" not found for automation: ${automation.name}`);
          return;
        }

        const data = sheet.getDataRange().getDisplayValues();
        if (data.length < 2) {
          Logger.log(`⚠️ Sheet "${automation.targetSheet}" has no data rows.`);
          return;
        }

        const headers = data[0];
        const rows = data.slice(1);

        // Filter by criteria if any
        const matchingRows = filterRowsByCriteria(rows, automation.criteria, headers);

        if (matchingRows.length === 0) {
          Logger.log(`⚠️ No rows match criteria for automation: ${automation.name}`);
          return;
        }

        // Send consolidated message with improved formatting
        sendSlackMessage(automation, {}, 0, true, {
          headers: headers,
          data: matchingRows
        });

        Logger.log(`✅ Sent ${matchingRows.length} rows for automation: ${automation.name}`);
      } catch (error) {
        Logger.log(`Error executing automation "${automation.name}": ${error.message}`);
      }
    });

  } catch (error) {
    Logger.log("Bulk Automation Error: " + error.message);
  }
}

/**
 * SEND SLACK MESSAGE - supports both single row and bulk formatting with beautiful Block Kit
 */
function sendSlackMessage(automation, rowData, rowNumber, isBulk = false, allRows = null) {
  try {
    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");
    const webhookUrl = automation.slackWebhookUrl || getSlackWebhookUrl();

    if (!botToken && !webhookUrl) {
      throw new Error("Slack Bot Token or Webhook URL is missing.");
    }

    let payload = {};

    if (isBulk && allRows) {
      // USE BEAUTIFUL BLOCK KIT FORMAT FOR BULK MESSAGES
      payload = buildBeautifulReport(automation, allRows);
    } else {
      // SINGLE ROW MESSAGE
      const messageProcessor = SlackLib.createMessageProcessor();
      const messageText = messageProcessor.processMessageTemplate(
        automation.messageTemplate,
        rowData,
        rowNumber
      );
      payload = { text: messageText };
    }

    // Add advanced Slack options if present
    if (automation.slackOptions) {
      if (automation.slackOptions.username) payload.username = automation.slackOptions.username;
      if (automation.slackOptions.icon_emoji) payload.icon_emoji = automation.slackOptions.icon_emoji;
      if (automation.slackOptions.icon_url) payload.icon_url = automation.slackOptions.icon_url;
    }

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
    if (!url) throw new Error("No Slack endpoint configured.");

    const response = UrlFetchApp.fetch(url, options);
    const result = botToken ? JSON.parse(response.getContentText()) : response;

    if (botToken && !result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    Logger.log("✅ Message sent successfully");
    return { success: true };
  } catch (error) {
    Logger.log("Error sending Slack message: " + error.message);
    throw error;
  }
}

/**
 * BUILD BEAUTIFUL REPORT - Clean sections with proper visual hierarchy
 */
function buildBeautifulReport(automation, allRows) {
  const headers = allRows.headers;
  const rows = allRows.data;
  const messageHeader = automation.messageHeader || `📊 ${automation.name}`;

  // Filter out completely empty rows
  const validRows = rows.filter(row =>
    !row.every(cell => !cell || cell.toString().trim() === "")
  );

  if (validRows.length === 0) {
    return { text: "No data to display." };
  }

  const blocks = [];

  // ==================== HEADER ====================
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: messageHeader,
      emoji: true
    }
  });

  // ==================== TIMESTAMP ====================
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `📅 *Week Ending:* ${new Date().toLocaleDateString()} | 🕐 ${new Date().toLocaleTimeString()}`
    }
  });

  blocks.push({ type: "divider" });

  // ==================== DETECT REPORT TYPE ====================
  // Check if this looks like a metrics report (has specific columns)
  const hasMetrics = headers.some(h =>
    h.toLowerCase().includes("revenue") ||
    h.toLowerCase().includes("purchases") ||
    h.toLowerCase().includes("arpu")
  );

  const hasCategories = headers.some(h =>
    h.toLowerCase().includes("category") ||
    h.toLowerCase().includes("type") ||
    h.toLowerCase().includes("section")
  );

  if (hasMetrics && validRows.length <= 10) {
    // ==================== METRICS LAYOUT (for reports with key metrics) ====================
    validRows.forEach(row => {
      const fields = [];

      headers.forEach((header, index) => {
        const value = row[index] || "N/A";
        fields.push({
          type: "mrkdwn",
          text: `*${getEmojiForHeader(header)} ${header}*\n${formatValue(value, header)}`
        });
      });

      blocks.push({
        type: "section",
        fields: fields
      });
    });
  } else if (hasCategories) {
    // ==================== GROUPED LAYOUT (for category/section reports) ====================
    const categoryIndex = headers.findIndex(h =>
      h.toLowerCase().includes("category") ||
      h.toLowerCase().includes("type") ||
      h.toLowerCase().includes("section")
    );

    const grouped = {};
    const order = [];

    validRows.forEach(row => {
      const category = (row[categoryIndex] || "Other").toString().trim();
      if (!grouped[category]) {
        grouped[category] = [];
        order.push(category);
      }
      grouped[category].push(row);
    });

    order.forEach((category, idx) => {
      // Category Header
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${getCategoryEmoji(category)} ${category}*`
        }
      });

      // Category Data
      grouped[category].forEach(row => {
        const fields = [];
        headers.forEach((header, index) => {
          if (index !== categoryIndex) { // Skip category column
            const value = row[index] || "N/A";
            fields.push({
              type: "mrkdwn",
              text: `*${header}:* ${formatValue(value, header)}`
            });
          }
        });

        if (fields.length > 0) {
          blocks.push({
            type: "section",
            fields: fields
          });
        }
      });

      if (idx < order.length - 1) {
        blocks.push({ type: "divider" });
      }
    });
  } else {
    // ==================== CARD LAYOUT (for general data) ====================
    validRows.forEach((row, rowIdx) => {
      const fields = [];

      headers.forEach((header, index) => {
        const value = row[index] || "N/A";
        fields.push({
          type: "mrkdwn",
          text: `*${header}:* ${formatValue(value, header)}`
        });
      });

      blocks.push({
        type: "section",
        fields: fields
      });

      if (rowIdx < validRows.length - 1) {
        blocks.push({ type: "divider" });
      }
    });
  }

  // ==================== FOOTER ====================
  blocks.push({ type: "divider" });
  blocks.push({
    type: "context",
    elements: [{
      type: "mrkdwn",
      text: `📊 Total Records: *${validRows.length}* | Generated by ${automation.name}`
    }]
  });

  return { blocks: blocks };
}

/**
 * FORMAT VALUE - Smart formatting based on content
 */
function formatValue(value, header) {
  const str = value.toString().trim();
  const lower = header.toLowerCase();

  // Currency formatting
  if (lower.includes("revenue") || lower.includes("arpu") || lower.includes("price") || lower.includes("amount")) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
  }

  // Percentage formatting
  if (lower.includes("percent") || lower.includes("%") || lower.includes("rate") || lower.includes("plan")) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      // Add trend emoji
      if (num >= 100 || num >= 90) {
        return `${num.toFixed(1)}% 📈`;
      } else if (num >= 80) {
        return `${num.toFixed(1)}% ⚠️`;
      } else {
        return `${num.toFixed(1)}% 📉`;
      }
    }
  }

  // Number formatting (purchases, count, etc)
  if (lower.includes("purchase") || lower.includes("count") || lower.includes("total") || lower.includes("quantity")) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
  }

  // Status formatting
  if (lower.includes("status")) {
    if (str.toLowerCase().includes("complete") || str.toLowerCase().includes("success") || str.toLowerCase().includes("approved")) {
      return `✅ ${str}`;
    } else if (str.toLowerCase().includes("pending") || str.toLowerCase().includes("progress")) {
      return `⏳ ${str}`;
    } else if (str.toLowerCase().includes("fail") || str.toLowerCase().includes("error") || str.toLowerCase().includes("reject")) {
      return `❌ ${str}`;
    } else if (str.toLowerCase().includes("below")) {
      return `⚠️ ${str}`;
    }
  }

  return str;
}

/**
 * GET EMOJI FOR HEADER - Visual indicators
 */
function getEmojiForHeader(header) {
  const lower = header.toLowerCase();

  if (lower.includes("revenue")) return "💰";
  if (lower.includes("purchase")) return "🛒";
  if (lower.includes("arpu")) return "📊";
  if (lower.includes("plan") || lower.includes("achievement")) return "📈";
  if (lower.includes("call")) return "📞";
  if (lower.includes("process")) return "⚙️";
  if (lower.includes("paid")) return "💳";
  if (lower.includes("target")) return "🎯";
  if (lower.includes("status")) return "🚦";
  if (lower.includes("date")) return "📅";
  if (lower.includes("time")) return "🕐";
  if (lower.includes("region")) return "🌍";
  if (lower.includes("performance")) return "📊";

  return "▪️";
}

/**
 * GET CATEGORY EMOJI - Category-specific icons
 */
function getCategoryEmoji(category) {
  const lower = category.toLowerCase();

  if (lower.includes("paid") && lower.includes("time")) return "✅";
  if (lower.includes("paid") && lower.includes("advance")) return "⏰";
  if (lower.includes("churn") && lower.includes("prevention")) return "💧";
  if (lower.includes("churn")) return "❌";
  if (lower.includes("killer") || lower.includes("base")) return "👁️";
  if (lower.includes("metric")) return "📊";
  if (lower.includes("procedure")) return "📋";
  if (lower.includes("regional") || lower.includes("region")) return "🌍";

  return "📦";
}

/**
 * TEST AUTOMATION - sends ALL rows as consolidated message
 */
function testSlackAutomation(automationId) {
  try {
    const automations = getSlackAutomations();
    const automation = automations.find(a => a.id === automationId);

    if (!automation) {
      throw new Error(`Automation with ID ${automationId} not found.`);
    }

    if (!automation.messageTemplate) {
      throw new Error("Automation is missing messageTemplate. Please edit and re-save it.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.targetSheet);

    if (!sheet) {
      throw new Error(`Sheet "${automation.targetSheet}" not found.`);
    }

    const data = sheet.getDataRange().getDisplayValues();
    if (data.length < 2) {
      throw new Error("Sheet has no data rows to test with.");
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Filter by criteria if any
    const matchingRows = filterRowsByCriteria(rows, automation.criteria, headers);

    if (matchingRows.length === 0) {
      throw new Error("No rows match the automation criteria.");
    }

    // Send consolidated message with beautiful formatting
    sendSlackMessage(automation, {}, 0, true, {
      headers: headers,
      data: matchingRows
    });

    return {
      success: true,
      message: `✅ Test message sent! Included ${matchingRows.length} matching rows in 1 beautifully formatted message.`
    };
  } catch (error) {
    Logger.log("Test Error: " + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * TRIGGER MANAGEMENT
 */
function saveAutomation(automationConfig) {
  try {
    const automations = getSlackAutomations();
    const automationManager = SlackLib.createAutomationManager();
    const result = automationManager.processAutomations(automations, automationConfig);

    if (result.success) {
      const triggerIds = createSlackTriggers(automationConfig);
      const updatedAutomations = automationManager.updateTriggerIds(
        result.automations,
        result.id,
        triggerIds
      );

      PropertiesService.getScriptProperties().setProperty(
        "slackAutomations",
        JSON.stringify(updatedAutomations)
      );

      return { success: true, id: result.id };
    }
    return result;
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function createSlackTriggers(automation) {
  deleteSlackTriggers(automation.id);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!automation.triggerIds) automation.triggerIds = [];

  switch (automation.triggerType) {
    case "onNewRow":
    case "onColumnUpdate":
      const editTriggerId = getOrCreateOnEditTrigger(ss);
      if (editTriggerId) automation.triggerIds.push(editTriggerId);
      break;
    case "bulkCriteria":
      if (automation.schedule && automation.schedule.enabled) {
        const schedId = createScheduledTrigger(automation.schedule);
        if (schedId) automation.triggerIds.push(schedId);
      }
      break;
  }
  return automation.triggerIds;
}

function createScheduledTrigger(schedule) {
  let trigger = ScriptApp.newTrigger("executeBulkSlackAutomation").timeBased();

  if (schedule.frequency === "daily") {
    trigger = trigger.everyDays(1).atHour(schedule.hour || 9);
  } else if (schedule.frequency === "weekly") {
    trigger = trigger.everyWeeks(1)
      .onWeekDay(ScriptApp.WeekDay[schedule.weekDay || "MONDAY"])
      .atHour(schedule.hour || 9);
  } else if (schedule.frequency === "hourly") {
    trigger = trigger.everyHours(schedule.hours || 1);
  }

  return trigger.create().getUniqueId();
}

function cleanupDuplicateTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  const seen = {};
  let deleted = 0;

  triggers.forEach(trigger => {
    const key = trigger.getHandlerFunction() + "_" + trigger.getEventType();
    if (seen[key]) {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    } else {
      seen[key] = true;
    }
  });

  SpreadsheetApp.getUi().alert(`✅ Cleaned up ${deleted} duplicate triggers`);
}

/**
 * UTILITY HELPERS
 */
function getSlackAutomations() {
  try {
    const stored = PropertiesService.getScriptProperties().getProperty("slackAutomations");
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function deleteSlackTriggers(automationId) {
  try {
    const automations = getSlackAutomations();
    const auto = automations.find(a => a.id === automationId);
    if (!auto || !auto.triggerIds) return;

    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      if (auto.triggerIds.includes(t.getUniqueId())) {
        ScriptApp.deleteTrigger(t);
      }
    });
  } catch (e) {
    Logger.log("Error deleting triggers: " + e.message);
  }
}

function getOrCreateOnEditTrigger(ss) {
  const triggers = ScriptApp.getProjectTriggers();
  const existing = triggers.find(t =>
    t.getHandlerFunction() === "onSlackTriggerChange" &&
    t.getEventType() === ScriptApp.EventType.ON_EDIT
  );
  if (existing) return existing.getUniqueId();
  return ScriptApp.newTrigger("onSlackTriggerChange")
    .forSpreadsheet(ss)
    .onEdit()
    .create()
    .getUniqueId();
}

/**
 * Deletes a specific Slack message.
 * @param {string} channelId The ID of the channel containing the message.
 * @param {string} timestamp The 'ts' value of the message to be deleted.
 */
function deleteSlackMessage(channelId, timestamp) {
  const token = "YOUR_SLACK_BOT_TOKEN"; // Use your Bot User OAuth Token
  const url = "https://slack.com/api/chat.delete";

  const payload = {
    "channel": channelId,
    "ts": timestamp
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + token
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      console.log("Message deleted successfully.");
    } else {
      console.error("Error deleting message: " + result.error);
    }
  } catch (e) {
    console.error("Request failed: " + e.toString());
  }
}
