/**
 * SCHEDULED BULK AUTOMATION - Executes saved automations on schedule
 * FIXED: Only runs automations that should run at this time
 */
function executeBulkSlackAutomation() {
  try {
    const automations = getSlackAutomations();
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find all enabled bulk automations with scheduling enabled
    const bulkAutomations = automations.filter(a =>
      a.enabled &&
      a.triggerType === "bulkCriteria" &&
      a.schedule &&
      a.schedule.enabled
    );

    if (bulkAutomations.length === 0) {
      Logger.log("No enabled bulk automations with scheduling found.");
      return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    bulkAutomations.forEach(automation => {
      try {
        // ✅ CHECK IF THIS AUTOMATION SHOULD RUN NOW
        if (!shouldAutomationRunNow(automation, currentHour, currentDay)) {
          Logger.log(`⏭️ Skipping "${automation.name}" - not scheduled for this time`);
          return;
        }

        Logger.log(`▶️ Running scheduled automation: ${automation.name}`);

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

        // Send consolidated message with improved formatting and advanced features
        sendEnhancedSlackMessage(automation, {}, 0, true, {
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
 * CHECK IF AUTOMATION SHOULD RUN NOW
 * Returns true if the automation's schedule matches current time
 */
function shouldAutomationRunNow(automation, currentHour, currentDay) {
  if (!automation.schedule || !automation.schedule.enabled) {
    return false;
  }

  const schedule = automation.schedule;

  // For hourly: always run (handled by trigger frequency)
  if (schedule.frequency === "hourly") {
    return true;
  }

  // For daily: check if hour matches
  if (schedule.frequency === "daily") {
    return currentHour === (schedule.hour || 9);
  }

  // For weekly: check if hour AND day match
  if (schedule.frequency === "weekly") {
    const weekDayMap = {
      "SUNDAY": 0,
      "MONDAY": 1,
      "TUESDAY": 2,
      "WEDNESDAY": 3,
      "THURSDAY": 4,
      "FRIDAY": 5,
      "SATURDAY": 6
    };

    const scheduledDay = weekDayMap[schedule.weekDay || "MONDAY"];
    const scheduledHour = schedule.hour || 9;

    return currentDay === scheduledDay && currentHour === scheduledHour;
  }

  return false;
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

    // IMPORTANT: When using bot token, channel is REQUIRED
    if (botToken) {
      // Get channel from automation config or script properties (check multiple variations)
      const properties = PropertiesService.getScriptProperties();
      const channel = automation.slackChannel ||
                     properties.getProperty("SLACK_CHANNEL") ||
                     properties.getProperty("SlackChannel");

      if (!channel) {
        throw new Error("Slack channel is required when using bot token. Please set SLACK_CHANNEL or SlackChannel in Script Properties, or add slackChannel to automation.");
      }

      payload.channel = channel;
      Logger.log(`Using bot token with channel: ${channel}`);
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

    // Store message timestamp for deletion capability (only with bot token)
    if (botToken && result.ok && result.ts && result.channel) {
      storeSentMessage({
        automationId: automation.id,
        automationName: automation.name,
        timestamp: result.ts,
        channel: result.channel,
        sentAt: new Date().toISOString(),
        rowCount: (allRows && allRows.data) ? allRows.data.length : 1
      });
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
 * Format options: inline, table, list, cards, plain, context, quote, compact, rich
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
      return buildTableFormat(messageHeader, headers, validRows, automation);
    case "list":
      return buildListFormat(messageHeader, headers, validRows, automation);
    case "cards":
      return buildCardsFormat(messageHeader, headers, validRows, automation);
    case "plain":
      return buildPlainFormat(messageHeader, headers, validRows, automation);
    case "context":
      return buildContextFormat(messageHeader, headers, validRows, automation);
    case "quote":
      return buildQuoteFormat(messageHeader, headers, validRows, automation);
    case "compact":
      return buildCompactFormat(messageHeader, headers, validRows, automation);
    case "rich":
      return buildRichFormat(messageHeader, headers, validRows, automation);
    case "leaderboard":
      return buildLeaderboardFormat(messageHeader, headers, validRows, automation);
    case "leaderboard_combined":
      return buildCombinedLeaderboardFromSheet(automation);
    case "key_metrics_weekly":
      return buildKeyMetricsWeeklyUpdate(automation);
    case "key_metrics_executive":
      return buildKeyMetricsExecutiveDashboard(automation);
    case "inline":
    default:
      return buildInlineFormat(messageHeader, headers, validRows, automation);
  }
}

/**
 * FORMAT 1: INLINE TEXT (current default)
 * Example: *Label:* Value  *Label:* Value
 */
function buildInlineFormat(messageHeader, headers, validRows, automation) {
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
      const rawValue = String(row[colIdx] || "N/A"); // Use raw value from sheet to preserve emojis
      rowText += `*${header}:* ${rawValue}     `;
    });

    // Add progress bar if enabled (Feature 7)
    if (automation.progressBars && automation.progressBars.enabled) {
      const valueColIdx = headers.indexOf(automation.progressBars.valueColumn);
      const goalColIdx = headers.indexOf(automation.progressBars.goalColumn);

      if (valueColIdx !== -1 && goalColIdx !== -1 && typeof buildProgressBar === 'function') {
        const value = parseFloat(String(row[valueColIdx]).replace(/[^0-9.-]/g, '')) || 0;
        const goal = parseFloat(String(row[goalColIdx]).replace(/[^0-9.-]/g, '')) || 0;

        if (goal > 0) {
          const progressBar = buildProgressBar(
            value,
            goal,
            automation.progressBars.width || 20,
            automation.progressBars.style || 'blocks'
          );
          rowText += `\n${progressBar}`;
        }
      }
    }

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
function buildTableFormat(messageHeader, headers, validRows, automation) {
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
      text: `📅 *Generated:* ${new Date().toLocaleString()}`
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
      const cellWidth = String(row[i] || "").length; // Use raw value length
      if (cellWidth > maxWidth) maxWidth = cellWidth;
    });
    return Math.min(maxWidth, 20); // Cap at 20 chars to allow space for emojis
  });

  // Build table text with code blocks (RESTORED)
  let tableText = "```\n";

  // Header row
  tableText += headers.map((h, i) => h.substring(0, colWidths[i]).padEnd(colWidths[i])).join(" | ") + "\n";

  // Separator
  tableText += colWidths.map(w => "─".repeat(w)).join("─┼─") + "\n";

  // Data rows - use RAW VALUES from sheet to preserve emojis
  limitedRows.forEach(row => {
    tableText += row.map((cell, i) => {
      const rawValue = String(cell || ""); // Keep original value with emojis as-is
      return rawValue.substring(0, colWidths[i]).padEnd(colWidths[i]);
    }).join(" | ") + "\n";
  });

  tableText += "```";

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: tableText
    }
  });

  // Add progress bars if enabled (Feature 7)
  if (automation && automation.progressBars && automation.progressBars.enabled) {
    const valueColIdx = headers.indexOf(automation.progressBars.valueColumn);
    const goalColIdx = headers.indexOf(automation.progressBars.goalColumn);

    if (valueColIdx !== -1 && goalColIdx !== -1 && typeof buildProgressBar === 'function') {
      blocks.push({ type: "divider" });

      let progressText = "*📊 Progress:*\n\n";
      limitedRows.forEach((row, idx) => {
        const value = parseFloat(String(row[valueColIdx]).replace(/[^0-9.-]/g, '')) || 0;
        const goal = parseFloat(String(row[goalColIdx]).replace(/[^0-9.-]/g, '')) || 0;

        if (goal > 0) {
          const regionName = cleanSheetData(row[0] || `Row ${idx + 1}`);
          const progressBar = buildProgressBar(
            value,
            goal,
            automation.progressBars.width || 20,
            automation.progressBars.style || 'blocks'
          );
          const percentage = ((value / goal) * 100).toFixed(1);
          progressText += `*${regionName}:* ${progressBar} ${percentage}%\n`;
        }
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: progressText
        }
      });
    }
  }

  Logger.log(`Built table format with ${blocks.length} blocks for ${limitedRows.length} rows`);
  return { blocks: blocks };
}

/**
 * FORMAT 3: BULLET LIST
 * Each row as bullet point with sub-items
 */
function buildListFormat(messageHeader, headers, validRows, automation) {
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
      const rawValue = String(row[colIdx] || "N/A"); // Use raw value from sheet to preserve emojis
      listText += `• *${header}:* ${rawValue}\n`;
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
function buildCardsFormat(messageHeader, headers, validRows, automation) {
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
      text: `📅 *Generated:* ${new Date().toLocaleString()}`
    }
  });

  blocks.push({ type: "divider" });

  const maxRows = Math.min(validRows.length, 20);
  const limitedRows = validRows.slice(0, maxRows);

  // Find region column for header
  const regionCol = headers.findIndex(h => h.toLowerCase().includes("region"));

  limitedRows.forEach((row, rowIdx) => {
    if (blocks.length >= 47) return;

    // Build card fields
    const fields = [];
    headers.forEach((header, colIdx) => {
      const rawValue = String(row[colIdx] || "N/A"); // Use raw value from sheet to preserve emojis

      fields.push({
        type: "mrkdwn",
        text: `*${header}:*\n${rawValue}`
      });
    });

    // Add fields in organized groups (max 10 fields per section for proper 2-column layout)
    const MAX_FIELDS = 10;
    for (let i = 0; i < fields.length; i += MAX_FIELDS) {
      const chunk = fields.slice(i, i + MAX_FIELDS);
      if (blocks.length < 47 && chunk.length > 0) {
        blocks.push({
          type: "section",
          fields: chunk
        });
      }
    }

    // Add divider between cards (except after last card)
    if (rowIdx < limitedRows.length - 1 && blocks.length < 47) {
      blocks.push({ type: "divider" });
    }
  });

  Logger.log(`Built cards format with ${blocks.length} blocks for ${limitedRows.length} rows`);
  return { blocks: blocks };
}

/**
 * FORMAT 5: PLAIN TEXT
 * Simple text without markdown
 */
function buildPlainFormat(messageHeader, headers, validRows, automation) {
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
      const rawValue = String(row[colIdx] || "N/A"); // Use raw value from sheet to preserve emojis
      plainText += `${header}: ${rawValue}  `;
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
 * FORMAT 6: CONTEXT FORMAT
 * Compact, subtle format using context blocks (smaller text)
 * Perfect for large datasets or secondary information
 */
function buildContextFormat(messageHeader, headers, validRows, automation) {
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
    type: "context",
    elements: [{
      type: "mrkdwn",
      text: `📅 Generated: ${new Date().toLocaleString()}`
    }]
  });

  blocks.push({ type: "divider" });

  const maxRows = Math.min(validRows.length, 40);
  const limitedRows = validRows.slice(0, maxRows);

  limitedRows.forEach((row, rowIdx) => {
    if (blocks.length >= 47) return;

    const elements = [];
    headers.forEach((header, colIdx) => {
      const rawValue = String(row[colIdx] || "N/A"); // Use raw value from sheet to preserve emojis
      elements.push({
        type: "mrkdwn",
        text: `*${header}:* ${rawValue}`
      });
    });

    // Context blocks can have up to 10 elements
    const maxElements = Math.min(elements.length, 10);
    blocks.push({
      type: "context",
      elements: elements.slice(0, maxElements)
    });
  });

  Logger.log(`Built context format with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * FORMAT 7: QUOTE FORMAT
 * Highlighted format using block quotes (> prefix)
 * Great for emphasis and important data
 */
function buildQuoteFormat(messageHeader, headers, validRows, automation) {
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

    let quoteText = "";
    headers.forEach((header, colIdx) => {
      const rawValue = String(row[colIdx] || "N/A"); // Use raw value from sheet to preserve emojis
      quoteText += `> *${header}:* ${rawValue}\n`;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: truncateText(quoteText.trim(), 3000)
      }
    });

    if (rowIdx < limitedRows.length - 1 && blocks.length < 47) {
      blocks.push({ type: "divider" });
    }
  });

  // Add progress bars if enabled (Feature 7)
  if (automation && automation.progressBars && automation.progressBars.enabled) {
    const valueColIdx = headers.indexOf(automation.progressBars.valueColumn);
    const goalColIdx = headers.indexOf(automation.progressBars.goalColumn);

    if (valueColIdx !== -1 && goalColIdx !== -1 && typeof buildProgressBar === 'function') {
      blocks.push({ type: "divider" });

      let progressText = "*📊 Progress:*\n\n";
      limitedRows.forEach((row, idx) => {
        const value = parseFloat(String(row[valueColIdx]).replace(/[^0-9.-]/g, '')) || 0;
        const goal = parseFloat(String(row[goalColIdx]).replace(/[^0-9.-]/g, '')) || 0;

        if (goal > 0) {
          const regionName = cleanSheetData(row[0] || `Row ${idx + 1}`);
          const progressBar = buildProgressBar(
            value,
            goal,
            automation.progressBars.width || 20,
            automation.progressBars.style || 'blocks'
          );
          const percentage = ((value / goal) * 100).toFixed(1);
          progressText += `*${regionName}:* ${progressBar} ${percentage}%\n`;
        }
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: progressText
        }
      });
    }
  }

  Logger.log(`Built quote format with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * FORMAT 8: COMPACT FORMAT
 * Multiple rows per block - maximizes data density
 * Perfect for large datasets (50+ rows)
 */
function buildCompactFormat(messageHeader, headers, validRows, automation) {
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

  // Process multiple rows per block (up to 5 rows per block)
  const maxRows = Math.min(validRows.length, 50);
  const limitedRows = validRows.slice(0, maxRows);
  const rowsPerBlock = 5;

  for (let i = 0; i < limitedRows.length; i += rowsPerBlock) {
    if (blocks.length >= 47) break;

    let combinedText = "";
    const blockRows = limitedRows.slice(i, i + rowsPerBlock);

    blockRows.forEach((row, localIdx) => {
      let rowText = `*#${i + localIdx + 1}:* `;
      headers.forEach((header, colIdx) => {
        const rawValue = String(row[colIdx] || "N/A"); // Use raw value from sheet to preserve emojis
        rowText += `${header}: ${rawValue} • `;
      });
      combinedText += rowText.slice(0, -3) + "\n"; // Remove last bullet
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: truncateText(combinedText.trim(), 3000)
      }
    });
  }

  Logger.log(`Built compact format with ${blocks.length} blocks for ${limitedRows.length} rows`);
  return { blocks: blocks };
}

/**
 * FORMAT 9: RICH FORMAT
 * Enhanced with emojis and visual elements
 * Automatically adds relevant emojis based on field names and values
 */
function buildRichFormat(messageHeader, headers, validRows, automation) {
  const blocks = [];

  // Header with emoji
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `📊 ${truncateText(messageHeader, 145)}`,
      emoji: true
    }
  });

  // Timestamp with emoji
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `📅 *Generated:* ${new Date().toLocaleString()} | 📈 *Total:* ${validRows.length} records`
    }
  });

  blocks.push({ type: "divider" });

  const maxRows = Math.min(validRows.length, 25);
  const limitedRows = validRows.slice(0, maxRows);

  limitedRows.forEach((row, rowIdx) => {
    if (blocks.length >= 47) return;

    let richText = "";
    headers.forEach((header, colIdx) => {
      const rawValue = String(row[colIdx] || "N/A"); // Use raw value from sheet to preserve emojis
      richText += `*${header}:* ${rawValue}     `;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: truncateText(richText.trim(), 3000)
      }
    });

    if (rowIdx < limitedRows.length - 1 && blocks.length < 47) {
      blocks.push({ type: "divider" });
    }
  });

  Logger.log(`Built rich format with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * FORMAT 9: LEADERBOARD FORMAT
 * Perfect for rankings, top performers, competitions
 * Features: Trophy emojis, rank badges, change indicators, regional flags
 */
function buildLeaderboardFormat(messageHeader, headers, validRows, automation) {
  const blocks = [];

  // Detect leaderboard type from header/automation name
  const headerLower = (messageHeader || '').toLowerCase();
  const automationName = (automation.name || '').toLowerCase();

  let leaderboardType = 'general';
  let headerIcon = '🏆';

  if (headerLower.includes('churn') || automationName.includes('churn')) {
    leaderboardType = 'churn';
    headerIcon = '🏆';
  } else if (headerLower.includes('killer') || automationName.includes('killer') || headerLower.includes('base')) {
    leaderboardType = 'killer';
    headerIcon = '💪';
  } else if (headerLower.includes('region') || automationName.includes('region')) {
    leaderboardType = 'regional';
    headerIcon = '🌍';
  }

  // Main header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `${headerIcon} ${truncateText(messageHeader, 145)}`,
      emoji: true
    }
  });

  blocks.push({ type: "divider" });

  // Find column indices
  const rankIdx = headers.findIndex(h => h.toLowerCase().includes('rank'));
  const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('manager'));
  const winsIdx = headers.findIndex(h => h.toLowerCase().includes('win'));
  const changeIdx = headers.findIndex(h => h.toLowerCase().includes('change'));
  const regionIdx = headers.findIndex(h => h.toLowerCase().includes('region'));

  // Regional leaderboard format
  if (leaderboardType === 'regional') {
    const totalIdx = headers.findIndex(h => h.toLowerCase().includes('total'));
    const churnIdx = headers.findIndex(h => h.toLowerCase().includes('churn'));
    const killerIdx = headers.findIndex(h => h.toLowerCase().includes('killer'));
    const topManagerIdx = headers.findIndex(h => h.toLowerCase().includes('top') || h.toLowerCase().includes('manager'));

    let regionalText = "";

    validRows.forEach((row, idx) => {
      const region = cleanSheetData(regionIdx !== -1 ? row[regionIdx] : row[1] || `Region ${idx + 1}`);
      const totalWins = totalIdx !== -1 ? row[totalIdx] : row[2] || 0;
      const churnWins = churnIdx !== -1 ? row[churnIdx] : 0;
      const killerWins = killerIdx !== -1 ? row[killerIdx] : 0;
      const topManager = cleanSheetData(topManagerIdx !== -1 ? row[topManagerIdx] : "N/A");

      const regionEmoji = getRegionSlackEmoji(region);

      regionalText += `*${regionEmoji} ${region}*\n`;
      regionalText += `├ Total Sales: *${totalWins}*`;

      if (churnWins || killerWins) {
        regionalText += ` (🏆 ${churnWins} Churn + 💪 ${killerWins} Killer)`;
      }

      regionalText += `\n└ Top Performer: ${topManager}\n\n`;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: regionalText
      }
    });

  } else {
    // Manager leaderboard format (Churn/Killer/General)
    let leaderboardText = "";

    validRows.forEach((row, idx) => {
      const rank = rankIdx !== -1 ? row[rankIdx] : (idx + 1);
      const managerName = cleanSheetData(nameIdx !== -1 ? row[nameIdx] : row[0] || `Person ${idx + 1}`);
      const wins = winsIdx !== -1 ? row[winsIdx] : row[1] || 0;
      const change = changeIdx !== -1 ? row[changeIdx] : null;
      const region = cleanSheetData(regionIdx !== -1 ? row[regionIdx] : null);

      // Rank emoji
      const rankEmoji = getRankEmoji(rank);

      // Build line
      leaderboardText += `${rankEmoji} *${managerName}*\n`;
      leaderboardText += `   └ ${wins} wins`;

      // Add change indicator if available
      if (change) {
        const changeIndicator = getChangeIndicator(change);
        leaderboardText += ` ${changeIndicator}`;
      }

      // Add region if available
      if (region) {
        const regionEmoji = getRegionSlackEmoji(region);
        leaderboardText += ` | ${regionEmoji} ${region}`;
      }

      leaderboardText += `\n\n`;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: leaderboardText
      }
    });
  }

  // Add summary stats for manager leaderboards
  if (leaderboardType !== 'regional' && winsIdx !== -1) {
    const totalWins = validRows.reduce((sum, row) => sum + (parseInt(row[winsIdx]) || 0), 0);
    const avgWins = (totalWins / validRows.length).toFixed(1);

    blocks.push({ type: "divider" });

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📊 *Total Sales:* ${totalWins} | *Average:* ${avgWins} | *Top Performers:* ${validRows.length}`
        }
      ]
    });
  }

  // Footer with timestamp
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Updated: ${new Date().toLocaleString()}`
      }
    ]
  });

  Logger.log(`Built leaderboard format with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * HELPER: Get rank emoji for leaderboard
 */
function getRankEmoji(rank) {
  switch(parseInt(rank)) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    case 4: return "4️⃣";
    case 5: return "5️⃣";
    case 6: return "6️⃣";
    case 7: return "7️⃣";
    case 8: return "8️⃣";
    case 9: return "9️⃣";
    case 10: return "🔟";
    default: return `${rank}️⃣`;
  }
}

/**
 * HELPER: Get change indicator with emoji
 */
function getChangeIndicator(change) {
  const changeStr = String(change);
  const changeNum = parseInt(changeStr.replace(/[^0-9-]/g, ''));

  if (changeNum > 0) {
    return `📈 +${Math.abs(changeNum)}`;
  } else if (changeNum < 0) {
    return `📉 -${Math.abs(changeNum)}`;
  } else {
    return `➖ 0`;
  }
}

/**
 * HELPER: Clean sheet data - AGGRESSIVELY removes ALL unwanted text
 */
function cleanSheetData(value) {
  if (!value) return '';

  let cleaned = String(value);

  // Log original value for debugging
  Logger.log(`Cleaning value: "${cleaned}"`);

  // Remove ALL lock emojis and variations
  cleaned = cleaned.replace(/[\u{1F512}\u{1F513}\u{1F510}\u{1F511}]/gu, '');
  cleaned = cleaned.replace(/🔒|🔓|🔐|🔑/g, '');

  // Remove "private channel" text - ALL possible variations
  cleaned = cleaned.replace(/private\s+channel/gi, '');
  cleaned = cleaned.replace(/private\s*channel/gi, '');
  cleaned = cleaned.replace(/privatechannel/gi, '');

  // Remove words individually in case they're separated
  cleaned = cleaned.replace(/\bprivate\b/gi, '');
  cleaned = cleaned.replace(/\bchannel\b/gi, '');

  // Remove # and @ symbols
  cleaned = cleaned.replace(/#/g, '');
  cleaned = cleaned.replace(/@/g, '');

  // Remove any control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Remove multiple spaces
  cleaned = cleaned.replace(/\s\s+/g, ' ');

  // Trim whitespace
  cleaned = cleaned.trim();

  Logger.log(`Cleaned to: "${cleaned}"`);

  return cleaned;
}

/**
 * HELPER: Get Slack emoji code for regions (replaces Unicode emojis)
 */
function getRegionSlackEmoji(region) {
  if (!region) return '';

  const regionStr = String(region).toUpperCase().trim();

  const regionMap = {
    'TR': ':flag-tr:',
    'ARAB': ':flag-sa:',
    'RU': ':ru:',
    'CZ': ':flag-cz:',
    'RO': ':flag-ro:',
    'ES': ':es:',
    'FR': ':fr:',
    'PL': ':flag-pl:',
    'DE': ':de:',
    'IL': ':flag-il:',
    'IT': ':flag-it:',
    'SA': ':flag-sa:',
    'NA': ':us:',
    'US': ':us:',
    'UK': ':flag-gb:',
    'JP': ':jp:',
    'KR': ':kr:',
    'CN': ':cn:',
    'IN': ':flag-in:',
    'BR': ':flag-br:',
    'MX': ':flag-mx:',
    'AU': ':flag-au:',
    'CA': ':flag-ca:',
    'EMEA': ':flag-eu:',
    'APAC': ':earth_asia:',
    'LATAM': ':earth_americas:'
  };

  return regionMap[regionStr] || '';
}

/**
 * FORMAT ARPU WITH PLAN COMPARISON
 * Compares manager's ARPU against their region's plan and adds indicator
 */
function formatArpuWithPlan(arpu, region, arpuPlansByRegion) {
  if (!arpu || !region) return arpu || "";

  const regionKey = String(region).trim().toUpperCase();
  const plan = arpuPlansByRegion[regionKey] || arpuPlansByRegion['OTHER'];

  if (!plan) return arpu;

  // Parse ARPU value
  const arpuNum = parseFloat(String(arpu).replace(/[^0-9.]/g, ''));
  const planNum = parseFloat(plan);

  if (isNaN(arpuNum) || isNaN(planNum)) return arpu;

  // Compare and add indicator
  if (arpuNum >= planNum) {
    return `${arpu} ✅`;
  } else {
    const diff = planNum - arpuNum;
    const pct = ((diff / planNum) * 100).toFixed(0);
    return `${arpu} ⚠️ (-${pct}%)`;
  }
}

/**
 * BUILD COMBINED LEADERBOARD FROM SHEET
 * Reads all 3 sections from Weekly Leaderboard sheet and creates one combined message
 * This is the RECOMMENDED format for weekly leaderboards - no spamming with 3 messages!
 */
function buildCombinedLeaderboardFromSheet(automation) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.targetSheet || "Weekly Leaderboard");

    if (!sheet) {
      Logger.log("Weekly Leaderboard sheet not found");
      return { text: "Weekly Leaderboard sheet not found. Please create it first." };
    }

    // Get all data sections from the sheet (TOP 5 STRUCTURE - with Rising Stars + ARPU & Upsell Share)
    const teamPerfData = sheet.getRange("A3:E6").getValues();  // NEW: Team Performance Summary (4 rows: Purchase, Revenue, Net Churn, ARPU)
    const regionalChampData = sheet.getRange("A10:C11").getValues();  // NEW: Regional Champions
    const upsellMetricsData = sheet.getRange("A15:E17").getValues();  // NEW: Upsell Metrics Summary
    const churnCurrentData = sheet.getRange("A21:I25").getValues();  // 5 rows (1-3 main, 4-5 rising stars) + ARPU & Upsell Share
    const churnOldData = sheet.getRange("A29:I33").getValues();  // 5 rows + ARPU & Upsell Share
    const killerCurrentData = sheet.getRange("A37:I41").getValues();  // 5 rows + ARPU & Upsell Share
    const killerOldData = sheet.getRange("A45:I49").getValues();  // 5 rows + ARPU & Upsell Share
    const totalsData = sheet.getRange("A53:B60").getValues();
    const managerOfWeekData = sheet.getRange("A64:G64").getValues();  // Now includes ARPU & Upsell Share
    const kbPaidRateData = sheet.getRange("A68:F70").getValues();
    const cpPaidRateData = sheet.getRange("A74:F76").getValues();
    const highestPaymentsData = sheet.getRange("A80:F82").getValues();
    const cpUpsellData = sheet.getRange("A86:G88").getValues();    // CP Upsell Top 3 (optional) - now with ARPU & Upsell Share
    const kbUpsellData = sheet.getRange("A92:G94").getValues();    // KB Upsell Top 3 (optional) - now with ARPU & Upsell Share
    const biggestArpuData = sheet.getRange("A98:F100").getValues(); // Biggest ARPU Sale (optional)
    const top3ArpuData = sheet.getRange("A104:G106").getValues();  // Top 3 ARPU with 20+ Payments (optional)
    const top3UpsellData = sheet.getRange("A110:G112").getValues(); // Top 3 Upsell Share with 20+ Payments (optional)
    const reactivationData = sheet.getRange("A116:E120").getValues(); // Reactivation Results - Top 5
    const arpuPlansData = sheet.getRange("A124:C135").getValues();  // ARPU Plans by Region

    // Build ARPU Plans lookup map
    const arpuPlansByRegion = {};
    arpuPlansData.forEach(row => {
      const region = String(row[0]).trim().toUpperCase();
      const plan = row[1];
      if (region && plan) {
        arpuPlansByRegion[region] = plan;
      }
    });

    const blocks = [];

    // Get display date from totals section (you can edit this manually in the sheet at B27)
    const displayDate = totalsData.length > 0 && totalsData[0][1] ? String(totalsData[0][1]) : "Jan 26th";

    // Main header
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `🏆 WEEKLY PERFORMANCE LEADERBOARD - ${displayDate}`,
        emoji: true
      }
    });

    blocks.push({ type: "divider" });

    // ============================================
    // COMPACT SUMMARY SNAPSHOT
    // ============================================
    const grandTotal = totalsData[1] ? totalsData[1][1] : 0;
    const churnTotal = totalsData[2] ? totalsData[2][1] : 0;
    const killerTotal = totalsData[5] ? totalsData[5][1] : 0;

    // Get ARPU from secondary sales plan section
    const arpuRow = teamPerfData.length > 3 ? teamPerfData[3] : null;
    const arpuPlan = arpuRow && arpuRow[1] ? String(arpuRow[1]) : null;
    const arpuToday = arpuRow && arpuRow[2] ? String(arpuRow[2]) : null;

    // Calculate ARPU variance
    let arpuVariance = "";
    if (arpuPlan && arpuToday) {
      const planNum = parseFloat(String(arpuPlan).replace(/[^0-9.]/g, ''));
      const todayNum = parseFloat(String(arpuToday).replace(/[^0-9.]/g, ''));
      if (!isNaN(planNum) && !isNaN(todayNum)) {
        const diff = todayNum - planNum;
        const pct = ((diff / planNum) * 100).toFixed(1);
        const arrow = diff >= 0 ? '↑' : '↓';
        const emoji = diff >= 0 ? '✅' : '⚠️';
        arpuVariance = ` ${emoji} (${arrow}${Math.abs(parseFloat(pct))}%)`;
      }
    }

    // Get reactivations count
    let reactivationsCount = 0;
    if (reactivationData && reactivationData.length > 0) {
      reactivationData.forEach(row => {
        if (row[3]) {
          const num = parseInt(row[3]);
          if (!isNaN(num)) reactivationsCount += num;
        }
      });
    }

    let summaryText = `📊 *${displayDate}*  |  Grand Total: *${grandTotal} sales*\n`;
    summaryText += `🏆 CP: *${churnTotal}*  |  💪 KB: *${killerTotal}*\n`;
    if (arpuPlan && arpuToday) {
      summaryText += `📈 ARPU: *${arpuToday}* / Plan: ${arpuPlan}${arpuVariance}\n`;
    }
    if (reactivationsCount > 0) {
      summaryText += `🔄 Reactivations: *${reactivationsCount} customers* returned`;
    }

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: summaryText
      }
    });

    blocks.push({ type: "divider" });

    // ============================================
    // SECONDARY SALES PLAN (was Team Performance)
    // ============================================
    if (teamPerfData && teamPerfData.length >= 2) {
      const purchaseRow = teamPerfData[0];  // [Metric, Plan, Forecast, DoD, WoW]
      const revenueRow = teamPerfData[1];
      const netChurnRow = teamPerfData.length > 2 ? teamPerfData[2] : null;
      const arpuRow = teamPerfData.length > 3 ? teamPerfData[3] : null;

      let messageLines = [];

      // Purchase Plan Execution
      if (purchaseRow && purchaseRow[1]) {
        let purchPlan = purchaseRow[1];
        // Convert to percentage if stored as decimal (1.109 -> 110.9%)
        if (typeof purchPlan === 'number' && purchPlan > 0 && purchPlan < 10) {
          purchPlan = (purchPlan * 100).toFixed(1) + '%';
        } else if (typeof purchPlan === 'string' && !purchPlan.includes('%')) {
          const num = parseFloat(purchPlan);
          if (!isNaN(num) && num > 0 && num < 10) {
            purchPlan = (num * 100).toFixed(1) + '%';
          }
        }
        messageLines.push(`• Purchase Plan Execution: *${purchPlan}*`);
      }

      // Revenue Plan Execution
      if (revenueRow && revenueRow[1]) {
        let revPlan = revenueRow[1];
        if (typeof revPlan === 'number' && revPlan > 0 && revPlan < 10) {
          revPlan = (revPlan * 100).toFixed(1) + '%';
        } else if (typeof revPlan === 'string' && !revPlan.includes('%')) {
          const num = parseFloat(revPlan);
          if (!isNaN(num) && num > 0 && num < 10) {
            revPlan = (num * 100).toFixed(1) + '%';
          }
        }
        messageLines.push(`• Revenue Plan Execution: *${revPlan}*`);
      }

      // Net Churn (optional)
      if (netChurnRow && (netChurnRow[1] || netChurnRow[2] || netChurnRow[3] || netChurnRow[4])) {
        let churnLine = "• Net Churn:";
        if (netChurnRow[1]) churnLine += ` Plan *${netChurnRow[1]}*`;
        if (netChurnRow[2]) churnLine += ` | Forecast *${netChurnRow[2]}*`;
        if (netChurnRow[3]) churnLine += ` | DoD *${netChurnRow[3]}*`;
        if (netChurnRow[4]) churnLine += ` | WoW *${netChurnRow[4]}*`;
        messageLines.push(churnLine);
      }

      // ARPU (optional)
      if (arpuRow && (arpuRow[1] || arpuRow[2])) {
        let arpuLine = "• ARPU:";
        if (arpuRow[1]) arpuLine += ` Plan *${arpuRow[1]}*`;
        if (arpuRow[2]) arpuLine += ` | Today *${arpuRow[2]}*`;
        messageLines.push(arpuLine);
      }

      if (messageLines.length > 0) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📊 SECONDARY SALES PLAN*\n\n${messageLines.join('\n')}`
          }
        });

        blocks.push({ type: "divider" });
      }
    }

    // ============================================
    // REGIONAL CHAMPIONS - CP and KB
    // ============================================
    if (regionalChampData && regionalChampData.length === 2) {
      const cpChamp = regionalChampData[0];  // [Category, Region, Performance]
      const kbChamp = regionalChampData[1];

      if (cpChamp[1] && kbChamp[1]) {
        const cpRegion = cleanSheetData(cpChamp[1]);
        const cpPerf = cpChamp[2];
        const cpEmoji = getRegionSlackEmoji(cpRegion);

        const kbRegion = cleanSheetData(kbChamp[1]);
        const kbPerf = kbChamp[2];
        const kbEmoji = getRegionSlackEmoji(kbRegion);

        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🌍 REGIONAL CHAMPIONS*\n\n🏆 *Churn Prevention*: ${cpEmoji} ${cpRegion}\n   └ ${cpPerf}\n\n💪 *Killer Base*: ${kbEmoji} ${kbRegion}\n   └ ${kbPerf}`
          }
        });

        blocks.push({ type: "divider" });
      }
    }

    // ============================================
    // UPSELL METRICS SUMMARY
    // ============================================
    if (upsellMetricsData && upsellMetricsData.length === 3) {
      const arpuRow = upsellMetricsData[0];  // [Metric, CP, KB, Overall, Top Manager]
      const upsellShareRow = upsellMetricsData[1];
      const salesRow = upsellMetricsData[2];

      // Check if there's actual data (not just empty cells)
      if (arpuRow[1] || arpuRow[2] || arpuRow[3]) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*📊 UPSELL METRICS SUMMARY*"
          }
        });

        let metricsText = "";

        // ARPU Row
        if (arpuRow[1] || arpuRow[2] || arpuRow[3]) {
          metricsText += `*Overall ARPU:*\n`;
          metricsText += `   • CP: *${arpuRow[1]}* | KB: *${arpuRow[2]}* | Overall: *${arpuRow[3]}*\n`;
          if (arpuRow[4]) {
            const topArpuManager = typeof applyManagerMentions === 'function'
              ? applyManagerMentions(arpuRow[4])
              : cleanSheetData(arpuRow[4]);
            metricsText += `   • Top Manager: ${topArpuManager}\n`;
          }
          metricsText += `\n`;
        }

        // Upsell Share Row
        if (upsellShareRow[1] || upsellShareRow[2] || upsellShareRow[3]) {
          // Format as percentages if they're decimals (e.g., 0.155 -> 15.5%)
          let cpShare = upsellShareRow[1];
          let kbShare = upsellShareRow[2];
          let overallShare = upsellShareRow[3];

          if (typeof cpShare === 'number' && cpShare < 1) {
            cpShare = (cpShare * 100).toFixed(1) + '%';
          } else if (!String(cpShare).includes('%')) {
            const num = parseFloat(String(cpShare));
            if (!isNaN(num) && num < 1) {
              cpShare = (num * 100).toFixed(1) + '%';
            }
          }

          if (typeof kbShare === 'number' && kbShare < 1) {
            kbShare = (kbShare * 100).toFixed(1) + '%';
          } else if (!String(kbShare).includes('%')) {
            const num = parseFloat(String(kbShare));
            if (!isNaN(num) && num < 1) {
              kbShare = (num * 100).toFixed(1) + '%';
            }
          }

          if (typeof overallShare === 'number' && overallShare < 1) {
            overallShare = (overallShare * 100).toFixed(2) + '%';
          } else if (!String(overallShare).includes('%')) {
            const num = parseFloat(String(overallShare));
            if (!isNaN(num) && num < 1) {
              overallShare = (num * 100).toFixed(2) + '%';
            }
          }

          metricsText += `*Upsell Share:*\n`;
          metricsText += `   • CP: *${cpShare}* | KB: *${kbShare}* | Overall: *${overallShare}*\n`;
          if (upsellShareRow[4]) {
            const topUpsellManager = typeof applyManagerMentions === 'function'
              ? applyManagerMentions(upsellShareRow[4])
              : cleanSheetData(upsellShareRow[4]);
            metricsText += `   • Top Manager: ${topUpsellManager}\n`;
          }
          metricsText += `\n`;
        }

        // N# of Sales Row
        if (salesRow[1] || salesRow[2] || salesRow[3]) {
          metricsText += `*Total Sales:*\n`;
          metricsText += `   • CP: *${salesRow[1]}* | KB: *${salesRow[2]}* | Overall: *${salesRow[3]}*\n`;
          if (salesRow[4]) {
            const topSalesManager = typeof applyManagerMentions === 'function'
              ? applyManagerMentions(salesRow[4])
              : cleanSheetData(salesRow[4]);
            metricsText += `   • Top Manager: ${topSalesManager}\n`;
          }
        }

        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: metricsText
          }
        });

        blocks.push({ type: "divider" });
      }
    }

    // ============================================
    // MANAGER OF THE WEEK - Read from sheet (editable) or auto-calculate
    // ============================================
    // Row format: [Manager Name, Sales, Cash Generated, WoW, ARPU, Upsell Share, Description]
    const manualManager = managerOfWeekData[0];
    const hasManualData = manualManager && manualManager[0] && String(manualManager[0]).trim() !== "";

    let managerOfWeekDisplay = null;

    if (hasManualData) {
      // Use manual data from sheet
      const managerName = manualManager[0];
      const sales = manualManager[1];
      const cashRaw = manualManager[2];
      const wow = manualManager[3] ? String(manualManager[3]).trim() : "";
      const arpu = manualManager[4] ? manualManager[4] : "";
      const upsellShare = manualManager[5] ? manualManager[5] : "";
      const description = manualManager[6] ? String(manualManager[6]).trim() : "";

      const displayName = typeof applyManagerMentions === 'function'
        ? applyManagerMentions(managerName)
        : cleanSheetData(managerName);

      const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;

      // Build formatted display with better spacing
      let displayText = `⭐ *MANAGER OF THE WEEK*\n\n🏆 *${displayName}*\n`;
      displayText += `   • Sales: *${sales} sales*\n`;
      displayText += `   • Cash: *${cashGenerated}*`;

      if (wow) {
        const wowNum = parseInt(wow.replace(/[^0-9-]/g, ''));
        const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :
                        !isNaN(wowNum) && wowNum >= 10 ? '📈' :
                        !isNaN(wowNum) && wowNum >= 1 ? '➕' :
                        !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';
        displayText += `\n   • WoW: ${wowEmoji} *${wow}*`;
      }

      if (arpu) {
        displayText += `\n   • ARPU: *${arpu}*`;
      }

      if (upsellShare) {
        displayText += `\n   • Upsell Share: *${upsellShare}*`;
      }

      if (description) {
        displayText += `\n\n*_${description}_*`;
      }

      managerOfWeekDisplay = displayText;

    } else {
      // Auto-calculate from #1 ranked managers
      const allManagers = [];

      [churnCurrentData, churnOldData, killerCurrentData, killerOldData].forEach((sectionData, sectionIdx) => {
        const sectionNames = ["CP Current", "CP Old", "KB Current", "KB Old"];
        sectionData.forEach(row => {
          const rank = row[1];
          if (rank === 1) {
            const managerName = row[2];
            const sales = row[3];
            const wow = row[4] ? String(row[4]).trim() : "";
            const cashRaw = row[5];
            const arpu = row[6] ? row[6] : "";
            const upsellShare = row[7] ? row[7] : "";
            const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
            const section = sectionNames[sectionIdx];

            if (managerName && sales) {
              allManagers.push({
                name: managerName,
                sales: sales,
                wow: wow,
                cash: cashGenerated,
                arpu: arpu,
                upsellShare: upsellShare,
                section: section
              });
            }
          }
        });
      });

      if (allManagers.length > 0) {
        const topManager = allManagers.reduce((max, manager) =>
          manager.sales > max.sales ? manager : max
        );

        const displayName = typeof applyManagerMentions === 'function'
          ? applyManagerMentions(topManager.name)
          : cleanSheetData(topManager.name);

        // Build formatted display with better spacing
        let displayText = `⭐ *MANAGER OF THE WEEK*\n\n🏆 *${displayName}*\n`;
        displayText += `   • Sales: *${topManager.sales} sales*\n`;
        displayText += `   • Cash: *${topManager.cash}*`;

        if (topManager.wow) {
          const wowNum = parseInt(topManager.wow.replace(/[^0-9-]/g, ''));
          const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :
                          !isNaN(wowNum) && wowNum >= 10 ? '📈' :
                          !isNaN(wowNum) && wowNum >= 1 ? '➕' :
                          !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';
          displayText += `\n   • WoW: ${wowEmoji} *${topManager.wow}*`;
        }

        if (topManager.arpu) {
          displayText += `\n   • ARPU: *${topManager.arpu}*`;
        }

        if (topManager.upsellShare) {
          displayText += `\n   • Upsell Share: *${topManager.upsellShare}*`;
        }

        displayText += `\n\n*_Leading in ${topManager.section}_*`;

        managerOfWeekDisplay = displayText;
      }
    }

    // Display Manager of the Week if we have data
    if (managerOfWeekDisplay) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: managerOfWeekDisplay
        }
      });

      blocks.push({ type: "divider" });
    }

    // ━━━━━━━━ LEADERBOARDS SECTION ━━━━━━━━
    blocks.push({
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: "━━━━━━━━ 🏆 *LEADERBOARDS* ━━━━━━━━"
      }]
    });

    // ============================================
    // SECTION 1: CHURN PREVENTION - CURRENT BASE - TOP 3 + RISING STARS
    // ============================================
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🏆 CHURN PREVENTION - CURRENT BASE - TOP 3*"
      }
    });

    // Split into main (ranks 1-3) and rising stars (ranks 4-5)
    const churnCurrentMain = churnCurrentData.filter(row => row[1] && row[1] >= 1 && row[1] <= 3);
    const churnCurrentRising = churnCurrentData.filter(row => row[1] && row[1] >= 4 && row[1] <= 5);

    let churnCurrentText = "";
    churnCurrentMain.forEach((row, idx) => {
      // Row format: [Week, Rank, Manager Name, Sales, WoW, Cash Generated, ARPU, Upsell Share, Region]
      const rank = row[1];
      const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
      const sales = row[3];
      const wow = row[4] ? String(row[4]).trim() : "";
      const cashRaw = row[5];
      const arpu = row[6] ? row[6] : "";
      const upsellShare = row[7] ? row[7] : "";
      const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
      const region = cleanSheetData(row[8]);

      if (!rank || !managerName) return;

      const rankEmoji = getRankEmoji(rank);
      const regionEmoji = region ? getRegionSlackEmoji(region) : "";

      // Build sales text with optional WoW (color-coded)
      let salesText = `${sales} sales`;
      if (wow) {
        // Parse WoW number for color-coding
        const wowNum = parseInt(wow.replace(/[^0-9-]/g, ''));
        const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :  // Strong growth
                        !isNaN(wowNum) && wowNum >= 10 ? '📈' :  // Good growth
                        !isNaN(wowNum) && wowNum >= 1 ? '➕' :   // Slight growth
                        !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';  // Decline or neutral
        salesText += `  ${wowEmoji} ${wow}`;
      }

      churnCurrentText += `${rankEmoji} *${managerName}*\n`;
      churnCurrentText += `   └ ${salesText} | 💰 ${cashGenerated}`;
      if (arpu) {
        const formattedArpu = formatArpuWithPlan(arpu, region, arpuPlansByRegion);
        churnCurrentText += ` | ARPU: ${formattedArpu}`;
      }
      if (upsellShare) {
        churnCurrentText += ` | Upsell: ${upsellShare}`;
      }
      if (region) {
        churnCurrentText += ` | ${regionEmoji} ${region}`;
      }
      churnCurrentText += `\n\n`;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: churnCurrentText || "_No data available_"
      }
    });

    // Add Rising Stars if available
    if (churnCurrentRising.length > 0) {
      let risingStarsText = "_⭐ Rising Stars_\n\n";
      churnCurrentRising.forEach((row) => {
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const sales = row[3];
        const wow = row[4] ? String(row[4]).trim() : "";
        const cashRaw = row[5];
        const arpu = row[6] ? row[6] : "";
        const upsellShare = row[7] ? row[7] : "";
        const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
        const region = cleanSheetData(row[8]);

        if (!rank || !managerName) return;

        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        let salesText = `${sales} sales`;
        if (wow) {
          const wowNum = parseInt(wow.replace(/[^0-9-]/g, ''));
          const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :
                          !isNaN(wowNum) && wowNum >= 10 ? '📈' :
                          !isNaN(wowNum) && wowNum >= 1 ? '➕' :
                          !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';
          salesText += ` ${wowEmoji} ${wow}`;
        }

        // Use consistent format with top 3
        risingStarsText += `⭐ *${managerName}*  #${rank}\n`;
        risingStarsText += `   └ ${salesText} | 💰 ${cashGenerated}`;
        if (arpu) {
          risingStarsText += ` | ARPU: ${arpu}`;
        }
        if (upsellShare) {
          risingStarsText += ` | Upsell: ${upsellShare}`;
        }
        if (region) {
          risingStarsText += ` | ${regionEmoji} ${region}`;
        }
        risingStarsText += `\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: risingStarsText
        }
      });
    }

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 2: CHURN PREVENTION - OLD BASE - TOP 3 + RISING STARS (OPTIONAL)
    // ============================================
    // Check if there's any data before displaying this section
    const hasChurnOldData = churnOldData.some(row => row[1] && row[2]); // Check if has rank and manager name

    if (hasChurnOldData) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🏆 CHURN PREVENTION - OLD BASE - TOP 3*"
        }
      });

      // Split into main (ranks 1-3) and rising stars (ranks 4-5)
      const churnOldMain = churnOldData.filter(row => row[1] && row[1] >= 1 && row[1] <= 3);
      const churnOldRising = churnOldData.filter(row => row[1] && row[1] >= 4 && row[1] <= 5);

      let churnOldText = "";
      churnOldMain.forEach((row, idx) => {
        // Row format: [Week, Rank, Manager Name, Sales, WoW, Cash Generated, ARPU, Upsell Share, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const sales = row[3];
        const wow = row[4] ? String(row[4]).trim() : "";
        const cashRaw = row[5];
        const arpu = row[6] ? row[6] : "";
        const upsellShare = row[7] ? row[7] : "";
        const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
        const region = cleanSheetData(row[8]);

        if (!rank || !managerName) return;

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        // Build sales text with optional WoW (color-coded)
        let salesText = `${sales} sales`;
        if (wow) {
          // Parse WoW number for color-coding
          const wowNum = parseInt(wow.replace(/[^0-9-]/g, ''));
          const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :  // Strong growth
                          !isNaN(wowNum) && wowNum >= 10 ? '📈' :  // Good growth
                          !isNaN(wowNum) && wowNum >= 1 ? '➕' :   // Slight growth
                          !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';  // Decline or neutral
          salesText += `  ${wowEmoji} ${wow}`;
        }

        churnOldText += `${rankEmoji} *${managerName}*\n`;
        churnOldText += `   └ ${salesText} | 💰 ${cashGenerated}`;
        if (arpu) {
          churnOldText += ` | ARPU: ${arpu}`;
        }
        if (upsellShare) {
          churnOldText += ` | Upsell: ${upsellShare}`;
        }
        if (region) {
          churnOldText += ` | ${regionEmoji} ${region}`;
        }
        churnOldText += `\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: churnOldText || "_No data available_"
        }
      });

      // Add Rising Stars if available
      if (churnOldRising.length > 0) {
        let risingStarsText = "_⭐ Rising Stars_\n\n";
        churnOldRising.forEach((row) => {
          const rank = row[1];
          const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
          const sales = row[3];
          const wow = row[4] ? String(row[4]).trim() : "";
          const cashRaw = row[5];
          const arpu = row[6] ? row[6] : "";
          const upsellShare = row[7] ? row[7] : "";
          const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
          const region = cleanSheetData(row[8]);

          if (!rank || !managerName) return;

          const regionEmoji = region ? getRegionSlackEmoji(region) : "";

          let salesText = `${sales} sales`;
          if (wow) {
            const wowNum = parseInt(wow.replace(/[^0-9-]/g, ''));
            const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :
                            !isNaN(wowNum) && wowNum >= 10 ? '📈' :
                            !isNaN(wowNum) && wowNum >= 1 ? '➕' :
                            !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';
            salesText += `  ${wowEmoji} ${wow}`;
          }

          risingStarsText += `#${rank} *${managerName}* - ${salesText} | 💰 ${cashGenerated}`;
          if (arpu) {
            risingStarsText += ` | ARPU: ${arpu}`;
          }
          if (upsellShare) {
            risingStarsText += ` | Upsell: ${upsellShare}`;
          }
          if (region) {
            risingStarsText += ` | ${regionEmoji} ${region}`;
          }
          risingStarsText += `\n`;
        });

        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: risingStarsText
          }
        });
      }
    }

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 3: KILLER BASE - CURRENT BASE - TOP 3 + RISING STARS (OPTIONAL)
    // ============================================
    const hasKillerCurrentData = killerCurrentData.some(row => row[1] && row[2]);

    if (hasKillerCurrentData) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*💪 KILLER BASE - CURRENT BASE - TOP 3*"
        }
      });

      // Split into main (ranks 1-3) and rising stars (ranks 4-5)
      const killerCurrentMain = killerCurrentData.filter(row => row[1] && row[1] >= 1 && row[1] <= 3);
      const killerCurrentRising = killerCurrentData.filter(row => row[1] && row[1] >= 4 && row[1] <= 5);

      let killerCurrentText = "";
      killerCurrentMain.forEach((row, idx) => {
        // Row format: [Week, Rank, Manager Name, Sales, WoW, Cash Generated, ARPU, Upsell Share, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const sales = row[3];
        const wow = row[4] ? String(row[4]).trim() : "";
        const cashRaw = row[5];
        const arpu = row[6] ? row[6] : "";
        const upsellShare = row[7] ? row[7] : "";
        const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
        const region = cleanSheetData(row[8]);

        if (!rank || !managerName) return;

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        // Build sales text with optional WoW (color-coded)
        let salesText = `${sales} sales`;
        if (wow) {
          // Parse WoW number for color-coding
          const wowNum = parseInt(wow.replace(/[^0-9-]/g, ''));
          const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :  // Strong growth
                          !isNaN(wowNum) && wowNum >= 10 ? '📈' :  // Good growth
                          !isNaN(wowNum) && wowNum >= 1 ? '➕' :   // Slight growth
                          !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';  // Decline or neutral
          salesText += `  ${wowEmoji} ${wow}`;
        }

        killerCurrentText += `${rankEmoji} *${managerName}*\n`;
        killerCurrentText += `   └ ${salesText} | 💰 ${cashGenerated}`;
        if (arpu) {
          killerCurrentText += ` | ARPU: ${arpu}`;
        }
        if (upsellShare) {
          killerCurrentText += ` | Upsell: ${upsellShare}`;
        }
        if (region) {
          killerCurrentText += ` | ${regionEmoji} ${region}`;
        }
        killerCurrentText += `\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: killerCurrentText || "_No data available_"
        }
      });

      // Add Rising Stars if available
      if (killerCurrentRising.length > 0) {
        let risingStarsText = "_⭐ Rising Stars_\n\n";
        killerCurrentRising.forEach((row) => {
          const rank = row[1];
          const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
          const sales = row[3];
          const wow = row[4] ? String(row[4]).trim() : "";
          const cashRaw = row[5];
          const arpu = row[6] ? row[6] : "";
          const upsellShare = row[7] ? row[7] : "";
          const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
          const region = cleanSheetData(row[8]);

          if (!rank || !managerName) return;

          const regionEmoji = region ? getRegionSlackEmoji(region) : "";

          let salesText = `${sales} sales`;
          if (wow) {
            const wowNum = parseInt(wow.replace(/[^0-9-]/g, ''));
            const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :
                            !isNaN(wowNum) && wowNum >= 10 ? '📈' :
                            !isNaN(wowNum) && wowNum >= 1 ? '➕' :
                            !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';
            salesText += `  ${wowEmoji} ${wow}`;
          }

          risingStarsText += `#${rank} *${managerName}* - ${salesText} | 💰 ${cashGenerated}`;
          if (arpu) {
            risingStarsText += ` | ARPU: ${arpu}`;
          }
          if (upsellShare) {
            risingStarsText += ` | Upsell: ${upsellShare}`;
          }
          if (region) {
            risingStarsText += ` | ${regionEmoji} ${region}`;
          }
          risingStarsText += `\n`;
        });

        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: risingStarsText
          }
        });
      }
    }

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 4: KILLER BASE - OLD BASE - TOP 3 + RISING STARS (OPTIONAL)
    // ============================================
    const hasKillerOldData = killerOldData.some(row => row[1] && row[2]);

    if (hasKillerOldData) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*💪 KILLER BASE - OLD BASE - TOP 3*"
        }
      });

      // Split into main (ranks 1-3) and rising stars (ranks 4-5)
      const killerOldMain = killerOldData.filter(row => row[1] && row[1] >= 1 && row[1] <= 3);
      const killerOldRising = killerOldData.filter(row => row[1] && row[1] >= 4 && row[1] <= 5);

      let killerOldText = "";
      killerOldMain.forEach((row, idx) => {
        // Row format: [Week, Rank, Manager Name, Sales, WoW, Cash Generated, ARPU, Upsell Share, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const sales = row[3];
        const wow = row[4] ? String(row[4]).trim() : "";
        const cashRaw = row[5];
        const arpu = row[6] ? row[6] : "";
        const upsellShare = row[7] ? row[7] : "";
        const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
        const region = cleanSheetData(row[8]);

        if (!rank || !managerName) return;

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        // Build sales text with optional WoW (color-coded)
        let salesText = `${sales} sales`;
        if (wow) {
          // Parse WoW number for color-coding
          const wowNum = parseInt(wow.replace(/[^0-9-]/g, ''));
          const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :  // Strong growth
                          !isNaN(wowNum) && wowNum >= 10 ? '📈' :  // Good growth
                          !isNaN(wowNum) && wowNum >= 1 ? '➕' :   // Slight growth
                          !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';  // Decline or neutral
          salesText += `  ${wowEmoji} ${wow}`;
        }

        killerOldText += `${rankEmoji} *${managerName}*\n`;
        killerOldText += `   └ ${salesText} | 💰 ${cashGenerated}`;
        if (arpu) {
          killerOldText += ` | ARPU: ${arpu}`;
        }
        if (upsellShare) {
          killerOldText += ` | Upsell: ${upsellShare}`;
        }
        if (region) {
          killerOldText += ` | ${regionEmoji} ${region}`;
        }
        killerOldText += `\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: killerOldText || "_No data available_"
        }
      });

      // Add Rising Stars if available
      if (killerOldRising.length > 0) {
        let risingStarsText = "_⭐ Rising Stars_\n\n";
        killerOldRising.forEach((row) => {
          const rank = row[1];
          const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
          const sales = row[3];
          const wow = row[4] ? String(row[4]).trim() : "";
          const cashRaw = row[5];
          const arpu = row[6] ? row[6] : "";
          const upsellShare = row[7] ? row[7] : "";
          const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
          const region = cleanSheetData(row[8]);

          if (!rank || !managerName) return;

          const regionEmoji = region ? getRegionSlackEmoji(region) : "";

          let salesText = `${sales} sales`;
          if (wow) {
            const wowNum = parseInt(wow.replace(/[^0-9-]/g, ''));
            const wowEmoji = !isNaN(wowNum) && wowNum >= 20 ? '🔥' :
                            !isNaN(wowNum) && wowNum >= 10 ? '📈' :
                            !isNaN(wowNum) && wowNum >= 1 ? '➕' :
                            !isNaN(wowNum) && wowNum < 0 ? '📉' : '➡️';
            salesText += `  ${wowEmoji} ${wow}`;
          }

          risingStarsText += `#${rank} *${managerName}* - ${salesText} | 💰 ${cashGenerated}`;
          if (arpu) {
            risingStarsText += ` | ARPU: ${arpu}`;
          }
          if (upsellShare) {
            risingStarsText += ` | Upsell: ${upsellShare}`;
          }
          if (region) {
            risingStarsText += ` | ${regionEmoji} ${region}`;
          }
          risingStarsText += `\n`;
        });

        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: risingStarsText
          }
        });
      }
    }

    blocks.push({ type: "divider" });

    // ━━━━━━━━ BONUS METRICS SECTION ━━━━━━━━
    blocks.push({
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: "━━━━━━━━ 📊 *BONUS METRICS* ━━━━━━━━"
      }]
    });

    // ============================================
    // SECTION 5: KB PAID RATE CONTACTED 14DAY - TOP 3 (OPTIONAL)
    // ============================================
    const hasKbPaidRateData = kbPaidRateData.some(row => row[1] && row[2]);

    if (hasKbPaidRateData) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*💪 KB PAID RATE CONTACTED 14DAY - TOP 3*"
        }
      });

      let kbPaidRateText = "";
      kbPaidRateData.forEach((row, idx) => {
        // Row format: [Week, Rank, Region, Paid Rate %, Target %, Total Payments]
        const rank = row[1];
        const region = cleanSheetData(row[2]);
        let paidRate = row[3];
        let target = row[4];
        const totalPayments = row[5];

        if (!rank || !region) return;

        // Format percentages: if it's a decimal (0.4), convert to percentage (40%)
        if (typeof paidRate === 'number' && paidRate < 1) {
          paidRate = (paidRate * 100).toFixed(2) + '%';
        } else if (typeof paidRate === 'string' && !paidRate.includes('%')) {
          const num = parseFloat(paidRate);
          if (!isNaN(num) && num < 1) {
            paidRate = (num * 100).toFixed(2) + '%';
          }
        }

        if (typeof target === 'number' && target < 1) {
          target = (target * 100).toFixed(2) + '%';
        } else if (typeof target === 'string' && !target.includes('%')) {
          const num = parseFloat(target);
          if (!isNaN(num) && num < 1) {
            target = (num * 100).toFixed(2) + '%';
          }
        }

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = getRegionSlackEmoji(region);

        kbPaidRateText += `${rankEmoji} ${regionEmoji} *${region}*\n`;
        kbPaidRateText += `   └ Paid Rate: *${paidRate}* | Target: ${target} | Total Payments: ${totalPayments}\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: kbPaidRateText || "_No data available_"
        }
      });
    }

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 6: CP PAID RATE CONTACTED 14DAY - TOP 3 (OPTIONAL)
    // ============================================
    const hasCpPaidRateData = cpPaidRateData.some(row => row[1] && row[2]);

    if (hasCpPaidRateData) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🏆 CP PAID RATE CONTACTED 14DAY - TOP 3*"
        }
      });

      let cpPaidRateText = "";
      cpPaidRateData.forEach((row, idx) => {
        // Row format: [Week, Rank, Region, Paid Rate %, Target %, Total Payments]
        const rank = row[1];
        const region = cleanSheetData(row[2]);
        let paidRate = row[3];
        let target = row[4];
        const totalPayments = row[5];

        if (!rank || !region) return;

        // Format percentages: if it's a decimal (0.4), convert to percentage (40%)
        if (typeof paidRate === 'number' && paidRate < 1) {
          paidRate = (paidRate * 100).toFixed(2) + '%';
        } else if (typeof paidRate === 'string' && !paidRate.includes('%')) {
          const num = parseFloat(paidRate);
          if (!isNaN(num) && num < 1) {
            paidRate = (num * 100).toFixed(2) + '%';
          }
        }

        if (typeof target === 'number' && target < 1) {
          target = (target * 100).toFixed(2) + '%';
        } else if (typeof target === 'string' && !target.includes('%')) {
          const num = parseFloat(target);
          if (!isNaN(num) && num < 1) {
            target = (num * 100).toFixed(2) + '%';
          }
        }

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = getRegionSlackEmoji(region);

        cpPaidRateText += `${rankEmoji} ${regionEmoji} *${region}*\n`;
        cpPaidRateText += `   └ Paid Rate: *${paidRate}* | Target: ${target} | Total Payments: ${totalPayments}\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: cpPaidRateText || "_No data available_"
        }
      });
    }

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 7: HIGHEST PAYMENTS THIS WEEK - TOP 3 (OPTIONAL)
    // ============================================
    const hasHighestPaymentsData = highestPaymentsData.some(row => row[1] && row[2]);

    if (hasHighestPaymentsData) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*💰 HIGHEST PAYMENTS THIS WEEK - TOP 3*"
        }
      });

      let highestPaymentsText = "";
      highestPaymentsData.forEach((row, idx) => {
        // Row format: [Week, Rank, Manager Name, Region, Payment ($), Slack User ID]
        const rank = row[1];
        let managerName = row[2];
        const region = cleanSheetData(row[3]);
        const payment = row[4];
        const userId = cleanSheetData(row[5]);

        if (!rank || !managerName) return;

        // Apply manager mentions (supports both direct User ID and Manager Tags lookup)
        if (userId && userId.startsWith('U') && userId.length >= 9) {
          // If User ID is provided directly in the sheet, use it
          managerName = `<@${userId}>`;
        } else {
          // Otherwise, use the applyManagerMentions function (looks up from Manager Tags sheet)
          managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(managerName) : cleanSheetData(managerName);
        }

        // Format payment with commas
        const formattedPayment = typeof payment === 'number'
          ? payment.toLocaleString('en-US')
          : payment;

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = getRegionSlackEmoji(region);

        highestPaymentsText += `${rankEmoji} *${managerName}* ${regionEmoji}\n`;
        highestPaymentsText += `   └ Payment: *$${formattedPayment}* | ${region}\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: highestPaymentsText || "_No data available_"
        }
      });
    }

    // ============================================
    // SECTION 8a: CP UPSELL - TOP 3 MANAGERS (OPTIONAL)
    // ============================================
    const hasCpUpsellData = cpUpsellData.some(row => row[1] && row[2]);

    if (hasCpUpsellData) {
      blocks.push({ type: "divider" });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🏆 CP UPSELL - TOP 3 MANAGERS*"
        }
      });

      let cpUpsellText = "";
      cpUpsellData.forEach((row) => {
        // Row format: [Week, Rank, Manager Name, N# of Sales, ARPU, Upsell Share, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const numSales = row[3];
        const arpu = row[4];
        const upsellShare = row[5];
        const region = cleanSheetData(row[6]);

        if (!rank || !managerName) return;

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        cpUpsellText += `${rankEmoji} *${managerName}*\n`;
        cpUpsellText += `   └ N# of Sales: *${numSales}* | ARPU: *${arpu}* | Upsell Share: *${upsellShare}*`;
        if (region) {
          cpUpsellText += ` | ${regionEmoji} ${region}`;
        }
        cpUpsellText += `\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: cpUpsellText || "_No data available_"
        }
      });
    }

    // ============================================
    // SECTION 8b: KB UPSELL - TOP 3 MANAGERS (OPTIONAL)
    // ============================================
    const hasKbUpsellData = kbUpsellData.some(row => row[1] && row[2]);

    if (hasKbUpsellData) {
      blocks.push({ type: "divider" });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*💪 KB UPSELL - TOP 3 MANAGERS*"
        }
      });

      let kbUpsellText = "";
      kbUpsellData.forEach((row) => {
        // Row format: [Week, Rank, Manager Name, N# of Sales, ARPU, Upsell Share, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const numSales = row[3];
        const arpu = row[4];
        const upsellShare = row[5];
        const region = cleanSheetData(row[6]);

        if (!rank || !managerName) return;

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        kbUpsellText += `${rankEmoji} *${managerName}*\n`;
        kbUpsellText += `   └ N# of Sales: *${numSales}* | ARPU: *${arpu}* | Upsell Share: *${upsellShare}*`;
        if (region) {
          kbUpsellText += ` | ${regionEmoji} ${region}`;
        }
        kbUpsellText += `\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: kbUpsellText || "_No data available_"
        }
      });
    }

    // ============================================
    // SECTION 8c: BIGGEST ARPU SALE OF THE WEEK (OPTIONAL)
    // ============================================
    const hasBiggestArpuData = biggestArpuData.some(row => row[1] && row[2]);

    if (hasBiggestArpuData) {
      blocks.push({ type: "divider" });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*📈 BIGGEST ARPU SALE OF THE WEEK*"
        }
      });

      let biggestArpuText = "";
      let arpuEntryIndex = 1;
      biggestArpuData.forEach((row) => {
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[1]) : cleanSheetData(row[1]);
        const client = cleanSheetData(row[2]);
        const prevArpu = row[3];
        const newArpu = row[4];
        const region = cleanSheetData(row[5]);

        if (!managerName || !client) return;

        const rankEmoji = getRankEmoji(arpuEntryIndex);
        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        const prevFormatted = typeof prevArpu === 'number' ? `$${prevArpu.toLocaleString('en-US')}` : prevArpu;
        const newFormatted = typeof newArpu === 'number' ? `$${newArpu.toLocaleString('en-US')}` : newArpu;

        // Calculate and show ARPU uplift
        let upliftText = "";
        if (typeof prevArpu === 'number' && typeof newArpu === 'number') {
          const uplift = newArpu - prevArpu;
          upliftText = uplift >= 0
            ? ` | 📈 +$${uplift.toLocaleString('en-US')} uplift`
            : ` | 📉 -$${Math.abs(uplift).toLocaleString('en-US')} uplift`;
        }

        biggestArpuText += `${rankEmoji} *${managerName}*\n`;
        biggestArpuText += `   └ Client: *${client}* | Prev ARPU: ${prevFormatted} → New ARPU: *${newFormatted}*${upliftText}`;
        if (region) {
          biggestArpuText += ` | ${regionEmoji} ${region}`;
        }
        biggestArpuText += `\n\n`;
        arpuEntryIndex++;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: biggestArpuText || "_No data available_"
        }
      });
    }

    // ============================================
    // SECTION 12: TOP 3 ARPU WITH 20+ PAYMENTS (OPTIONAL)
    // ============================================
    const hasTop3ArpuData = top3ArpuData.some(row => row[1] && row[2]);

    if (hasTop3ArpuData) {
      blocks.push({ type: "divider" });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*📊 TOP 3 ARPU - 20+ PAYMENTS*"
        }
      });

      let top3ArpuText = "";
      top3ArpuData.forEach((row) => {
        // Row format: [Week, Rank, Manager Name, ARPU, Total Payments, Upsell Share, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const arpu = row[3];
        const totalPayments = row[4];
        const upsellShare = row[5];
        const region = cleanSheetData(row[6]);

        if (!rank || !managerName) return;

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        top3ArpuText += `${rankEmoji} *${managerName}*\n`;
        top3ArpuText += `   └ ARPU: *${arpu}* | Total Payments: *${totalPayments}* | Upsell Share: *${upsellShare}*`;
        if (region) {
          top3ArpuText += ` | ${regionEmoji} ${region}`;
        }
        top3ArpuText += `\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: top3ArpuText || "_No data available_"
        }
      });
    }

    // ============================================
    // SECTION 13: TOP 3 UPSELL SHARE WITH 20+ PAYMENTS (OPTIONAL)
    // ============================================
    const hasTop3UpsellData = top3UpsellData.some(row => row[1] && row[2]);

    if (hasTop3UpsellData) {
      blocks.push({ type: "divider" });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🔥 TOP 3 UPSELL SHARE - 20+ PAYMENTS*"
        }
      });

      let top3UpsellText = "";
      top3UpsellData.forEach((row) => {
        // Row format: [Week, Rank, Manager Name, Upsell Share, Total Payments, ARPU, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const upsellShare = row[3];
        const totalPayments = row[4];
        const arpu = row[5];
        const region = cleanSheetData(row[6]);

        if (!rank || !managerName) return;

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        top3UpsellText += `${rankEmoji} *${managerName}*\n`;
        top3UpsellText += `   └ Upsell Share: *${upsellShare}* | Total Payments: *${totalPayments}* | ARPU: *${arpu}*`;
        if (region) {
          top3UpsellText += ` | ${regionEmoji} ${region}`;
        }
        top3UpsellText += `\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: top3UpsellText || "_No data available_"
        }
      });
    }

    // ============================================
    // SECTION 14: REACTIVATION RESULTS - TOP 5
    // ============================================
    const hasReactivationData = reactivationData && reactivationData.some(row => row[1] && row[2] && row[3]);

    if (hasReactivationData) {
      blocks.push({ type: "divider" });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🔄 REACTIVATION RESULTS - TOP 5*"
        }
      });

      let reactivationText = "";
      reactivationData.forEach((row) => {
        // Row format: [Week, Rank, Manager Name, Number of Returns, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const numReturns = row[3];
        const region = cleanSheetData(row[4]);

        if (!rank || !managerName || !numReturns) return;

        const rankEmoji = getRankEmoji(rank);
        const regionEmoji = region ? getRegionSlackEmoji(region) : "";

        reactivationText += `${rankEmoji} *${managerName}*\n`;
        reactivationText += `   └ Reactivated: *${numReturns} customers*`;
        if (region) {
          reactivationText += ` | ${regionEmoji} ${region}`;
        }
        reactivationText += `\n\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: reactivationText || "_No data available_"
        }
      });
    }

    // Footer with stats from sheet (you can update these manually)
    // Note: totalsData[0] is Display Date, so actual totals start at index 1
    // Variables already declared in summary block above, just get additional ones
    const churnCurrent = totalsData[3] ? totalsData[3][1] : 0;
    const churnOld = totalsData[4] ? totalsData[4][1] : 0;
    const killerCurrent = totalsData[6] ? totalsData[6][1] : 0;
    const killerOld = totalsData[7] ? totalsData[7][1] : 0;

    blocks.push({ type: "divider" });

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📊 *Grand Total:* ${grandTotal} sales | 🏆 CP: ${churnTotal} (${churnCurrent} Current + ${churnOld} Old) | 💪 KB: ${killerTotal} (${killerCurrent} Current + ${killerOld} Old) | Updated: ${new Date().toLocaleString()}`
        }
      ]
    });

    Logger.log(`Built combined leaderboard with ${blocks.length} blocks`);
    return { blocks: blocks };

  } catch (error) {
    Logger.log(`Error building combined leaderboard: ${error.message}`);
    return { text: `Error building combined leaderboard: ${error.message}` };
  }
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

  // Extract emojis from the original value to preserve them
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F910}-\u{1F96B}\u{1F980}-\u{1F9E0}]|🔴|🟢|🟡|🟠|🔵|🟣|⚫|⚪|🟤|✅|❌|⚠️|🚦|📅|📊|💰|🛒|📞|💬|💳|🔺|🔻|▲|▼/gu;

  // Find emoji positions in original string
  const emojiMatches = [...str.matchAll(emojiRegex)];
  const hasEmojiAtStart = emojiMatches.length > 0 && emojiMatches[0].index === 0;
  const emojis = emojiMatches.map(m => m[0]);
  const emojiString = emojis.join(' ');

  // Currency formatting
  if (lower.includes("revenue") || lower.includes("arpu") || lower.includes("price") || lower.includes("amount")) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      const formatted = `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
      if (!emojiString) return formatted;
      // Preserve emoji position (start or end)
      return hasEmojiAtStart ? `${emojiString} ${formatted}` : `${formatted} ${emojiString}`;
    }
  }

  // Percentage formatting - PRESERVE EMOJIS FROM SHEET
  if (lower.includes("percent") || lower.includes("%") || lower.includes("rate") || lower.includes("plan") || lower.includes("forecast") || lower.includes("today") || lower.includes("yesterday")) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      const formatted = `${num.toFixed(2)}%`;
      if (!emojiString) return formatted;
      // Preserve emoji position (start or end)
      return hasEmojiAtStart ? `${emojiString} ${formatted}` : `${formatted} ${emojiString}`;
    }
  }

  // Number formatting
  if (lower.includes("purchase") || lower.includes("count") || lower.includes("total") || lower.includes("quantity")) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      if (!emojiString) return formatted;
      // Preserve emoji position (start or end)
      return hasEmojiAtStart ? `${emojiString} ${formatted}` : `${formatted} ${emojiString}`;
    }
  }

  // Return as-is (emojis already preserved in original position)
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
  if (lower.includes("response")) return "💬";
  if (lower.includes("payment")) return "💳";
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
 * GET PERFORMANCE EMOJI - Returns emoji based on percentage achievement
 * ✅ >= 100% (Excellent)
 * ⚠️ 90-99% (Warning)
 * ❌ < 90% (Critical)
 */
function getPerformanceEmoji(valueStr) {
  // Handle various formats: "99.0%", "99%", "0.99", 99, etc.
  if (!valueStr || valueStr === "N/A") return "";

  let numValue;
  const str = String(valueStr).trim();

  // Remove percentage sign if present and convert
  if (str.includes("%")) {
    numValue = parseFloat(str.replace("%", "").trim());
  } else {
    numValue = parseFloat(str);
    // If value is between 0 and 1, assume it's decimal format (0.99 = 99%)
    if (numValue > 0 && numValue <= 1) {
      numValue = numValue * 100;
    }
  }

  if (isNaN(numValue)) return "";

  if (numValue >= 100) return " ✅";
  if (numValue >= 90) return " ⚠️";
  return " ❌";
}

/**
 * GET REGION FLAG - Returns flag emoji for region code
 */
function getRegionFlag(region) {
  const r = String(region).toUpperCase().trim();

  if (r === "TR" || r.includes("TURKEY")) return "🇹🇷";
  if (r === "PL" || r.includes("POLAND")) return "🇵🇱";
  if (r === "IL" || r.includes("ISRAEL")) return "🇮🇱";
  if (r === "FR" || r.includes("FRANCE")) return "🇫🇷";
  if (r === "IT" || r.includes("ITALY")) return "🇮🇹";
  if (r === "RO" || r.includes("ROMANIA")) return "🇷🇴";
  if (r === "ES" || r.includes("SPAIN")) return "🇪🇸";
  if (r === "RU" || r.includes("RUSSIA")) return "🇷🇺";
  if (r.includes("DE") || r.includes("GERMANY")) return "🇩🇪";
  if (r.includes("NL") || r.includes("NETHERLANDS")) return "🇳🇱";
  if (r.includes("CH") || r.includes("SWITZERLAND")) return "🇨🇭";
  if (r.includes("AT") || r.includes("AUSTRIA")) return "🇦🇹";
  if (r.includes("CZ") || r.includes("CZECH")) return "🇨🇿";
  if (r.includes("SK") || r.includes("SLOVAK")) return "🇸🇰";
  if (r.includes("AE") || r.includes("EMIRATES")) return "🇦🇪";
  if (r.includes("AR") || r.includes("ARGENTINA")) return "🇦🇷";
  if (r.includes("SA") || r.includes("SAUDI")) return "🇸🇦";
  if (r === "TOTAL" || r.includes("GLOBAL")) return "🌍";

  return "📍";
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

    const result = sendEnhancedSlackMessage(automation, {}, 0, true, {
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
 * UPDATE SPECIFIC MESSAGE - Manually update a message by timestamp
 *
 * This is helpful when you want to update a specific Slack message with fresh data.
 *
 * To get the message timestamp:
 * 1. In Slack, hover over the message
 * 2. Click the "..." menu → "Copy link"
 * 3. The link looks like: https://workspace.slack.com/archives/C123/p1234567890123456
 * 4. The timestamp is: 1234567890.123456 (add decimal point before last 6 digits)
 *
 * Example: updateSpecificMessage('auto_123', '1705934477.861929')
 */
function updateSpecificMessage(automationId, messageTimestamp, channel) {
  try {
    Logger.log(`Updating message ${messageTimestamp} for automation ${automationId} in channel ${channel}`);

    const automations = getSlackAutomations();
    const automation = automations.find(a => a.id === automationId);

    if (!automation) {
      return { success: false, error: `Automation with ID ${automationId} not found.` };
    }

    // Enable message update temporarily
    if (!automation.messageUpdate) {
      automation.messageUpdate = { enabled: false };
    }

    const originalEnabled = automation.messageUpdate.enabled;
    const originalStrategy = automation.messageUpdate.strategy;
    const originalMessageId = automation.messageUpdate.messageId;
    const originalChannel = automation.slackChannel;

    // Temporarily set to update specific message in specific channel
    automation.messageUpdate.enabled = true;
    automation.messageUpdate.strategy = 'update_by_id';
    automation.messageUpdate.messageId = messageTimestamp;
    automation.slackChannel = channel; // Use the channel where message was sent

    // Get fresh data from sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.targetSheet);

    if (!sheet) {
      return { success: false, error: `Sheet "${automation.targetSheet}" not found.` };
    }

    const data = sheet.getDataRange().getDisplayValues();
    if (data.length < 2) {
      return { success: false, error: "Sheet has no data rows." };
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Filter by criteria if any
    const matchingRows = filterRowsByCriteria(rows, automation.criteria, headers);

    Logger.log(`Updating message with ${matchingRows.length} rows`);

    // Send update
    const result = sendEnhancedSlackMessage(automation, {}, 0, true, {
      headers: headers,
      data: matchingRows
    });

    // Restore original settings
    automation.messageUpdate.enabled = originalEnabled;
    automation.messageUpdate.strategy = originalStrategy;
    automation.messageUpdate.messageId = originalMessageId;
    automation.slackChannel = originalChannel;

    if (!result.success) {
      return { success: false, error: `Failed to update message: ${result.error || 'Unknown error'}` };
    }

    Logger.log("✅ Message updated successfully!");

    return {
      success: true,
      message: `✅ Message updated! Timestamp: ${messageTimestamp}, Rows: ${matchingRows.length}`
    };
  } catch (error) {
    Logger.log("Error: " + error.message);
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
        // Create or reuse shared hourly trigger
        const schedId = getOrCreateSharedScheduledTrigger();
        if (schedId) automation.triggerIds.push(schedId);
      }
      break;
  }
  return automation.triggerIds;
}

/**
 * GET OR CREATE SHARED SCHEDULED TRIGGER
 * Creates ONE shared hourly trigger for ALL scheduled automations
 * Each automation's schedule is checked in executeBulkSlackAutomation()
 */
function getOrCreateSharedScheduledTrigger() {
  const triggers = ScriptApp.getProjectTriggers();

  // Check if shared trigger already exists
  const existing = triggers.find(t =>
    t.getHandlerFunction() === "executeBulkSlackAutomation" &&
    t.getEventType() === ScriptApp.EventType.CLOCK
  );

  if (existing) {
    Logger.log("Using existing shared scheduled trigger");
    return existing.getUniqueId();
  }

  // Create new shared trigger that runs every hour
  Logger.log("Creating new shared scheduled trigger (hourly)");
  const trigger = ScriptApp.newTrigger("executeBulkSlackAutomation")
    .timeBased()
    .everyHours(1)
    .create();

  return trigger.getUniqueId();
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

    // Check if any other automations are using scheduled triggers
    const otherScheduledAutomations = automations.filter(a =>
      a.id !== automationId &&
      a.enabled &&
      a.triggerType === "bulkCriteria" &&
      a.schedule &&
      a.schedule.enabled
    );

    triggers.forEach(t => {
      if (auto.triggerIds.includes(t.getUniqueId())) {
        // Don't delete shared scheduled trigger if other automations need it
        if (t.getHandlerFunction() === "executeBulkSlackAutomation" &&
            t.getEventType() === ScriptApp.EventType.CLOCK &&
            otherScheduledAutomations.length > 0) {
          Logger.log("Keeping shared scheduled trigger (other automations need it)");
          return;
        }

        Logger.log(`Deleting trigger: ${t.getHandlerFunction()}`);
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
 * STORE SENT MESSAGE - Save message metadata for deletion capability
 */
function storeSentMessage(messageData) {
  try {
    const messages = getSentMessages();
    messages.unshift(messageData); // Add to beginning

    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.splice(100);
    }

    PropertiesService.getScriptProperties().setProperty(
      "sentSlackMessages",
      JSON.stringify(messages)
    );
  } catch (e) {
    Logger.log("Error storing message: " + e.message);
  }
}

/**
 * GET SENT MESSAGES - Retrieve list of sent messages
 */
function getSentMessages() {
  try {
    const stored = PropertiesService.getScriptProperties().getProperty("sentSlackMessages");
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    Logger.log("Error getting sent messages: " + e.message);
    return [];
  }
}

/**
 * TEST SLACK CONFIGURATION - Run this to test if Slack config is being read correctly
 * Open Execution log to see results
 */
function testSlackConfiguration() {
  const properties = PropertiesService.getScriptProperties();

  Logger.log("=== SLACK CONFIGURATION TEST ===");
  Logger.log("SLACK_BOT_TOKEN: " + (properties.getProperty("SLACK_BOT_TOKEN") ? "EXISTS (length: " + properties.getProperty("SLACK_BOT_TOKEN").length + ")" : "NOT FOUND"));
  Logger.log("SLACK_CHANNELS: " + properties.getProperty("SLACK_CHANNELS"));
  Logger.log("SLACK_CHANNEL: " + properties.getProperty("SLACK_CHANNEL"));
  Logger.log("SlackChannel (PascalCase): " + properties.getProperty("SlackChannel"));
  Logger.log("SLACK_WEBHOOK_URL: " + (properties.getProperty("SLACK_WEBHOOK_URL") ? "EXISTS" : "NOT FOUND"));

  Logger.log("\n=== CALLING getSlackConfiguration() ===");
  const config = getSlackConfiguration();
  Logger.log("Result: " + JSON.stringify(config, null, 2));

  return config;
}

/**
 * GET SLACK CONFIGURATION - Returns bot token status and available channels
 * Used by UI to configure Slack settings
 */
function getSlackConfiguration() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const botToken = properties.getProperty("SLACK_BOT_TOKEN");

    // Check multiple property name variations for channels
    const channelsString = properties.getProperty("SLACK_CHANNELS"); // Plural - preferred
    const defaultChannel = properties.getProperty("SLACK_CHANNEL") ||  // UPPER_CASE
                          properties.getProperty("SlackChannel");      // PascalCase (fallback)

    Logger.log("Bot Token exists: " + !!botToken);
    Logger.log("SLACK_CHANNELS: " + channelsString);
    Logger.log("SLACK_CHANNEL/SlackChannel: " + defaultChannel);

    // Parse channels (comma-separated list)
    let channels = [];

    // First, check SLACK_CHANNELS (plural) - preferred property
    if (channelsString && channelsString.trim()) {
      channels = channelsString.split(',').map(c => c.trim()).filter(c => c);
    }
    // If SLACK_CHANNELS doesn't exist, check if SLACK_CHANNEL has comma-separated values
    else if (defaultChannel && defaultChannel.trim() && defaultChannel.includes(',')) {
      channels = defaultChannel.split(',').map(c => c.trim()).filter(c => c);
    }
    // If SLACK_CHANNEL is a single value, use it
    else if (defaultChannel && defaultChannel.trim()) {
      channels = [defaultChannel.trim()];
    }

    // Add some common channel formats as examples if no channels configured
    if (channels.length === 0) {
      Logger.log("No channels configured, using examples");
      channels = ['#weekly-updates', '#daily-reports', '#alerts'];
    }

    Logger.log("Final channels array: " + JSON.stringify(channels));

    return {
      hasBotToken: !!botToken,
      channels: channels,
      defaultChannel: channels[0] || ''
    };
  } catch (e) {
    Logger.log("Error getting Slack configuration: " + e.message);
    return {
      hasBotToken: false,
      channels: [],
      defaultChannel: ''
    };
  }
}

/**
 * DELETE SLACK MESSAGE - Delete a specific message using bot token
 */
function deleteSlackMessage(channelId, timestamp) {
  try {
    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");

    if (!botToken) {
      return {
        success: false,
        error: "Slack Bot Token not configured. Please add SLACK_BOT_TOKEN to Script Properties."
      };
    }

    const url = "https://slack.com/api/chat.delete";

    const payload = {
      "channel": channelId,
      "ts": timestamp
    };

    const options = {
      "method": "post",
      "contentType": "application/json",
      "headers": {
        "Authorization": "Bearer " + botToken
      },
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      // Remove from stored messages
      removeSentMessage(timestamp);
      Logger.log("✅ Message deleted successfully.");
      return { success: true, message: "Message deleted successfully" };
    } else {
      Logger.log("❌ Error deleting message: " + result.error);
      return { success: false, error: `Slack API error: ${result.error}` };
    }
  } catch (e) {
    Logger.log("❌ Request failed: " + e.toString());
    return { success: false, error: e.message };
  }
}

/**
 * REMOVE SENT MESSAGE - Remove message from stored list after deletion
 */
function removeSentMessage(timestamp) {
  try {
    const messages = getSentMessages();
    const filtered = messages.filter(m => m.timestamp !== timestamp);
    PropertiesService.getScriptProperties().setProperty(
      "sentSlackMessages",
      JSON.stringify(filtered)
    );
  } catch (e) {
    Logger.log("Error removing message from list: " + e.message);
  }
}

/**
 * DELETE MULTIPLE MESSAGES - Bulk delete messages
 */
function deleteMultipleMessages(messageIds) {
  try {
    const messages = getSentMessages();
    const results = [];

    messageIds.forEach(id => {
      const message = messages.find(m => m.timestamp === id);
      if (message) {
        const result = deleteSlackMessage(message.channel, message.timestamp);
        results.push({
          timestamp: id,
          ...result
        });
      }
    });

    const successCount = results.filter(r => r.success).length;
    return {
      success: true,
      deleted: successCount,
      failed: results.length - successCount,
      details: results
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * CLEAR OLD MESSAGES - Delete messages older than specified days
 */
function clearOldMessages(daysOld) {
  try {
    const messages = getSentMessages();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const toDelete = messages.filter(m => new Date(m.sentAt) < cutoffDate);

    if (toDelete.length === 0) {
      return { success: true, message: "No old messages to delete", deleted: 0 };
    }

    const results = deleteMultipleMessages(toDelete.map(m => m.timestamp));
    return results;
  } catch (e) {
    return { success: false, error: e.message };
  }
}
