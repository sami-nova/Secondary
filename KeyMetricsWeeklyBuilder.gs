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
    // Check if metric is ARPU-related (should be formatted as currency)
    const isARPU = m.metric && m.metric.toUpperCase().includes('ARPU');

    let formattedValue, formattedPlan;

    if (isARPU) {
      // Format ARPU as currency
      formattedValue = formatCurrency(m.value);
      formattedPlan = m.planTarget ? formatCurrency(m.planTarget) : '';
    } else {
      // Use default formatting for other metrics
      formattedValue = formatMetricValue(m.value);
      formattedPlan = formatMetricValue(m.planTarget);
    }

    const deltaText = m.deltaWoW ? ` ${m.deltaWoW}` : "";

    overviewText += `• *${m.metric}:* ${formattedValue}`;
    if (formattedPlan) {
      overviewText += ` (Plan: ${formattedPlan})`;
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
 * Build Net Churn by Region section (grouped by geography for compact display)
 */
function buildNetChurnByRegionSection(regions) {
  const blocks = [];

  // Check if any region has "Last Week" data
  const hasLastWeekData = regions.some(r => r.lastWeek !== '' && r.lastWeek !== null && r.lastWeek !== undefined);

  // Build header based on available data
  let headerText = "*📍 NET CHURN BY REGION*\n_";
  if (hasLastWeekData) {
    headerText += "Last Week → Today | Plan | Forecast";
  } else {
    headerText += "Today | Plan | Forecast";
  }
  headerText += "_";

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: headerText
    }
  });

  // Group regions by geography
  const regionGroups = {
    'Total': [],
    'Middle East': ['ARAB', 'TR', 'IL'],
    'Europe': ['PL', 'DE', 'IT', 'RO', 'ES', 'FR', 'CZ'],
    'Russia/CIS': ['RU'],
    'Asia': ['JP', 'KR']
  };

  // Process each geographic group
  Object.keys(regionGroups).forEach(groupName => {
    const groupRegions = regions.filter(r => {
      if (groupName === 'Total') {
        return r.region.toUpperCase() === 'TOTAL';
      }
      return regionGroups[groupName].includes(r.region.toUpperCase());
    });

    if (groupRegions.length === 0) return;

    let groupText = "";
    if (groupName !== 'Total') {
      groupText = `*${groupName}*\n`;
    }

    groupRegions.forEach(r => {
      const regionEmoji = getRegionSlackEmoji(r.region);
      const status = r.status || '';

      if (hasLastWeekData && r.lastWeek) {
        groupText += `${regionEmoji} *${r.region}*: ${formatPercentage(r.lastWeek)} → ${formatPercentage(r.today)} | Plan: ${formatPercentage(r.plan)} | Forecast: ${formatPercentage(r.forecast)} ${status}\n`;
      } else {
        groupText += `${regionEmoji} *${r.region}*: ${formatPercentage(r.today)} | Plan: ${formatPercentage(r.plan)} | Forecast: ${formatPercentage(r.forecast)} ${status}\n`;
      }
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: groupText.trim()
      }
    });
  });

  return blocks;
}

/**
 * Read Sales Performance by Region
 * Template range: A27:E40 (simplified to match Slack output)
 */
function readSalesPerformanceByRegion(sheet) {
  try {
    const dataRange = sheet.getRange("A27:E40");
    const data = dataRange.getValues();

    const regions = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const region = cleanSheetData(row[0]);
      const purchPercent = row[1];
      const factRevenue = row[2];
      const planRevenue = row[3];
      const revenuePercent = row[4];

      // Skip empty rows
      if (!region) continue;

      regions.push({
        region: region,
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
 * Build Sales Performance by Region section (grouped by geography, compact)
 */
function buildSalesPerformanceSection(regions) {
  const blocks = [];

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*💰 SALES PERFORMANCE BY REGION*\n_Purchase % | Revenue | Achievement_"
    }
  });

  // Group regions by geography
  const regionGroups = {
    'Total': [],
    'Middle East': ['ARAB', 'TR', 'IL'],
    'Europe': ['PL', 'DE', 'IT', 'RO', 'ES', 'FR', 'CZ'],
    'Russia/CIS': ['RU'],
    'Asia': ['JP', 'KR']
  };

  // Process each geographic group
  Object.keys(regionGroups).forEach(groupName => {
    const groupRegions = regions.filter(r => {
      if (groupName === 'Total') {
        return r.region.toUpperCase() === 'TOTAL';
      }
      return regionGroups[groupName].includes(r.region.toUpperCase());
    });

    if (groupRegions.length === 0) return;

    let groupText = "";
    if (groupName !== 'Total') {
      groupText = `*${groupName}*\n`;
    }

    groupRegions.forEach(r => {
      const regionEmoji = getRegionSlackEmoji(r.region);
      groupText += `${regionEmoji} *${r.region}*: ${formatPercentage(r.purchPercent)} | ${formatCurrency(r.factRevenue, true)} | Achievement: ${formatPercentage(r.revenuePercent)}\n`;
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: groupText.trim()
      }
    });
  });

  return blocks;
}

/**
 * Read Plan vs Fact by Category
 * Template range: A44:E48 (simplified to match Slack output)
 */
function readPlanFactByCategory(sheet) {
  try {
    const dataRange = sheet.getRange("A44:E48");
    const data = dataRange.getValues();

    const categories = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const category = cleanSheetData(row[0]);
      const factPurchase = row[1];
      const planPurchase = row[2];
      const purchPercent = row[3];
      const factRevenue = row[4];

      // Skip empty rows
      if (!category) continue;

      categories.push({
        category: category,
        factPurchase: factPurchase,
        planPurchase: planPurchase,
        purchPercent: purchPercent,
        factRevenue: factRevenue
      });
    }

    return categories;
  } catch (error) {
    Logger.log(`Error reading Category data: ${error.toString()}`);
    return [];
  }
}

/**
 * Build Plan vs Fact by Category section (compact, single block)
 */
function buildPlanFactByCategorySection(categories) {
  const blocks = [];

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*📦 PLAN VS FACT - BY CATEGORY*\n_Fact vs Plan | Achievement | Revenue_"
    }
  });

  // Build all categories in one compact block
  let categoryText = "";
  categories.forEach(c => {
    categoryText += `*${capitalize(c.category)}*: ${formatNumber(c.factPurchase)} vs ${formatNumber(c.planPurchase)} (${formatPercentage(c.purchPercent)}) | ${formatCurrency(c.factRevenue, true)}\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: categoryText.trim()
    }
  });

  return blocks;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get region Slack emoji code (e.g., :flag-tr:)
 * Same as leaderboard implementation
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
    'LATAM': ':earth_americas:',
    'TOTAL': ':earth_americas:'
  };

  return regionMap[regionStr] || '';
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
