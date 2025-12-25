# Quick Start Guide

Get your automation scripts running in 10 minutes!

## Step 1: Install Dependencies (2 min)

```bash
pip install -r requirements.txt
```

## Step 2: Configure Environment (3 min)

```bash
# Copy the example file
cp .env.example .env

# Edit with your details
nano .env
```

**Minimum required:**
- `SLACK_WEBHOOK_URL` - Get from Slack → Apps → Incoming Webhooks
- For Google Sheets scripts: `GOOGLE_SHEET_ID` (from the sheet URL)
- For Metabase scripts: `METABASE_URL`, `METABASE_USERNAME`, `METABASE_PASSWORD`

## Step 3: Google API Setup (5 min)

**Only needed for scripts 2, 3, and 4**

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a project
3. Enable APIs: Google Sheets, Google Slides, Google Drive
4. Create OAuth credentials (Desktop app)
5. Download JSON → save as `config/credentials.json`

## Step 4: Test a Script (1 min)

Test the threshold alerts (simplest):

```bash
python3 scripts/threshold-alerts/threshold_alerts.py
```

On first run with Google APIs, you'll be prompted to authorize in your browser.

## What Each Script Needs

### Script 1: Metabase-to-Slack
- Metabase credentials
- Slack webhook
- Edit `config/metabase_reports.json`

### Script 2: Deal Status Notifier
- Google credentials
- Google Sheet ID
- Slack webhook

### Script 3: Threshold Alerts
- Google credentials
- Google Sheet ID
- Slack webhook
- Edit `config/thresholds.json`

### Script 4: Screenshot-to-Slides
- Metabase credentials
- Google credentials
- Google Presentation ID
- Chrome/Chromium installed
- Edit `config/dashboards.json`

## Common Issues

**"ModuleNotFoundError"**
```bash
pip install -r requirements.txt
```

**"credentials.json not found"**
- Download from Google Cloud Console
- Save to `config/credentials.json`

**"Slack webhook failed"**
- Test with: `curl -X POST -d '{"text":"test"}' YOUR_WEBHOOK_URL`

## Next Steps

1. Edit configuration files in `config/`
2. Run scripts manually to test
3. Set up cron jobs for automation (see README.md)
4. Monitor logs for any issues

## Getting Help

See the full [README.md](README.md) for:
- Detailed documentation
- Troubleshooting guide
- Cron job examples
- Security best practices
