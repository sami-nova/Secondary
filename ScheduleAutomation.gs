/**
 * Manager Schedule Automation Script
 *
 * This Google Apps Script automates the manager schedule sheet with:
 * - Auto-coloring based on dropdown selections
 * - Monthly sheet generation
 * - Email reminders for managers to fill schedules
 * - Data validation and error checking
 * - Summary dashboard generation
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the project (Ctrl+S)
 * 5. Refresh your Google Sheet - you'll see a new "Schedule Manager" menu
 * 6. Run initial setup from the menu
 */

// ============================================
// CONFIGURATION - Customize these values
// ============================================

const CONFIG = {
  // Column indices (1-based, adjust if your sheet structure differs)
  MANAGER_NAME_COL: 1,      // Column A
  REGION_COL: 2,            // Column B
  PROCEDURES_COL: 3,        // Column C
  SCHEDULE_START_COL: 4,    // Column D (first day column)

  // Data row settings
  HEADER_ROW: 1,
  DATA_START_ROW: 2,

  // Color coding (hex colors)
  COLORS: {
    HOLIDAY: '#FFEB3B',      // Yellow
    VACATION: '#4CAF50',     // Green
    SICK_LEAVE: '#F44336',   // Red
    DAY_OFF: '#2196F3',      // Blue
    WORK_HOURS: '#FFFFFF',   // White (default)
    HEADER: '#1565C0',       // Dark blue for headers
    HEADER_TEXT: '#FFFFFF',  // White text for headers
    WEEKEND: '#F5F5F5',      // Light gray for weekends
    EMPTY: '#EEEEEE'         // Light gray for empty cells
  },

  // Schedule options for dropdown
  SCHEDULE_OPTIONS: [
    '9:00-18:00',
    '9:30-18:30',
    '10:00-19:00',
    '10:30-19:30',
    '11:00-20:00',
    '13:00-22:00',
    '16:00-01:00',
    '8:00-17:00',
    'Day off',
    'Holiday',
    'Vacation',
    'Sick Leave'
  ],

  // Region options
  REGIONS: ['Arab', 'CZ', 'DE', 'ES', 'FR', 'IL', 'IT', 'PL', 'RO', 'RU', 'TR'],

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

  // Email settings
  EMAIL_SUBJECT: 'Reminder: Please Fill Your Schedule',
  DAYS_BEFORE_MONTH_END: 5,  // Send reminder X days before month ends

  // Summary columns (added at the end)
  SUMMARY_COLUMNS: ['Work Days', 'Vacations', 'Holidays', 'Sick Days']
};


// ============================================
// MENU AND TRIGGERS
// ============================================

/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Schedule Manager')
    .addItem('Initial Setup', 'initialSetup')
    .addSeparator()
    .addSubMenu(ui.createMenu('Monthly Operations')
      .addItem('Generate Next Month Sheet', 'generateNextMonthSheet')
      .addItem('Generate Specific Month...', 'promptGenerateMonth'))
    .addSubMenu(ui.createMenu('Formatting')
      .addItem('Apply Colors to Current Sheet', 'applyColorsToCurrentSheet')
      .addItem('Refresh Dropdowns', 'refreshDropdowns')
      .addItem('Format Headers', 'formatHeaders'))
    .addSubMenu(ui.createMenu('Calculations')
      .addItem('Recalculate All Summaries', 'recalculateAllSummaries')
      .addItem('Add Summary Formulas', 'addSummaryFormulas'))
    .addSubMenu(ui.createMenu('Reminders')
      .addItem('Send Reminder to All Managers', 'sendReminderToAll')
      .addItem('Setup Automatic Reminders', 'setupAutomaticReminders')
      .addItem('Remove Automatic Reminders', 'removeAutomaticReminders'))
    .addSubMenu(ui.createMenu('Reports')
      .addItem('Generate Monthly Summary', 'generateMonthlySummary')
      .addItem('Generate Coverage Report', 'generateCoverageReport'))
    .addSeparator()
    .addItem('Help & Documentation', 'showHelp')
    .addToUi();
}

/**
 * Trigger that runs when cells are edited
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const row = range.getRow();
  const col = range.getColumn();

  // Skip if editing header row or manager info columns
  if (row < CONFIG.DATA_START_ROW || col < CONFIG.SCHEDULE_START_COL) {
    return;
  }

  // Skip if this is a summary column (last 4 columns typically)
  const lastCol = sheet.getLastColumn();
  if (col > lastCol - CONFIG.SUMMARY_COLUMNS.length) {
    return;
  }

  // Apply color based on the new value
  const value = e.value;
  applyColorToCell(range, value);
}


// ============================================
// INITIAL SETUP
// ============================================

/**
 * Performs initial setup of the spreadsheet
 */
function initialSetup() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Initial Setup',
    'This will:\n' +
    '1. Set up automatic color formatting trigger\n' +
    '2. Format the current sheet headers\n' +
    '3. Apply dropdowns to schedule cells\n' +
    '4. Add summary formulas\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  try {
    // Setup triggers
    setupEditTrigger();

    // Format current sheet
    const sheet = SpreadsheetApp.getActiveSheet();
    formatHeaders(sheet);
    applyDropdownsToSheet(sheet);
    addSummaryFormulas();
    applyColorsToCurrentSheet();

    ui.alert('Setup Complete', 'Initial setup completed successfully!', ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Setup failed: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Sets up the edit trigger for automatic color formatting
 */
function setupEditTrigger() {
  // Remove existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEdit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Note: onEdit is a simple trigger that runs automatically
  // For installable trigger with more permissions:
  ScriptApp.newTrigger('onEditInstallable')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
}

/**
 * Installable edit trigger with full permissions
 */
function onEditInstallable(e) {
  onEdit(e);
}


// ============================================
// COLOR FORMATTING
// ============================================

/**
 * Applies color to a single cell based on its value
 */
function applyColorToCell(range, value) {
  if (!value) {
    range.setBackground(CONFIG.COLORS.EMPTY);
    return;
  }

  const valueLower = value.toString().toLowerCase();

  if (valueLower.includes('holiday')) {
    range.setBackground(CONFIG.COLORS.HOLIDAY);
  } else if (valueLower.includes('vacation')) {
    range.setBackground(CONFIG.COLORS.VACATION);
  } else if (valueLower.includes('sick')) {
    range.setBackground(CONFIG.COLORS.SICK_LEAVE);
  } else if (valueLower.includes('day off') || valueLower === 'off') {
    range.setBackground(CONFIG.COLORS.DAY_OFF);
  } else if (valueLower.includes(':')) {
    // Work hours (contains time like "9:00-18:00")
    range.setBackground(CONFIG.COLORS.WORK_HOURS);
  } else {
    range.setBackground(CONFIG.COLORS.EMPTY);
  }
}

/**
 * Applies colors to all schedule cells in the current sheet
 */
function applyColorsToCurrentSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // Calculate the range of schedule cells (excluding summary columns)
  const scheduleEndCol = lastCol - CONFIG.SUMMARY_COLUMNS.length;

  if (scheduleEndCol < CONFIG.SCHEDULE_START_COL) return;

  const range = sheet.getRange(
    CONFIG.DATA_START_ROW,
    CONFIG.SCHEDULE_START_COL,
    lastRow - CONFIG.DATA_START_ROW + 1,
    scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1
  );

  const values = range.getValues();
  const backgrounds = [];

  for (let i = 0; i < values.length; i++) {
    const rowColors = [];
    for (let j = 0; j < values[i].length; j++) {
      const value = values[i][j];
      rowColors.push(getColorForValue(value));
    }
    backgrounds.push(rowColors);
  }

  range.setBackgrounds(backgrounds);

  // Also color weekend columns
  colorWeekendColumns(sheet);

  SpreadsheetApp.getActiveSpreadsheet().toast('Colors applied successfully!', 'Complete', 3);
}

/**
 * Returns the appropriate color for a cell value
 */
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

/**
 * Colors weekend columns with a subtle background
 */
function colorWeekendColumns(sheet) {
  const headerRow = sheet.getRange(CONFIG.HEADER_ROW, 1, 1, sheet.getLastColumn()).getValues()[0];

  for (let col = CONFIG.SCHEDULE_START_COL - 1; col < headerRow.length; col++) {
    const header = headerRow[col];
    if (header && (header.toString().includes('Sat') || header.toString().includes('Sun'))) {
      // Apply subtle weekend styling to header only
      sheet.getRange(CONFIG.HEADER_ROW, col + 1)
        .setBackground('#FFF3E0');
    }
  }
}


// ============================================
// DROPDOWN MANAGEMENT
// ============================================

/**
 * Refreshes dropdowns on the current sheet
 */
function refreshDropdowns() {
  const sheet = SpreadsheetApp.getActiveSheet();
  applyDropdownsToSheet(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Dropdowns refreshed!', 'Complete', 3);
}

/**
 * Applies dropdown validation to schedule cells
 */
function applyDropdownsToSheet(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // Calculate schedule range (excluding summary columns)
  const scheduleEndCol = lastCol - CONFIG.SUMMARY_COLUMNS.length;

  if (lastRow < CONFIG.DATA_START_ROW || scheduleEndCol < CONFIG.SCHEDULE_START_COL) return;

  // Create dropdown rule for schedule options
  const scheduleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.SCHEDULE_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  // Apply to schedule range
  const scheduleRange = sheet.getRange(
    CONFIG.DATA_START_ROW,
    CONFIG.SCHEDULE_START_COL,
    lastRow - CONFIG.DATA_START_ROW + 1,
    scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1
  );
  scheduleRange.setDataValidation(scheduleRule);

  // Apply region dropdown
  const regionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.REGIONS, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.REGION_COL, lastRow - CONFIG.DATA_START_ROW + 1, 1)
    .setDataValidation(regionRule);

  // Apply procedures dropdown
  const proceduresRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.PROCEDURES, true)
    .setAllowInvalid(true) // Allow custom combinations
    .build();

  sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.PROCEDURES_COL, lastRow - CONFIG.DATA_START_ROW + 1, 1)
    .setDataValidation(proceduresRule);
}


// ============================================
// MONTHLY SHEET GENERATION
// ============================================

/**
 * Generates a sheet for the next month
 */
function generateNextMonthSheet() {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  generateMonthSheet(nextMonth.getFullYear(), nextMonth.getMonth());
}

/**
 * Prompts user to select a specific month to generate
 */
function promptGenerateMonth() {
  const ui = SpreadsheetApp.getUi();

  const monthResponse = ui.prompt(
    'Generate Month Sheet',
    'Enter month name (e.g., "February 2026"):',
    ui.ButtonSet.OK_CANCEL
  );

  if (monthResponse.getSelectedButton() !== ui.Button.OK) return;

  const monthStr = monthResponse.getResponseText();
  const date = new Date(monthStr + ' 1');

  if (isNaN(date.getTime())) {
    ui.alert('Error', 'Invalid date format. Please use format like "February 2026"', ui.ButtonSet.OK);
    return;
  }

  generateMonthSheet(date.getFullYear(), date.getMonth());
}

/**
 * Generates a new sheet for the specified month
 */
function generateMonthSheet(year, month) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const sheetName = monthNames[month] + ' ' + year;

  // Check if sheet already exists
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Sheet Exists',
      `Sheet "${sheetName}" already exists. Do you want to replace it?`,
      ui.ButtonSet.YES_NO
    );
    if (response !== ui.Button.YES) return;
    ss.deleteSheet(sheet);
  }

  // Get manager data from the most recent month sheet
  const sourceSheet = findMostRecentMonthSheet(ss) || ss.getSheets()[0];
  const managerData = getManagerData(sourceSheet);

  // Create new sheet
  sheet = ss.insertSheet(sheetName);

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build headers
  const headers = ['Manager', 'Region', 'Procedures'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayName = dayNames[date.getDay()];
    headers.push(`${dayName}, ${monthNames[month].substring(0, 3)} ${day}`);
  }

  // Add summary columns
  headers.push(...CONFIG.SUMMARY_COLUMNS);

  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Add manager data
  if (managerData.length > 0) {
    const dataRows = managerData.map(manager => {
      const row = [manager.name, manager.region, manager.procedures];
      // Add empty cells for each day
      for (let i = 0; i < daysInMonth; i++) {
        row.push('');
      }
      // Add placeholder for summary (will be filled by formulas)
      for (let i = 0; i < CONFIG.SUMMARY_COLUMNS.length; i++) {
        row.push('');
      }
      return row;
    });

    sheet.getRange(2, 1, dataRows.length, dataRows[0].length).setValues(dataRows);
  }

  // Format the sheet
  formatHeaders(sheet);
  applyDropdownsToSheet(sheet);
  addSummaryFormulasToSheet(sheet, daysInMonth);

  // Highlight weekends
  highlightWeekends(sheet, year, month, daysInMonth);

  // Freeze first row and first 3 columns
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);

  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);

  SpreadsheetApp.getActiveSpreadsheet().toast(`Sheet "${sheetName}" created successfully!`, 'Complete', 5);

  // Activate the new sheet
  ss.setActiveSheet(sheet);
}

/**
 * Finds the most recent month sheet
 */
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

/**
 * Gets manager data from a source sheet
 */
function getManagerData(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

  return data
    .filter(row => row[0]) // Filter out empty rows
    .map(row => ({
      name: row[0],
      region: row[1],
      procedures: row[2]
    }));
}

/**
 * Highlights weekend columns
 */
function highlightWeekends(sheet, year, month, daysInMonth) {
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      const col = CONFIG.SCHEDULE_START_COL + day - 1;
      sheet.getRange(CONFIG.HEADER_ROW, col)
        .setBackground('#FFF3E0')
        .setFontColor('#E65100');
    }
  }
}


// ============================================
// HEADER FORMATTING
// ============================================

/**
 * Formats headers with professional styling
 */
function formatHeaders(sheet) {
  if (!sheet) sheet = SpreadsheetApp.getActiveSheet();

  const lastCol = sheet.getLastColumn();
  const headerRange = sheet.getRange(CONFIG.HEADER_ROW, 1, 1, lastCol);

  headerRange
    .setBackground(CONFIG.COLORS.HEADER)
    .setFontColor(CONFIG.COLORS.HEADER_TEXT)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // Set row height
  sheet.setRowHeight(CONFIG.HEADER_ROW, 40);

  // Style manager info columns differently
  sheet.getRange(CONFIG.HEADER_ROW, 1, 1, 3)
    .setBackground('#0D47A1');

  // Style summary columns
  const summaryStartCol = lastCol - CONFIG.SUMMARY_COLUMNS.length + 1;
  sheet.getRange(CONFIG.HEADER_ROW, summaryStartCol, 1, CONFIG.SUMMARY_COLUMNS.length)
    .setBackground('#1B5E20');

  SpreadsheetApp.getActiveSpreadsheet().toast('Headers formatted!', 'Complete', 3);
}


// ============================================
// SUMMARY FORMULAS
// ============================================

/**
 * Adds summary formulas to the current sheet
 */
function addSummaryFormulas() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();

  // Find where schedule columns end (before summary columns)
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let scheduleEndCol = lastCol;

  for (let i = headers.length - 1; i >= 0; i--) {
    if (CONFIG.SUMMARY_COLUMNS.includes(headers[i])) {
      scheduleEndCol = i; // 0-indexed, so this is the column before
    }
  }

  const daysInSchedule = scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1;
  addSummaryFormulasToSheet(sheet, daysInSchedule);
}

/**
 * Adds summary formulas to a specific sheet
 */
function addSummaryFormulasToSheet(sheet, daysInMonth) {
  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return;

  const scheduleStartCol = CONFIG.SCHEDULE_START_COL;
  const scheduleEndCol = scheduleStartCol + daysInMonth - 1;

  // Column letters for formulas
  const startColLetter = columnToLetter(scheduleStartCol);
  const endColLetter = columnToLetter(scheduleEndCol);

  // Summary column positions
  const workDaysCol = scheduleEndCol + 1;
  const vacationsCol = scheduleEndCol + 2;
  const holidaysCol = scheduleEndCol + 3;
  const sickDaysCol = scheduleEndCol + 4;

  // Add headers if not present
  sheet.getRange(1, workDaysCol).setValue('Work Days');
  sheet.getRange(1, vacationsCol).setValue('Vacations');
  sheet.getRange(1, holidaysCol).setValue('Holidays');
  sheet.getRange(1, sickDaysCol).setValue('Sick Days');

  // Add formulas for each row
  for (let row = CONFIG.DATA_START_ROW; row <= lastRow; row++) {
    const rangeStr = `${startColLetter}${row}:${endColLetter}${row}`;

    // Work Days: Count cells with time pattern (contains ":")
    sheet.getRange(row, workDaysCol).setFormula(
      `=SUMPRODUCT(--ISNUMBER(SEARCH(":",${rangeStr})))`
    );

    // Vacations: Count "Vacation"
    sheet.getRange(row, vacationsCol).setFormula(
      `=COUNTIF(${rangeStr},"*Vacation*")`
    );

    // Holidays: Count "Holiday"
    sheet.getRange(row, holidaysCol).setFormula(
      `=COUNTIF(${rangeStr},"*Holiday*")`
    );

    // Sick Days: Count "Sick"
    sheet.getRange(row, sickDaysCol).setFormula(
      `=COUNTIF(${rangeStr},"*Sick*")`
    );
  }

  // Format summary columns
  const summaryRange = sheet.getRange(CONFIG.DATA_START_ROW, workDaysCol, lastRow - CONFIG.DATA_START_ROW + 1, 4);
  summaryRange
    .setHorizontalAlignment('center')
    .setNumberFormat('0');

  SpreadsheetApp.getActiveSpreadsheet().toast('Summary formulas added!', 'Complete', 3);
}

/**
 * Recalculates all summaries
 */
function recalculateAllSummaries() {
  addSummaryFormulas();
}

/**
 * Converts column number to letter
 */
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
// EMAIL REMINDERS
// ============================================

/**
 * Sends reminder emails to all managers
 */
function sendReminderToAll() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Send Reminders',
    'This will send email reminders to all managers.\n\n' +
    'Note: You need to have a "Manager Emails" sheet with columns:\n' +
    'Manager Name | Email\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const emailSheet = ss.getSheetByName('Manager Emails');

  if (!emailSheet) {
    ui.alert('Error', 'Please create a "Manager Emails" sheet with columns: Manager Name, Email', ui.ButtonSet.OK);
    createEmailTemplateSheet();
    return;
  }

  const emailData = emailSheet.getRange(2, 1, emailSheet.getLastRow() - 1, 2).getValues();
  const nextMonth = getNextMonthName();

  let sentCount = 0;
  let errorCount = 0;

  emailData.forEach(row => {
    const name = row[0];
    const email = row[1];

    if (email && email.includes('@')) {
      try {
        sendReminderEmail(name, email, nextMonth);
        sentCount++;
      } catch (e) {
        errorCount++;
        console.error(`Failed to send email to ${email}: ${e.message}`);
      }
    }
  });

  ui.alert('Complete', `Sent ${sentCount} reminders. ${errorCount} failed.`, ui.ButtonSet.OK);
}

/**
 * Sends reminder email to a single manager
 */
function sendReminderEmail(name, email, monthName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetUrl = ss.getUrl();

  const subject = `${CONFIG.EMAIL_SUBJECT} - ${monthName}`;
  const body = `
Hello ${name},

This is a friendly reminder to fill in your schedule for ${monthName}.

Please access the schedule sheet here:
${sheetUrl}

Please complete your schedule by selecting your working hours, days off, vacations, or holidays for each day.

Thank you!

---
This is an automated message from the Schedule Management System.
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });
}

/**
 * Creates a template sheet for manager emails
 */
function createEmailTemplateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Manager Emails');

  if (!sheet) {
    sheet = ss.insertSheet('Manager Emails');
    sheet.getRange('A1:B1').setValues([['Manager Name', 'Email']]);
    sheet.getRange('A1:B1')
      .setBackground(CONFIG.COLORS.HEADER)
      .setFontColor(CONFIG.COLORS.HEADER_TEXT)
      .setFontWeight('bold');

    // Add sample data
    sheet.getRange('A2:B2').setValues([['Sample Manager', 'manager@example.com']]);

    sheet.autoResizeColumns(1, 2);
  }

  ss.setActiveSheet(sheet);
}

/**
 * Gets the next month name
 */
function getNextMonthName() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return monthNames[nextMonth.getMonth()] + ' ' + nextMonth.getFullYear();
}

/**
 * Sets up automatic monthly reminders
 */
function setupAutomaticReminders() {
  // Remove existing reminder triggers
  removeAutomaticReminders();

  // Create new trigger to run on the 25th of each month
  ScriptApp.newTrigger('automaticMonthlyReminder')
    .timeBased()
    .onMonthDay(25)
    .atHour(9)
    .create();

  SpreadsheetApp.getUi().alert('Success', 'Automatic reminders set up! Emails will be sent on the 25th of each month.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Removes automatic reminder triggers
 */
function removeAutomaticReminders() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'automaticMonthlyReminder') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  SpreadsheetApp.getActiveSpreadsheet().toast('Automatic reminders removed.', 'Complete', 3);
}

/**
 * Automatic monthly reminder function (called by trigger)
 */
function automaticMonthlyReminder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const emailSheet = ss.getSheetByName('Manager Emails');

  if (!emailSheet) return;

  const emailData = emailSheet.getRange(2, 1, emailSheet.getLastRow() - 1, 2).getValues();
  const nextMonth = getNextMonthName();

  emailData.forEach(row => {
    const name = row[0];
    const email = row[1];

    if (email && email.includes('@')) {
      try {
        sendReminderEmail(name, email, nextMonth);
      } catch (e) {
        console.error(`Failed to send email to ${email}: ${e.message}`);
      }
    }
  });
}


// ============================================
// REPORTS
// ============================================

/**
 * Generates a monthly summary report
 */
function generateMonthlySummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = SpreadsheetApp.getActiveSheet();

  // Create or get summary sheet
  let summarySheet = ss.getSheetByName('Monthly Summary');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Monthly Summary');
  } else {
    summarySheet.clear();
  }

  // Get data from source sheet
  const lastRow = sourceSheet.getLastRow();
  const lastCol = sourceSheet.getLastColumn();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Error', 'No data to summarize.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Headers for summary
  const summaryHeaders = ['Region', 'Total Managers', 'Total Work Days', 'Total Vacations', 'Total Holidays', 'Total Sick Days', 'Avg Work Days'];
  summarySheet.getRange(1, 1, 1, summaryHeaders.length).setValues([summaryHeaders]);

  // Get all data
  const data = sourceSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // Group by region
  const regionStats = {};

  data.forEach(row => {
    const region = row[1] || 'Unknown';
    const workDays = parseFloat(row[lastCol - 4]) || 0;
    const vacations = parseFloat(row[lastCol - 3]) || 0;
    const holidays = parseFloat(row[lastCol - 2]) || 0;
    const sickDays = parseFloat(row[lastCol - 1]) || 0;

    if (!regionStats[region]) {
      regionStats[region] = {
        count: 0,
        workDays: 0,
        vacations: 0,
        holidays: 0,
        sickDays: 0
      };
    }

    regionStats[region].count++;
    regionStats[region].workDays += workDays;
    regionStats[region].vacations += vacations;
    regionStats[region].holidays += holidays;
    regionStats[region].sickDays += sickDays;
  });

  // Build summary rows
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

  // Add totals row
  const totals = Object.values(regionStats).reduce((acc, stats) => {
    acc.count += stats.count;
    acc.workDays += stats.workDays;
    acc.vacations += stats.vacations;
    acc.holidays += stats.holidays;
    acc.sickDays += stats.sickDays;
    return acc;
  }, { count: 0, workDays: 0, vacations: 0, holidays: 0, sickDays: 0 });

  summaryRows.push([
    'TOTAL',
    totals.count,
    totals.workDays,
    totals.vacations,
    totals.holidays,
    totals.sickDays,
    (totals.workDays / totals.count).toFixed(1)
  ]);

  // Write data
  summarySheet.getRange(2, 1, summaryRows.length, summaryHeaders.length).setValues(summaryRows);

  // Format
  summarySheet.getRange(1, 1, 1, summaryHeaders.length)
    .setBackground(CONFIG.COLORS.HEADER)
    .setFontColor(CONFIG.COLORS.HEADER_TEXT)
    .setFontWeight('bold');

  summarySheet.getRange(summaryRows.length + 1, 1, 1, summaryHeaders.length)
    .setBackground('#E8F5E9')
    .setFontWeight('bold');

  summarySheet.autoResizeColumns(1, summaryHeaders.length);

  ss.setActiveSheet(summarySheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Monthly summary generated!', 'Complete', 3);
}

/**
 * Generates a coverage report showing who's working each day
 */
function generateCoverageReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = SpreadsheetApp.getActiveSheet();

  // Create or get coverage sheet
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

  // Get headers and data
  const headers = sourceSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = sourceSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // Find day columns
  const dayColumns = [];
  for (let i = CONFIG.SCHEDULE_START_COL - 1; i < headers.length - CONFIG.SUMMARY_COLUMNS.length; i++) {
    dayColumns.push({ index: i, header: headers[i] });
  }

  // Coverage headers
  const coverageHeaders = ['Date', 'Working', 'Day Off', 'Vacation', 'Holiday', 'Sick', 'Coverage %'];
  coverageSheet.getRange(1, 1, 1, coverageHeaders.length).setValues([coverageHeaders]);

  // Calculate coverage for each day
  const coverageRows = dayColumns.map(day => {
    let working = 0, dayOff = 0, vacation = 0, holiday = 0, sick = 0, empty = 0;

    data.forEach(row => {
      const value = row[day.index];
      if (!value) {
        empty++;
      } else if (value.toString().includes(':')) {
        working++;
      } else if (value.toString().toLowerCase().includes('day off')) {
        dayOff++;
      } else if (value.toString().toLowerCase().includes('vacation')) {
        vacation++;
      } else if (value.toString().toLowerCase().includes('holiday')) {
        holiday++;
      } else if (value.toString().toLowerCase().includes('sick')) {
        sick++;
      }
    });

    const total = data.length;
    const coveragePercent = ((working / total) * 100).toFixed(1);

    return [day.header, working, dayOff, vacation, holiday, sick, coveragePercent + '%'];
  });

  coverageSheet.getRange(2, 1, coverageRows.length, coverageHeaders.length).setValues(coverageRows);

  // Format
  coverageSheet.getRange(1, 1, 1, coverageHeaders.length)
    .setBackground(CONFIG.COLORS.HEADER)
    .setFontColor(CONFIG.COLORS.HEADER_TEXT)
    .setFontWeight('bold');

  // Conditional formatting for coverage percentage
  const coverageRange = coverageSheet.getRange(2, 7, coverageRows.length, 1);

  coverageSheet.autoResizeColumns(1, coverageHeaders.length);

  ss.setActiveSheet(coverageSheet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Coverage report generated!', 'Complete', 3);
}


// ============================================
// HELP & DOCUMENTATION
// ============================================

/**
 * Shows help documentation
 */
function showHelp() {
  const ui = SpreadsheetApp.getUi();

  const helpText = `
SCHEDULE MANAGER - HELP

QUICK START:
1. Run "Initial Setup" from the menu to configure everything
2. Use "Generate Next Month Sheet" to create new monthly sheets
3. Managers fill in their schedules using the dropdowns

FEATURES:

Auto-Coloring:
- Yellow = Holiday
- Green = Vacation
- Red = Sick Leave
- Blue = Day Off
- White = Work Hours

Monthly Operations:
- Generate sheets for any month
- Manager info is copied automatically
- Summary formulas are added automatically

Email Reminders:
- Create "Manager Emails" sheet with name and email columns
- Send manual reminders or set up automatic monthly reminders

Reports:
- Monthly Summary: Stats grouped by region
- Coverage Report: Daily staffing levels

KEYBOARD SHORTCUTS:
None - use the Schedule Manager menu

SUPPORT:
Contact your administrator for help.
  `;

  ui.alert('Schedule Manager Help', helpText, ui.ButtonSet.OK);
}


// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validates that all managers have filled their schedule
 */
function validateScheduleCompletion() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  const scheduleEndCol = lastCol - CONFIG.SUMMARY_COLUMNS.length;
  const scheduleRange = sheet.getRange(
    CONFIG.DATA_START_ROW,
    CONFIG.SCHEDULE_START_COL,
    lastRow - CONFIG.DATA_START_ROW + 1,
    scheduleEndCol - CONFIG.SCHEDULE_START_COL + 1
  );

  const values = scheduleRange.getValues();
  const names = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.MANAGER_NAME_COL, lastRow - CONFIG.DATA_START_ROW + 1, 1).getValues();

  const incomplete = [];

  values.forEach((row, index) => {
    const emptyCount = row.filter(cell => !cell).length;
    if (emptyCount > 0) {
      incomplete.push({
        name: names[index][0],
        missing: emptyCount
      });
    }
  });

  if (incomplete.length === 0) {
    SpreadsheetApp.getUi().alert('Complete', 'All managers have completed their schedules!', SpreadsheetApp.getUi().ButtonSet.OK);
  } else {
    const message = incomplete.map(m => `${m.name}: ${m.missing} days missing`).join('\n');
    SpreadsheetApp.getUi().alert('Incomplete Schedules', message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Exports the current month data to JSON (for integration with other systems)
 */
function exportToJson() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const jsonData = data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  console.log(JSON.stringify(jsonData, null, 2));
  SpreadsheetApp.getUi().alert('Export Complete', 'JSON data has been logged to the console. Check View > Logs.', SpreadsheetApp.getUi().ButtonSet.OK);
}
