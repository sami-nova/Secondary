# Slack Message Formatting - Implementation Guide

## Overview

This guide explains the improved Slack message formatting that has been implemented to replace messy text-based tables with beautiful, professional Block Kit layouts.

## What Was Fixed

### Before ❌
- Messy text tables with misaligned columns
- Hard to read on mobile devices
- Poor visual hierarchy
- Columns getting truncated

### After ✅
- Clean Block Kit sections with visual hierarchy
- Mobile-friendly card layouts
- Automatic formatting based on data type
- Smart emoji indicators
- Proper grouping and organization

## How It Works

### Automatic Report Detection

The system automatically detects what type of report you're sending and formats it accordingly:

1. **Sales Reports** - Detects reports with Revenue, ARPU, Purchases columns
2. **Grouped Data** - Detects Category/Type/Section columns and groups data
3. **General Data** - Falls back to clean card layout for any other data

### Smart Formatting

The system automatically formats values based on column names:

- **Currency** (Revenue, ARPU, Amount) → `$125,000`
- **Percentages** (Plan, Rate, %) → `95.5% 📈`
- **Numbers** (Purchases, Count) → `1,234`
- **Status** → Adds emoji indicators ✅ ⚠️ ❌

## Using the Updated Code

### 1. Copy the Updated Files

Replace your existing files with:
- `SlackAutomationBuilder.gs` - Main message building logic
- `SlackReportFormatter.gs` - Advanced formatting functions

### 2. Keep Your Existing Files

These files remain unchanged:
- `Code.gs` - Menu and configuration
- `SlackAutomationScheduler.html` - UI for creating automations
- `SlackTrigger.gs` - Trigger handlers
- `Index.html` - Templates page
- `Style.html` - CSS styles

### 3. Test Your Automations

1. Open your Google Sheet
2. Go to **Slack Integration** → **Open Automation Workflow Builder**
3. Select an existing automation
4. Click **Test** to see the new formatting

## Report Formats

### Format 1: Sales Report (Automatic)

Perfect for weekly sales reports with metrics, procedures, categories, and regions.

**Triggers when headers include:**
- Revenue
- ARPU
- Purchases
- Plan Achievement

**Output:**
```
📊 SECONDARY SALES WEEKLY REPORT
Week Ending: 2025-12-22

🎯 KEY METRICS OVERVIEW
💰 Total Revenue          📈 +5.2%
$125,000

🛒 Total Purchases        📈 +3.1%
450

📊 ARPU                   📈 +2.0%
$278

━━━━━━━━━━━━━━━━━━━━━━

📋 PROCEDURE PERFORMANCE
👁️ Killer Base (KB)       ⚠️ Below Target
Call: 75% | Process: 45% | Paid: 40%

💧 Churn Prevention (CP)  ⚠️ Below Target
Call: 85% | Process: 80% | Paid: 75%

━━━━━━━━━━━━━━━━━━━━━━

📊 CATEGORY BREAKDOWN
✅ Paid on Time
Purchases: 200 (44.4%) | Revenue: $50,000 | ARPU: $250

⏰ Paid in Advance
Purchases: 150 (33.3%) | Revenue: $45,000 | ARPU: $300

━━━━━━━━━━━━━━━━━━━━━━

🌟 TOP REGIONAL PERFORMERS
🥇 North Region
Revenue: $45,000 | Plan: 110.5% | ARPU: $300
📝 Exceeded target by 10.5%

🥈 South Region
Revenue: $40,000 | Plan: 98.2% | ARPU: $280
```

### Format 2: Grouped Data (Automatic)

When your data has a Category, Type, or Section column, data is automatically grouped.

**Output:**
```
📊 PROJECT TRACKER

📦 Development
Project Name: New Feature | Status: ✅ Complete
Owner: John | Due Date: 2025-12-30

📦 Testing
Project Name: QA Testing | Status: ⏳ In Progress
Owner: Sarah | Due Date: 2025-12-28
```

### Format 3: Card Layout (Default)

For any other data, a clean card layout is used.

**Output:**
```
📊 TASK LIST

▪️ Task Name: Complete Report
▪️ Assignee: Mike
▪️ Status: ✅ Complete
▪️ Priority: High

━━━━━━━━━━━━━━━━━━

▪️ Task Name: Review Code
▪️ Assignee: Lisa
▪️ Status: ⏳ Pending
▪️ Priority: Medium
```

## Customization

### Custom Emojis

To change emojis for specific columns or categories, edit these functions in `SlackAutomationBuilder.gs`:

```javascript
function getEmojiForHeader(header) {
  const lower = header.toLowerCase();

  if (lower.includes("revenue")) return "💰";
  if (lower.includes("your_column")) return "🎯"; // Add your own

  return "▪️";
}
```

### Custom Category Icons

Edit `getCategoryEmoji()` function:

```javascript
function getCategoryEmoji(category) {
  const lower = category.toLowerCase();

  if (lower.includes("your_category")) return "🎨"; // Add your own

  return "📦";
}
```

### Format Specific Report Types

You can create custom formatters in `SlackReportFormatter.gs`:

```javascript
function buildCustomReport(automation, allRows) {
  const blocks = [];

  // Your custom logic here
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: "My Custom Report",
      emoji: true
    }
  });

  return { blocks: blocks };
}
```

Then call it from `buildBeautifulReport()`:

```javascript
// Detect custom report
if (headers.some(h => h.includes('MySpecialColumn'))) {
  return buildCustomReport(automation, allRows);
}
```

## Advanced Features

### Smart Value Formatting

The system automatically enhances values:

- **Trends** → Adds 📈 📉 for positive/negative changes
- **Status Indicators** → Adds ✅ ⚠️ ❌ based on status text
- **Performance** → Shows 📈 for >90%, ⚠️ for 80-90%, 📉 for <80%

### Mobile Optimization

All layouts use Slack's Block Kit which:
- Automatically adapts to screen size
- Uses native Slack components
- Maintains readability on all devices

### Grouping Logic

Data is grouped when:
1. A "Category", "Type", or "Section" column exists
2. There are more than 3 rows
3. Multiple rows share the same category value

## Troubleshooting

### Message Still Looks Messy

**Check:**
1. Are you testing the right automation?
2. Did you replace both `.gs` files?
3. Does your sheet have proper headers?

**Solution:**
- Click **Refresh** in the automation builder
- Delete and recreate the automation
- Check execution logs for errors

### No Emojis Showing

**Cause:** Column names don't match the emoji logic

**Solution:**
Add your column names to `getEmojiForHeader()` function

### Sections Not Grouping

**Cause:** No Category/Type/Section column found

**Solution:**
- Rename a column to include "Category", "Type", or "Section"
- Or edit the detection logic in `buildBeautifulReport()`

### Too Many Blocks Error

**Cause:** Slack has a 50-block limit per message

**Solution:**
- Limit rows with criteria in your automation
- Split large reports into multiple automations
- Use the compact table format for very large datasets

## Best Practices

### 1. Use Descriptive Headers

Instead of: `Rev`, `Purch`, `Pct`
Use: `Revenue`, `Purchases`, `Percent`

This helps automatic emoji and formatting detection.

### 2. Group Related Data

Use a "Category" or "Section" column to group related rows together.

### 3. Limit Row Count

For best readability:
- Sales Reports: 5-15 rows
- Grouped Data: 10-20 rows
- Card Layout: 5-10 rows

Use automation criteria to filter data.

### 4. Test Before Scheduling

Always use the **Test** button before enabling automatic schedules.

### 5. Use Message Headers

Set a clear `messageHeader` in your automation config:
- ✅ "Weekly Sales Report - North Region"
- ❌ "Report"

## Examples

### Example 1: Weekly Metrics Report

**Sheet Structure:**
```
Metric          | This Week | Last Week | Change  | Target
Total Revenue   | 125000    | 118000    | 5.9     | 100%
Total Purchases | 450       | 436       | 3.2     | 100%
```

**Result:** Automatically formatted as Sales Report with emoji indicators

### Example 2: Task Tracker

**Sheet Structure:**
```
Category     | Task Name      | Status      | Owner
Development  | Build Feature  | Complete    | John
Development  | Write Tests    | In Progress | Sarah
Design       | Create Mockup  | Complete    | Mike
```

**Result:** Grouped by Category with status emojis

### Example 3: Customer Feedback

**Sheet Structure:**
```
Customer  | Rating | Comment           | Date
Acme Corp | 5      | Excellent service | 2025-12-20
Tech Inc  | 4      | Good product      | 2025-12-21
```

**Result:** Card layout with emoji indicators

## Support

For issues or questions:
1. Check the execution logs in Apps Script
2. Review the function comments in the code
3. Test with a small sample dataset first

## What's Next

You can further customize:
- Add custom report types for your specific needs
- Create formatting rules for specific columns
- Build interactive buttons (requires Slack App instead of webhook)
- Add charts and visualizations (external image URLs)

---

**Last Updated:** 2025-12-24
**Version:** 2.0 - Beautiful Block Kit Formatting
