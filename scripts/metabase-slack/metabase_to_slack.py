#!/usr/bin/env python3
"""
Metabase to Slack Daily Reports
Fetches data from Metabase queries and posts formatted reports to Slack channels.
"""

import os
import requests
import json
from datetime import datetime
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class MetabaseSlackReporter:
    def __init__(self):
        self.metabase_url = os.getenv('METABASE_URL', '').rstrip('/')
        self.metabase_username = os.getenv('METABASE_USERNAME')
        self.metabase_password = os.getenv('METABASE_PASSWORD')
        self.slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        self.session_token = None

    def authenticate_metabase(self) -> bool:
        """Authenticate with Metabase and get session token."""
        try:
            response = requests.post(
                f"{self.metabase_url}/api/session",
                json={
                    "username": self.metabase_username,
                    "password": self.metabase_password
                }
            )
            response.raise_for_status()
            self.session_token = response.json().get('id')
            logger.info("Successfully authenticated with Metabase")
            return True
        except Exception as e:
            logger.error(f"Failed to authenticate with Metabase: {e}")
            return False

    def fetch_query_results(self, question_id: int) -> Optional[Dict]:
        """Fetch results from a Metabase question/query."""
        if not self.session_token:
            if not self.authenticate_metabase():
                return None

        try:
            headers = {"X-Metabase-Session": self.session_token}
            response = requests.get(
                f"{self.metabase_url}/api/card/{question_id}/query",
                headers=headers
            )
            response.raise_for_status()
            logger.info(f"Successfully fetched question {question_id}")
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch question {question_id}: {e}")
            return None

    def format_report(self, data: Dict, title: str) -> Dict:
        """Format Metabase data into Slack message blocks."""
        rows = data.get('data', {}).get('rows', [])
        cols = data.get('data', {}).get('cols', [])

        # Create header
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"📊 {title}"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Generated:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    }
                ]
            },
            {"type": "divider"}
        ]

        # Add data summary
        if rows:
            summary_text = f"*Total Records:* {len(rows)}\n\n"

            # Show first few rows as example
            if len(rows) > 0:
                summary_text += "*Sample Data:*\n"
                for i, row in enumerate(rows[:5]):  # First 5 rows
                    row_text = " | ".join([f"*{cols[j]['display_name']}:* {val}" for j, val in enumerate(row)])
                    summary_text += f"{i+1}. {row_text}\n"

                if len(rows) > 5:
                    summary_text += f"\n_... and {len(rows) - 5} more records_"

            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": summary_text
                }
            })
        else:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "⚠️ No data found for this report"
                }
            })

        return {"blocks": blocks}

    def post_to_slack(self, message: Dict) -> bool:
        """Post formatted message to Slack."""
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

    def run_report(self, question_id: int, title: str) -> bool:
        """Main method to run a report: fetch from Metabase and post to Slack."""
        logger.info(f"Running report: {title}")

        # Fetch data
        data = self.fetch_query_results(question_id)
        if not data:
            return False

        # Format message
        message = self.format_report(data, title)

        # Post to Slack
        return self.post_to_slack(message)


def main():
    """Run configured reports."""
    reporter = MetabaseSlackReporter()

    # Load report configurations from environment or config file
    reports_config = os.getenv('REPORTS_CONFIG', 'config/metabase_reports.json')

    if os.path.exists(reports_config):
        with open(reports_config, 'r') as f:
            reports = json.load(f)

        for report in reports:
            question_id = report.get('question_id')
            title = report.get('title', f'Report {question_id}')
            reporter.run_report(question_id, title)
    else:
        logger.warning(f"No config file found at {reports_config}")
        # Example: run a single report from environment variables
        question_id = os.getenv('METABASE_QUESTION_ID')
        if question_id:
            reporter.run_report(int(question_id), "Daily Sales Report")
        else:
            logger.error("No report configuration found")


if __name__ == "__main__":
    main()
