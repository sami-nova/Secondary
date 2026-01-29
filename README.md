# Secondary Sales - Manager Schedule Automation v2.0

Automation tools for the Secondary Sales team's manager schedule management in Google Sheets.

## What's New in v2.0

- **Auto-Fill Week Pattern**: Fill Week 1 only, auto-populate the rest of the month
- **Slack Notifications**: Reminders via Slack instead of email
- **Region-Grouped Views**: Visual organization by region
- **Region Dashboard**: Summary stats per region
- **20+ Working Hours Options**: More shift time choices

## Features

| Feature | Description |
|---------|-------------|
| **Auto-Fill** | Fill Week 1, auto-populate remaining weeks |
| **Auto-Coloring** | Cells color-code based on schedule type |
| **Slack Reminders** | Send reminders to Slack channel |
| **Monthly Generator** | One-click creation of formatted monthly sheets |
| **Region Views** | Group and visualize managers by region |
| **Summary Calculations** | Automatic counting of work days, vacations, etc. |
| **Coverage Reports** | Daily staffing level reports |
| **Region Dashboard** | Statistics grouped by region |

## Color Coding

| Status | Color |
|--------|-------|
| Work Hours | White |
| Day Off | Light Blue |
| Holiday | Light Yellow |
| Vacation | Light Green |
| Sick Leave | Light Red |

## Files

- `ScheduleAutomation.gs` - Main Google Apps Script (v2.0)
- `SETUP_GUIDE.md` - Step-by-step installation and usage guide
- `ConditionalFormattingRules.md` - No-code alternative

## Quick Start

1. Open your Google Sheet
2. Go to **Extensions** > **Apps Script**
3. Copy contents of `ScheduleAutomation.gs` into the editor
4. Save and refresh your spreadsheet
5. Use the **Schedule Manager** menu > **Initial Setup**
6. Configure Slack webhook in Settings sheet

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

## Key Workflows

### For Managers (Filling Schedules)
1. Fill in Week 1 (first 7 days) with your schedule
2. Ask admin to run Auto-Fill, or it fills automatically
3. Adjust any exceptions (vacations, holidays) manually

### For Admins (Managing Schedules)
1. Generate next month's sheet
2. Send Slack reminder to all managers
3. Run Auto-Fill after managers complete Week 1
4. Generate reports for coverage analysis

## Menu Structure

```
📅 Schedule Manager
├── 🚀 Initial Setup
├── 📆 Monthly Operations
│   ├── Generate Next Month Sheet
│   ├── Generate Specific Month...
│   └── Generate Region View
├── 🔄 Auto-Fill
│   ├── Fill Month from First Week
│   └── Fill Selected Row from First Week
├── 🎨 Formatting
├── 📊 Calculations
├── 💬 Slack Notifications
│   ├── Send Reminder to All
│   ├── Setup Slack Webhook...
│   ├── Test Slack Connection
│   └── Setup Auto Reminders (25th)
├── 📈 Reports
│   ├── Generate Monthly Summary
│   ├── Generate Coverage Report
│   └── Generate Region Dashboard
├── ⚙️ Settings
└── ❓ Help
```

## Requirements

- Google Sheets
- Permission to add Apps Script
- Slack workspace (for notifications)
- Slack Incoming Webhook URL
