# Manager Schedule Sheet - Automation Setup Guide v2.0

This guide explains how to set up the automated schedule management system for your Google Sheets.

## New in Version 2.0

| Feature | Description |
|---------|-------------|
| **Auto-Fill Week Pattern** | Fill Week 1, auto-populate the rest of the month |
| **Slack Notifications** | Send reminders via Slack instead of email |
| **Region-Grouped View** | Visual organization by region with separators |
| **Region Dashboard** | Summary stats per region |
| **More Working Hours** | 20+ shift time options |

---

## Quick Start (5 minutes)

### Step 1: Open Apps Script Editor

1. Open your Google Sheet
2. Go to **Extensions** > **Apps Script**
3. This opens a new tab with the script editor

### Step 2: Add the Script

1. Delete any existing code in the editor
2. Copy the entire contents of `ScheduleAutomation.gs`
3. Paste it into the script editor
4. Click **Save** (Ctrl+S or Cmd+S)
5. Give your project a name (e.g., "Schedule Automation")

### Step 3: Authorize the Script

1. Click **Run** > **Run function** > **onOpen**
2. A dialog will ask for permissions - click **Review Permissions**
3. Select your Google account
4. Click **Advanced** > **Go to Schedule Automation (unsafe)**
5. Click **Allow**

### Step 4: Refresh Your Spreadsheet

1. Go back to your Google Sheet
2. Refresh the page (F5 or Ctrl+R)
3. You should see a new menu called **"Schedule Manager"**

### Step 5: Run Initial Setup

1. Click **Schedule Manager** > **Initial Setup**
2. Click **Yes** when prompted
3. Configure Slack webhook in the Settings sheet
4. Done!

---

## Auto-Fill Week Pattern (New!)

This is the fastest way to fill schedules. Managers only need to fill **Week 1 (7 days)**, and the script copies that pattern to the rest of the month.

### How It Works

```
Week 1:  Mon | Tue | Wed | Thu | Fri | Sat | Sun
         9-18  9-18  9-18  9-18  9-18  Off   Off

Auto-fills to:
Week 2:  Mon | Tue | Wed | Thu | Fri | Sat | Sun
         9-18  9-18  9-18  9-18  9-18  Off   Off
Week 3:  (same pattern)
Week 4:  (same pattern)
```

### Using Auto-Fill

**Option 1: Fill All Managers**
1. Make sure all managers have filled their first week
2. Go to **Schedule Manager** > **Auto-Fill** > **Fill Month from First Week**
3. Confirm - all empty cells will be populated

**Option 2: Fill One Manager**
1. Click on any cell in that manager's row
2. Go to **Schedule Manager** > **Auto-Fill** > **Fill Selected Row from First Week**
3. Only that manager's row will be filled

### Important Notes

- Only fills empty cells (won't overwrite existing data)
- Vacations/holidays in Week 1 will repeat (adjust manually after)
- Works best when schedule is consistent week-to-week

---

## Slack Notifications

### Setting Up Slack Webhook

1. Go to https://api.slack.com/apps
2. Click **Create New App** > **From scratch**
3. Name it "Schedule Reminders" and select your workspace
4. Go to **Incoming Webhooks** > Turn it ON
5. Click **Add New Webhook to Workspace**
6. Select the channel for reminders
7. Copy the Webhook URL

### Adding Webhook to Google Sheets

**Method 1: Via Menu**
1. Go to **Schedule Manager** > **Slack Notifications** > **Setup Slack Webhook...**
2. Paste your webhook URL
3. Click OK

**Method 2: Via Settings Sheet**
1. Go to **Schedule Manager** > **Settings**
2. Paste the webhook URL in cell B2

### Testing Connection

1. Go to **Schedule Manager** > **Slack Notifications** > **Test Slack Connection**
2. Check your Slack channel for the test message

### Sending Reminders

**Manual Reminder:**
- Go to **Schedule Manager** > **Slack Notifications** > **Send Reminder to All**

**Automatic Monthly Reminder:**
1. Go to **Schedule Manager** > **Slack Notifications** > **Setup Auto Reminders (25th)**
2. Reminders will be sent on the 25th of each month at 9 AM

### Sample Slack Message

```
📅 Schedule Reminder

Please fill in your schedule for February 2026

Don't forget to complete your working hours, days off, vacations, and holidays.

📊 Schedule Sheet: Click here to open

⚠️ Managers with incomplete schedules:
• John Smith (15 days)
• Jane Doe (10 days)

💡 Tip: Fill in Week 1, then use Auto-Fill to populate the rest!
```

---

## Region-Grouped Views

### Generate Region View

Creates a new sheet with managers visually grouped by region:

1. Open your schedule month sheet
2. Go to **Schedule Manager** > **Monthly Operations** > **Generate Region View**

This creates a sheet like:
```
▼ Arab Region (Arab) - 3 managers
  Al Abu        | Arab | Killer Base...
  Passant       | Arab | Care Calls...
  Abdalkarim    | Arab | Churn...
─────────────────────────────────────
▼ Czech Republic (CZ) - 1 manager
  Anastasia     | CZ   | Churn...
─────────────────────────────────────
```

### Group Current Sheet by Region

Sorts the current sheet by region and applies color coding:

1. Go to **Schedule Manager** > **Formatting** > **Group by Region**

Each region gets a subtle background color for the manager info columns.

### Region Dashboard

Generates a summary dashboard showing stats per region:

1. Go to **Schedule Manager** > **Reports** > **Generate Region Dashboard**

---

## Working Hours Options

The dropdown now includes these shift times:

| Shift | Hours |
|-------|-------|
| 8:00-17:00 | 9 hours |
| 9:00-13:00 | 4 hours (half day) |
| 9:00-17:00 | 8 hours |
| 9:00-17:30 | 8.5 hours |
| 9:00-18:00 | 9 hours |
| 9:30-17:30 | 8 hours |
| 9:30-18:30 | 9 hours |
| 10:00-14:00 | 4 hours (half day) |
| 10:00-18:00 | 8 hours |
| 10:00-19:00 | 9 hours |
| 10:30-19:00 | 8.5 hours |
| 10:30-19:30 | 9 hours |
| 11:00-19:00 | 8 hours |
| 11:00-20:00 | 9 hours |
| 12:00-20:00 | 8 hours |
| 12:00-21:00 | 9 hours |
| 13:00-21:00 | 8 hours |
| 13:00-22:00 | 9 hours |
| 15:00-17:00 | 2 hours |
| 16:00-01:00 | 9 hours (night) |
| 17:00-01:00 | 8 hours (night) |

Plus: Day off, Holiday, Vacation, Sick Leave

---

## Color Coding

| Status | Color | Hex Code |
|--------|-------|----------|
| Work Hours | White | #FFFFFF |
| Day Off | Light Blue | #BBDEFB |
| Holiday | Light Yellow | #FFF9C4 |
| Vacation | Light Green | #C8E6C9 |
| Sick Leave | Light Red | #FFCDD2 |
| Empty | Light Gray | #F5F5F5 |
| Weekend Header | Light Orange | #FFF3E0 |

### Region Colors

Each region has a subtle tint for the manager info columns:

| Region | Color |
|--------|-------|
| Arab | Light Blue |
| CZ | Light Purple |
| DE | Light Green |
| ES | Light Amber |
| FR | Light Cyan |
| IL | Light Pink |
| IT | Light Lime |
| PL | Light Deep Purple |
| RO | Light Indigo |
| RU | Light Brown |
| TR | Light Red |

---

## Reports

### Monthly Summary

Shows statistics grouped by region:
- Total managers per region
- Total work days, vacations, holidays, sick days
- Average work days per manager

### Coverage Report

Shows daily staffing levels:
- Number of people working each day
- Number on vacation, holiday, sick, day off
- Coverage percentage

### Region Dashboard

Visual dashboard with:
- Each region in a separate section
- Individual manager stats
- Region totals

---

## Troubleshooting

### Auto-Fill not working

1. Make sure the first 7 days (Week 1) have data
2. Check that empty cells exist to fill
3. Ensure you're on a month sheet (not a report)

### Slack messages not sending

1. Verify webhook URL starts with `https://hooks.slack.com`
2. Test the connection first
3. Check that the Slack app is installed in your workspace

### Region colors not showing

1. Run **Schedule Manager** > **Formatting** > **Group by Region**
2. Or regenerate the month sheet

### Menu not appearing

1. Refresh the Google Sheet page
2. Run `onOpen` function manually from Apps Script
3. Re-authorize permissions if prompted

---

## Best Practices

1. **Use Auto-Fill**: Have managers fill only Week 1, then auto-fill the rest
2. **Send Slack reminders early**: Use the 25th reminder to give managers time
3. **Generate Region View**: Use for easier visual review by team leads
4. **Check Coverage Report**: Before approving vacation requests
5. **Keep Settings updated**: Update Slack webhook if channel changes

---

## Menu Reference

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
│   ├── Apply Colors to Current Sheet
│   ├── Refresh Dropdowns
│   ├── Format Headers
│   └── Group by Region
├── 📊 Calculations
│   ├── Recalculate All Summaries
│   └── Add Summary Formulas
├── 💬 Slack Notifications
│   ├── Send Reminder to All
│   ├── Setup Slack Webhook...
│   ├── Test Slack Connection
│   ├── Setup Auto Reminders (25th)
│   └── Remove Auto Reminders
├── 📈 Reports
│   ├── Generate Monthly Summary
│   ├── Generate Coverage Report
│   └── Generate Region Dashboard
├── ⚙️ Settings
└── ❓ Help
```
