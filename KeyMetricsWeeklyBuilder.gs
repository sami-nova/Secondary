/**
 * Key Metrics Weekly Update - Slack Automation
 * Sends a formatted weekly metrics report including Net Churn, ARPU, Sales Performance, and Category breakdown
 *
 * Features:
 * - Multi-section format for easy scanning
 * - Optional sections (hide if empty)
 * - Visual indicators (emojis, status icons)
 * - Monospaced tables for data alignment
 * - Region flag emojis
 * - Manual editability in Google Sheets
 *
 * Works with the "Key Metrics Weekly" sheet created by KeyMetricsWeeklyTemplate.gs
 */

/**
 * Main function to build and send the Key Metrics Weekly Update
 * @param {Object} automation - Automation object from Slack Automation Settings
 */
function buildKeyMetricsWeeklyUpdate(automation) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.sheetName || "Key Metrics Weekly");

    if (!sheet) {
      Logger.log(`Sheet not found: ${automation.sheetName || "Key Metrics Weekly"}`);
      return {
        text: `❌ Error: Sheet "${automation.sheetName || "Key Metrics Weekly"}" not found`
      };
    }

    // Build the message blocks
    const blocks = [];

    // ============================================
    // HEADER
    // ============================================
    const generatedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'M/dd/yyyy');

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📊 Key metrics weekly updates*\n🗓️ Generated: ${generatedDate}`
      }
    });

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 1: KEY METRICS OVERVIEW
    // ============================================
    const overviewData = readKeyMetricsOverview(sheet);
    if (overviewData && overviewData.length > 0) {
      blocks.push(...buildKeyMetricsOverviewSection(overviewData));
      blocks.push({ type: "divider" });
    }

    // ============================================
    // SECTION 2: NET CHURN BY REGION
    // ============================================
    const netChurnData = readNetChurnByRegion(sheet);
    if (netChurnData && netChurnData.length > 0) {
      blocks.push(...buildNetChurnByRegionSection(netChurnData));
      blocks.push({ type: "divider" });
    }

    // ============================================
    // SECTION 3: SALES PERFORMANCE BY REGION
    // ============================================
    const salesData = readSalesPerformanceByRegion(sheet);
    if (salesData && salesData.length > 0) {
      blocks.push(...buildSalesPerformanceSection(salesData));
      blocks.push({ type: "divider" });
    }

    // ============================================
    // SECTION 4: PLAN VS FACT BY CATEGORY
    // ============================================
    const categoryData = readPlanFactByCategory(sheet);
    if (categoryData && categoryData.length > 0) {
      blocks.push(...buildPlanFactByCategorySection(categoryData));
    }

    return {
      blocks: blocks
    };

  } catch (error) {
    Logger.log(`Error building Key Metrics Weekly Update: ${error.toString()}`);
    return {
      text: `❌ Error building Key Metrics Weekly Update: ${error.message}`
    };
  }
}

/**
 * Read Key Metrics Overview data
 * Template range: A3:D6
 */
function readKeyMetricsOverview(sheet) {
  try {
    const dataRange = sheet.getRange("A3:D6");
    const data = dataRange.getValues();

    const metrics = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const metric = cleanSheetData(row[0]);
      const value = row[1];
      const planTarget = row[2];
      const deltaWoW = cleanSheetData(row[3]);

      // Skip empty rows
      if (!metric) continue;

      metrics.push({
        metric: metric,
        value: value,
        planTarget: planTarget,
        deltaWoW: deltaWoW
      });
    }

    return metrics;
  } catch (error) {
    Logger.log(`Error reading overview data: ${error.toString()}`);
    return [];
  }
}

/**
 * Build Key Metrics Overview section
 */
function buildKeyMetricsOverviewSection(metrics) {
  const blocks = [];

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🎯 KEY METRICS OVERVIEW*"
    }
  });

  let overviewText = "";

  metrics.forEach(m => {
    const formattedValue = formatMetricValue(m.value);
    const formattedPlan = formatMetricValue(m.planTarget);
    const deltaText = m.deltaWoW ? ` ${m.deltaWoW}` : "";

    overviewText += `• *${m.metric}:* ${formattedValue}`;
    if (formattedPlan) {
      overviewText += ` (${formattedPlan})`;
    }
    overviewText += deltaText + "\n";
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: overviewText || "_No overview data available_"
    }
  });

  return blocks;
}

/**
 * Read Net Churn by Region data
 * Template range: A10:F23
 */
function readNetChurnByRegion(sheet) {
  try {
    const dataRange = sheet.getRange("A10:F23");
    const data = dataRange.getValues();

    const regions = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const region = cleanSheetData(row[0]);
      const lastWeek = row[1];
      const today = row[2];
      const forecast = row[3];
      const plan = row[4];
      const status = cleanSheetData(row[5]);

      // Skip empty rows
      if (!region) continue;

      regions.push({
        region: region,
        lastWeek: lastWeek,
        today: today,
        forecast: forecast,
        plan: plan,
        status: status
      });
    }

    return regions;
  } catch (error) {
    Logger.log(`Error reading Net Churn data: ${error.toString()}`);
    return [];
  }
}

/**
 * Build Net Churn by Region section with monospaced table
 */
function buildNetChurnByRegionSection(regions) {
  const blocks = [];

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*📍 NET CHURN BY REGION*"
    }
  });

  // Build monospaced table with code blocks for proper alignment
  let tableText = "```\n";
  tableText += "Region | Last week | Today | Plan   | Forecast\n";
  tableText += "-------|-----------|-------|--------|----------\n";

  regions.forEach(r => {
    // Get region flag emoji ONLY (no text)
    const regionEmoji = getKeyMetricsRegionEmoji(r.region);
    const regionDisplay = regionEmoji || r.region;

    const region = padRight(regionDisplay, 6);
    const lastWeek = padLeft(formatPercentage(r.lastWeek), 9);
    const today = padLeft(formatPercentage(r.today), 5);
    const plan = padLeft(formatPercentage(r.plan), 6);
    const forecast = padLeft(formatPercentage(r.forecast), 8);

    // Use status from sheet if provided
    let statusIcon = r.status ? ` ${r.status}` : "";

    tableText += `${region} | ${lastWeek} | ${today} | ${plan} | ${forecast}${statusIcon}\n`;
  });

  tableText += "```";

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: tableText
    }
  });

  return blocks;
}

/**
 * Read Sales Performance by Region
 * Template range: A27:H40
 */
function readSalesPerformanceByRegion(sheet) {
  try {
    const dataRange = sheet.getRange("A27:H40");
    const data = dataRange.getValues();

    const regions = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const region = cleanSheetData(row[0]);
      const factPurchase = row[1];
      const planPurchase = row[2];
      const forecastPurch = row[3];
      const purchPercent = row[4];
      const factRevenue = row[5];
      const planRevenue = row[6];
      const revenuePercent = row[7];

      // Skip empty rows
      if (!region) continue;

      regions.push({
        region: region,
        factPurchase: factPurchase,
        planPurchase: planPurchase,
        forecastPurch: forecastPurch,
        purchPercent: purchPercent,
        factRevenue: factRevenue,
        planRevenue: planRevenue,
        revenuePercent: revenuePercent
      });
    }

    return regions;
  } catch (error) {
    Logger.log(`Error reading Sales Performance data: ${error.toString()}`);
    return [];
  }
}

/**
 * Build Sales Performance by Region section
 */
function buildSalesPerformanceSection(regions) {
  const blocks = [];

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*💰 SALES PERFORMANCE BY REGION*"
    }
  });

  // Build monospaced table with code blocks for proper alignment
  let tableText = "```\n";
  tableText += "Region | Purch%| Revenue   | Plan Rev  | Rev%   \n";
  tableText += "-------|-------|-----------|-----------|--------\n";

  regions.forEach(r => {
    // Get region flag emoji ONLY (no text)
    const regionEmoji = getKeyMetricsRegionEmoji(r.region);
    const regionDisplay = regionEmoji || r.region;

    const region = padRight(regionDisplay, 6);
    const purchPct = padLeft(formatPercentage(r.purchPercent), 5);
    const revenue = padLeft(formatCurrency(r.factRevenue, true), 9);
    const planRev = padLeft(formatCurrency(r.planRevenue, true), 9);
    const revPct = padLeft(formatPercentage(r.revenuePercent), 6);

    tableText += `${region} | ${purchPct} | ${revenue} | ${planRev} | ${revPct}\n`;
  });

  tableText += "```";

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: tableText
    }
  });

  return blocks;
}

/**
 * Read Plan vs Fact by Category
 * Template range: A44:G48
 */
function readPlanFactByCategory(sheet) {
  try {
    const dataRange = sheet.getRange("A44:G48");
    const data = dataRange.getValues();

    const categories = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const category = cleanSheetData(row[0]);
      const factPurchase = row[1];
      const planPurchase = row[2];
      const forecastPurch = row[3];
      const purchPercent = row[4];
      const factRevenue = row[5];
      const planRevenue = row[6];

      // Skip empty rows or "Total" row (we'll show Total first)
      if (!category) continue;

      categories.push({
        category: category,
        factPurchase: factPurchase,
        planPurchase: planPurchase,
        forecastPurch: forecastPurch,
        purchPercent: purchPercent,
        factRevenue: factRevenue,
        planRevenue: planRevenue
      });
    }

    return categories;
  } catch (error) {
    Logger.log(`Error reading Category data: ${error.toString()}`);
    return [];
  }
}

/**
 * Build Plan vs Fact by Category section
 */
function buildPlanFactByCategorySection(categories) {
  const blocks = [];

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*📦 PLAN VS FACT - BY CATEGORY*"
    }
  });

  // Build monospaced table with code blocks for proper alignment
  let tableText = "```\n";
  tableText += "Category        | Fact  | Plan  | Purch%| Revenue   \n";
  tableText += "----------------|-------|-------|-------|----------\n";

  categories.forEach(c => {
    const category = padRight(capitalize(c.category), 15);
    const fact = padLeft(formatNumber(c.factPurchase), 5);
    const plan = padLeft(formatNumber(c.planPurchase), 5);
    const purchPct = padLeft(formatPercentage(c.purchPercent), 5);
    const revenue = padLeft(formatCurrency(c.factRevenue, true), 9);

    tableText += `${category} | ${fact} | ${plan} | ${purchPct} | ${revenue}\n`;
  });

  tableText += "```";

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: tableText
    }
  });

  return blocks;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get region flag emoji for Key Metrics (similar to leaderboard)
 */
function getKeyMetricsRegionEmoji(region) {
  if (!region) return "";

  const regionUpper = String(region).toUpperCase().trim();

  // Map regions to flag emojis
  const regionMap = {
    'TOTAL': '🌍',
    'ARAB': '🇸🇦',
    'AE': '🇦🇪',
    'AR': '🇦🇪',
    'SA': '🇸🇦',
    'AE/AR/SA': '🇸🇦',
    'TR': '🇹🇷',
    'PL': '🇵🇱',
    'IL': '🇮🇱',
    'DE': '🇩🇪',
    'NL': '🇳🇱',
    'CH': '🇨🇭',
    'AT': '🇦🇹',
    'DE/NL/CH/AT': '🇩🇪',
    'IT': '🇮🇹',
    'RU': '🇷🇺',
    'RO': '🇷🇴',
    'ES': '🇪🇸',
    'FR': '🇫🇷',
    'CZ': '🇨🇿',
    'SK': '🇸🇰',
    'CZ/SK': '🇨🇿',
    'JP': '🇯🇵',
    'KR': '🇰🇷'
  };

  return regionMap[regionUpper] || "";
}

/**
 * Clean sheet data (remove extra whitespace, handle null/undefined)
 */
function cleanSheetData(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return String(value).trim();
}

/**
 * Format metric value (handles currency, percentages, numbers)
 */
function formatMetricValue(value) {
  if (value === '' || value === null || value === undefined) return '';

  // If already a formatted string, return as-is
  if (typeof value === 'string') {
    return value;
  }

  // If it's a number
  if (typeof value === 'number') {
    // Check if it looks like a percentage (< 1)
    if (value < 1 && value > 0) {
      return (value * 100).toFixed(2) + '%';
    }
    // Check if it looks like currency (large number)
    if (value >= 1000) {
      return formatCurrency(value);
    }
    return value.toFixed(2) + '%';
  }

  return String(value);
}

/**
 * Format percentage
 */
function formatPercentage(value) {
  if (value === '' || value === null || value === undefined) return '';

  // If already a string with %, return as-is
  if (typeof value === 'string' && value.includes('%')) {
    return value;
  }

  // If it's a number
  if (typeof value === 'number') {
    let num;

    // If value is between 0 and 1 (decimal format), multiply by 100
    // This handles: 0.948 → 94.8%, 1.0 → 100%, 0.01 → 1%
    if (value > 0 && value <= 1) {
      num = value * 100;
    } else {
      // Value is already a percentage: 94.8, 100, 115.8
      num = value;
    }

    // Remove .00 if it's a whole number
    if (num % 1 === 0) {
      return Math.round(num) + '%';
    }
    return num.toFixed(2) + '%';
  }

  return String(value);
}

/**
 * Format currency
 * @param {number|string} value - The value to format
 * @param {boolean} short - If true, format as $1.2M instead of $1,234,567
 */
function formatCurrency(value, short = false) {
  if (value === '' || value === null || value === undefined) return '';

  // If already a formatted string with $, return as-is
  if (typeof value === 'string' && value.includes('$')) {
    return value;
  }

  let num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));

  if (isNaN(num)) return String(value);

  if (short) {
    if (num >= 1000000) {
      return '$' + (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return '$' + (num / 1000).toFixed(1) + 'K';
    }
  }

  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Format number with commas
 */
function formatNumber(value) {
  if (value === '' || value === null || value === undefined) return '';

  let num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));

  if (isNaN(num)) return String(value);

  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Pad string to the right
 */
function padRight(str, length) {
  str = String(str);
  while (str.length < length) {
    str += ' ';
  }
  return str.substring(0, length);
}

/**
 * Pad string to the left
 */
function padLeft(str, length) {
  str = String(str);
  while (str.length < length) {
    str = ' ' + str;
  }
  return str.substring(0, length);
}

/**
 * Capitalize first letter of each word
 */
function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}
