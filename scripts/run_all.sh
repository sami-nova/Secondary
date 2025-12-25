#!/bin/bash
# Run all automation scripts

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "🚀 Running Sales Automation Scripts..."
echo "======================================"

# 1. Metabase to Slack Reports
echo ""
echo "📊 Running Metabase to Slack Reports..."
python3 scripts/metabase-slack/metabase_to_slack.py

# 2. Deal Status Notifier
echo ""
echo "🔔 Running Deal Status Notifier..."
python3 scripts/deal-notifier/deal_status_notifier.py

# 3. Threshold Alerts
echo ""
echo "🎯 Running Threshold Alerts..."
python3 scripts/threshold-alerts/threshold_alerts.py

echo ""
echo "✅ All automation scripts completed!"
