/**
 * Key Metrics Executive Dashboard - Slack Automation
 * Combines multiple format elements for a comprehensive executive view
 *
 * Features:
 * - Compact summary with key takeaways
 * - Performance tiers (Top Performers / On Track / Needs Attention)
 * - Week-over-week comparisons
 * - Visual indicators and trend arrows
 * - Regional highlights and category breakdown
 *
 * Works with the "Key Metrics Weekly" sheet created by KeyMetricsWeeklyTemplate.gs
 */

/**
 * Main function to build the Executive Dashboard format
 * @param {Object} automation - Automation object from Slack Automation Settings
 */
function buildKeyMetricsExecutiveDashboard(automation) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.sheetName || "Key Metrics Weekly");

    if (!sheet) {
      Logger.log(`Sheet not found: ${automation.sheetName || "Key Metrics Weekly"}`);
      return {
        text: `❌ Error: Sheet "${automation.sheetName || "Key Metrics Weekly"}" not found`
      };
    }

    const blocks = [];
    const generatedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'M/dd/yyyy');

    // ============================================
    // HEADER
    // ============================================
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: "📊 WEEKLY METRICS DASHBOARD",
        emoji: true
      }
    });

    blocks.push({
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: `📅 Week ending: ${generatedDate}`
      }]
    });

    blocks.push({ type: "divider" });

    // ============================================
    // SECTION 1: KEY TAKEAWAYS (Summary)
    // ============================================
    const overviewData = readKeyMetricsOverview(sheet);
    if (overviewData && overviewData.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🎯 KEY TAKEAWAYS*"
        }
      });

      let takeawaysText = "";
      overviewData.forEach(m => {
        const isARPU = m.metric && m.metric.toUpperCase().includes('ARPU');
        const formattedValue = isARPU ? formatCurrency(m.value) : formatMetricValue(m.value);
        const deltaText = m.deltaWoW ? ` ${m.deltaWoW}` : "";

        takeawaysText += `• ${m.metric}: *${formattedValue}*${deltaText}\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: takeawaysText
        }
      });

      blocks.push({ type: "divider" });
    }

    // ============================================
    // SECTION 2: PERFORMANCE TIERS (Regional)
    // ============================================
    const salesData = readSalesPerformanceByRegion(sheet);
    if (salesData && salesData.length > 0) {
      // Split into tiers based on performance
      const topPerformers = [];
      const onTrack = [];
      const needsAttention = [];

      salesData.forEach(r => {
        if (r.region.toUpperCase() === 'TOTAL') return; // Skip total row

        const purchPct = parseFloat(String(r.purchPercent).replace('%', ''));
        if (isNaN(purchPct)) return;

        if (purchPct >= 100) {
          topPerformers.push(r);
        } else if (purchPct >= 90) {
          onTrack.push(r);
        } else {
          needsAttention.push(r);
        }
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*📈 REGIONAL PERFORMANCE SNAPSHOT*"
        }
      });

      // Top Performers
      if (topPerformers.length > 0) {
        let topText = "*🏆 Exceeding Targets*\n";
        topPerformers.slice(0, 5).forEach(r => {
          const emoji = getRegionSlackEmoji(r.region);
          topText += `${emoji} *${r.region}*: ${formatPercentage(r.purchPercent)} | ${formatCurrency(r.factRevenue, true)} | ${formatPercentage(r.revenuePercent)}\n`;
        });
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: topText
          }
        });
      }

      // On Track
      if (onTrack.length > 0) {
        let trackText = "*✅ On Track*\n";
        onTrack.slice(0, 5).forEach(r => {
          const emoji = getRegionSlackEmoji(r.region);
          trackText += `${emoji} *${r.region}*: ${formatPercentage(r.purchPercent)} | ${formatCurrency(r.factRevenue, true)} | ${formatPercentage(r.revenuePercent)}\n`;
        });
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: trackText
          }
        });
      }

      // Needs Attention
      if (needsAttention.length > 0) {
        let attentionText = "*⚠️ Action Required*\n";
        needsAttention.forEach(r => {
          const emoji = getRegionSlackEmoji(r.region);
          const gap = 100 - parseFloat(String(r.purchPercent).replace('%', ''));
          attentionText += `${emoji} *${r.region}*: ${formatPercentage(r.purchPercent)} | ${formatCurrency(r.factRevenue, true)} | _${gap.toFixed(1)}pp below target_\n`;
        });
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: attentionText
          }
        });
      }

      blocks.push({ type: "divider" });
    }

    // ============================================
    // SECTION 3: NET CHURN COMPARISON
    // ============================================
    const netChurnData = readNetChurnByRegion(sheet);
    if (netChurnData && netChurnData.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*📍 NET CHURN TRACKING*"
        }
      });

      // Show top 5 regions with highest churn risk
      const sortedByChurn = netChurnData
        .filter(r => r.region.toUpperCase() !== 'TOTAL')
        .sort((a, b) => {
          const aVal = parseFloat(String(a.today).replace('%', '')) || 0;
          const bVal = parseFloat(String(b.today).replace('%', '')) || 0;
          return bVal - aVal;
        });

      let churnText = "_Today vs Plan vs Forecast_\n\n";
      sortedByChurn.slice(0, 8).forEach(r => {
        const emoji = getRegionSlackEmoji(r.region);
        const status = r.status || '';
        churnText += `${emoji} *${r.region}*: ${formatPercentage(r.today)} vs ${formatPercentage(r.plan)} vs ${formatPercentage(r.forecast)} ${status}\n`;
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: churnText
        }
      });

      blocks.push({ type: "divider" });
    }

    // ============================================
    // SECTION 4: CATEGORY BREAKDOWN
    // ============================================
    const categoryData = readPlanFactByCategory(sheet);
    if (categoryData && categoryData.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*💰 REVENUE BY CATEGORY*"
        }
      });

      // Find total revenue
      const totalCategory = categoryData.find(c => c.category && c.category.toLowerCase().includes('total'));
      const totalRevenue = totalCategory ? totalCategory.factRevenue : 0;

      let categoryText = "";
      categoryData.forEach(c => {
        if (c.category && c.category.toLowerCase().includes('total')) {
          categoryText += `:earth_americas: *Total*: ${formatCurrency(c.factRevenue, true)} (${formatPercentage(c.purchPercent)})\n`;
        } else {
          const revenue = formatCurrency(c.factRevenue, true);
          const percent = formatPercentage(c.purchPercent);

          // Calculate percentage of total
          let categoryPct = "";
          if (totalRevenue > 0) {
            const pct = (parseFloat(c.factRevenue) / parseFloat(totalRevenue) * 100).toFixed(0);
            categoryPct = ` • ${pct}% of total`;
          }

          categoryText += `• *${capitalize(c.category)}*: ${revenue} (${percent})${categoryPct}\n`;
        }
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: categoryText
        }
      });
    }

    return {
      blocks: blocks
    };

  } catch (error) {
    Logger.log(`Error building Executive Dashboard: ${error.toString()}`);
    return {
      text: `❌ Error building Executive Dashboard: ${error.message}`
    };
  }
}

// ============================================
// UTILITY FUNCTIONS (reuse from KeyMetricsWeeklyBuilder.gs)
// ============================================

// Note: These functions reference the same utility functions from KeyMetricsWeeklyBuilder.gs
// If running standalone, copy over: formatPercentage, formatCurrency, formatMetricValue,
// formatNumber, capitalize, cleanSheetData, getRegionSlackEmoji, and the read functions
