# Slack Report Automation - Setup Guide

This guide will help you set up automated weekly sales reports from Google Sheets to Slack.

## Features

✅ **Better Formatting**: Uses Slack's Block Kit for clean, readable messages
✅ **Automatic Scheduling**: Can run automatically every week
✅ **Emoji Indicators**: Visual indicators for metrics and trends
✅ **Structured Sections**: Clear separation of different report sections
✅ **Mobile Friendly**: Looks great on both desktop and mobile Slack apps

## Prerequisites

1. A Google Sheet with your sales report data
2. A Slack workspace with admin access
3. Ability to create Slack webhooks

## Step 1: Create a Slack Webhook

1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app (e.g., "Sales Report Bot")
5. Select your workspace
6. Click "Incoming Webhooks" in the left sidebar
7. Toggle "Activate Incoming Webhooks" to **On**
8. Click "Add New Webhook to Workspace"
9. Select the channel where you want reports posted
10. Copy the webhook URL (looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`)

## Step 2: Set Up the Google Apps Script

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Delete any existing code in the editor
4. Copy the entire content from `SlackReportAutomation.gs` and paste it
5. Update the configuration at the top of the script:

```javascript
const SLACK_WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE'; // Paste your webhook URL
const SHEET_NAME = 'Sheet1'; // Change to your sheet name
```

6. Click **Save** (disk icon)
7. Name your project (e.g., "Slack Sales Report")

## Step 3: Adjust Cell References

The script assumes a specific layout. If your sheet layout differs, you'll need to adjust the cell references in the script.

### Current Layout Assumptions:

- **Week Ending Date**: Cell `C3`
- **Key Metrics**: Starting at row 6
  - Total Revenue: Row 6
  - Total Purchases: Row 7
  - ARPU: Row 8
  - Plan Achievement: Row 9
- **Procedure Performance**: Starting at row 13
  - Killer Base: Row 13
  - Churn Prevention: Row 14
- **Category Breakdown**: Starting at row 18
- **Regional Performers**: Starting at row 30

### How to Adjust:

Find the relevant function in the script and update the cell references. For example:

```javascript
function getKeyMetrics(sheet) {
  return {
    totalRevenue: {
      thisWeek: sheet.getRange('C6').getValue(),  // Change 'C6' to your cell
      lastWeek: sheet.getRange('D6').getValue(),  // Change 'D6' to your cell
      // ... etc
    }
  };
}
```

## Step 4: Test the Script

1. In the Apps Script editor, select `sendWeeklyReportToSlack` from the function dropdown
2. Click **Run** (▶️ button)
3. First time: Grant permissions
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"
4. Check your Slack channel for the report
5. Review the **Execution log** (View → Logs) for any errors

## Step 5: Set Up Automatic Weekly Reports (Optional)

To send reports automatically every week:

1. In the Apps Script editor, select `setupWeeklyTrigger` from the function dropdown
2. Click **Run**
3. This will create a trigger to run every Monday at 9 AM

To change the schedule:
- Edit the `setupWeeklyTrigger` function
- Available options:
  ```javascript
  .onWeekDay(ScriptApp.WeekDay.MONDAY)  // Day of week
  .atHour(9)                             // Hour (0-23)
  ```

To remove automatic reports:
1. Select `removeWeeklyTrigger` from the function dropdown
2. Click **Run**

## Customization Options

### Change Emojis

Edit the emoji constants in the formatting functions:

```javascript
function getCategoryEmoji(category) {
  const emojiMap = {
    'Paid on Time': '✅',      // Change these
    'Paid in Advance': '⏰',
    'Churn Prevention': '💧',
    'Churn': '❌'
  };
  return emojiMap[category] || '📦';
}
```

### Adjust Number Formatting

Modify the formatting functions:

```javascript
function formatCurrency(value) {
  // Change currency symbol, decimal places, etc.
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}
```

### Add More Sections

Follow the pattern in `buildSlackMessage()`:

```javascript
// Get data
const myData = getMyCustomData(sheet);

// Format and add to blocks
blocks.push(...formatMyCustomSection(myData));

// Add divider
blocks.push({"type": "divider"});
```

## Troubleshooting

### Report Not Sending

1. Check execution log: **View → Logs** or **View → Executions**
2. Common issues:
   - Wrong webhook URL
   - Wrong sheet name
   - Wrong cell references
   - Missing permissions

### Data Not Showing Correctly

1. Check that cell references match your sheet layout
2. Verify sheet name matches `SHEET_NAME` constant
3. Check data types (numbers vs. text)

### Empty Sections

If certain sections show "No data available":
- Check cell references in the corresponding `get...()` function
- Ensure data exists in those cells
- Check for empty cells or formatting issues

### Format Issues in Slack

- Slack has a 50-block limit per message
- If your report has many items, you may need to split it
- Consider summarizing less important sections

## Manual Testing Commands

You can test individual sections by creating test functions:

```javascript
function testKeyMetrics() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const metrics = getKeyMetrics(sheet);
  Logger.log(metrics);
}
```

## Support

For issues with:
- **Slack webhooks**: Check [Slack API documentation](https://api.slack.com/messaging/webhooks)
- **Google Apps Script**: Check [Google Apps Script documentation](https://developers.google.com/apps-script)
- **This script**: Review the code comments and adjust cell references

## Example Output

The Slack message will have:
- 📊 Header with report title
- 🎯 Key metrics with change indicators
- 📋 Procedure performance with status warnings
- 📊 Category breakdown with emojis
- 🌟 Top regional performers with medals

Each section is clearly separated and uses Slack's native formatting for better readability on all devices.
