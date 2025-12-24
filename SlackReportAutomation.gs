/**
 * Secondary Sales Weekly Report - Slack Automation
 * This script sends a formatted weekly sales report from Google Sheets to Slack
 */

// Configuration
const SLACK_WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE'; // Replace with your Slack webhook URL
const SHEET_NAME = 'Sheet1'; // Replace with your sheet name

/**
 * Main function to send the report to Slack
 */
function sendWeeklyReportToSlack() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) {
      Logger.log('Sheet not found: ' + SHEET_NAME);
      return;
    }

    // Get the week ending date
    const weekEnding = sheet.getRange('C3').getValue();

    // Build the Slack message using Block Kit
    const slackMessage = buildSlackMessage(sheet, weekEnding);

    // Send to Slack
    sendToSlack(slackMessage);

    Logger.log('Report sent successfully to Slack');
  } catch (error) {
    Logger.log('Error sending report: ' + error.toString());
  }
}

/**
 * Build the Slack message with Block Kit formatting
 */
function buildSlackMessage(sheet, weekEnding) {
  const blocks = [];

  // Header
  blocks.push({
    "type": "header",
    "text": {
      "type": "plain_text",
      "text": "📊 SECONDARY SALES WEEKLY REPORT",
      "emoji": true
    }
  });

  // Week ending info
  blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `*Week Ending:* ${formatDate(weekEnding)}`
    }
  });

  blocks.push({"type": "divider"});

  // Key Metrics Overview
  const keyMetrics = getKeyMetrics(sheet);
  blocks.push(...formatKeyMetrics(keyMetrics));

  blocks.push({"type": "divider"});

  // Procedure Performance
  const procedures = getProcedurePerformance(sheet);
  blocks.push(...formatProcedurePerformance(procedures));

  blocks.push({"type": "divider"});

  // Category Breakdown
  const categories = getCategoryBreakdown(sheet);
  blocks.push(...formatCategoryBreakdown(categories));

  blocks.push({"type": "divider"});

  // Top Regional Performers
  const regions = getTopRegionalPerformers(sheet);
  blocks.push(...formatTopRegionalPerformers(regions));

  return {
    "blocks": blocks
  };
}

/**
 * Get Key Metrics data
 */
function getKeyMetrics(sheet) {
  return {
    totalRevenue: {
      thisWeek: sheet.getRange('C6').getValue(),
      lastWeek: sheet.getRange('D6').getValue(),
      change: sheet.getRange('E6').getValue(),
      target: sheet.getRange('F6').getValue(),
      status: sheet.getRange('G6').getValue()
    },
    totalPurchases: {
      thisWeek: sheet.getRange('C7').getValue(),
      lastWeek: sheet.getRange('D7').getValue(),
      change: sheet.getRange('E7').getValue(),
      target: sheet.getRange('F7').getValue(),
      status: sheet.getRange('G7').getValue()
    },
    arpu: {
      thisWeek: sheet.getRange('C8').getValue(),
      lastWeek: sheet.getRange('D8').getValue(),
      change: sheet.getRange('E8').getValue(),
      target: sheet.getRange('F8').getValue(),
      status: sheet.getRange('G8').getValue()
    },
    planAchievement: {
      thisWeek: sheet.getRange('C9').getValue(),
      lastWeek: sheet.getRange('D9').getValue(),
      change: sheet.getRange('E9').getValue(),
      target: sheet.getRange('F9').getValue(),
      status: sheet.getRange('G9').getValue()
    }
  };
}

/**
 * Format Key Metrics section
 */
function formatKeyMetrics(metrics) {
  const blocks = [];

  blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*🎯 KEY METRICS OVERVIEW*"
    }
  });

  // Total Revenue
  blocks.push({
    "type": "section",
    "fields": [
      {
        "type": "mrkdwn",
        "text": `*💰 Total Revenue*\n${formatCurrency(metrics.totalRevenue.thisWeek)}`
      },
      {
        "type": "mrkdwn",
        "text": `*Change*\n${formatChange(metrics.totalRevenue.change)}`
      }
    ]
  });

  // Total Purchases
  blocks.push({
    "type": "section",
    "fields": [
      {
        "type": "mrkdwn",
        "text": `*🛒 Total Purchases*\n${formatNumber(metrics.totalPurchases.thisWeek)}`
      },
      {
        "type": "mrkdwn",
        "text": `*Change*\n${formatChange(metrics.totalPurchases.change)}`
      }
    ]
  });

  // ARPU
  blocks.push({
    "type": "section",
    "fields": [
      {
        "type": "mrkdwn",
        "text": `*📊 ARPU*\n${formatCurrency(metrics.arpu.thisWeek)}`
      },
      {
        "type": "mrkdwn",
        "text": `*Change*\n${formatChange(metrics.arpu.change)}`
      }
    ]
  });

  // Plan Achievement
  blocks.push({
    "type": "section",
    "fields": [
      {
        "type": "mrkdwn",
        "text": `*📈 Plan Achievement*\n${formatPercentage(metrics.planAchievement.thisWeek)}`
      },
      {
        "type": "mrkdwn",
        "text": `*Target*\n${formatPercentage(metrics.planAchievement.target)}`
      }
    ]
  });

  return blocks;
}

/**
 * Get Procedure Performance data
 */
function getProcedurePerformance(sheet) {
  return {
    killerBase: {
      callRate: sheet.getRange('C13').getValue(),
      processRate: sheet.getRange('D13').getValue(),
      paidRate: sheet.getRange('E13').getValue(),
      target: sheet.getRange('F13').getValue(),
      status: sheet.getRange('G13').getValue()
    },
    churnPrevention: {
      callRate: sheet.getRange('C14').getValue(),
      processRate: sheet.getRange('D14').getValue(),
      paidRate: sheet.getRange('E14').getValue(),
      target: sheet.getRange('F14').getValue(),
      status: sheet.getRange('G14').getValue()
    }
  };
}

/**
 * Format Procedure Performance section
 */
function formatProcedurePerformance(procedures) {
  const blocks = [];

  blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*📋 PROCEDURE PERFORMANCE*"
    }
  });

  // Killer Base
  blocks.push({
    "type": "section",
    "fields": [
      {
        "type": "mrkdwn",
        "text": `*👁️ Killer Base (KB)*`
      },
      {
        "type": "mrkdwn",
        "text": `*Status*\n⚠️ ${procedures.killerBase.status || 'Below Target'}`
      },
      {
        "type": "mrkdwn",
        "text": `Call Rate: ${formatPercentage(procedures.killerBase.callRate)}`
      },
      {
        "type": "mrkdwn",
        "text": `Process Rate: ${formatPercentage(procedures.killerBase.processRate)}`
      },
      {
        "type": "mrkdwn",
        "text": `Paid Rate: ${formatPercentage(procedures.killerBase.paidRate)}`
      },
      {
        "type": "mrkdwn",
        "text": `Target: ${procedures.killerBase.target || '80% / 50% / Reg'}`
      }
    ]
  });

  // Churn Prevention
  blocks.push({
    "type": "section",
    "fields": [
      {
        "type": "mrkdwn",
        "text": `*💧 Churn Prevention (CP)*`
      },
      {
        "type": "mrkdwn",
        "text": `*Status*\n⚠️ ${procedures.churnPrevention.status || 'Below Target'}`
      },
      {
        "type": "mrkdwn",
        "text": `Call Rate: ${formatPercentage(procedures.churnPrevention.callRate)}`
      },
      {
        "type": "mrkdwn",
        "text": `Process Rate: ${formatPercentage(procedures.churnPrevention.processRate)}`
      },
      {
        "type": "mrkdwn",
        "text": `Paid Rate: ${formatPercentage(procedures.churnPrevention.paidRate)}`
      },
      {
        "type": "mrkdwn",
        "text": `Target: ${procedures.churnPrevention.target || '90% / 85% / Reg'}`
      }
    ]
  });

  return blocks;
}

/**
 * Get Category Breakdown data
 */
function getCategoryBreakdown(sheet) {
  const categories = [];

  // Read up to 10 rows or until empty
  for (let i = 0; i < 10; i++) {
    const row = 18 + i; // Starting from row 18 (adjust based on your sheet)
    const category = sheet.getRange(`B${row}`).getValue();

    if (!category || category === 'TOTAL') break;

    categories.push({
      name: category,
      purchases: sheet.getRange(`C${row}`).getValue(),
      purchasesPct: sheet.getRange(`D${row}`).getValue(),
      revenue: sheet.getRange(`E${row}`).getValue(),
      revenuePct: sheet.getRange(`F${row}`).getValue(),
      arpu: sheet.getRange(`G${row}`).getValue()
    });
  }

  // Get totals
  const totalRow = 18 + categories.length;
  const totals = {
    purchases: sheet.getRange(`C${totalRow}`).getValue(),
    purchasesPct: sheet.getRange(`D${totalRow}`).getValue(),
    revenue: sheet.getRange(`E${totalRow}`).getValue(),
    revenuePct: sheet.getRange(`F${totalRow}`).getValue()
  };

  return { categories, totals };
}

/**
 * Format Category Breakdown section
 */
function formatCategoryBreakdown(data) {
  const blocks = [];

  blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*📊 CATEGORY BREAKDOWN*"
    }
  });

  if (data.categories.length === 0) {
    blocks.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "_No data available_"
      }
    });
  } else {
    data.categories.forEach(cat => {
      blocks.push({
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*${getCategoryEmoji(cat.name)} ${cat.name}*`
          },
          {
            "type": "mrkdwn",
            "text": `ARPU: ${formatCurrency(cat.arpu)}`
          },
          {
            "type": "mrkdwn",
            "text": `Purchases: ${formatNumber(cat.purchases)} (${formatPercentage(cat.purchasesPct)})`
          },
          {
            "type": "mrkdwn",
            "text": `Revenue: ${formatCurrency(cat.revenue)} (${formatPercentage(cat.revenuePct)})`
          }
        ]
      });
    });

    // Totals
    blocks.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*TOTAL:* ${formatNumber(data.totals.purchases)} purchases • ${formatCurrency(data.totals.revenue)} revenue`
      }
    });
  }

  return blocks;
}

/**
 * Get Top Regional Performers data
 */
function getTopRegionalPerformers(sheet) {
  const regions = [];

  // Read up to 10 regions or until empty
  for (let i = 0; i < 10; i++) {
    const row = 30 + i; // Adjust based on your sheet structure
    const region = sheet.getRange(`B${row}`).getValue();

    if (!region || region === '' || region === 'Region') continue;

    regions.push({
      name: region,
      revenue: sheet.getRange(`C${row}`).getValue(),
      planPct: sheet.getRange(`D${row}`).getValue(),
      arpu: sheet.getRange(`E${row}`).getValue(),
      performance: sheet.getRange(`F${row}`).getValue(),
      note: sheet.getRange(`G${row}`).getValue()
    });
  }

  return regions;
}

/**
 * Format Top Regional Performers section
 */
function formatTopRegionalPerformers(regions) {
  const blocks = [];

  blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*🌟 TOP REGIONAL PERFORMERS*"
    }
  });

  if (regions.length === 0) {
    blocks.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "_No data available_"
      }
    });
  } else {
    regions.forEach((region, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍';

      blocks.push({
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*${medal} ${region.name}*`
          },
          {
            "type": "mrkdwn",
            "text": `Plan: ${formatPercentage(region.planPct)}`
          },
          {
            "type": "mrkdwn",
            "text": `Revenue: ${formatCurrency(region.revenue)}`
          },
          {
            "type": "mrkdwn",
            "text": `ARPU: ${formatCurrency(region.arpu)}`
          }
        ]
      });

      if (region.note) {
        blocks.push({
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": `📝 ${region.note}`
            }
          ]
        });
      }
    });
  }

  return blocks;
}

/**
 * Send message to Slack webhook
 */
function sendToSlack(payload) {
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);

  if (response.getResponseCode() !== 200) {
    throw new Error('Slack API error: ' + response.getContentText());
  }
}

/**
 * Formatting helper functions
 */
function formatDate(date) {
  if (!date) return 'N/A';
  if (date instanceof Date) {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return date.toString();
}

function formatCurrency(value) {
  if (value === '' || value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return value.toString();
}

function formatNumber(value) {
  if (value === '' || value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return value.toString();
}

function formatPercentage(value) {
  if (value === '' || value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    // If value is already a decimal (0.5 = 50%)
    if (value <= 1 && value >= 0) {
      return (value * 100).toFixed(1) + '%';
    }
    return value.toFixed(1) + '%';
  }
  return value.toString();
}

function formatChange(value) {
  if (value === '' || value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    const symbol = value >= 0 ? '📈' : '📉';
    const sign = value >= 0 ? '+' : '';
    return `${symbol} ${sign}${formatPercentage(value)}`;
  }
  return value.toString();
}

function getCategoryEmoji(category) {
  const emojiMap = {
    'Paid on Time': '✅',
    'Paid in Advance': '⏰',
    'Churn Prevention': '💧',
    'Churn': '❌'
  };
  return emojiMap[category] || '📦';
}

/**
 * Create a time-based trigger to run weekly
 * Run this once to set up automatic weekly reports
 */
function setupWeeklyTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendWeeklyReportToSlack') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger - runs every Monday at 9 AM
  ScriptApp.newTrigger('sendWeeklyReportToSlack')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();

  Logger.log('Weekly trigger created successfully');
}

/**
 * Remove the weekly trigger
 */
function removeWeeklyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendWeeklyReportToSlack') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  Logger.log('Weekly trigger removed');
}
