# Manager Schedule Sheet - Automation Setup Guide

This guide explains how to set up the automated schedule management system for your Google Sheets.

## Features Overview

| Feature | Description |
|---------|-------------|
| **Auto-Coloring** | Cells automatically change color based on selection (Holiday=Yellow, Vacation=Green, etc.) |
| **Monthly Sheet Generator** | One-click creation of new monthly sheets with all formatting and formulas |
| **Email Reminders** | Automated or manual reminders to managers to fill their schedules |
| **Summary Calculations** | Automatic counting of work days, vacations, holidays, and sick days |
| **Coverage Reports** | Generate reports showing staffing levels per day |
| **Regional Summaries** | Statistics grouped by region |

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
3. Done! Your sheet is now automated

---

## Detailed Feature Guide

### Auto-Coloring

Once set up, cells will automatically change color when you select a value:

| Value | Color |
|-------|-------|
| Any time (9:00-18:00, etc.) | White |
| Day off | Blue |
| Holiday | Yellow |
| Vacation | Green |
| Sick Leave | Red |

**To manually apply colors to existing data:**
- Go to **Schedule Manager** > **Formatting** > **Apply Colors to Current Sheet**

---

### Monthly Sheet Generator

Generate new monthly sheets with all formatting, dropdowns, and formulas pre-configured.

**To generate next month's sheet:**
1. Go to **Schedule Manager** > **Monthly Operations** > **Generate Next Month Sheet**

**To generate a specific month:**
1. Go to **Schedule Manager** > **Monthly Operations** > **Generate Specific Month...**
2. Enter the month name (e.g., "March 2026")

**What gets created:**
- All day columns with proper headers (Mon, Jan 15, etc.)
- Manager names, regions, and procedures copied from previous month
- Dropdown menus on all schedule cells
- Summary formulas (Work Days, Vacations, Holidays, Sick Days)
- Weekend columns highlighted
- Frozen header row and manager columns

---

### Email Reminders

Send reminder emails to managers when it's time to fill their schedules.

#### Setting Up Manager Emails

1. Create a new sheet named **"Manager Emails"**
2. Add two columns: **Manager Name** | **Email**
3. Fill in manager names and their email addresses

Example:
| Manager Name | Email |
|--------------|-------|
| Al Abu | al.abu@company.com |
| Passant Elsayed | passant.e@company.com |

#### Sending Manual Reminders

1. Go to **Schedule Manager** > **Reminders** > **Send Reminder to All Managers**
2. Confirm the action

#### Setting Up Automatic Reminders

1. Go to **Schedule Manager** > **Reminders** > **Setup Automatic Reminders**
2. Emails will be sent automatically on the 25th of each month

---

### Reports

#### Monthly Summary Report

Shows statistics grouped by region:
- Total managers per region
- Total work days, vacations, holidays, sick days
- Average work days per manager

**To generate:**
1. Open the month sheet you want to summarize
2. Go to **Schedule Manager** > **Reports** > **Generate Monthly Summary**

#### Coverage Report

Shows staffing levels for each day:
- Number of people working
- Number on vacation, holiday, sick, day off
- Coverage percentage

**To generate:**
1. Open the month sheet
2. Go to **Schedule Manager** > **Reports** > **Generate Coverage Report**

---

## Customization

### Modifying Schedule Options

To change the available dropdown options, edit the `CONFIG.SCHEDULE_OPTIONS` array in the script:

```javascript
SCHEDULE_OPTIONS: [
  '9:00-18:00',
  '9:30-18:30',
  '10:00-19:00',
  // Add your custom times here
  'Day off',
  'Holiday',
  'Vacation',
  'Sick Leave'
],
```

### Modifying Colors

Edit the `CONFIG.COLORS` object:

```javascript
COLORS: {
  HOLIDAY: '#FFEB3B',      // Yellow
  VACATION: '#4CAF50',     // Green
  SICK_LEAVE: '#F44336',   // Red
  DAY_OFF: '#2196F3',      // Blue
  // Change these hex codes as needed
},
```

### Adding New Regions

Edit the `CONFIG.REGIONS` array:

```javascript
REGIONS: ['Arab', 'CZ', 'DE', 'ES', 'FR', 'IL', 'IT', 'PL', 'RO', 'RU', 'TR', 'US'],
```

---

## Troubleshooting

### Menu doesn't appear

1. Make sure you saved the script
2. Refresh the Google Sheet page
3. If still not working, run the `onOpen` function manually from the script editor

### Colors not applying automatically

1. Go to **Schedule Manager** > **Initial Setup** to set up the edit trigger
2. Make sure you authorized all permissions

### Formulas not calculating

1. Go to **Schedule Manager** > **Calculations** > **Add Summary Formulas**
2. Make sure your data is in the expected columns

### Email reminders not sending

1. Check that you have a "Manager Emails" sheet with correct format
2. Make sure email addresses are valid
3. Check that you authorized Gmail permissions

---

## Best Practices

1. **Generate sheets in advance**: Create next month's sheet before the current month ends
2. **Send reminders early**: Set up automatic reminders for the 25th to give managers time
3. **Use the coverage report**: Check staffing levels before approving vacations
4. **Keep manager list updated**: Update the Manager Emails sheet when team changes

---

## Support

For issues or feature requests, contact your system administrator.
