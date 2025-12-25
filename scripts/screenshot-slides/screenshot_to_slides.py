#!/usr/bin/env python3
"""
Screenshot to Slides
Captures screenshots of Metabase dashboards and inserts them into Google Slides presentations.
"""

import os
import json
import logging
import time
import pickle
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    import requests
except ImportError:
    print("Required packages not installed. Run: pip install -r requirements.txt")
    exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SCOPES = [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive.file'
]


class ScreenshotToSlides:
    def __init__(self):
        self.metabase_url = os.getenv('METABASE_URL', '').rstrip('/')
        self.metabase_username = os.getenv('METABASE_USERNAME')
        self.metabase_password = os.getenv('METABASE_PASSWORD')
        self.presentation_id = os.getenv('GOOGLE_PRESENTATION_ID')
        self.credentials_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'config/credentials.json')
        self.token_file = os.getenv('GOOGLE_TOKEN_FILE', 'config/slides_token.pickle')
        self.screenshots_dir = os.getenv('SCREENSHOTS_DIR', 'temp/screenshots')
        self.driver = None
        self.slides_service = None
        self.drive_service = None

        # Create screenshots directory
        os.makedirs(self.screenshots_dir, exist_ok=True)

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

    def connect_to_google_apis(self) -> bool:
        """Connect to Google Slides and Drive APIs."""
        try:
            creds = self._get_google_credentials()
            if not creds:
                return False

            self.slides_service = build('slides', 'v1', credentials=creds)
            self.drive_service = build('drive', 'v3', credentials=creds)
            logger.info("Successfully connected to Google APIs")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Google APIs: {e}")
            return False

    def setup_driver(self) -> bool:
        """Setup Selenium WebDriver for screenshots."""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--disable-gpu')

            # Use system Chrome/Chromium
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info("Successfully initialized Chrome WebDriver")
            return True
        except Exception as e:
            logger.error(f"Failed to setup WebDriver: {e}")
            logger.error("Make sure Chrome/Chromium and chromedriver are installed")
            return False

    def login_to_metabase(self) -> bool:
        """Login to Metabase."""
        try:
            logger.info("Logging into Metabase...")
            self.driver.get(f"{self.metabase_url}/auth/login")

            # Wait for login form
            wait = WebDriverWait(self.driver, 10)
            username_field = wait.until(
                EC.presence_of_element_located((By.NAME, "username"))
            )

            # Enter credentials
            username_field.send_keys(self.metabase_username)
            password_field = self.driver.find_element(By.NAME, "password")
            password_field.send_keys(self.metabase_password)

            # Submit form
            password_field.submit()

            # Wait for redirect after login
            time.sleep(3)

            logger.info("Successfully logged into Metabase")
            return True
        except Exception as e:
            logger.error(f"Failed to login to Metabase: {e}")
            return False

    def capture_dashboard_screenshot(self, dashboard_id: int, output_path: str) -> bool:
        """Capture screenshot of Metabase dashboard."""
        try:
            logger.info(f"Capturing dashboard {dashboard_id}...")

            # Navigate to dashboard
            self.driver.get(f"{self.metabase_url}/dashboard/{dashboard_id}")

            # Wait for dashboard to load
            wait = WebDriverWait(self.driver, 20)
            wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "DashCard"))
            )

            # Extra wait for data to load
            time.sleep(5)

            # Take screenshot
            self.driver.save_screenshot(output_path)
            logger.info(f"Screenshot saved to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to capture screenshot: {e}")
            return False

    def upload_image_to_drive(self, image_path: str) -> Optional[str]:
        """Upload image to Google Drive and return its URL."""
        try:
            file_metadata = {
                'name': os.path.basename(image_path),
                'mimeType': 'image/png'
            }

            media = MediaFileUpload(image_path, mimetype='image/png', resumable=True)

            file = self.drive_service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webContentLink'
            ).execute()

            # Make the file publicly accessible
            self.drive_service.permissions().create(
                fileId=file['id'],
                body={'type': 'anyone', 'role': 'reader'}
            ).execute()

            logger.info(f"Image uploaded to Drive: {file['id']}")
            return file['id']
        except Exception as e:
            logger.error(f"Failed to upload image to Drive: {e}")
            return None

    def add_slide_with_image(self, image_path: str, title: str, slide_index: Optional[int] = None) -> bool:
        """Add a new slide with an image to the presentation."""
        try:
            # Get presentation to determine slide count
            presentation = self.slides_service.presentations().get(
                presentationId=self.presentation_id
            ).execute()

            slides = presentation.get('slides', [])

            # Create new slide
            requests_batch = [
                {
                    'createSlide': {
                        'insertionIndex': slide_index if slide_index is not None else len(slides),
                        'slideLayoutReference': {
                            'predefinedLayout': 'BLANK'
                        }
                    }
                }
            ]

            response = self.slides_service.presentations().batchUpdate(
                presentationId=self.presentation_id,
                body={'requests': requests_batch}
            ).execute()

            # Get the new slide's object ID
            slide_id = response['replies'][0]['createSlide']['objectId']

            # Upload image to Drive
            image_file_id = self.upload_image_to_drive(image_path)
            if not image_file_id:
                return False

            # Add title and image to slide
            page_width = 9144000  # 9.144 inches in EMUs (1 inch = 914400 EMUs)
            page_height = 5143500  # 5.1435 inches in EMUs

            requests_batch = [
                # Add title text box
                {
                    'createShape': {
                        'objectId': f'title_{slide_id}',
                        'shapeType': 'TEXT_BOX',
                        'elementProperties': {
                            'pageObjectId': slide_id,
                            'size': {
                                'width': {'magnitude': page_width, 'unit': 'EMU'},
                                'height': {'magnitude': 500000, 'unit': 'EMU'}
                            },
                            'transform': {
                                'scaleX': 1,
                                'scaleY': 1,
                                'translateX': 0,
                                'translateY': 200000,
                                'unit': 'EMU'
                            }
                        }
                    }
                },
                # Insert title text
                {
                    'insertText': {
                        'objectId': f'title_{slide_id}',
                        'text': title
                    }
                },
                # Add image
                {
                    'createImage': {
                        'url': f'https://drive.google.com/uc?id={image_file_id}',
                        'elementProperties': {
                            'pageObjectId': slide_id,
                            'size': {
                                'width': {'magnitude': 8000000, 'unit': 'EMU'},
                                'height': {'magnitude': 4500000, 'unit': 'EMU'}
                            },
                            'transform': {
                                'scaleX': 1,
                                'scaleY': 1,
                                'translateX': 570000,
                                'translateY': 900000,
                                'unit': 'EMU'
                            }
                        }
                    }
                }
            ]

            self.slides_service.presentations().batchUpdate(
                presentationId=self.presentation_id,
                body={'requests': requests_batch}
            ).execute()

            logger.info(f"Successfully added slide with image: {title}")
            return True

        except Exception as e:
            logger.error(f"Failed to add slide with image: {e}")
            return False

    def process_dashboards(self, dashboards: List[Dict]) -> int:
        """Process multiple dashboards and add them to slides."""
        success_count = 0

        for dashboard in dashboards:
            dashboard_id = dashboard.get('id')
            title = dashboard.get('title', f'Dashboard {dashboard_id}')

            # Generate screenshot path
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            screenshot_path = os.path.join(
                self.screenshots_dir,
                f'dashboard_{dashboard_id}_{timestamp}.png'
            )

            # Capture screenshot
            if self.capture_dashboard_screenshot(dashboard_id, screenshot_path):
                # Add to slides
                if self.add_slide_with_image(screenshot_path, title):
                    success_count += 1

                # Clean up screenshot
                try:
                    os.remove(screenshot_path)
                except:
                    pass

            # Small delay between dashboards
            time.sleep(2)

        return success_count

    def run(self, dashboards_config: str):
        """Main method to capture dashboards and create slides."""
        logger.info("Starting screenshot to slides process...")

        # Load dashboards configuration
        if not os.path.exists(dashboards_config):
            logger.error(f"Dashboards config not found: {dashboards_config}")
            return

        with open(dashboards_config, 'r') as f:
            config = json.load(f)

        dashboards = config.get('dashboards', [])
        if not dashboards:
            logger.error("No dashboards configured")
            return

        # Setup
        if not self.connect_to_google_apis():
            return

        if not self.setup_driver():
            return

        try:
            # Login to Metabase
            if not self.login_to_metabase():
                return

            # Process dashboards
            success_count = self.process_dashboards(dashboards)

            logger.info(f"Successfully processed {success_count}/{len(dashboards)} dashboards")

        finally:
            # Cleanup
            if self.driver:
                self.driver.quit()

    def __del__(self):
        """Cleanup driver on deletion."""
        if hasattr(self, 'driver') and self.driver:
            try:
                self.driver.quit()
            except:
                pass


def main():
    """Run the screenshot to slides tool."""
    config_file = os.getenv('DASHBOARDS_CONFIG', 'config/dashboards.json')

    tool = ScreenshotToSlides()
    tool.run(config_file)


if __name__ == "__main__":
    main()
