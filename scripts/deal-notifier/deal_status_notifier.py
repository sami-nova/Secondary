#!/usr/bin/env python3
"""
Deal Status Notifier
Monitors Google Sheets for deal status changes and sends Slack notifications.
"""

import os
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
import pickle
from pathlib import Path

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


class DealStatusNotifier:
    def __init__(self):
        self.spreadsheet_id = os.getenv('GOOGLE_SHEET_ID')
        self.sheet_name = os.getenv('SHEET_NAME', 'Deals')
        self.slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        self.state_file = os.getenv('STATE_FILE', 'config/deal_notifier_state.json')
        self.credentials_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'config/credentials.json')
        self.token_file = os.getenv('GOOGLE_TOKEN_FILE', 'config/token.pickle')
        self.service = None
        self.previous_state = self._load_state()

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

    def fetch_deals(self) -> Optional[List[Dict]]:
        """Fetch current deals from Google Sheet."""
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
                return []

            headers = values[0]
            deals = []

            for row in values[1:]:
                # Pad row to match headers length
                row += [''] * (len(headers) - len(row))
                deal = dict(zip(headers, row))
                deals.append(deal)

            logger.info(f"Fetched {len(deals)} deals from sheet")
            return deals

        except Exception as e:
            logger.error(f"Failed to fetch deals: {e}")
            return None

    def _load_state(self) -> Dict:
        """Load previous state from file."""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load state: {e}")
        return {}

    def _save_state(self, state: Dict):
        """Save current state to file."""
        try:
            os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
            with open(self.state_file, 'w') as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save state: {e}")

    def detect_changes(self, current_deals: List[Dict]) -> List[Dict]:
        """Detect changes in deal status."""
        changes = []

        # Create a map of current deals by ID
        deal_id_field = os.getenv('DEAL_ID_FIELD', 'Deal ID')
        status_field = os.getenv('STATUS_FIELD', 'Status')

        current_state = {}
        for deal in current_deals:
            deal_id = deal.get(deal_id_field, '')
            if deal_id:
                current_state[deal_id] = deal

        # Compare with previous state
        for deal_id, current_deal in current_state.items():
            previous_deal = self.previous_state.get(deal_id)
            current_status = current_deal.get(status_field, '')

            if previous_deal:
                previous_status = previous_deal.get(status_field, '')
                if current_status != previous_status and current_status:
                    changes.append({
                        'deal_id': deal_id,
                        'deal': current_deal,
                        'previous_status': previous_status,
                        'current_status': current_status
                    })
            elif current_status:  # New deal
                changes.append({
                    'deal_id': deal_id,
                    'deal': current_deal,
                    'previous_status': 'New',
                    'current_status': current_status
                })

        # Save new state
        self._save_state(current_state)
        self.previous_state = current_state

        return changes

    def format_slack_message(self, changes: List[Dict]) -> Dict:
        """Format changes into Slack message."""
        if not changes:
            return None

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🔔 Deal Status Updates"
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

        for change in changes:
            deal = change['deal']
            deal_name = deal.get('Deal Name', deal.get('Name', 'Unknown'))

            # Determine emoji based on status
            status_emoji = {
                'Won': '🎉',
                'Lost': '😞',
                'Negotiation': '💼',
                'Proposal': '📄',
                'Qualified': '✅',
                'New': '🆕'
            }
            emoji = status_emoji.get(change['current_status'], '📌')

            status_text = f"{emoji} *{deal_name}*\n"
            status_text += f"Status changed: `{change['previous_status']}` → `{change['current_status']}`\n"

            # Add additional deal info
            amount = deal.get('Amount', deal.get('Value', ''))
            if amount:
                status_text += f"💰 Amount: {amount}\n"

            owner = deal.get('Owner', deal.get('Rep', ''))
            if owner:
                status_text += f"👤 Owner: {owner}"

            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": status_text
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
        """Main monitoring loop."""
        logger.info("Starting deal status monitoring...")

        deals = self.fetch_deals()
        if deals is None:
            logger.error("Failed to fetch deals")
            return

        changes = self.detect_changes(deals)

        if changes:
            logger.info(f"Detected {len(changes)} status changes")
            message = self.format_slack_message(changes)
            self.post_to_slack(message)
        else:
            logger.info("No changes detected")


def main():
    """Run the notifier."""
    notifier = DealStatusNotifier()

    # Check if running in continuous mode
    continuous = os.getenv('CONTINUOUS_MODE', 'false').lower() == 'true'
    interval = int(os.getenv('CHECK_INTERVAL', '300'))  # 5 minutes default

    if continuous:
        logger.info(f"Running in continuous mode (checking every {interval} seconds)")
        while True:
            try:
                notifier.run()
                time.sleep(interval)
            except KeyboardInterrupt:
                logger.info("Stopping monitoring...")
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(interval)
    else:
        notifier.run()


if __name__ == "__main__":
    main()
