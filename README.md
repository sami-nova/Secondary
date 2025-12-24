# Secondary Sales Automation

Automated weekly sales reporting from Google Sheets to Slack with beautiful formatting.

## 📋 Overview

This project provides Google Apps Script solutions to automatically send your Secondary Sales weekly reports from Google Sheets to Slack. Say goodbye to messy text tables and hello to clean, professional-looking reports!

## ✨ Features

- **📊 Beautiful Formatting**: Uses Slack Block Kit for professional, readable messages
- **🎨 Multiple Format Options**: Choose from 5 different message formats (inline, table, list, cards, plain)
- **🔄 Automatic Scheduling**: Set up weekly automatic reports
- **📱 Mobile Friendly**: Looks great on desktop and mobile
- **🎯 Visual Indicators**: Emojis for metrics, trends, and categories
- **⚡ Easy Setup**: Just copy, paste, and configure

## 🚀 Quick Start

1. **Choose Your Version**:
   - `SlackReportAutomation.gs` - Full featured with Slack Block Kit (Recommended)
   - `SlackReportAutomation-Simple.gs` - Simpler text-based version

2. **Follow Setup Guide**: See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions

3. **Test & Deploy**: Run manually or set up automatic weekly reports

## 📂 Files

- **SlackReportAutomation.gs** - Main script with Block Kit formatting
- **SlackReportAutomation-Simple.gs** - Alternative simple text version
- **SETUP_GUIDE.md** - Comprehensive setup and customization guide

## 🔧 Configuration

Two simple steps:

1. Get your Slack webhook URL from https://api.slack.com/apps
2. Update these lines in the script:

```javascript
const SLACK_WEBHOOK_URL = 'your-webhook-url-here';
const SHEET_NAME = 'Sheet1';
```

## 📊 What It Includes

The automated report includes:

- **Key Metrics Overview**: Revenue, Purchases, ARPU, Plan Achievement
- **Procedure Performance**: Killer Base, Churn Prevention with targets
- **Category Breakdown**: Performance by category with percentages
- **Top Regional Performers**: Ranked regional performance with medals

## 🎯 Before & After

**Before** (Messy text table):
```
SECONDARY S |           |           |        |         |
Week Ending:| 2025-12-22|           |        |         |
...messy unformatted text table...
```

**After** (Clean Slack blocks):
```
📊 SECONDARY SALES WEEKLY REPORT
Week Ending: 2025-12-22

🎯 KEY METRICS OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━
💰 Total Revenue       📈 +5.2%
$125,000

[Beautifully formatted sections with emojis and structure]
```

## 🛠️ Customization

The scripts are fully customizable:

- Change emojis and formatting
- Adjust cell references to match your sheet
- Modify sections to include/exclude data
- Customize scheduling (daily, weekly, monthly)

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for customization options.

## 📖 Documentation

- [REQUIRED_FILES.md](REQUIRED_FILES.md) - Which files to copy and update
- [MESSAGE_FORMAT_GUIDE.md](MESSAGE_FORMAT_GUIDE.md) - Choose between 5 message formats with examples
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup and troubleshooting guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Fix common issues (test button, errors, etc.)
- [Slack Block Kit](https://api.slack.com/block-kit) - Learn about Slack formatting
- [Google Apps Script](https://developers.google.com/apps-script) - Apps Script documentation

## 🤝 Support

For issues:
- Check the [SETUP_GUIDE.md](SETUP_GUIDE.md) troubleshooting section
- Review cell references in your script
- Check execution logs in Apps Script editor

## 📝 License

Free to use and modify for your needs.
