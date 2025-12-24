/**
 * SLACK REPORT FORMATTER
 * Advanced formatting functions for different report types
 */

/**
 * BUILD SALES REPORT - Specifically formatted for weekly sales reports
 */
function buildSalesReport(automation, allRows) {
  const headers = allRows.headers;
  const rows = allRows.data;
  const blocks = [];

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: "📊 SECONDARY SALES WEEKLY REPORT",
      emoji: true
    }
  });

  // Find week ending date
  const weekEndingIndex = headers.findIndex(h => h.toLowerCase().includes("week"));
  const weekEnding = weekEndingIndex !== -1 && rows[0] ? rows[0][weekEndingIndex] : new Date().toLocaleDateString();

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Week Ending:* ${weekEnding}`
    }
  });

  blocks.push({ type: "divider" });

  // KEY METRICS OVERVIEW
  const metricsSection = extractMetricsSection(headers, rows);
  if (metricsSection.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🎯 KEY METRICS OVERVIEW*"
      }
    });

    metricsSection.forEach(metric => {
      const fields = [];
      Object.keys(metric).forEach(key => {
        if (key !== '_label') {
          fields.push({
            type: "mrkdwn",
            text: `*${key}*\n${formatMetricValue(metric[key], key)}`
          });
        }
      });

      if (fields.length > 0) {
        blocks.push({
          type: "section",
          fields: fields
        });
      }
    });

    blocks.push({ type: "divider" });
  }

  // PROCEDURE PERFORMANCE
  const procedureSection = extractProcedureSection(headers, rows);
  if (procedureSection.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*📋 PROCEDURE PERFORMANCE*"
      }
    });

    procedureSection.forEach(proc => {
      blocks.push({
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*${proc.name}*`
          },
          {
            type: "mrkdwn",
            text: `*Status*\n${proc.status || '⚠️ Below Target'}`
          },
          {
            type: "mrkdwn",
            text: `Call Rate: ${formatPercentValue(proc.callRate)}`
          },
          {
            type: "mrkdwn",
            text: `Process Rate: ${formatPercentValue(proc.processRate)}`
          },
          {
            type: "mrkdwn",
            text: `Paid Rate: ${formatPercentValue(proc.paidRate)}`
          },
          {
            type: "mrkdwn",
            text: `Target: ${proc.target || 'N/A'}`
          }
        ]
      });
    });

    blocks.push({ type: "divider" });
  }

  // CATEGORY BREAKDOWN
  const categorySection = extractCategorySection(headers, rows);
  if (categorySection.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*📊 CATEGORY BREAKDOWN*"
      }
    });

    categorySection.forEach(cat => {
      blocks.push({
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*${getCategoryEmoji(cat.name)} ${cat.name}*`
          },
          {
            type: "mrkdwn",
            text: `ARPU: ${formatCurrencyValue(cat.arpu)}`
          },
          {
            type: "mrkdwn",
            text: `Purchases: ${formatNumberValue(cat.purchases)} (${formatPercentValue(cat.purchasesPct)})`
          },
          {
            type: "mrkdwn",
            text: `Revenue: ${formatCurrencyValue(cat.revenue)} (${formatPercentValue(cat.revenuePct)})`
          }
        ]
      });
    });

    blocks.push({ type: "divider" });
  }

  // REGIONAL PERFORMERS
  const regionalSection = extractRegionalSection(headers, rows);
  if (regionalSection.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🌟 TOP REGIONAL PERFORMERS*"
      }
    });

    regionalSection.forEach((region, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍';

      blocks.push({
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*${medal} ${region.name}*`
          },
          {
            type: "mrkdwn",
            text: `Plan: ${formatPercentValue(region.planPct)}`
          },
          {
            type: "mrkdwn",
            text: `Revenue: ${formatCurrencyValue(region.revenue)}`
          },
          {
            type: "mrkdwn",
            text: `ARPU: ${formatCurrencyValue(region.arpu)}`
          }
        ]
      });

      if (region.note) {
        blocks.push({
          type: "context",
          elements: [{
            type: "mrkdwn",
            text: `📝 ${region.note}`
          }]
        });
      }
    });
  }

  return { blocks: blocks };
}

/**
 * EXTRACT METRICS SECTION - Find key metrics rows
 */
function extractMetricsSection(headers, rows) {
  const metrics = [];
  const metricLabels = ['Total Revenue', 'Total Purchases', 'ARPU', 'Plan Achievement'];

  rows.forEach(row => {
    const label = row[0] || '';
    if (metricLabels.some(m => label.includes(m))) {
      const metric = { _label: label };

      headers.forEach((header, index) => {
        if (index > 0 && row[index]) {
          metric[header] = row[index];
        }
      });

      if (Object.keys(metric).length > 1) {
        metrics.push(metric);
      }
    }
  });

  return metrics;
}

/**
 * EXTRACT PROCEDURE SECTION - Find procedure performance data
 */
function extractProcedureSection(headers, rows) {
  const procedures = [];

  rows.forEach(row => {
    const label = row[0] || '';
    if (label.includes('Killer Base') || label.includes('Churn Prevention')) {
      const proc = {
        name: label.replace(/\(.*?\)/g, '').trim(),
        callRate: findColumnValue(row, headers, 'Call'),
        processRate: findColumnValue(row, headers, 'Process'),
        paidRate: findColumnValue(row, headers, 'Paid'),
        target: findColumnValue(row, headers, 'Target'),
        status: findColumnValue(row, headers, 'Status')
      };

      procedures.push(proc);
    }
  });

  return procedures;
}

/**
 * EXTRACT CATEGORY SECTION - Find category breakdown
 */
function extractCategorySection(headers, rows) {
  const categories = [];
  const categoryLabels = ['Paid on Time', 'Paid in Advance', 'Churn Prevention', 'Churn'];

  rows.forEach(row => {
    const label = row[0] || '';
    if (categoryLabels.some(c => label.includes(c))) {
      const category = {
        name: label,
        purchases: findColumnValue(row, headers, 'Purchases'),
        purchasesPct: findColumnValue(row, headers, '% of Total', 0),
        revenue: findColumnValue(row, headers, 'Revenue'),
        revenuePct: findColumnValue(row, headers, '% of Total', 1),
        arpu: findColumnValue(row, headers, 'ARPU')
      };

      categories.push(category);
    }
  });

  return categories;
}

/**
 * EXTRACT REGIONAL SECTION - Find top regional performers
 */
function extractRegionalSection(headers, rows) {
  const regions = [];

  rows.forEach(row => {
    const label = row[0] || '';
    // Skip header rows and empty rows
    if (label && !label.includes('Region') && !label.includes('TOTAL')) {
      // Check if this looks like a region row (has numeric revenue/plan data)
      const hasNumericData = row.slice(1).some(cell => !isNaN(parseFloat(cell)));

      if (hasNumericData) {
        const region = {
          name: label,
          revenue: findColumnValue(row, headers, 'Revenue'),
          planPct: findColumnValue(row, headers, 'Plan'),
          arpu: findColumnValue(row, headers, 'ARPU'),
          performance: findColumnValue(row, headers, 'Performance'),
          note: findColumnValue(row, headers, 'Note')
        };

        regions.push(region);
      }
    }
  });

  return regions;
}

/**
 * FIND COLUMN VALUE - Helper to find value in row by column name
 */
function findColumnValue(row, headers, searchTerm, occurrence = 0) {
  let foundCount = 0;

  for (let i = 0; i < headers.length; i++) {
    if (headers[i].toLowerCase().includes(searchTerm.toLowerCase())) {
      if (foundCount === occurrence) {
        return row[i] || '';
      }
      foundCount++;
    }
  }

  return '';
}

/**
 * FORMAT METRIC VALUE - Format with proper emoji and styling
 */
function formatMetricValue(value, metricName) {
  if (!value) return 'N/A';

  const str = value.toString();
  const lower = metricName.toLowerCase();

  if (lower.includes('change')) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      const emoji = num >= 0 ? '📈' : '📉';
      const sign = num >= 0 ? '+' : '';
      return `${emoji} ${sign}${num.toFixed(1)}%`;
    }
  }

  return str;
}

/**
 * FORMAT CURRENCY VALUE
 */
function formatCurrencyValue(value) {
  if (!value || value === 'N/A') return 'N/A';

  const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return value;

  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * FORMAT NUMBER VALUE
 */
function formatNumberValue(value) {
  if (!value || value === 'N/A') return 'N/A';

  const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return value;

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * FORMAT PERCENT VALUE
 */
function formatPercentValue(value) {
  if (!value || value === 'N/A') return 'N/A';

  const str = value.toString();
  const num = parseFloat(str.replace(/[^0-9.-]/g, ''));

  if (isNaN(num)) return value;

  // If value is already a percentage (contains %)
  if (str.includes('%')) {
    return str;
  }

  // If value is decimal (0.95 = 95%)
  if (num <= 1 && num >= 0) {
    return (num * 100).toFixed(1) + '%';
  }

  return num.toFixed(1) + '%';
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

  return "📦";
}

/**
 * BUILD COMPACT TABLE - For simple data display
 */
function buildCompactTable(headers, rows) {
  let text = "```\n";

  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    let maxWidth = h.length;
    rows.forEach(row => {
      const cellWidth = (row[i] || '').toString().length;
      if (cellWidth > maxWidth) maxWidth = cellWidth;
    });
    return Math.min(maxWidth, 15);
  });

  // Header
  text += headers
    .map((h, i) => h.substring(0, colWidths[i]).padEnd(colWidths[i]))
    .join(' | ') + '\n';

  // Separator
  text += colWidths
    .map(w => '─'.repeat(w))
    .join('─┼─') + '\n';

  // Rows
  rows.forEach(row => {
    text += row
      .map((cell, i) => (cell || '').toString().substring(0, colWidths[i]).padEnd(colWidths[i]))
      .join(' | ') + '\n';
  });

  text += '```';

  return text;
}

/**
 * BUILD ORGANIZED REPORT - Auto-detect report type and format accordingly
 */
function buildOrganizedReport(automation, allRows) {
  const headers = allRows.headers;
  const rows = allRows.data;

  // Detect if this is a sales report
  const isSalesReport = headers.some(h =>
    h.toLowerCase().includes('revenue') ||
    h.toLowerCase().includes('arpu') ||
    h.toLowerCase().includes('purchases')
  );

  if (isSalesReport) {
    return buildSalesReport(automation, allRows);
  }

  // Fallback to general beautiful report
  return buildBeautifulReport(automation, allRows);
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
 * BUILD BEAUTIFUL REPORT - REMOVED - Use version in SlackAutomationBuilder.gs
 * This duplicate function was causing format selection to not work.
 * SlackAutomationBuilder.gs has the correct version with all 5 formats.
 */
// Function removed - see SlackAutomationBuilder.gs for buildBeautifulReport()

// Helper function if not already defined
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
 * GET EMOJI FOR HEADER
 */
function getEmojiForHeader(header) {
  const lower = header.toLowerCase();

  if (lower.includes("revenue")) return "💰";
  if (lower.includes("purchase")) return "🛒";
  if (lower.includes("arpu")) return "📊";
  if (lower.includes("plan")) return "📈";
  if (lower.includes("call")) return "📞";
  if (lower.includes("process")) return "⚙️";
  if (lower.includes("paid")) return "💳";
  if (lower.includes("target")) return "🎯";
  if (lower.includes("status")) return "🚦";
  if (lower.includes("date")) return "📅";
  if (lower.includes("region")) return "🌍";

  return "▪️";
}
