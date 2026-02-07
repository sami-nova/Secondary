/**
 * Key Metrics Weekly Update - Slack Automation
 * Sends a formatted weekly metrics report including Net Churn, ARPU, Sales Performance, and Category breakdown
 *
 * Features:
 * - Multi-section format for easy scanning
 * - Optional sections (hide if empty)
 * - Visual indicators (emojis, status icons)
 * - Monospaced tables for data alignment
 * - Manual editability in Google Sheets
 */

/**
 * Main function to build and send the Key Metrics Weekly Update
 * @param {Object} automation - Automation object from Slack Automation Settings
 */
function buildKeyMetricsWeeklyUpdate(automation) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.sheetName || "Net Churn Weekly");

    if (!sheet) {
      Logger.log(`Sheet not found: ${automation.sheetName || "Net Churn Weekly"}`);
      return {
        text: `❌ Error: Sheet "${automation.sheetName || "Net Churn Weekly"}" not found`
      };
    }

    // Build the message blocks
    const blocks = [];

    // ============================================
    // HEADER
    // ============================================
    const generatedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'M/dd/yyyy, hh:mm:ss a');

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
    if (overviewData && overviewData.hasData) {
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
 * Read Key Metrics Overview data (Net Churn Total, ARPU Secondary, Purchase %, Total Revenue)
 * Expected sheet structure: Row with key metrics summary
 */
function readKeyMetricsOverview(sheet) {
  try {
    // Read from a dedicated "Overview" section in the sheet
    // Format: Cell A1: "Key Metrics Overview" (header)
    //         Row 2: Labels | Row 3: Values
    // Adjust these cell ranges based on your actual sheet structure

    const netChurnTotal = sheet.getRange("C2").getValue(); // Today's Net Churn Total
    const netChurnPlan = sheet.getRange("D2").getValue();  // Plan
    const netChurnDelta = calculateDelta(netChurnTotal, netChurnPlan);

    const arpuSecondary = sheet.getRange("C3").getValue(); // ARPU Secondary (if you have it)
    const arpuWoW = sheet.getRange("D3").getValue();       // WoW change (optional)

    const purchasePercent = sheet.getRange("C4").getValue(); // Total Purchase %
    const totalRevenue = sheet.getRange("C5").getValue();    // Total Revenue

    // Check if we have any data
    const hasData = netChurnTotal || arpuSecondary || purchasePercent || totalRevenue;

    return {
      hasData: hasData,
      netChurnTotal: netChurnTotal,
      netChurnPlan: netChurnPlan,
      netChurnDelta: netChurnDelta,
      arpuSecondary: arpuSecondary,
      arpuWoW: arpuWoW,
      purchasePercent: purchasePercent,
      totalRevenue: totalRevenue
    };
  } catch (error) {
    Logger.log(`Error reading overview data: ${error.toString()}`);
    return { hasData: false };
  }
}

/**
 * Build Key Metrics Overview section
 */
function buildKeyMetricsOverviewSection(data) {
  const blocks = [];

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🎯 KEY METRICS OVERVIEW*"
    }
  });

  let overviewText = "";

  // Net Churn Total
  if (data.netChurnTotal) {
    const statusIcon = data.netChurnDelta < 0 ? "✅" : "❌";
    const deltaText = data.netChurnDelta ? `${statusIcon} ${data.netChurnDelta}pp` : "";
    overviewText += `• *Total Net Churn:* ${formatPercentage(data.netChurnTotal)}`;
    if (data.netChurnPlan) {
      overviewText += ` (Plan: ${formatPercentage(data.netChurnPlan)}) ${deltaText}`;
    }
    overviewText += "\n";
  }

  // ARPU Secondary
  if (data.arpuSecondary) {
    overviewText += `• *ARPU Secondary:* ${formatCurrency(data.arpuSecondary)}`;
    if (data.arpuWoW) {
      const wowIcon = data.arpuWoW >= 0 ? "↗️" : "↘️";
      overviewText += ` | WoW: ${wowIcon} ${data.arpuWoW > 0 ? '+' : ''}${formatPercentage(data.arpuWoW)}`;
    }
    overviewText += "\n";
  }

  // Purchase % and Revenue
  if (data.purchasePercent || data.totalRevenue) {
    overviewText += `• *Total Purchase %:* ${formatPercentage(data.purchasePercent)} | *Total Revenue:* ${formatCurrency(data.totalRevenue)}`;
  }

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
 * Expected sheet structure: Table with Region, Last week, Today, Plan, Forecast columns
 */
function readNetChurnByRegion(sheet) {
  try {
    // Adjust these ranges based on your actual sheet structure
    // Expected: Starting at row 7 (or wherever your Net Churn table starts)
    // Columns: A=Region, B=Last week, C=Today, D=Forecast, E=Plan

    const dataRange = sheet.getRange("A2:F15"); // Adjust range as needed
    const data = dataRange.getValues();

    const regions = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const region = cleanSheetData(row[0]);
      const lastWeek = row[1];
      const today = row[2];
      const forecast = row[3];
      const plan = row[4];
      const statusIcon = row[5]; // Optional: you can add status icons in the sheet

      // Skip empty rows or header rows
      if (!region || region === "Region") continue;

      regions.push({
        region: region,
        lastWeek: lastWeek,
        today: today,
        forecast: forecast,
        plan: plan,
        statusIcon: statusIcon
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

  // Build monospaced table
  let tableText = "```\n";
  tableText += "Region | Last week | Today | Plan   | Forecast\n";
  tableText += "-------|-----------|-------|--------|----------\n";

  regions.forEach(r => {
    const region = padRight(r.region, 6);
    const lastWeek = padLeft(formatPercentage(r.lastWeek), 9);
    const today = padLeft(formatPercentage(r.today), 5);
    const plan = padLeft(formatPercentage(r.plan), 6);
    const forecast = padLeft(formatPercentage(r.forecast), 5);

    // Determine status icon
    let statusIcon = "";
    if (r.statusIcon) {
      statusIcon = ` ${r.statusIcon}`;
    } else if (r.today && r.plan) {
      // Auto-calculate: if today < plan, it's good (✅), otherwise bad (❌)
      const todayNum = parseFloat(String(r.today).replace('%', ''));
      const planNum = parseFloat(String(r.plan).replace('%', ''));
      statusIcon = !isNaN(todayNum) && !isNaN(planNum) && todayNum < planNum ? " ✅" : " ❌";
    }

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
 * Expected: Regional data with Purchase %, Revenue, Plan Revenue
 */
function readSalesPerformanceByRegion(sheet) {
  try {
    // Adjust range based on your "Plan and Fact by regions" section
    // Expected columns: region_code, fact_purchase, plan_purchase, forecast_purchase,
    //                   Purch_Prediction, fact_revenue, plan_revenue, forecast_revenue, Revenue_Prediction

    const dataRange = sheet.getRange("A20:J35"); // Adjust as needed
    const data = dataRange.getValues();

    const regions = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const region = cleanSheetData(row[0]);
      const purchPercent = row[4]; // Purch_Prediction column
      const factRevenue = row[5];  // fact_revenue
      const planRevenue = row[6];  // plan_revenue
      const revenuePercent = row[8]; // Revenue_Prediction

      // Skip empty rows, headers, or totals
      if (!region || region === "region_code" || region === "Total") continue;

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

  // Build monospaced table
  let tableText = "```\n";
  tableText += "Region | Purch%| Revenue    | Plan Rev   | Rev%   | Status\n";
  tableText += "-------|-------|------------|------------|--------|-------\n";

  regions.forEach(r => {
    const region = padRight(r.region, 6);
    const purchPct = padLeft(formatPercentage(r.purchPercent), 5);
    const revenue = padLeft(formatCurrency(r.factRevenue, true), 10);
    const planRev = padLeft(formatCurrency(r.planRevenue, true), 10);
    const revPct = padLeft(formatPercentage(r.revenuePercent), 6);

    // Status icon based on revenue %
    let status = "";
    if (r.revenuePercent) {
      const revNum = parseFloat(String(r.revenuePercent).replace('%', ''));
      if (!isNaN(revNum)) {
        if (revNum >= 100) status = "🔥";
        else if (revNum >= 95) status = "✅";
        else if (revNum >= 85) status = "⚠️";
        else status = "❌";
      }
    }

    tableText += `${region} | ${purchPct} | ${revenue} | ${planRev} | ${revPct} | ${status}\n`;
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
 * Expected: Categories like "paid on time", "paid in advance", "churn prevention", "churn"
 */
function readPlanFactByCategory(sheet) {
  try {
    // Adjust range based on your "Plan and Fact by category" section
    // Expected columns: category, fact_purchase, plan_purchases, forecast_purchase,
    //                   Purch_Plan_Exec, fact_revenue, plan_revenue, forecast_revenue, Revenue_Plan_Exec

    const dataRange = sheet.getRange("A40:J45"); // Adjust as needed
    const data = dataRange.getValues();

    const categories = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const category = cleanSheetData(row[0]);
      const factPurchase = row[1];
      const planPurchase = row[2];
      const purchPercent = row[4]; // Purch_Plan_Exec
      const factRevenue = row[5];
      const planRevenue = row[6];

      // Skip empty rows, headers, or totals
      if (!category || category === "category" || category === "Total") continue;

      categories.push({
        category: category,
        factPurchase: factPurchase,
        planPurchase: planPurchase,
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

  // Build monospaced table
  let tableText = "```\n";
  tableText += "Category        | Fact  | Plan  | Purch%| Revenue    | Status\n";
  tableText += "----------------|-------|-------|-------|------------|-------\n";

  categories.forEach(c => {
    const category = padRight(capitalize(c.category), 15);
    const fact = padLeft(formatNumber(c.factPurchase), 5);
    const plan = padLeft(formatNumber(c.planPurchase), 5);
    const purchPct = padLeft(formatPercentage(c.purchPercent), 5);
    const revenue = padLeft(formatCurrency(c.factRevenue, true), 10);

    // Status icon based on purchase %
    let status = "";
    if (c.purchPercent) {
      const pctNum = parseFloat(String(c.purchPercent).replace('%', ''));
      if (!isNaN(pctNum)) {
        if (pctNum >= 100) status = "🔥";
        else if (pctNum >= 90) status = "✅";
        else if (pctNum >= 80) status = "⚠️";
        else status = "❌";
      }
    }

    tableText += `${category} | ${fact} | ${plan} | ${purchPct} | ${revenue} | ${status}\n`;
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
 * Clean sheet data (remove extra whitespace, handle null/undefined)
 */
function cleanSheetData(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return String(value).trim();
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

  // If it's a decimal (0.5 = 50%)
  if (typeof value === 'number') {
    if (value < 1 && value > 0) {
      return (value * 100).toFixed(2) + '%';
    }
    return value.toFixed(2) + '%';
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

/**
 * Calculate delta between two percentage values
 */
function calculateDelta(current, target) {
  if (!current || !target) return null;

  const currentNum = parseFloat(String(current).replace('%', ''));
  const targetNum = parseFloat(String(target).replace('%', ''));

  if (isNaN(currentNum) || isNaN(targetNum)) return null;

  const delta = currentNum - targetNum;
  return (delta > 0 ? '+' : '') + delta.toFixed(2);
}
