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

    // Get all data sections from the sheet (TOP 3 STRUCTURE)
    const churnCurrentData = sheet.getRange("A3:G5").getValues();
    const churnOldData = sheet.getRange("A9:G11").getValues();
    const killerCurrentData = sheet.getRange("A15:G17").getValues();
    const killerOldData = sheet.getRange("A21:G23").getValues();
    const totalsData = sheet.getRange("A27:B34").getValues();
    const managerOfWeekData = sheet.getRange("A38:E38").getValues();
    const kbPaidRateData = sheet.getRange("A42:F44").getValues();
    const cpPaidRateData = sheet.getRange("A48:F50").getValues();
    const highestPaymentsData = sheet.getRange("A54:F56").getValues();

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
    // MANAGER OF THE WEEK - Read from sheet (editable) or auto-calculate
    // ============================================
    // Row format: [Manager Name, Sales, Cash Generated, WoW, Description]
    const manualManager = managerOfWeekData[0];
    const hasManualData = manualManager && manualManager[0] && String(manualManager[0]).trim() !== "";

    let managerOfWeekDisplay = null;

    if (hasManualData) {
      // Use manual data from sheet
      const managerName = manualManager[0];
      const sales = manualManager[1];
      const cashRaw = manualManager[2];
      const wow = manualManager[3] ? String(manualManager[3]).trim() : "";
      const description = manualManager[4] ? String(manualManager[4]).trim() : "";

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
            const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
            const section = sectionNames[sectionIdx];

            if (managerName && sales) {
              allManagers.push({
                name: managerName,
                sales: sales,
                wow: wow,
                cash: cashGenerated,
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

    // ============================================
    // SECTION 1: CHURN PREVENTION - CURRENT BASE - TOP 3
    // ============================================
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🏆 CHURN PREVENTION - CURRENT BASE - TOP 3*"
      }
    });

    let churnCurrentText = "";
    churnCurrentData.forEach((row, idx) => {
      // Row format: [Week, Rank, Manager Name, Sales, WoW, Cash Generated, Region]
      const rank = row[1];
      const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
      const sales = row[3];
      const wow = row[4] ? String(row[4]).trim() : "";
      const cashRaw = row[5];
      const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
      const region = cleanSheetData(row[6]);

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
        salesText += ` (${wowEmoji} ${wow} WoW)`;
      }

      churnCurrentText += `${rankEmoji} *${managerName}*\n`;
      churnCurrentText += `   └ ${salesText} | 💰 ${cashGenerated}`;
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

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 2: CHURN PREVENTION - OLD BASE - TOP 3 (OPTIONAL)
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

      let churnOldText = "";
      churnOldData.forEach((row, idx) => {
        // Row format: [Week, Rank, Manager Name, Sales, WoW, Cash Generated, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const sales = row[3];
        const wow = row[4] ? String(row[4]).trim() : "";
        const cashRaw = row[5];
        const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
        const region = cleanSheetData(row[6]);

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
          salesText += ` (${wowEmoji} ${wow} WoW)`;
        }

        churnOldText += `${rankEmoji} *${managerName}*\n`;
        churnOldText += `   └ ${salesText} | 💰 ${cashGenerated}`;
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
    }

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 3: KILLER BASE - CURRENT BASE - TOP 3 (OPTIONAL)
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

      let killerCurrentText = "";
      killerCurrentData.forEach((row, idx) => {
        // Row format: [Week, Rank, Manager Name, Sales, WoW, Cash Generated, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const sales = row[3];
        const wow = row[4] ? String(row[4]).trim() : "";
        const cashRaw = row[5];
        const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
        const region = cleanSheetData(row[6]);

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
          salesText += ` (${wowEmoji} ${wow} WoW)`;
        }

        killerCurrentText += `${rankEmoji} *${managerName}*\n`;
        killerCurrentText += `   └ ${salesText} | 💰 ${cashGenerated}`;
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
    }

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 4: KILLER BASE - OLD BASE - TOP 3 (OPTIONAL)
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

      let killerOldText = "";
      killerOldData.forEach((row, idx) => {
        // Row format: [Week, Rank, Manager Name, Sales, WoW, Cash Generated, Region]
        const rank = row[1];
        const managerName = typeof applyManagerMentions === 'function' ? applyManagerMentions(row[2]) : cleanSheetData(row[2]);
        const sales = row[3];
        const wow = row[4] ? String(row[4]).trim() : "";
        const cashRaw = row[5];
        const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
        const region = cleanSheetData(row[6]);

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
          salesText += ` (${wowEmoji} ${wow} WoW)`;
        }

        killerOldText += `${rankEmoji} *${managerName}*\n`;
        killerOldText += `   └ ${salesText} | 💰 ${cashGenerated}`;
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
    }

    blocks.push({ type: "divider" });

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

    // Footer with stats from sheet (you can update these manually)
    // Note: totalsData[0] is Display Date, so actual totals start at index 1
    const grandTotal = totalsData[1][1] || 0;
    const churnTotal = totalsData[2][1] || 0;
    const churnCurrent = totalsData[3][1] || 0;
    const churnOld = totalsData[4][1] || 0;
    const killerTotal = totalsData[5][1] || 0;
    const killerCurrent = totalsData[6][1] || 0;
    const killerOld = totalsData[7][1] || 0;

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
