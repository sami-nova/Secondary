/**
 * Secondary Sales Weekly Report - Slack Automation (Simple Text Version)
 * This is a simpler version that uses formatted text instead of Block Kit
 */

// Configuration
const SLACK_WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE';
const SHEET_NAME = 'Sheet1';

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

    const weekEnding = sheet.getRange('C3').getValue();
    const message = buildSimpleMessage(sheet, weekEnding);

    sendToSlack(message);

    Logger.log('Report sent successfully to Slack');
  } catch (error) {
    Logger.log('Error sending report: ' + error.toString());
  }
}

/**
 * Build a simple formatted text message
 */
function buildSimpleMessage(sheet, weekEnding) {
  let text = '';

  // Header
  text += '📊 *SECONDARY SALES WEEKLY REPORT*\n';
  text += `Week Ending: ${formatDate(weekEnding)}\n`;
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // Key Metrics Overview
  text += '*🎯 KEY METRICS OVERVIEW*\n';
  text += '```\n';

  const revenue = {
    thisWeek: sheet.getRange('C6').getValue(),
    change: sheet.getRange('E6').getValue()
  };
  text += `💰 Total Revenue:      ${formatCurrency(revenue.thisWeek)}`;
  if (revenue.change) text += ` (${formatChange(revenue.change)})`;
  text += '\n';

  const purchases = {
    thisWeek: sheet.getRange('C7').getValue(),
    change: sheet.getRange('E7').getValue()
  };
  text += `🛒 Total Purchases:    ${formatNumber(purchases.thisWeek)}`;
  if (purchases.change) text += ` (${formatChange(purchases.change)})`;
  text += '\n';

  const arpu = {
    thisWeek: sheet.getRange('C8').getValue(),
    change: sheet.getRange('E8').getValue()
  };
  text += `📊 ARPU:               ${formatCurrency(arpu.thisWeek)}`;
  if (arpu.change) text += ` (${formatChange(arpu.change)})`;
  text += '\n';

  const plan = {
    thisWeek: sheet.getRange('C9').getValue(),
    target: sheet.getRange('F9').getValue()
  };
  text += `📈 Plan Achievement:   ${formatPercentage(plan.thisWeek)}`;
  if (plan.target) text += ` / Target: ${formatPercentage(plan.target)}`;
  text += '\n';

  text += '```\n\n';

  // Procedure Performance
  text += '*📋 PROCEDURE PERFORMANCE*\n';
  text += '```\n';

  const kb = {
    callRate: sheet.getRange('C13').getValue(),
    processRate: sheet.getRange('D13').getValue(),
    paidRate: sheet.getRange('E13').getValue(),
    target: sheet.getRange('F13').getValue(),
    status: sheet.getRange('G13').getValue()
  };
  text += `👁️  Killer Base (KB)\n`;
  text += `   Call: ${formatPercentage(kb.callRate)} | Process: ${formatPercentage(kb.processRate)} | Paid: ${formatPercentage(kb.paidRate)}\n`;
  text += `   Target: ${kb.target || '80% / 50% / Reg'} | Status: ${kb.status || 'Below Target'} ⚠️\n\n`;

  const cp = {
    callRate: sheet.getRange('C14').getValue(),
    processRate: sheet.getRange('D14').getValue(),
    paidRate: sheet.getRange('E14').getValue(),
    target: sheet.getRange('F14').getValue(),
    status: sheet.getRange('G14').getValue()
  };
  text += `💧 Churn Prevention (CP)\n`;
  text += `   Call: ${formatPercentage(cp.callRate)} | Process: ${formatPercentage(cp.processRate)} | Paid: ${formatPercentage(cp.paidRate)}\n`;
  text += `   Target: ${cp.target || '90% / 85% / Reg'} | Status: ${cp.status || 'Below Target'} ⚠️\n`;

  text += '```\n\n';

  // Category Breakdown
  const categories = getCategoryBreakdown(sheet);

  text += '*📊 CATEGORY BREAKDOWN*\n';
  if (categories.categories.length > 0) {
    text += '```\n';
    categories.categories.forEach(cat => {
      const emoji = getCategoryEmoji(cat.name);
      text += `${emoji} ${cat.name}\n`;
      text += `   Purchases: ${formatNumber(cat.purchases)} (${formatPercentage(cat.purchasesPct)})`;
      text += ` | Revenue: ${formatCurrency(cat.revenue)} (${formatPercentage(cat.revenuePct)})`;
      text += ` | ARPU: ${formatCurrency(cat.arpu)}\n`;
    });
    text += `\nTOTAL: ${formatNumber(categories.totals.purchases)} purchases | ${formatCurrency(categories.totals.revenue)} revenue\n`;
    text += '```\n\n';
  } else {
    text += '_No data available_\n\n';
  }

  // Top Regional Performers
  const regions = getTopRegionalPerformers(sheet);

  text += '*🌟 TOP REGIONAL PERFORMERS*\n';
  if (regions.length > 0) {
    text += '```\n';
    regions.forEach((region, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
      text += `${medal} ${region.name}\n`;
      text += `   Revenue: ${formatCurrency(region.revenue)}`;
      text += ` | Plan: ${formatPercentage(region.planPct)}`;
      text += ` | ARPU: ${formatCurrency(region.arpu)}\n`;
      if (region.note) {
        text += `   📝 ${region.note}\n`;
      }
    });
    text += '```\n';
  } else {
    text += '_No data available_\n';
  }

  return {
    "text": text,
    "mrkdwn": true
  };
}

/**
 * Get Category Breakdown data
 */
function getCategoryBreakdown(sheet) {
  const categories = [];

  for (let i = 0; i < 10; i++) {
    const row = 18 + i;
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
 * Get Top Regional Performers data
 */
function getTopRegionalPerformers(sheet) {
  const regions = [];

  for (let i = 0; i < 10; i++) {
    const row = 30 + i;
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
    if (value <= 1 && value >= 0) {
      return (value * 100).toFixed(1) + '%';
    }
    return value.toFixed(1) + '%';
  }
  return value.toString();
}

function formatChange(value) {
  if (value === '' || value === null || value === undefined) return '';
  if (typeof value === 'number') {
    const symbol = value >= 0 ? '↑' : '↓';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatPercentage(value)} ${symbol}`;
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
