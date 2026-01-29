/**
 * Manager Schedule Automation Script v2.0
 *
 * Features:
 * - Auto-coloring based on dropdown selections
 * - Monthly sheet generation with region grouping
 * - Slack notifications for reminders
 * - Auto-fill week pattern (fill first week, auto-populate rest)
 * - Summary calculations and reports
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the project (Ctrl+S)
 * 5. Refresh your Google Sheet - you'll see a new "Schedule Manager" menu
 * 6. Run initial setup from the menu
 * 7. Configure Slack webhook URL in the Settings sheet
 */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Column indices (1-based)
  MANAGER_NAME_COL: 1,      // Column A
  REGION_COL: 2,            // Column B
  PROCEDURES_COL: 3,        // Column C
  SCHEDULE_START_COL: 4,    // Column D (first day column)

  // Data row settings
  HEADER_ROW: 1,
  DATA_START_ROW: 2,

  // Color coding (hex colors)
  COLORS: {
    HOLIDAY: '#FFF9C4',      // Light Yellow
    VACATION: '#C8E6C9',     // Light Green
    SICK_LEAVE: '#FFCDD2',   // Light Red
    DAY_OFF: '#BBDEFB',      // Light Blue
    WORK_HOURS: '#FFFFFF',   // White
    HEADER: '#1565C0',       // Dark blue for headers
    HEADER_TEXT: '#FFFFFF',  // White text for headers
    WEEKEND: '#FFF3E0',      // Light orange for weekends
    EMPTY: '#F5F5F5',        // Light gray for empty
    REGION_HEADER: '#37474F', // Dark gray for region headers
    REGION_SEPARATOR: '#ECEFF1' // Light gray for region separators
  },

  // Updated schedule options based on your dropdown
  SCHEDULE_OPTIONS: [
    '9:00-18:00',
    '9:00-17:00',
    '9:00-17:30',
    '9:00-13:00',
    '9:30-17:30',
    '9:30-18:30',
    '10:00-18:00',
    '10:00-19:00',
    '10:00-14:00',
    '10:30-19:00',
    '10:30-19:30',
    '11:00-19:00',
    '11:00-20:00',
    '12:00-20:00',
    '12:00-21:00',
    '13:00-21:00',
    '13:00-22:00',
    '15:00-17:00',
    '16:00-01:00',
    '17:00-01:00',
    '8:00-17:00',
    'Day off',
    'Holiday',
    'Vacation',
    'Sick Leave'
  ],

  // Region options with display order
  REGIONS: [
    { code: 'Arab', name: 'Arab Region', color: '#E3F2FD' },
    { code: 'CZ', name: 'Czech Republic', color: '#F3E5F5' },
    { code: 'DE', name: 'Germany', color: '#E8F5E9' },
    { code: 'ES', name: 'Spain', color: '#FFF8E1' },
    { code: 'FR', name: 'France', color: '#E0F7FA' },
    { code: 'IL', name: 'Israel', color: '#FCE4EC' },
    { code: 'IT', name: 'Italy', color: '#F1F8E9' },
    { code: 'PL', name: 'Poland', color: '#EDE7F6' },
    { code: 'RO', name: 'Romania', color: '#E8EAF6' },
    { code: 'RU', name: 'Russia', color: '#EFEBE9' },
    { code: 'TR', name: 'Turkey', color: '#FFEBEE' }
  ],

  // Procedure options
  PROCEDURES: [
    'Killer Base',
    'Refunds',
    'Care Calls',
    'Churn Prevention',
    'NPS',
    'KB',
    'Killer Base, Refunds',
    'Care Calls, Churn Prevention',
    'Churn Prevention, Refunds',
    'Care Calls, Killer Base',
    'Refunds, Care Calls, Killer Base',
    'Churn Prevention, KB, Care Calls, NPS',
    'Killer Base, Churn Prevention',
    'Churn Prevention, Killer Base, Refunds',
    'Care Calls, Churn Prevention, NPS'
  ],

  // Summary columns
  SUMMARY_COLUMNS: ['Work Days', 'Vacations', 'Holidays', 'Sick Days']
};


// ============================================
// MENU AND INITIALIZATION
// ============================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📅 Schedule Manager')
    .addItem('🚀 Initial Setup', 'initialSetup')
    .addSeparator()
    .addSubMenu(ui.createMenu('📆 Monthly Operations')
      .addItem('Generate Next Month Sheet', 'generateNextMonthSheet')
      .addItem('Generate Specific Month...', 'promptGenerateMonth')
      .addItem('Generate Region View', 'generateRegionView'))
    .addSubMenu(ui.createMenu('🔄 Auto-Fill')
      .addItem('Fill Month from First Week', 'autoFillFromFirstWeek')
      .addItem('Fill Selected Row from First Week', 'autoFillSelectedRow'))
    .addSubMenu(ui.createMenu('🎨 Formatting')
      .addItem('Apply Colors to Current Sheet', 'applyColorsToCurrentSheet')
      .addItem('Refresh Dropdowns', 'refreshDropdowns')
      .addItem('Format Headers', 'formatHeadersMenu')
      .addItem('Group by Region', 'groupByRegion'))
    .addSubMenu(ui.createMenu('📊 Calculations')
      .addItem('Recalculate All Summaries', 'recalculateAllSummaries')
      .addItem('Add Summary Formulas', 'addSummaryFormulas'))
    .addSubMenu(ui.createMenu('💬 Slack Notifications')
      .addItem('Send Reminder to All', 'sendSlackReminderToAll')
      .addItem('Setup Slack Webhook...', 'setupSlackWebhook')
      .addItem('Test Slack Connection', 'testSlackConnection')
      .addItem('Setup Auto Reminders (25th)', 'setupAutomaticReminders')
      .addItem('Remove Auto Reminders', 'removeAutomaticReminders'))
    .addSubMenu(ui.createMenu('📈 Reports')
      .addItem('Generate Monthly Summary', 'generateMonthlySummary')
      .addItem('Generate Coverage Report', 'generateCoverageReport')
      .addItem('Generate Region Dashboard', 'generateRegionDashboard'))
    .addSeparator()
    .addItem('⚙️ Settings', 'openSettings')
    .addItem('❓ Help', 'showHelp')
    .addToUi();
}

function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const row = range.getRow();
  const col = range.getColumn();

  // Skip header rows and non-schedule columns
  if (row < CONFIG.DATA_START_ROW || col < CONFIG.SCHEDULE_START_COL) return;

  // Skip summary columns
  const lastCol = sheet.getLastColumn();
  if (col > lastCol - CONFIG.SUMMARY_COLUMNS.length) return;

  // Apply color
  const value = e.value;
  applyColorToCell(range, value);
}


// ============================================
// INITIAL SETUP
// ============================================

function initialSetup() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Initial Setup',
    'This will:\n' +
    '1. Create a Settings sheet for Slack webhook\n' +
    '2. Set up automatic color formatting\n' +
    '3. Format the current sheet\n' +
    '4. Apply dropdowns and formulas\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  try {
    createSettingsSheet();
    setupEditTrigger();

    const sheet = SpreadsheetApp.getActiveSheet();
    formatHeaders(sheet);
    applyDropdownsToSheet(sheet);
    addSummaryFormulas();
    applyColorsToCurrentSheet();

    ui.alert('Setup Complete!',
      'Initial setup completed successfully!\n\n' +
      'Next steps:\n' +
      '1. Go to Settings sheet to configure Slack webhook\n' +
      '2. Use "Auto-Fill" to populate schedules quickly',
      ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Setup failed: ' + error.message, ui.ButtonSet.OK);
  }
}

function createSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Settings');

  if (!sheet) {
    sheet = ss.insertSheet('Settings');

    // Headers
    sheet.getRange('A1:B1').setValues([['Setting', 'Value']]);
    sheet.getRange('A1:B1')
      .setBackground(CONFIG.COLORS.HEADER)
      .setFontColor(CONFIG.COLORS.HEADER_TEXT)
      .setFontWeight('bold');

    // Settings
    const settings = [
      ['Slack Webhook URL', ''],
      ['Slack Channel', '#schedule-reminders'],
      ['Reminder Day of Month', '25'],
      ['Auto-fill Default Pattern', 'Copy Week 1']
    ];
    sheet.getRange(2, 1, settings.length, 2).setValues(settings);

    // Instructions
    sheet.getRange('D1').setValue('Instructions');
    sheet.getRange('D1').setFontWeight('bold');
    sheet.getRange('D2:D6').setValues([
      ['1. Create a Slack Incoming Webhook at: https://api.slack.com/apps'],
      ['2. Copy the webhook URL and paste it in cell B2'],
      ['3. The channel in B3 is for display purposes only'],
      ['4. Reminders will be sent on the day specified in B4'],
      ['5. Save and test the connection from the menu']
    ]);

    sheet.autoResizeColumns(1, 4);
    sheet.setColumnWidth(4, 400);
  }

  return sheet;
}

function setupEditTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditInstallable') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('onEditInstallable')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
}

function onEditInstallable(e) {
  onEdit(e);
}


// ============================================
// AUTO-FILL WEEK PATTERN
// ============================================

/**
 * Fills the entire month based on the first week's pattern
 */
function autoFillFromFirstWeek() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();

  const response = ui.alert(
    'Auto-Fill Month',
    'This will copy Week 1 (first 7 days) pattern to all remaining weeks for ALL managers.\n\n' +
    'Make sure the first week is filled correctly before proceeding.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const scheduleEndCol = lastCol - CONFIG.SUMMARY_COLUMNS.length;
  const daysInMonth = scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1;

  if (daysInMonth < 7) {
    ui.alert('Error', 'Not enough days in schedule. Need at least 7 days.', ui.ButtonSet.OK);
    return;
  }

  let filledCount = 0;

  for (let row = CONFIG.DATA_START_ROW; row <= lastRow; row++) {
    // Skip region header rows (check if column A has region-like content)
    const managerName = sheet.getRange(row, CONFIG.MANAGER_NAME_COL).getValue();
    if (!managerName || isRegionHeader(managerName)) continue;

    // Get first week pattern (7 days)
    const firstWeekRange = sheet.getRange(row, CONFIG.SCHEDULE_START_COL, 1, 7);
    const firstWeekValues = firstWeekRange.getValues()[0];

    // Check if first week has data
    const hasData = firstWeekValues.some(v => v !== '');
    if (!hasData) continue;

    // Fill remaining weeks
    for (let dayIndex = 7; dayIndex < daysInMonth; dayIndex++) {
      const patternIndex = dayIndex % 7;
      const targetCol = CONFIG.SCHEDULE_START_COL + dayIndex;
      const currentValue = sheet.getRange(row, targetCol).getValue();

      // Only fill if cell is empty
      if (!currentValue) {
        sheet.getRange(row, targetCol).setValue(firstWeekValues[patternIndex]);
      }
    }
    filledCount++;
  }

  // Apply colors
  applyColorsToCurrentSheet();

  ui.alert('Complete', `Auto-filled schedules for ${filledCount} managers based on Week 1 pattern.`, ui.ButtonSet.OK);
}

/**
 * Fills only the selected row based on its first week
 */
function autoFillSelectedRow() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const selection = sheet.getActiveRange();
  const row = selection.getRow();

  if (row < CONFIG.DATA_START_ROW) {
    ui.alert('Error', 'Please select a manager row (not the header).', ui.ButtonSet.OK);
    return;
  }

  const managerName = sheet.getRange(row, CONFIG.MANAGER_NAME_COL).getValue();

  const response = ui.alert(
    'Auto-Fill Row',
    `Fill remaining weeks for "${managerName}" based on Week 1 pattern?`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const lastCol = sheet.getLastColumn();
  const scheduleEndCol = lastCol - CONFIG.SUMMARY_COLUMNS.length;
  const daysInMonth = scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1;

  // Get first week pattern
  const firstWeekRange = sheet.getRange(row, CONFIG.SCHEDULE_START_COL, 1, 7);
  const firstWeekValues = firstWeekRange.getValues()[0];

  // Fill remaining weeks
  let filledCells = 0;
  for (let dayIndex = 7; dayIndex < daysInMonth; dayIndex++) {
    const patternIndex = dayIndex % 7;
    const targetCol = CONFIG.SCHEDULE_START_COL + dayIndex;
    const currentValue = sheet.getRange(row, targetCol).getValue();

    if (!currentValue && firstWeekValues[patternIndex]) {
      sheet.getRange(row, targetCol).setValue(firstWeekValues[patternIndex]);
      filledCells++;
    }
  }

  // Apply colors to the row
  const rowRange = sheet.getRange(row, CONFIG.SCHEDULE_START_COL, 1, daysInMonth);
  const values = rowRange.getValues()[0];
  const backgrounds = values.map(v => getColorForValue(v));
  rowRange.setBackgrounds([backgrounds]);

  ui.alert('Complete', `Filled ${filledCells} cells for ${managerName}.`, ui.ButtonSet.OK);
}

function isRegionHeader(value) {
  const regionCodes = CONFIG.REGIONS.map(r => r.code);
  return regionCodes.includes(value) || value.toString().startsWith('---');
}


// ============================================
// REGION-GROUPED VIEW
// ============================================

/**
 * Generates a view grouped by region with visual separators
 */
function generateRegionView() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sourceSheet.getName() + ' (By Region)';

  // Check if view already exists
  let viewSheet = ss.getSheetByName(sheetName);
  if (viewSheet) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert('Sheet Exists', `"${sheetName}" exists. Replace it?`, ui.ButtonSet.YES_NO);
    if (response !== ui.Button.YES) return;
    ss.deleteSheet(viewSheet);
  }

  viewSheet = ss.insertSheet(sheetName);

  // Get source data
  const lastRow = sourceSheet.getLastRow();
  const lastCol = sourceSheet.getLastColumn();
  const headers = sourceSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = sourceSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // Group data by region
  const regionGroups = {};
  CONFIG.REGIONS.forEach(r => regionGroups[r.code] = []);

  data.forEach(row => {
    const region = row[CONFIG.REGION_COL - 1];
    if (regionGroups[region]) {
      regionGroups[region].push(row);
    } else {
      // Unknown region - add to first group
      if (!regionGroups['Other']) regionGroups['Other'] = [];
      regionGroups['Other'].push(row);
    }
  });

  // Build grouped view
  let currentRow = 1;

  // Add headers
  viewSheet.getRange(currentRow, 1, 1, headers.length).setValues([headers]);
  formatHeaders(viewSheet);
  currentRow++;

  // Add each region
  CONFIG.REGIONS.forEach(region => {
    const managers = regionGroups[region.code];
    if (!managers || managers.length === 0) return;

    // Region header row
    const regionHeaderRow = new Array(headers.length).fill('');
    regionHeaderRow[0] = `▼ ${region.name} (${region.code}) - ${managers.length} managers`;
    viewSheet.getRange(currentRow, 1, 1, headers.length).setValues([regionHeaderRow]);
    viewSheet.getRange(currentRow, 1, 1, headers.length)
      .setBackground(CONFIG.COLORS.REGION_HEADER)
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontSize(11);
    viewSheet.getRange(currentRow, 1, 1, 3).merge();
    currentRow++;

    // Manager rows
    managers.forEach(manager => {
      viewSheet.getRange(currentRow, 1, 1, manager.length).setValues([manager]);
      // Apply region-specific background tint
      viewSheet.getRange(currentRow, 1, 1, 3).setBackground(region.color);
      currentRow++;
    });

    // Spacer row
    viewSheet.getRange(currentRow, 1, 1, headers.length)
      .setBackground(CONFIG.COLORS.REGION_SEPARATOR);
    viewSheet.setRowHeight(currentRow, 8);
    currentRow++;
  });

  // Apply formatting
  applyDropdownsToSheet(viewSheet);

  // Apply colors to schedule cells
  const scheduleEndCol = lastCol - CONFIG.SUMMARY_COLUMNS.length;
  for (let row = 2; row <= viewSheet.getLastRow(); row++) {
    const firstCell = viewSheet.getRange(row, 1).getValue();
    if (firstCell && !firstCell.toString().startsWith('▼') &&
        viewSheet.getRange(row, CONFIG.SCHEDULE_START_COL).getValue()) {
      const rowValues = viewSheet.getRange(row, CONFIG.SCHEDULE_START_COL, 1, scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1).getValues()[0];
      const backgrounds = rowValues.map(v => getColorForValue(v));
      viewSheet.getRange(row, CONFIG.SCHEDULE_START_COL, 1, backgrounds.length).setBackgrounds([backgrounds]);
    }
  }

  // Freeze
  viewSheet.setFrozenRows(1);
  viewSheet.setFrozenColumns(3);
  viewSheet.autoResizeColumns(1, 3);

  ss.setActiveSheet(viewSheet);
  SpreadsheetApp.getActiveSpreadsheet().toast(`Region view "${sheetName}" created!`, 'Complete', 5);
}

/**
 * Sorts and groups current sheet by region
 */
function groupByRegion() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 3) {
    SpreadsheetApp.getUi().alert('Error', 'Not enough data to sort.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Sort by region (column B)
  const range = sheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, lastCol);
  range.sort({ column: CONFIG.REGION_COL, ascending: true });

  // Apply alternating region colors
  const data = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.REGION_COL, lastRow - CONFIG.DATA_START_ROW + 1, 1).getValues();
  let currentRegion = '';

  for (let i = 0; i < data.length; i++) {
    const region = data[i][0];
    const row = CONFIG.DATA_START_ROW + i;

    if (region !== currentRegion) {
      currentRegion = region;
    }

    // Find region color
    const regionConfig = CONFIG.REGIONS.find(r => r.code === region);
    if (regionConfig) {
      sheet.getRange(row, 1, 1, 3).setBackground(regionConfig.color);
    }
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('Sheet grouped by region!', 'Complete', 3);
}


// ============================================
// SLACK NOTIFICATIONS
// ============================================

/**
 * Gets Slack webhook URL from Settings sheet
 */
function getSlackWebhookUrl() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');

  if (!settingsSheet) {
    throw new Error('Settings sheet not found. Run Initial Setup first.');
  }

  const url = settingsSheet.getRange('B2').getValue();
  if (!url || !url.toString().startsWith('https://hooks.slack.com')) {
    throw new Error('Invalid Slack webhook URL. Please configure in Settings sheet.');
  }

  return url;
}

/**
 * Sends a message to Slack
 */
function sendSlackMessage(message, blocks) {
  const webhookUrl = getSlackWebhookUrl();

  const payload = {
    text: message,
    blocks: blocks || undefined
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(webhookUrl, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error(`Slack API error: ${response.getContentText()}`);
  }

  return true;
}

/**
 * Tests Slack connection
 */
function testSlackConnection() {
  const ui = SpreadsheetApp.getUi();

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetUrl = ss.getUrl();

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✅ *Slack Connection Test Successful!*\n\nYour schedule reminder system is configured correctly.'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📊 *Schedule Sheet:* <${sheetUrl}|Click to open>`
        }
      }
    ];

    sendSlackMessage('Schedule Manager Test', blocks);
    ui.alert('Success!', 'Test message sent to Slack successfully!', ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Failed to send to Slack: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Sends schedule reminder to Slack
 */
function sendSlackReminderToAll() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Send Slack Reminder',
    'This will send a reminder to your Slack channel for all managers to fill their schedules.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetUrl = ss.getUrl();
    const nextMonth = getNextMonthName();

    // Get list of managers who haven't completed their schedule
    const sheet = SpreadsheetApp.getActiveSheet();
    const incompleteManagers = getIncompleteManagers(sheet);

    let managerList = '';
    if (incompleteManagers.length > 0) {
      managerList = incompleteManagers.slice(0, 10).map(m => `• ${m.name} (${m.missing} days)`).join('\n');
      if (incompleteManagers.length > 10) {
        managerList += `\n• ...and ${incompleteManagers.length - 10} more`;
      }
    }

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📅 Schedule Reminder',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Please fill in your schedule for ${nextMonth}*\n\nDon't forget to complete your working hours, days off, vacations, and holidays.`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📊 *Schedule Sheet:* <${sheetUrl}|Click here to open>`
        }
      }
    ];

    if (managerList) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⚠️ *Managers with incomplete schedules:*\n${managerList}`
        }
      });
    }

    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: '💡 _Tip: Fill in Week 1, then use Auto-Fill to populate the rest!_'
      }]
    });

    sendSlackMessage(`Schedule Reminder - ${nextMonth}`, blocks);
    ui.alert('Success!', 'Reminder sent to Slack!', ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Failed to send: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Gets list of managers with incomplete schedules
 */
function getIncompleteManagers(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const scheduleEndCol = lastCol - CONFIG.SUMMARY_COLUMNS.length;

  const incomplete = [];

  for (let row = CONFIG.DATA_START_ROW; row <= lastRow; row++) {
    const name = sheet.getRange(row, CONFIG.MANAGER_NAME_COL).getValue();
    if (!name || isRegionHeader(name)) continue;

    const scheduleRange = sheet.getRange(row, CONFIG.SCHEDULE_START_COL, 1, scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1);
    const values = scheduleRange.getValues()[0];
    const emptyCount = values.filter(v => !v).length;

    if (emptyCount > 0) {
      incomplete.push({ name: name, missing: emptyCount });
    }
  }

  return incomplete.sort((a, b) => b.missing - a.missing);
}

/**
 * Setup Slack webhook URL
 */
function setupSlackWebhook() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'Setup Slack Webhook',
    'Enter your Slack Incoming Webhook URL:\n\n(Get one from https://api.slack.com/apps)',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const url = response.getResponseText().trim();

  if (!url.startsWith('https://hooks.slack.com')) {
    ui.alert('Error', 'Invalid webhook URL. Must start with https://hooks.slack.com', ui.ButtonSet.OK);
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let settingsSheet = ss.getSheetByName('Settings');

  if (!settingsSheet) {
    settingsSheet = createSettingsSheet();
  }

  settingsSheet.getRange('B2').setValue(url);
  ui.alert('Success!', 'Slack webhook URL saved. Use "Test Slack Connection" to verify.', ui.ButtonSet.OK);
}

/**
 * Sets up automatic monthly Slack reminders
 */
function setupAutomaticReminders() {
  removeAutomaticReminders();

  ScriptApp.newTrigger('automaticSlackReminder')
    .timeBased()
    .onMonthDay(25)
    .atHour(9)
    .create();

  SpreadsheetApp.getUi().alert('Success', 'Automatic Slack reminders set up! Messages will be sent on the 25th of each month at 9 AM.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function removeAutomaticReminders() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'automaticSlackReminder') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function automaticSlackReminder() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetUrl = ss.getUrl();
    const nextMonth = getNextMonthName();

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📅 Monthly Schedule Reminder',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Reminder: Please fill in your schedule for ${nextMonth}*\n\nThe month is ending soon - make sure to complete your schedule!`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📊 <${sheetUrl}|Click here to open the schedule>`
        }
      }
    ];

    sendSlackMessage(`Monthly Schedule Reminder - ${nextMonth}`, blocks);
  } catch (error) {
    console.error('Failed to send automatic reminder:', error);
  }
}


// ============================================
// COLOR FORMATTING
// ============================================

function applyColorToCell(range, value) {
  range.setBackground(getColorForValue(value));
}

function getColorForValue(value) {
  if (!value) return CONFIG.COLORS.EMPTY;

  const valueLower = value.toString().toLowerCase();

  if (valueLower.includes('holiday')) return CONFIG.COLORS.HOLIDAY;
  if (valueLower.includes('vacation')) return CONFIG.COLORS.VACATION;
  if (valueLower.includes('sick')) return CONFIG.COLORS.SICK_LEAVE;
  if (valueLower.includes('day off') || valueLower === 'off') return CONFIG.COLORS.DAY_OFF;
  if (valueLower.includes(':')) return CONFIG.COLORS.WORK_HOURS;

  return CONFIG.COLORS.EMPTY;
}

function applyColorsToCurrentSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const scheduleEndCol = lastCol - CONFIG.SUMMARY_COLUMNS.length;

  if (scheduleEndCol < CONFIG.SCHEDULE_START_COL) return;

  const range = sheet.getRange(
    CONFIG.DATA_START_ROW,
    CONFIG.SCHEDULE_START_COL,
    lastRow - CONFIG.DATA_START_ROW + 1,
    scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1
  );

  const values = range.getValues();
  const backgrounds = values.map(row => row.map(v => getColorForValue(v)));

  range.setBackgrounds(backgrounds);
  colorWeekendColumns(sheet);

  SpreadsheetApp.getActiveSpreadsheet().toast('Colors applied!', 'Complete', 3);
}

function colorWeekendColumns(sheet) {
  const headerRow = sheet.getRange(CONFIG.HEADER_ROW, 1, 1, sheet.getLastColumn()).getValues()[0];

  for (let col = CONFIG.SCHEDULE_START_COL - 1; col < headerRow.length; col++) {
    const header = headerRow[col];
    if (header && (header.toString().startsWith('Sat') || header.toString().startsWith('Sun'))) {
      sheet.getRange(CONFIG.HEADER_ROW, col + 1).setBackground(CONFIG.COLORS.WEEKEND);
    }
  }
}


// ============================================
// DROPDOWN MANAGEMENT
// ============================================

function refreshDropdowns() {
  const sheet = SpreadsheetApp.getActiveSheet();
  applyDropdownsToSheet(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Dropdowns refreshed!', 'Complete', 3);
}

function applyDropdownsToSheet(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const scheduleEndCol = lastCol - CONFIG.SUMMARY_COLUMNS.length;

  if (lastRow < CONFIG.DATA_START_ROW || scheduleEndCol < CONFIG.SCHEDULE_START_COL) return;

  // Schedule dropdown
  const scheduleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.SCHEDULE_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(
    CONFIG.DATA_START_ROW,
    CONFIG.SCHEDULE_START_COL,
    lastRow - CONFIG.DATA_START_ROW + 1,
    scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1
  ).setDataValidation(scheduleRule);

  // Region dropdown
  const regionCodes = CONFIG.REGIONS.map(r => r.code);
  const regionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(regionCodes, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.REGION_COL, lastRow - CONFIG.DATA_START_ROW + 1, 1)
    .setDataValidation(regionRule);
}


// ============================================
// MONTHLY SHEET GENERATION
// ============================================

function generateNextMonthSheet() {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  generateMonthSheet(nextMonth.getFullYear(), nextMonth.getMonth());
}

function promptGenerateMonth() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Generate Month Sheet',
    'Enter month name (e.g., "February 2026"):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const date = new Date(response.getResponseText() + ' 1');
  if (isNaN(date.getTime())) {
    ui.alert('Error', 'Invalid date format.', ui.ButtonSet.OK);
    return;
  }

  generateMonthSheet(date.getFullYear(), date.getMonth());
}

function generateMonthSheet(year, month) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const sheetName = monthNames[month] + ' ' + year;

  let sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert('Sheet Exists', `"${sheetName}" exists. Replace it?`, ui.ButtonSet.YES_NO);
    if (response !== ui.Button.YES) return;
    ss.deleteSheet(sheet);
  }

  const sourceSheet = findMostRecentMonthSheet(ss) || ss.getSheets()[0];
  const managerData = getManagerData(sourceSheet);

  sheet = ss.insertSheet(sheetName);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build headers
  const headers = ['Manager', 'Region', 'Procedures'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayName = dayNames[date.getDay()];
    headers.push(`${dayName}, ${monthNames[month].substring(0, 3)} ${day}`);
  }

  headers.push(...CONFIG.SUMMARY_COLUMNS);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Add manager data (grouped by region)
  if (managerData.length > 0) {
    // Sort by region
    managerData.sort((a, b) => {
      const aIndex = CONFIG.REGIONS.findIndex(r => r.code === a.region);
      const bIndex = CONFIG.REGIONS.findIndex(r => r.code === b.region);
      return aIndex - bIndex;
    });

    const dataRows = managerData.map(manager => {
      const row = [manager.name, manager.region, manager.procedures];
      for (let i = 0; i < daysInMonth; i++) row.push('');
      for (let i = 0; i < CONFIG.SUMMARY_COLUMNS.length; i++) row.push('');
      return row;
    });

    sheet.getRange(2, 1, dataRows.length, dataRows[0].length).setValues(dataRows);

    // Apply region colors
    let currentRegion = '';
    for (let i = 0; i < managerData.length; i++) {
      const region = managerData[i].region;
      const row = i + 2;
      const regionConfig = CONFIG.REGIONS.find(r => r.code === region);
      if (regionConfig) {
        sheet.getRange(row, 1, 1, 3).setBackground(regionConfig.color);
      }
    }
  }

  formatHeaders(sheet);
  applyDropdownsToSheet(sheet);
  addSummaryFormulasToSheet(sheet, daysInMonth);
  highlightWeekends(sheet, year, month, daysInMonth);

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);
  sheet.autoResizeColumns(1, 3);

  ss.setActiveSheet(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast(`"${sheetName}" created!`, 'Complete', 5);
}

function findMostRecentMonthSheet(ss) {
  const sheets = ss.getSheets();
  const monthPattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/;

  let mostRecent = null;
  let mostRecentDate = null;

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (monthPattern.test(name)) {
      const date = new Date(name);
      if (!mostRecentDate || date > mostRecentDate) {
        mostRecentDate = date;
        mostRecent = sheet;
      }
    }
  });

  return mostRecent;
}

function getManagerData(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  return data
    .filter(row => row[0] && !isRegionHeader(row[0]))
    .map(row => ({ name: row[0], region: row[1], procedures: row[2] }));
}

function highlightWeekends(sheet, year, month, daysInMonth) {
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const col = CONFIG.SCHEDULE_START_COL + day - 1;
      sheet.getRange(CONFIG.HEADER_ROW, col)
        .setBackground(CONFIG.COLORS.WEEKEND)
        .setFontColor('#E65100');
    }
  }
}


// ============================================
// HEADER FORMATTING
// ============================================

function formatHeadersMenu() {
  formatHeaders(SpreadsheetApp.getActiveSheet());
  SpreadsheetApp.getActiveSpreadsheet().toast('Headers formatted!', 'Complete', 3);
}

function formatHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  const headerRange = sheet.getRange(CONFIG.HEADER_ROW, 1, 1, lastCol);

  headerRange
    .setBackground(CONFIG.COLORS.HEADER)
    .setFontColor(CONFIG.COLORS.HEADER_TEXT)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setRowHeight(CONFIG.HEADER_ROW, 40);

  // Manager info columns
  sheet.getRange(CONFIG.HEADER_ROW, 1, 1, 3).setBackground('#0D47A1');

  // Summary columns
  const summaryStartCol = lastCol - CONFIG.SUMMARY_COLUMNS.length + 1;
  if (summaryStartCol > 0) {
    sheet.getRange(CONFIG.HEADER_ROW, summaryStartCol, 1, CONFIG.SUMMARY_COLUMNS.length)
      .setBackground('#1B5E20');
  }
}


// ============================================
// SUMMARY FORMULAS
// ============================================

function addSummaryFormulas() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  let scheduleEndCol = lastCol;
  for (let i = headers.length - 1; i >= 0; i--) {
    if (CONFIG.SUMMARY_COLUMNS.includes(headers[i])) {
      scheduleEndCol = i;
    }
  }

  const daysInSchedule = scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1;
  addSummaryFormulasToSheet(sheet, daysInSchedule);
}

function addSummaryFormulasToSheet(sheet, daysInMonth) {
  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return;

  const scheduleStartCol = CONFIG.SCHEDULE_START_COL;
  const scheduleEndCol = scheduleStartCol + daysInMonth - 1;
  const startColLetter = columnToLetter(scheduleStartCol);
  const endColLetter = columnToLetter(scheduleEndCol);

  const workDaysCol = scheduleEndCol + 1;
  const vacationsCol = scheduleEndCol + 2;
  const holidaysCol = scheduleEndCol + 3;
  const sickDaysCol = scheduleEndCol + 4;

  sheet.getRange(1, workDaysCol).setValue('Work Days');
  sheet.getRange(1, vacationsCol).setValue('Vacations');
  sheet.getRange(1, holidaysCol).setValue('Holidays');
  sheet.getRange(1, sickDaysCol).setValue('Sick Days');

  for (let row = CONFIG.DATA_START_ROW; row <= lastRow; row++) {
    const managerName = sheet.getRange(row, CONFIG.MANAGER_NAME_COL).getValue();
    if (!managerName || isRegionHeader(managerName)) continue;

    const rangeStr = `${startColLetter}${row}:${endColLetter}${row}`;

    sheet.getRange(row, workDaysCol).setFormula(`=SUMPRODUCT(--ISNUMBER(SEARCH(":",${rangeStr})))`);
    sheet.getRange(row, vacationsCol).setFormula(`=COUNTIF(${rangeStr},"*Vacation*")`);
    sheet.getRange(row, holidaysCol).setFormula(`=COUNTIF(${rangeStr},"*Holiday*")`);
    sheet.getRange(row, sickDaysCol).setFormula(`=COUNTIF(${rangeStr},"*Sick*")`);
  }

  sheet.getRange(CONFIG.DATA_START_ROW, workDaysCol, lastRow - CONFIG.DATA_START_ROW + 1, 4)
    .setHorizontalAlignment('center')
    .setNumberFormat('0');

  SpreadsheetApp.getActiveSpreadsheet().toast('Summary formulas added!', 'Complete', 3);
}

function recalculateAllSummaries() {
  addSummaryFormulas();
}

function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}


// ============================================
// REPORTS
// ============================================

function generateMonthlySummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = SpreadsheetApp.getActiveSheet();

  let summarySheet = ss.getSheetByName('Monthly Summary');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Monthly Summary');
  } else {
    summarySheet.clear();
  }

  const lastRow = sourceSheet.getLastRow();
  const lastCol = sourceSheet.getLastColumn();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Error', 'No data to summarize.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const summaryHeaders = ['Region', 'Total Managers', 'Total Work Days', 'Total Vacations', 'Total Holidays', 'Total Sick Days', 'Avg Work Days'];
  summarySheet.getRange(1, 1, 1, summaryHeaders.length).setValues([summaryHeaders]);

  const data = sourceSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const regionStats = {};

  data.forEach(row => {
    const name = row[0];
    if (!name || isRegionHeader(name)) return;

    const region = row[1] || 'Unknown';
    const workDays = parseFloat(row[lastCol - 4]) || 0;
    const vacations = parseFloat(row[lastCol - 3]) || 0;
    const holidays = parseFloat(row[lastCol - 2]) || 0;
    const sickDays = parseFloat(row[lastCol - 1]) || 0;

    if (!regionStats[region]) {
      regionStats[region] = { count: 0, workDays: 0, vacations: 0, holidays: 0, sickDays: 0 };
    }

    regionStats[region].count++;
    regionStats[region].workDays += workDays;
    regionStats[region].vacations += vacations;
    regionStats[region].holidays += holidays;
    regionStats[region].sickDays += sickDays;
  });

  const summaryRows = Object.keys(regionStats).sort().map(region => {
    const stats = regionStats[region];
    return [
      region,
      stats.count,
      stats.workDays,
      stats.vacations,
      stats.holidays,
      stats.sickDays,
      (stats.workDays / stats.count).toFixed(1)
    ];
  });

  const totals = Object.values(regionStats).reduce((acc, stats) => {
    acc.count += stats.count;
    acc.workDays += stats.workDays;
    acc.vacations += stats.vacations;
    acc.holidays += stats.holidays;
    acc.sickDays += stats.sickDays;
    return acc;
  }, { count: 0, workDays: 0, vacations: 0, holidays: 0, sickDays: 0 });

  summaryRows.push(['TOTAL', totals.count, totals.workDays, totals.vacations, totals.holidays, totals.sickDays, (totals.workDays / totals.count).toFixed(1)]);

  summarySheet.getRange(2, 1, summaryRows.length, summaryHeaders.length).setValues(summaryRows);

  summarySheet.getRange(1, 1, 1, summaryHeaders.length)
    .setBackground(CONFIG.COLORS.HEADER)
    .setFontColor(CONFIG.COLORS.HEADER_TEXT)
    .setFontWeight('bold');

  summarySheet.getRange(summaryRows.length + 1, 1, 1, summaryHeaders.length)
    .setBackground('#E8F5E9')
    .setFontWeight('bold');

  summarySheet.autoResizeColumns(1, summaryHeaders.length);
  ss.setActiveSheet(summarySheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Summary generated!', 'Complete', 3);
}

function generateCoverageReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = SpreadsheetApp.getActiveSheet();

  let coverageSheet = ss.getSheetByName('Coverage Report');
  if (!coverageSheet) {
    coverageSheet = ss.insertSheet('Coverage Report');
  } else {
    coverageSheet.clear();
  }

  const lastRow = sourceSheet.getLastRow();
  const lastCol = sourceSheet.getLastColumn();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Error', 'No data to analyze.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const headers = sourceSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = sourceSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const dayColumns = [];
  for (let i = CONFIG.SCHEDULE_START_COL - 1; i < headers.length - CONFIG.SUMMARY_COLUMNS.length; i++) {
    dayColumns.push({ index: i, header: headers[i] });
  }

  const coverageHeaders = ['Date', 'Working', 'Day Off', 'Vacation', 'Holiday', 'Sick', 'Coverage %'];
  coverageSheet.getRange(1, 1, 1, coverageHeaders.length).setValues([coverageHeaders]);

  const validData = data.filter(row => row[0] && !isRegionHeader(row[0]));

  const coverageRows = dayColumns.map(day => {
    let working = 0, dayOff = 0, vacation = 0, holiday = 0, sick = 0;

    validData.forEach(row => {
      const value = row[day.index];
      if (!value) return;
      const valueLower = value.toString().toLowerCase();
      if (valueLower.includes(':')) working++;
      else if (valueLower.includes('day off')) dayOff++;
      else if (valueLower.includes('vacation')) vacation++;
      else if (valueLower.includes('holiday')) holiday++;
      else if (valueLower.includes('sick')) sick++;
    });

    const total = validData.length;
    const coveragePercent = total > 0 ? ((working / total) * 100).toFixed(1) : '0';

    return [day.header, working, dayOff, vacation, holiday, sick, coveragePercent + '%'];
  });

  coverageSheet.getRange(2, 1, coverageRows.length, coverageHeaders.length).setValues(coverageRows);

  coverageSheet.getRange(1, 1, 1, coverageHeaders.length)
    .setBackground(CONFIG.COLORS.HEADER)
    .setFontColor(CONFIG.COLORS.HEADER_TEXT)
    .setFontWeight('bold');

  coverageSheet.autoResizeColumns(1, coverageHeaders.length);
  ss.setActiveSheet(coverageSheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Coverage report generated!', 'Complete', 3);
}

function generateRegionDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = SpreadsheetApp.getActiveSheet();

  let dashSheet = ss.getSheetByName('Region Dashboard');
  if (!dashSheet) {
    dashSheet = ss.insertSheet('Region Dashboard');
  } else {
    dashSheet.clear();
  }

  const lastRow = sourceSheet.getLastRow();
  const lastCol = sourceSheet.getLastColumn();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Error', 'No data.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const data = sourceSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // Title
  dashSheet.getRange('A1').setValue('Region Dashboard');
  dashSheet.getRange('A1').setFontSize(18).setFontWeight('bold');

  let currentRow = 3;

  CONFIG.REGIONS.forEach(region => {
    const regionData = data.filter(row => row[1] === region.code && row[0] && !isRegionHeader(row[0]));
    if (regionData.length === 0) return;

    // Region header
    dashSheet.getRange(currentRow, 1).setValue(`${region.name} (${region.code})`);
    dashSheet.getRange(currentRow, 1, 1, 5)
      .setBackground(region.color)
      .setFontWeight('bold')
      .setFontSize(12);
    dashSheet.getRange(currentRow, 1, 1, 5).merge();
    currentRow++;

    // Stats header
    dashSheet.getRange(currentRow, 1, 1, 5).setValues([['Manager', 'Work Days', 'Vacations', 'Holidays', 'Sick Days']]);
    dashSheet.getRange(currentRow, 1, 1, 5).setFontWeight('bold').setBackground('#ECEFF1');
    currentRow++;

    // Manager stats
    regionData.forEach(row => {
      dashSheet.getRange(currentRow, 1, 1, 5).setValues([[
        row[0],
        row[lastCol - 4] || 0,
        row[lastCol - 3] || 0,
        row[lastCol - 2] || 0,
        row[lastCol - 1] || 0
      ]]);
      currentRow++;
    });

    // Region total
    const totals = regionData.reduce((acc, row) => {
      acc.workDays += parseFloat(row[lastCol - 4]) || 0;
      acc.vacations += parseFloat(row[lastCol - 3]) || 0;
      acc.holidays += parseFloat(row[lastCol - 2]) || 0;
      acc.sickDays += parseFloat(row[lastCol - 1]) || 0;
      return acc;
    }, { workDays: 0, vacations: 0, holidays: 0, sickDays: 0 });

    dashSheet.getRange(currentRow, 1, 1, 5).setValues([[
      `Total (${regionData.length} managers)`,
      totals.workDays,
      totals.vacations,
      totals.holidays,
      totals.sickDays
    ]]);
    dashSheet.getRange(currentRow, 1, 1, 5).setFontWeight('bold').setBackground('#E8F5E9');
    currentRow += 2;
  });

  dashSheet.autoResizeColumns(1, 5);
  ss.setActiveSheet(dashSheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Dashboard generated!', 'Complete', 3);
}


// ============================================
// SETTINGS & HELP
// ============================================

function openSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    sheet = createSettingsSheet();
  }
  ss.setActiveSheet(sheet);
}

function getNextMonthName() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return monthNames[nextMonth.getMonth()] + ' ' + nextMonth.getFullYear();
}

function showHelp() {
  const ui = SpreadsheetApp.getUi();

  const helpText = `
SCHEDULE MANAGER v2.0 - HELP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTO-FILL FEATURE (NEW!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fill in Week 1 (first 7 days), then use:
• "Fill Month from First Week" - fills ALL managers
• "Fill Selected Row" - fills just one manager

The pattern repeats: Day 1→8→15→22, Day 2→9→16→23, etc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLACK NOTIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Create a Slack app at api.slack.com
2. Add an Incoming Webhook
3. Go to Settings sheet or use menu to add URL
4. Test connection, then send reminders!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLOR CODING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Yellow = Holiday
• Green = Vacation
• Red = Sick Leave
• Blue = Day Off
• White = Work Hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGION VIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use "Generate Region View" to create a
grouped view with visual separators.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEYBOARD TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Select a cell and press Enter to see dropdown.
Use arrow keys + Enter to select quickly.
  `;

  ui.alert('Schedule Manager Help', helpText, ui.ButtonSet.OK);
}
