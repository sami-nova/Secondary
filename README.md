# Secondary Sales - Manager Schedule Automation

Automation tools for the Secondary Sales team's manager schedule management in Google Sheets.

## Overview

This repository contains automation scripts and documentation to improve the manager scheduling workflow in Google Sheets.

## Features

| Feature | Description |
|---------|-------------|
| **Auto-Coloring** | Cells automatically color-code based on schedule type |
| **Monthly Sheet Generator** | One-click creation of formatted monthly sheets |
| **Email Reminders** | Automated reminders for managers to fill schedules |
| **Summary Calculations** | Automatic counting of work days, vacations, holidays |
| **Coverage Reports** | Daily staffing level reports |
| **Regional Summaries** | Statistics grouped by region |

## Color Coding

| Status | Color |
|--------|-------|
| Work Hours | White |
| Day Off | Blue |
| Holiday | Yellow |
| Vacation | Green |
| Sick Leave | Red |

## Files

- `ScheduleAutomation.gs` - Main Google Apps Script with all automation features
- `SETUP_GUIDE.md` - Step-by-step installation and usage guide
- `ConditionalFormattingRules.md` - No-code alternative using conditional formatting

## Quick Start

1. Open your Google Sheet
2. Go to **Extensions** > **Apps Script**
3. Copy contents of `ScheduleAutomation.gs` into the editor
4. Save and refresh your spreadsheet
5. Use the new **Schedule Manager** menu to run **Initial Setup**

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

## Automation Capabilities

### Automatic Features (after setup)
- Color changes when dropdown values are selected
- Summary formulas calculate totals automatically
- Weekend columns highlighted

### Manual Triggers (from menu)
- Generate new monthly sheets
- Send email reminders
- Generate reports

### Scheduled Features (optional)
- Automatic monthly reminder emails on the 25th

## Requirements

- Google Sheets
- Permission to add Apps Script
- (Optional) Gmail access for email reminders
