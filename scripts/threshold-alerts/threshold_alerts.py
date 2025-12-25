#!/usr/bin/env python3
"""
Sales Threshold Alerts
Monitors Google Sheets for sales thresholds and sends Slack alerts when targets are hit.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
import pickle

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    import requests
except ImportError:
    print("Required packages not installed. Run: pip install -r requirements.txt")
    exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']


class ThresholdAlerts:
    def __init__(self):
        self.spreadsheet_id = os.getenv('GOOGLE_SHEET_ID')
        self.sheet_name = os.getenv('SHEET_NAME', 'Sales')
        self.slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        self.thresholds_config = os.getenv('THRESHOLDS_CONFIG', 'config/thresholds.json')
        self.credentials_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'config/credentials.json')
        self.token_file = os.getenv('GOOGLE_TOKEN_FILE', 'config/token.pickle')
        self.alert_state_file = os.getenv('ALERT_STATE_FILE', 'config/alert_state.json')
        self.service = None
        self.thresholds = self._load_thresholds()
        self.alert_state = self._load_alert_state()

    def _get_google_credentials(self) -> Optional[Credentials]:
        """Get Google API credentials."""
        creds = None

        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                creds = pickle.load(token)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    logger.error(f"Credentials file not found: {self.credentials_file}")
                    return None
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=0)

            with open(self.token_file, 'wb') as token:
                pickle.dump(creds, token)

        return creds

    def connect_to_sheets(self) -> bool:
        """Connect to Google Sheets API."""
        try:
            creds = self._get_google_credentials()
            if not creds:
                return False
            self.service = build('sheets', 'v4', credentials=creds)
            logger.info("Successfully connected to Google Sheets")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Google Sheets: {e}")
            return False

    def _load_thresholds(self) -> List[Dict]:
        """Load threshold configurations."""
        if os.path.exists(self.thresholds_config):
            try:
                with open(self.thresholds_config, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load thresholds config: {e}")

        # Default thresholds
        return [
            {
                "name": "Monthly Sales Target",
                "metric": "Total Sales",
                "threshold": 100000,
                "comparison": ">=",
                "alert_once": True
            }
        ]

    def _load_alert_state(self) -> Dict:
        """Load alert state to prevent duplicate alerts."""
        if os.path.exists(self.alert_state_file):
            try:
                with open(self.alert_state_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load alert state: {e}")
        return {}

    def _save_alert_state(self):
        """Save alert state."""
        try:
            os.makedirs(os.path.dirname(self.alert_state_file), exist_ok=True)
            with open(self.alert_state_file, 'w') as f:
                json.dump(self.alert_state, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save alert state: {e}")

    def fetch_data(self) -> Optional[Dict[str, any]]:
        """Fetch data from Google Sheet and calculate metrics."""
        if not self.service:
            if not self.connect_to_sheets():
                return None

        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f'{self.sheet_name}!A:Z'
            ).execute()

            values = result.get('values', [])
            if not values:
                logger.warning("No data found in sheet")
                return {}

            headers = values[0]
            rows = values[1:]

            # Calculate metrics
            metrics = self._calculate_metrics(headers, rows)
            logger.info(f"Calculated metrics: {metrics}")
            return metrics

        except Exception as e:
            logger.error(f"Failed to fetch data: {e}")
            return None

    def _calculate_metrics(self, headers: List[str], rows: List[List]) -> Dict:
        """Calculate metrics from sheet data."""
        metrics = {}

        # Try to find common metric columns
        amount_columns = []
        for i, header in enumerate(headers):
            header_lower = header.lower()
            if any(keyword in header_lower for keyword in ['amount', 'value', 'revenue', 'sales']):
                amount_columns.append((i, header))

        # Calculate totals for numeric columns
        for col_idx, col_name in amount_columns:
            total = 0
            count = 0
            for row in rows:
                if col_idx < len(row):
                    try:
                        # Clean the value (remove currency symbols, commas)
                        value = str(row[col_idx]).replace('$', '').replace(',', '').strip()
                        if value:
                            total += float(value)
                            count += 1
                    except (ValueError, AttributeError):
                        continue

            if count > 0:
                metrics[col_name] = total
                metrics[f"{col_name} (Count)"] = count
                metrics[f"{col_name} (Average)"] = total / count

        # Add row count
        metrics["Total Rows"] = len(rows)

        return metrics

    def check_thresholds(self, metrics: Dict) -> List[Dict]:
        """Check if any thresholds have been crossed."""
        triggered_alerts = []

        for threshold in self.thresholds:
            name = threshold['name']
            metric_name = threshold['metric']
            threshold_value = threshold['threshold']
            comparison = threshold.get('comparison', '>=')
            alert_once = threshold.get('alert_once', True)

            # Check if metric exists
            if metric_name not in metrics:
                logger.warning(f"Metric '{metric_name}' not found in data")
                continue

            current_value = metrics[metric_name]

            # Check threshold
            triggered = False
            if comparison == '>=' and current_value >= threshold_value:
                triggered = True
            elif comparison == '>' and current_value > threshold_value:
                triggered = True
            elif comparison == '<=' and current_value <= threshold_value:
                triggered = True
            elif comparison == '<' and current_value < threshold_value:
                triggered = True
            elif comparison == '==' and current_value == threshold_value:
                triggered = True

            if triggered:
                # Check if we should alert
                state_key = f"{name}_{metric_name}_{threshold_value}"
                if alert_once and self.alert_state.get(state_key):
                    logger.info(f"Threshold '{name}' already alerted, skipping")
                    continue

                # Record alert
                triggered_alerts.append({
                    'name': name,
                    'metric': metric_name,
                    'current_value': current_value,
                    'threshold': threshold_value,
                    'comparison': comparison
                })

                # Update state
                if alert_once:
                    self.alert_state[state_key] = {
                        'triggered_at': datetime.now().isoformat(),
                        'value': current_value
                    }

        if triggered_alerts:
            self._save_alert_state()

        return triggered_alerts

    def format_slack_message(self, alerts: List[Dict], metrics: Dict) -> Dict:
        """Format threshold alerts into Slack message."""
        if not alerts:
            return None

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🎯 Sales Threshold Alert!"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Time:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    }
                ]
            },
            {"type": "divider"}
        ]

        for alert in alerts:
            # Format the values nicely
            current = f"${alert['current_value']:,.2f}" if isinstance(alert['current_value'], (int, float)) else str(alert['current_value'])
            threshold = f"${alert['threshold']:,.2f}" if isinstance(alert['threshold'], (int, float)) else str(alert['threshold'])

            alert_text = f"🎉 *{alert['name']}*\n"
            alert_text += f"*{alert['metric']}:* {current}\n"
            alert_text += f"Threshold: {alert['comparison']} {threshold}\n"

            # Calculate percentage if numeric
            if isinstance(alert['current_value'], (int, float)) and isinstance(alert['threshold'], (int, float)):
                if alert['threshold'] > 0:
                    percentage = (alert['current_value'] / alert['threshold']) * 100
                    alert_text += f"Achievement: {percentage:.1f}%"

            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": alert_text
                }
            })

        # Add metrics summary
        summary_text = "*Current Metrics:*\n"
        for key, value in sorted(metrics.items())[:5]:  # Top 5 metrics
            if isinstance(value, (int, float)):
                summary_text += f"• {key}: {value:,.2f}\n"
            else:
                summary_text += f"• {key}: {value}\n"

        blocks.append({"type": "divider"})
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": summary_text
            }
        })

        return {"blocks": blocks}

    def post_to_slack(self, message: Dict) -> bool:
        """Post message to Slack."""
        if not message:
            return True

        try:
            response = requests.post(
                self.slack_webhook_url,
                json=message,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            logger.info("Successfully posted to Slack")
            return True
        except Exception as e:
            logger.error(f"Failed to post to Slack: {e}")
            return False

    def run(self):
        """Main method to check thresholds and send alerts."""
        logger.info("Checking sales thresholds...")

        # Fetch current metrics
        metrics = self.fetch_data()
        if metrics is None:
            logger.error("Failed to fetch data")
            return

        # Check thresholds
        alerts = self.check_thresholds(metrics)

        if alerts:
            logger.info(f"Triggered {len(alerts)} threshold alerts")
            message = self.format_slack_message(alerts, metrics)
            self.post_to_slack(message)
        else:
            logger.info("No thresholds triggered")


def main():
    """Run threshold monitoring."""
    monitor = ThresholdAlerts()
    monitor.run()


if __name__ == "__main__":
    main()
