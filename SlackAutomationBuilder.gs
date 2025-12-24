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
 * VALIDATE BLOCKS - Checks blocks against Slack's requirements
 */
function validateBlocks(blocks) {
  if (!blocks || !Array.isArray(blocks)) {
    return { valid: false, error: "Blocks must be an array" };
  }

  if (blocks.length === 0) {
    return { valid: false, error: "Blocks array cannot be empty" };
  }

  if (blocks.length > 50) {
    return { valid: false, error: `Too many blocks: ${blocks.length} (max 50)` };
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (!block.type) {
      return { valid: false, error: `Block ${i} missing type` };
    }

    // Check section blocks have valid fields
    if (block.type === "section" && block.fields) {
      if (!Array.isArray(block.fields)) {
        return { valid: false, error: `Block ${i} fields must be an array` };
      }

      if (block.fields.length > 10) {
        return { valid: false, error: `Block ${i} has ${block.fields.length} fields (max 10)` };
      }

      // Check each field
      for (let j = 0; j < block.fields.length; j++) {
        const field = block.fields[j];
        if (!field.type || !field.text) {
          return { valid: false, error: `Block ${i}, field ${j} missing type or text` };
        }

        if (field.text.length > 3000) {
          return { valid: false, error: `Block ${i}, field ${j} text too long: ${field.text.length} chars` };
        }
      }
    }

    // Check header blocks
    if (block.type === "header" && block.text) {
      if (block.text.text && block.text.text.length > 150) {
        return { valid: false, error: `Header block ${i} text too long: ${block.text.text.length} chars (max 150)` };
      }
    }

    // Check section text blocks
    if (block.type === "section" && block.text) {
      if (block.text.text && block.text.text.length > 3000) {
        return { valid: false, error: `Section block ${i} text too long: ${block.text.text.length} chars` };
      }
    }
  }

  return { valid: true };
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

    // Check if using formatted output (not legacy simple text)
    const useFormattedOutput = automation.messageFormat &&
                               automation.messageFormat !== "simple" &&
                               automation.messageFormat !== "rich";

    if (useFormattedOutput && (isBulk || !isBulk)) {
      // USE SELECTED FORMAT FOR BOTH SINGLE AND BULK MESSAGES
      if (isBulk && allRows) {
        // Bulk message with all rows
        payload = buildBeautifulReport(automation, allRows);
      } else {
        // Single row message - convert to allRows format
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
          // Fallback to plain text if sheet not found
          const messageProcessor = SlackLib.createMessageProcessor();
          const messageText = messageProcessor.processMessageTemplate(
            automation.messageTemplate,
            rowData,
            rowNumber
          );
          payload = { text: messageText };
        }
      }

      // Validate blocks before sending
      if (payload.blocks) {
        const validation = validateBlocks(payload.blocks);
        if (!validation.valid) {
          Logger.log(`❌ Block validation failed: ${validation.error}`);
          return { success: false, error: `Invalid Slack blocks: ${validation.error}` };
        }
      }
    } else {
      // LEGACY SIMPLE TEXT MESSAGE
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
    if (!url) {
      const errorMsg = "No Slack endpoint configured. Please set a webhook URL in the automation.";
      Logger.log(errorMsg);
      return { success: false, error: errorMsg };
    }

    Logger.log(`Sending to Slack: ${url.substring(0, 40)}...`);

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    Logger.log(`Slack response code: ${responseCode}`);

    if (responseCode !== 200) {
      const errorMsg = `Slack returned error code ${responseCode}: ${response.getContentText()}`;
      Logger.log(errorMsg);
      return { success: false, error: errorMsg };
    }

    const result = botToken ? JSON.parse(response.getContentText()) : { ok: true };

    if (botToken && !result.ok) {
      const errorMsg = `Slack API error: ${result.error}`;
      Logger.log(errorMsg);
      return { success: false, error: errorMsg };
    }

    Logger.log("✅ Message sent successfully to Slack");
    return { success: true };
  } catch (error) {
    Logger.log("Error sending Slack message: " + error.message);
    Logger.log("Error stack: " + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * EXTRACT FIELDS FROM TEMPLATE - Get field names from {{field}} placeholders
 */
function extractFieldsFromTemplate(template) {
  if (!template) return null;

  const fieldMatches = template.match(/\{\{([^}]+)\}\}/g);
  if (!fieldMatches) return null;

  const fields = [];
  fieldMatches.forEach(match => {
    const fieldName = match.replace(/\{\{|\}\}/g, '').trim();
    // Exclude special placeholders
    if (!['ROW_NUMBER', 'TIMESTAMP', 'DATE', 'TIME'].includes(fieldName)) {
      if (!fields.includes(fieldName)) {
        fields.push(fieldName);
      }
    }
  });

  return fields.length > 0 ? fields : null;
}

/**
 * FILTER HEADERS AND ROWS - Keep only specified fields
 */
function filterDataByFields(headers, rows, fieldsToInclude) {
  if (!fieldsToInclude || fieldsToInclude.length === 0) {
    return { headers: headers, rows: rows };
  }

  const filteredIndices = [];
  const filteredHeaders = [];

  // Find indices of fields to include
  fieldsToInclude.forEach(field => {
    const index = headers.indexOf(field);
    if (index !== -1) {
      filteredIndices.push(index);
      filteredHeaders.push(field);
    }
  });

  // Filter rows to only include selected columns
  const filteredRows = rows.map(row => {
    return filteredIndices.map(index => row[index] || "");
  });

  return { headers: filteredHeaders, rows: filteredRows };
}

/**
 * BUILD BEAUTIFUL REPORT - Supports multiple format types
 * Format options: inline, table, list, cards, plain
 */
function buildBeautifulReport(automation, allRows) {
  let headers = allRows.headers;
  let rows = allRows.data;
  const messageHeader = automation.messageHeader || automation.name;
  const format = automation.messageFormat || "inline"; // Default to inline

  // Extract fields from template if provided
  const fieldsToInclude = extractFieldsFromTemplate(automation.messageTemplate);

  // Filter data to only include fields mentioned in template
  if (fieldsToInclude) {
    const filtered = filterDataByFields(headers, rows, fieldsToInclude);
    headers = filtered.headers;
    rows = filtered.rows;
  }

  // Filter out completely empty rows
  const validRows = rows.filter(row =>
    !row.every(cell => !cell || cell.toString().trim() === "")
  );

  if (validRows.length === 0) {
    return { text: "No data to display." };
  }

  // Route to appropriate formatter based on selected format
  switch (format) {
    case "table":
      return buildTableFormat(messageHeader, headers, validRows);
    case "list":
      return buildListFormat(messageHeader, headers, validRows);
    case "cards":
      return buildCardsFormat(messageHeader, headers, validRows);
    case "plain":
      return buildPlainFormat(messageHeader, headers, validRows);
    case "inline":
    default:
      return buildInlineFormat(messageHeader, headers, validRows);
  }
}

/**
 * FORMAT 1: INLINE TEXT (current default)
 * Example: *Label:* Value  *Label:* Value
 */
function buildInlineFormat(messageHeader, headers, validRows) {
  const blocks = [];
  const MAX_BLOCKS = 48;

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: truncateText(messageHeader, 150),
      emoji: true
    }
  });

  // Timestamp
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `📅 Generated: ${new Date().toLocaleString()}`
    }
  });

  blocks.push({ type: "divider" });

  // Limit rows
  const maxRows = Math.min(validRows.length, 25);
  const limitedRows = validRows.slice(0, maxRows);

  // Process each row as inline text
  limitedRows.forEach((row, rowIdx) => {
    if (blocks.length >= MAX_BLOCKS - 1) return;

    let rowText = "";
    headers.forEach((header, colIdx) => {
      const value = row[colIdx] || "N/A";
      const formattedValue = formatValue(value, header);
      rowText += `*${header}:* ${formattedValue}     `;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: truncateText(rowText.trim(), 3000)
      }
    });

    if (rowIdx < limitedRows.length - 1 && blocks.length < MAX_BLOCKS - 1) {
      blocks.push({ type: "divider" });
    }
  });

  Logger.log(`Built inline format with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * FORMAT 2: TABLE IN CODE BLOCK
 * Creates a formatted ASCII table
 */
function buildTableFormat(messageHeader, headers, validRows) {
  const blocks = [];

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: truncateText(messageHeader, 150),
      emoji: true
    }
  });

  // Timestamp
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `📅 Generated: ${new Date().toLocaleString()}`
    }
  });

  blocks.push({ type: "divider" });

  // Build table
  const maxRows = Math.min(validRows.length, 30);
  const limitedRows = validRows.slice(0, maxRows);

  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    let maxWidth = h.length;
    limitedRows.forEach(row => {
      const cellWidth = (row[i] || "").toString().length;
      if (cellWidth > maxWidth) maxWidth = cellWidth;
    });
    return Math.min(maxWidth, 15); // Cap at 15 chars
  });

  // Build table text
  let tableText = "```\n";

  // Header row
  tableText += headers.map((h, i) => h.substring(0, colWidths[i]).padEnd(colWidths[i])).join(" | ") + "\n";

  // Separator
  tableText += colWidths.map(w => "─".repeat(w)).join("─┼─") + "\n";

  // Data rows
  limitedRows.forEach(row => {
    tableText += row.map((cell, i) =>
      formatValue(cell || "", headers[i]).substring(0, colWidths[i]).padEnd(colWidths[i])
    ).join(" | ") + "\n";
  });

  tableText += "```";

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: tableText
    }
  });

  Logger.log(`Built table format with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * FORMAT 3: BULLET LIST
 * Each row as bullet point with sub-items
 */
function buildListFormat(messageHeader, headers, validRows) {
  const blocks = [];

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: truncateText(messageHeader, 150),
      emoji: true
    }
  });

  // Timestamp
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `📅 Generated: ${new Date().toLocaleString()}`
    }
  });

  blocks.push({ type: "divider" });

  const maxRows = Math.min(validRows.length, 25);
  const limitedRows = validRows.slice(0, maxRows);

  limitedRows.forEach((row, rowIdx) => {
    if (blocks.length >= 47) return;

    let listText = "";

    headers.forEach((header, colIdx) => {
      const value = row[colIdx] || "N/A";
      const formattedValue = formatValue(value, header);
      listText += `• *${header}:* ${formattedValue}\n`;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: truncateText(listText.trim(), 3000)
      }
    });

    if (rowIdx < limitedRows.length - 1 && blocks.length < 47) {
      blocks.push({ type: "divider" });
    }
  });

  Logger.log(`Built list format with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * FORMAT 4: COMPACT CARDS
 * 2-column card layout
 */
function buildCardsFormat(messageHeader, headers, validRows) {
  const blocks = [];
  const MAX_FIELDS_PER_SECTION = 10;

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: truncateText(messageHeader, 150),
      emoji: true
    }
  });

  // Timestamp
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `📅 Generated: ${new Date().toLocaleString()}`
    }
  });

  blocks.push({ type: "divider" });

  const maxRows = Math.min(validRows.length, 20);
  const limitedRows = validRows.slice(0, maxRows);

  limitedRows.forEach((row, rowIdx) => {
    if (blocks.length >= 47) return;

    const fields = [];
    headers.forEach((header, colIdx) => {
      const value = row[colIdx] || "N/A";
      fields.push({
        type: "mrkdwn",
        text: truncateText(`*${header}:*\n${formatValue(value, header)}`, 300)
      });
    });

    // Split into chunks of 10 fields
    for (let i = 0; i < fields.length; i += MAX_FIELDS_PER_SECTION) {
      const chunk = fields.slice(i, i + MAX_FIELDS_PER_SECTION);
      if (blocks.length < 47 && chunk.length > 0) {
        blocks.push({
          type: "section",
          fields: chunk
        });
      }
    }

    if (rowIdx < limitedRows.length - 1 && blocks.length < 47) {
      blocks.push({ type: "divider" });
    }
  });

  Logger.log(`Built cards format with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * FORMAT 5: PLAIN TEXT
 * Simple text without markdown
 */
function buildPlainFormat(messageHeader, headers, validRows) {
  const blocks = [];

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: truncateText(messageHeader, 150),
      emoji: true
    }
  });

  // Timestamp
  blocks.push({
    type: "section",
    text: {
      type: "plain_text",
      text: `Generated: ${new Date().toLocaleString()}`
    }
  });

  blocks.push({ type: "divider" });

  const maxRows = Math.min(validRows.length, 30);
  const limitedRows = validRows.slice(0, maxRows);

  limitedRows.forEach((row, rowIdx) => {
    if (blocks.length >= 47) return;

    let plainText = "";
    headers.forEach((header, colIdx) => {
      const value = row[colIdx] || "N/A";
      plainText += `${header}: ${formatValue(value, header)}  `;
    });

    blocks.push({
      type: "section",
      text: {
        type: "plain_text",
        text: truncateText(plainText.trim(), 3000)
      }
    });

    if (rowIdx < limitedRows.length - 1 && blocks.length < 47) {
      blocks.push({ type: "divider" });
    }
  });

  Logger.log(`Built plain format with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * TRUNCATE TEXT - Ensures text doesn't exceed Slack limits
 */
function truncateText(text, maxLength) {
  if (!text) return "";
  const str = text.toString();
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

/**
 * FORMAT VALUE - Simple, clean formatting without emojis
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

  // Percentage formatting (no emojis)
  if (lower.includes("percent") || lower.includes("%") || lower.includes("rate") || lower.includes("plan") || lower.includes("forecast") || lower.includes("today") || lower.includes("yesterday")) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      return `${num.toFixed(2)}%`;
    }
  }

  // Number formatting
  if (lower.includes("purchase") || lower.includes("count") || lower.includes("total") || lower.includes("quantity")) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
  }

  // Return as-is (no emoji additions)
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
 * FILTER ROWS BY CRITERIA - Helper function (also in SlackTrigger.gs)
 */
function filterRowsByCriteria(rows, criteria, headers) {
  if (!criteria || criteria.length === 0) {
    return rows;
  }

  return rows.filter(row => {
    return criteria.every(crit => evaluateCriterion(row, crit, headers));
  });
}

/**
 * EVALUATE SINGLE CRITERION - Helper function (also in SlackTrigger.gs)
 */
function evaluateCriterion(row, criterion, headers) {
  const fieldIndex = headers.indexOf(criterion.field);
  if (fieldIndex === -1) return true;

  const cellValue = row[fieldIndex] ? row[fieldIndex].toString().trim() : "";
  const compareValue = criterion.value ? criterion.value.toString().trim() : "";

  switch (criterion.operator) {
    case "equals":
      return cellValue === compareValue;
    case "not_equals":
      return cellValue !== compareValue;
    case "contains":
      return cellValue.includes(compareValue);
    case "not_contains":
      return !cellValue.includes(compareValue);
    case "starts_with":
      return cellValue.startsWith(compareValue);
    case "ends_with":
      return cellValue.endsWith(compareValue);
    case "is_empty":
      return cellValue === "";
    case "is_not_empty":
      return cellValue !== "";
    case "greater_than":
      return parseFloat(cellValue) > parseFloat(compareValue);
    case "less_than":
      return parseFloat(cellValue) < parseFloat(compareValue);
    default:
      return true;
  }
}

/**
 * TEST AUTOMATION - sends ALL rows as consolidated message
 */
function testSlackAutomation(automationId) {
  try {
    Logger.log(`Testing automation: ${automationId}`);

    const automations = getSlackAutomations();
    Logger.log(`Found ${automations.length} automations`);

    const automation = automations.find(a => a.id === automationId);

    if (!automation) {
      return { success: false, error: `Automation with ID ${automationId} not found.` };
    }

    Logger.log(`Testing automation: ${automation.name}`);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.targetSheet);

    if (!sheet) {
      return { success: false, error: `Sheet "${automation.targetSheet}" not found.` };
    }

    const data = sheet.getDataRange().getDisplayValues();
    if (data.length < 2) {
      return { success: false, error: "Sheet has no data rows to test with." };
    }

    const headers = data[0];
    const rows = data.slice(1);

    Logger.log(`Sheet has ${rows.length} rows`);

    // Filter by criteria if any
    const matchingRows = filterRowsByCriteria(rows, automation.criteria, headers);

    Logger.log(`Matched ${matchingRows.length} rows after filtering`);

    if (matchingRows.length === 0) {
      return { success: false, error: "No rows match the automation criteria. Check your filter settings or remove criteria to send all rows." };
    }

    // Send consolidated message with beautiful formatting
    Logger.log(`Sending Slack message with ${matchingRows.length} rows`);

    const result = sendSlackMessage(automation, {}, 0, true, {
      headers: headers,
      data: matchingRows
    });

    if (!result.success) {
      return { success: false, error: `Failed to send to Slack: ${result.error || 'Unknown error'}` };
    }

    Logger.log("Test completed successfully");

    return {
      success: true,
      message: `✅ Test message sent! Included ${matchingRows.length} matching rows in 1 beautifully formatted message.`
    };
  } catch (error) {
    Logger.log("Test Error: " + error.message);
    Logger.log("Error stack: " + error.stack);
    return { success: false, error: error.message || "Unknown error occurred during test" };
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
