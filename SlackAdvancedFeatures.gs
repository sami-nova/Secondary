/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SLACK ADVANCED FEATURES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file contains all the advanced Slack features:
 * 1. Color-Coded Alerts (Red/Yellow/Green sidebars)
 * 2. @User Mentions (Tag specific people)
 * 3. Conditional @channel (Notify everyone when critical)
 * 4. Interactive Buttons (Click to take action)
 * 5. Message Editing (Update existing messages)
 * 6. Auto-Reactions (Emoji status indicators)
 * 7. Progress Bars (Visual goal tracking)
 * 8. Multi-Channel Posting (Send to multiple channels)
 * 9. File Attachments (Excel/PDF/Charts)
 * 10. Threaded Updates (Summary + details in thread)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * FEATURE 1: EVALUATE ALERT LEVEL - Determine color code based on data
 * Returns: { level: 'critical'|'warning'|'success'|'info', color: 'danger'|'warning'|'good'|'#439FE0' }
 */
function evaluateAlertLevel(automation, rowData) {
  // Default to info
  let alertLevel = {
    level: 'info',
    color: '#439FE0', // Slack blue
    icon: 'ℹ️',
    prefix: ''
  };

  // Check if color alerts are enabled
  if (!automation.colorAlerts || !automation.colorAlerts.enabled) {
    return alertLevel;
  }

  const rules = automation.colorAlerts.rules || [];

  // Evaluate each rule in order (critical, warning, success)
  for (const rule of rules) {
    if (evaluateCondition(rowData, rule.condition)) {
      return {
        level: rule.level,
        color: rule.color,
        icon: rule.icon || '',
        prefix: rule.prefix || ''
      };
    }
  }

  return alertLevel;
}

/**
 * FEATURE 2: BUILD MENTIONS - Create @user and @channel mentions
 */
function buildMentions(automation, rowData) {
  let mentions = [];

  // Check for user mentions
  if (automation.mentions && automation.mentions.enabled) {
    for (const mention of automation.mentions.users || []) {
      if (evaluateCondition(rowData, mention.condition)) {
        // Add user mention
        const userId = mention.userId || mention.userEmail;
        if (userId) {
          mentions.push({
            type: 'user',
            id: userId,
            message: mention.message || ''
          });
        }
      }
    }
  }

  // Check for channel-wide notifications
  if (automation.channelNotify && automation.channelNotify.enabled) {
    const notifyType = automation.channelNotify.type || 'conditional';

    if (notifyType === 'always') {
      mentions.push({ type: 'channel', id: 'channel' });
    } else if (notifyType === 'conditional') {
      if (evaluateCondition(rowData, automation.channelNotify.condition)) {
        mentions.push({ type: 'channel', id: 'channel' });
      }
    }

    // Check for @here
    if (automation.channelNotify.useHere) {
      if (evaluateCondition(rowData, automation.channelNotify.condition)) {
        mentions.push({ type: 'here', id: 'here' });
      }
    }
  }

  return mentions;
}

/**
 * FEATURE 3: FORMAT MENTIONS - Convert mentions to Slack format
 * CRITICAL: Only formats valid mentions to prevent "🔒private channel" text
 */
function formatMentions(mentions) {
  let text = '';

  for (const mention of mentions) {
    if (mention.type === 'user') {
      // VALIDATION: User IDs must start with 'U' and be at least 9 characters
      // Invalid IDs cause Slack to display "🔒private channel"
      const userId = mention.id;
      if (userId && userId.startsWith('U') && userId.length >= 9) {
        text += `<@${userId}> `;
        if (mention.message) {
          text += mention.message + ' ';
        }
      } else {
        Logger.log(`⚠ Skipping invalid user ID: "${userId}" (would show as "private channel")`);
      }
    } else if (mention.type === 'channel') {
      text += '<!channel> ';
    } else if (mention.type === 'here') {
      text += '<!here> ';
    }
  }

  return text.trim();
}

/**
 * FEATURE 4: BUILD INTERACTIVE BUTTONS - Create action buttons
 */
function buildActionButtons(automation, rowData) {
  if (!automation.buttons || !automation.buttons.enabled) {
    return null;
  }

  const buttons = [];

  for (const btn of automation.buttons.actions || []) {
    const button = {
      type: 'button',
      text: {
        type: 'plain_text',
        text: btn.label || 'Button',
        emoji: true
      },
      action_id: btn.actionId || `button_${Date.now()}`,
      style: btn.style || 'default' // primary, danger, default
    };

    // Add URL if specified
    if (btn.action === 'url' && btn.url) {
      button.url = processTemplate(btn.url, rowData);
    }

    // Add value for other actions
    if (btn.value) {
      button.value = processTemplate(btn.value, rowData);
    }

    buttons.push(button);
  }

  if (buttons.length === 0) return null;

  return {
    type: 'actions',
    elements: buttons
  };
}

/**
 * FEATURE 5: UPDATE EXISTING MESSAGE - Edit message instead of creating new
 */
function updateSlackMessage(automation, channel, timestamp, payload) {
  try {
    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");

    if (!botToken) {
      Logger.log("Cannot update message: Bot token required");
      return { success: false, error: "Bot token required for message updates" };
    }

    // Prepare update payload
    const updatePayload = {
      channel: channel,
      ts: timestamp,
      ...payload
    };

    const options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + botToken,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(updatePayload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch("https://slack.com/api/chat.update", options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      Logger.log("✅ Message updated successfully");
      return { success: true, ts: result.ts };
    } else {
      Logger.log(`❌ Message update failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    Logger.log("Error updating message: " + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * FEATURE 6: ADD EMOJI REACTIONS - Add reactions to sent message
 */
function addReactions(channel, timestamp, reactions) {
  try {
    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");

    Logger.log(`\n🔍 ADD REACTIONS DEBUG:`);
    Logger.log(`  - botToken: ${botToken ? 'EXISTS (length: ' + botToken.length + ')' : 'MISSING'}`);
    Logger.log(`  - channel: ${channel}`);
    Logger.log(`  - timestamp: ${timestamp}`);
    Logger.log(`  - reactions array: ${JSON.stringify(reactions)}`);

    if (!botToken) {
      Logger.log(`❌ CRITICAL: No bot token found in Script Properties`);
      return { success: false, error: 'No bot token' };
    }

    if (!reactions || reactions.length === 0) {
      Logger.log(`⚠️ No reactions to add (empty array)`);
      return { success: true };
    }

    let successCount = 0;
    let errors = [];

    for (const emoji of reactions) {
      // Remove colons if present
      const emojiName = emoji.replace(/:/g, '');
      Logger.log(`\n  Adding reaction: "${emoji}" (cleaned: "${emojiName}")`);

      const payload = {
        channel: channel,
        timestamp: timestamp,
        name: emojiName
      };

      const options = {
        method: "post",
        headers: {
          "Authorization": "Bearer " + botToken,
          "Content-Type": "application/json"
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch("https://slack.com/api/reactions.add", options);
      const responseText = response.getContentText();
      Logger.log(`  Response: ${responseText}`);

      const result = JSON.parse(responseText);

      if (result.ok) {
        successCount++;
        Logger.log(`  ✅ Success!`);
      } else {
        const errorMsg = `${emoji}: ${result.error}`;
        errors.push(errorMsg);
        Logger.log(`  ❌ Failed: ${result.error}`);

        // Log additional error details if available
        if (result.needed) Logger.log(`     Needed scope: ${result.needed}`);
        if (result.provided) Logger.log(`     Provided scope: ${result.provided}`);
      }

      // Add small delay between reactions
      Utilities.sleep(100);
    }

    Logger.log(`\n📊 FINAL RESULT: Added ${successCount}/${reactions.length} reactions`);
    if (errors.length > 0) {
      Logger.log(`❌ Errors: ${errors.join(', ')}`);
    }

    return { success: successCount > 0, count: successCount, errors: errors };
  } catch (error) {
    Logger.log("❌ Exception in addReactions: " + error.message);
    Logger.log("❌ Stack: " + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * FEATURE 7: BUILD PROGRESS BAR - Create visual progress indicator
 */
function buildProgressBar(value, goal, width = 20, style = 'blocks') {
  if (!value || !goal || goal === 0) return '';

  const percentage = Math.min(Math.max((value / goal) * 100, 0), 100);
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  let bar = '';

  if (style === 'blocks') {
    bar = '█'.repeat(filled) + '░'.repeat(empty);
  } else if (style === 'shaded') {
    bar = '▓'.repeat(filled) + '░'.repeat(empty);
  } else if (style === 'ascii') {
    bar = '[' + '='.repeat(filled) + ' '.repeat(empty) + ']';
  }

  return bar;
}

/**
 * FEATURE 7B: ADD PROGRESS BARS TO MESSAGE - Enhance message with progress bars
 */
function addProgressBarsToData(automation, headers, rows) {
  if (!automation.progressBars || !automation.progressBars.enabled) {
    return { headers, rows };
  }

  const config = automation.progressBars;
  const valueColumnIndex = headers.indexOf(config.valueColumn);
  const goalColumnIndex = headers.indexOf(config.goalColumn);

  if (valueColumnIndex === -1 || goalColumnIndex === -1) {
    Logger.log("Progress bar columns not found");
    return { headers, rows };
  }

  // Add progress bar column
  const newHeaders = [...headers, 'Progress'];
  const newRows = rows.map(row => {
    const value = parseFloat(String(row[valueColumnIndex]).replace(/[^0-9.-]/g, '')) || 0;
    const goal = parseFloat(String(row[goalColumnIndex]).replace(/[^0-9.-]/g, '')) || 0;
    const percentage = goal > 0 ? Math.round((value / goal) * 100) : 0;

    const bar = buildProgressBar(value, goal, config.width || 20, config.style || 'blocks');
    const icon = percentage >= 90 ? '✅' : percentage >= 70 ? '⚠️' : '❌';

    const progressText = `${bar} ${percentage}% ${icon}`;

    return [...row, progressText];
  });

  return { headers: newHeaders, rows: newRows };
}

/**
 * FEATURE 8: SEND TO MULTIPLE CHANNELS - Post same/different message to multiple channels
 */
function sendToMultipleChannels(automation, payload, originalChannel) {
  if (!automation.multiChannel || !automation.multiChannel.enabled) {
    return null;
  }

  const results = [];
  const channels = automation.multiChannel.channels || [];

  for (const channelConfig of channels) {
    if (channelConfig.channel === originalChannel) continue; // Skip original channel

    try {
      // Clone payload
      let channelPayload = JSON.parse(JSON.stringify(payload));

      // Customize per channel if specified
      if (channelConfig.customize) {
        if (channelConfig.format) {
          // Rebuild with different format
          // This would need to call buildBeautifulReport with custom format
        }

        if (channelConfig.notifyChannel && !channelPayload.text.includes('<!channel>')) {
          channelPayload.text = '<!channel> ' + (channelPayload.text || '');
        }
      }

      channelPayload.channel = channelConfig.channel;

      // Send to this channel
      const result = sendToChannel(channelPayload);
      results.push({
        channel: channelConfig.channel,
        success: result.success,
        error: result.error
      });
    } catch (error) {
      results.push({
        channel: channelConfig.channel,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * FEATURE 8B: SEND TO CHANNEL - Helper function to send to a specific channel
 */
function sendToChannel(payload) {
  try {
    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");

    if (!botToken) {
      return { success: false, error: "Bot token required" };
    }

    const options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + botToken,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch("https://slack.com/api/chat.postMessage", options);
    const result = JSON.parse(response.getContentText());

    return {
      success: result.ok,
      error: result.error || null,
      ts: result.ts,
      channel: result.channel
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * FEATURE 9: EXPORT SHEET AS FILE - Create Excel/CSV from sheet data
 */
function exportSheetAsFile(sheetName, format = 'xlsx') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return { success: false, error: "Sheet not found" };
    }

    let blob;
    let filename;

    if (format === 'xlsx' || format === 'excel') {
      // Export as Excel
      const url = ss.getUrl();
      const exportUrl = url.replace(/\/edit.*/, '') + '/export?format=xlsx&gid=' + sheet.getSheetId();

      const token = ScriptApp.getOAuthToken();
      const response = UrlFetchApp.fetch(exportUrl, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      blob = response.getBlob();
      filename = `${sheetName}_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd')}.xlsx`;
    } else if (format === 'csv') {
      // Export as CSV
      const data = sheet.getDataRange().getValues();
      let csvContent = data.map(row => row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',')).join('\n');

      blob = Utilities.newBlob(csvContent, 'text/csv');
      filename = `${sheetName}_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd')}.csv`;
    }

    blob.setName(filename);

    return {
      success: true,
      blob: blob,
      filename: filename
    };
  } catch (error) {
    Logger.log("Error exporting sheet: " + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * FEATURE 9B: UPLOAD FILE TO SLACK - Upload file attachment
 */
function uploadFileToSlack(channel, blob, filename, initialComment = '') {
  try {
    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");

    if (!botToken) {
      return { success: false, error: "Bot token required for file uploads" };
    }

    // Use files.upload API (deprecated but simpler) or files.uploadV2
    const formData = {
      file: blob,
      filename: filename,
      channels: channel,
      initial_comment: initialComment
    };

    const options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + botToken
      },
      payload: formData,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch("https://slack.com/api/files.upload", options);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      Logger.log(`✅ File uploaded: ${filename}`);
      return {
        success: true,
        file: result.file
      };
    } else {
      Logger.log(`❌ File upload failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    Logger.log("Error uploading file: " + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * FEATURE 10: SEND THREADED MESSAGES - Post summary with replies in thread
 */
function sendThreadedMessage(automation, allRows, channel) {
  try {
    const botToken = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");

    if (!botToken) {
      Logger.log("Bot token required for threaded messages");
      return { success: false, error: "Bot token required" };
    }

    // Build parent message (summary)
    const summaryPayload = buildSummaryMessage(automation, allRows);
    summaryPayload.channel = channel;

    // Send parent message
    const parentResult = sendToChannel(summaryPayload);

    if (!parentResult.success) {
      return { success: false, error: "Failed to send parent message" };
    }

    const parentTs = parentResult.ts;
    Logger.log(`Parent message sent: ${parentTs}`);

    // Build and send thread replies
    const threadConfig = automation.threading || {};
    const filterRows = threadConfig.filterTotal ? allRows.data.filter((row, i) => {
      const regionIndex = allRows.headers.indexOf('Region');
      return regionIndex === -1 || row[regionIndex] !== 'Total';
    }) : allRows.data;

    let replyCount = 0;

    for (const row of filterRows) {
      const replyPayload = buildThreadReply(automation, allRows.headers, row);
      replyPayload.channel = channel;
      replyPayload.thread_ts = parentTs;

      const replyResult = sendToChannel(replyPayload);

      if (replyResult.success) {
        replyCount++;
      }

      // Add small delay between messages
      Utilities.sleep(200);
    }

    Logger.log(`✅ Thread created with ${replyCount} replies`);

    return {
      success: true,
      parentTs: parentTs,
      replyCount: replyCount
    };
  } catch (error) {
    Logger.log("Error sending threaded message: " + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * FEATURE 10B: BUILD SUMMARY MESSAGE - Create parent message for thread
 */
function buildSummaryMessage(automation, allRows) {
  // Get first row (usually Total) for summary
  const summaryRow = allRows.data[0];
  const rowData = {};

  allRows.headers.forEach((header, i) => {
    rowData[header] = summaryRow[i];
  });

  return {
    text: `📊 ${automation.messageHeader || automation.name}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `📊 ${automation.messageHeader || automation.name} - Summary`,
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📅 *Date:* ${new Date().toLocaleDateString()}\n\n` +
                `*Total Forecast:* ${rowData['Forecast'] || 'N/A'}\n` +
                `*Plan:* ${rowData['Plan'] || 'N/A'}\n\n` +
                `👇 See regional breakdown in thread below`
        }
      },
      {
        type: "divider"
      }
    ]
  };
}

/**
 * FEATURE 10C: BUILD THREAD REPLY - Create individual reply for each row
 */
function buildThreadReply(automation, headers, row) {
  const rowData = {};
  headers.forEach((header, i) => {
    rowData[header] = row[i];
  });

  let text = '';
  headers.forEach((header, i) => {
    text += `*${header}:* ${row[i] || 'N/A'}\n`;
  });

  return {
    text: text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text
        }
      }
    ]
  };
}

/**
 * HELPER: EVALUATE CONDITION - Check if data meets condition
 */
function evaluateCondition(rowData, condition) {
  if (!condition || !condition.field || !condition.operator) {
    return false;
  }

  const value = rowData[condition.field];
  const compareValue = condition.value;

  // Parse numbers if needed
  const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
  const numCompare = parseFloat(String(compareValue).replace(/[^0-9.-]/g, '')) || 0;

  switch (condition.operator) {
    case '<':
      return numValue < numCompare;
    case '>':
      return numValue > numCompare;
    case '<=':
      return numValue <= numCompare;
    case '>=':
      return numValue >= numCompare;
    case '==':
    case 'equals':
      return value == compareValue;
    case '!=':
    case 'not_equals':
      return value != compareValue;
    case 'contains':
      return String(value).includes(String(compareValue));
    default:
      return false;
  }
}

/**
 * HELPER: PROCESS TEMPLATE - Replace {{placeholders}} with values
 */
function processTemplate(template, rowData) {
  if (!template) return '';

  let result = template;

  for (const [key, value] of Object.entries(rowData)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  }

  return result;
}

/**
 * HELPER: GET REACTIONS FOR ALERT LEVEL - Return emoji reactions based on alert
 */
function getReactionsForAlert(alertLevel, automation) {
  if (!automation.reactions || !automation.reactions.enabled) {
    return [];
  }

  const reactions = automation.reactions.rules || {};

  let emojiList = [];

  // Always add base reactions
  if (automation.reactions.always) {
    emojiList = emojiList.concat(automation.reactions.always);
  }

  // Add level-specific reactions
  if (reactions[alertLevel.level]) {
    emojiList = emojiList.concat(reactions[alertLevel.level]);
  }

  return emojiList;
}
