# Secondary Sales Automation Suite

A collection of automation scripts to streamline sales workflows using Slack, Metabase, and Google Sheets/Slides.

## Overview

This automation suite includes 4 powerful scripts:

1. **Metabase-to-Slack Daily Reports** - Auto-post Metabase query results to Slack
2. **Deal Status Notifier** - Monitor Google Sheets for deal changes and notify team
3. **Sales Threshold Alerts** - Get alerted when sales targets are hit
4. **Screenshot-to-Slides** - Auto-capture Metabase dashboards and add to Google Slides

## Quick Start

### 1. Installation

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd Secondary

# Install Python dependencies
pip install -r requirements.txt

# Install Chrome/Chromium (for screenshot script)
# Ubuntu/Debian:
sudo apt-get install chromium-browser chromium-chromedriver

# macOS:
brew install --cask google-chrome
brew install chromedriver
```

### 2. Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

### 3. Google API Setup

For scripts that use Google Sheets/Slides, you need to set up Google Cloud credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable APIs:
   - Google Sheets API
   - Google Slides API
   - Google Drive API
4. Create credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: "Desktop app"
   - Download the JSON file
5. Save as `config/credentials.json`

### 4. Slack Webhook Setup

1. Go to your Slack workspace settings
2. Navigate to "Apps" → "Incoming Webhooks"
3. Click "Add New Webhook to Workspace"
4. Select the channel for notifications
5. Copy the webhook URL to your `.env` file

## Scripts Documentation

### 1. Metabase-to-Slack Daily Reports

Fetches data from Metabase queries and posts formatted reports to Slack channels.

**Configuration:**
- Edit `config/metabase_reports.json` with your Metabase question IDs
- Set Metabase credentials in `.env`

**Usage:**
```bash
python3 scripts/metabase-slack/metabase_to_slack.py
```

**Schedule with cron:**
```bash
# Daily at 9 AM
0 9 * * * cd /path/to/Secondary && python3 scripts/metabase-slack/metabase_to_slack.py
```

**Example config/metabase_reports.json:**
```json
[
  {
    "question_id": 123,
    "title": "Daily Sales Summary"
  }
]
```

### 2. Deal Status Notifier

Monitors Google Sheets for deal status changes and sends real-time Slack notifications.

**Configuration:**
- Set `GOOGLE_SHEET_ID` in `.env`
- Configure field names: `DEAL_ID_FIELD`, `STATUS_FIELD`
- Set up Google credentials (see Google API Setup)

**Usage:**
```bash
# Run once (check for changes)
python3 scripts/deal-notifier/deal_status_notifier.py

# Run continuously (monitors every 5 minutes)
CONTINUOUS_MODE=true CHECK_INTERVAL=300 python3 scripts/deal-notifier/deal_status_notifier.py
```

**Expected Google Sheet Format:**
| Deal ID | Deal Name | Status | Amount | Owner |
|---------|-----------|--------|--------|-------|
| D-001 | Acme Corp | Negotiation | $50,000 | John |

### 3. Sales Threshold Alerts

Monitors sales metrics in Google Sheets and alerts when thresholds are crossed.

**Configuration:**
- Edit `config/thresholds.json` to set your targets
- Configure Google Sheet ID in `.env`

**Usage:**
```bash
python3 scripts/threshold-alerts/threshold_alerts.py
```

**Schedule with cron:**
```bash
# Check every hour
0 * * * * cd /path/to/Secondary && python3 scripts/threshold-alerts/threshold_alerts.py
```

**Example config/thresholds.json:**
```json
[
  {
    "name": "Monthly Sales Target - $100K",
    "metric": "Amount",
    "threshold": 100000,
    "comparison": ">=",
    "alert_once": true
  }
]
```

**Supported comparisons:** `>=`, `>`, `<=`, `<`, `==`

### 4. Screenshot-to-Slides

Captures screenshots of Metabase dashboards and automatically inserts them into Google Slides.

**Configuration:**
- Edit `config/dashboards.json` with dashboard IDs
- Set `GOOGLE_PRESENTATION_ID` in `.env`
- Ensure Chrome/Chromium is installed

**Usage:**
```bash
cd scripts/screenshot-slides
./run_screenshot.sh
```

**Example config/dashboards.json:**
```json
{
  "dashboards": [
    {
      "id": 1,
      "title": "Sales Overview Dashboard"
    }
  ]
}
```

## Running All Scripts

Run all automation scripts at once:

```bash
./scripts/run_all.sh
```

This runs:
1. Metabase reports
2. Deal notifier
3. Threshold alerts

(Screenshot script runs separately due to its longer execution time)

## Automation with Cron

Set up daily automation:

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily reports at 9 AM
0 9 * * * cd /path/to/Secondary && ./scripts/run_all.sh >> logs/automation.log 2>&1

# Weekly slides update (Monday at 8 AM)
0 8 * * 1 cd /path/to/Secondary/scripts/screenshot-slides && ./run_screenshot.sh >> ../../logs/screenshots.log 2>&1
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `METABASE_URL` | Your Metabase instance URL | For scripts 1, 4 |
| `METABASE_USERNAME` | Metabase login email | For scripts 1, 4 |
| `METABASE_PASSWORD` | Metabase password | For scripts 1, 4 |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | All scripts |
| `GOOGLE_SHEET_ID` | Google Sheet ID from URL | Scripts 2, 3 |
| `GOOGLE_PRESENTATION_ID` | Google Slides ID from URL | Script 4 |
| `SHEET_NAME` | Sheet tab name (default: "Deals") | Scripts 2, 3 |
| `DEAL_ID_FIELD` | Column name for deal ID | Script 2 |
| `STATUS_FIELD` | Column name for status | Script 2 |

## Troubleshooting

### Google Authentication Issues
- Make sure `config/credentials.json` exists
- Delete `config/token.pickle` and re-authenticate
- Check that required APIs are enabled in Google Cloud Console

### Metabase Connection Errors
- Verify `METABASE_URL` is correct (no trailing slash)
- Check username/password are correct
- Ensure Metabase question IDs are accessible to your user

### Chrome/Selenium Issues
- Install Chrome: `sudo apt-get install chromium-browser chromium-chromedriver`
- Check Chrome version matches chromedriver version
- Run in non-headless mode for debugging (edit script)

### Slack Webhook Not Working
- Test webhook URL with curl:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test message"}' \
    YOUR_WEBHOOK_URL
  ```

## Project Structure

```
Secondary/
├── scripts/
│   ├── metabase-slack/
│   │   └── metabase_to_slack.py
│   ├── deal-notifier/
│   │   └── deal_status_notifier.py
│   ├── threshold-alerts/
│   │   └── threshold_alerts.py
│   ├── screenshot-slides/
│   │   ├── screenshot_to_slides.py
│   │   └── run_screenshot.sh
│   └── run_all.sh
├── config/
│   ├── metabase_reports.json
│   ├── thresholds.json
│   ├── dashboards.json
│   └── credentials.json (you create this)
├── temp/
│   └── screenshots/
├── requirements.txt
├── .env (you create this)
├── .env.example
└── README.md
```

## Security Notes

- Never commit `.env` or `config/credentials.json` to version control
- Keep your Slack webhook URLs private
- Use environment variables for sensitive data
- Regularly rotate API credentials

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review script logs for error messages
3. Ensure all dependencies are installed
4. Verify configuration files are valid JSON

## License

MIT
