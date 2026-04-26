/**
 * WEEKLY LEADERBOARD ARCHIVER
 * Automatically saves a copy of the current week's data for historical tracking
 */

/**
 * ARCHIVE CURRENT WEEK
 * Copies the current week's leaderboard data to the archive sheet
 * Run this at the end of each week before updating data for the new week
 */
function archiveCurrentWeek() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("Weekly Leaderboard");

  if (!sourceSheet) {
    SpreadsheetApp.getUi().alert("Error", "Weekly Leaderboard sheet not found!", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Get or create archive sheet
  let archiveSheet = ss.getSheetByName("Weekly Archive");
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet("Weekly Archive");

    // Set up archive headers
    archiveSheet.getRange("A1").setValue("📊 WEEKLY LEADERBOARD ARCHIVE");
    archiveSheet.getRange("A1:K1").merge();
    archiveSheet.getRange("A1:K1").setBackground("#1A237E").setFontColor("white").setFontWeight("bold").setFontSize(14);

    archiveSheet.getRange("A2").setValue("Archive Date");
    archiveSheet.getRange("B2").setValue("Week");
    archiveSheet.getRange("C2").setValue("Section");
    archiveSheet.getRange("D2").setValue("Rank");
    archiveSheet.getRange("E2").setValue("Manager Name");
    archiveSheet.getRange("F2").setValue("Sales");
    archiveSheet.getRange("G2").setValue("WoW");
    archiveSheet.getRange("H2").setValue("Cash Generated");
    archiveSheet.getRange("I2").setValue("ARPU");
    archiveSheet.getRange("J2").setValue("Upsell Share");
    archiveSheet.getRange("K2").setValue("Region");

    archiveSheet.getRange("A2:K2").setBackground("#3F51B5").setFontColor("white").setFontWeight("bold");
    archiveSheet.setFrozenRows(2);

    // Set column widths
    archiveSheet.setColumnWidth(1, 120);  // Archive Date
    archiveSheet.setColumnWidth(2, 100);  // Week
    archiveSheet.setColumnWidth(3, 200);  // Section
    archiveSheet.setColumnWidth(4, 60);   // Rank
    archiveSheet.setColumnWidth(5, 150);  // Manager Name
    archiveSheet.setColumnWidth(6, 80);   // Sales
    archiveSheet.setColumnWidth(7, 80);   // WoW
    archiveSheet.setColumnWidth(8, 120);  // Cash Generated
    archiveSheet.setColumnWidth(9, 100);  // ARPU
    archiveSheet.setColumnWidth(10, 100); // Upsell Share
    archiveSheet.setColumnWidth(11, 80);  // Region
  }

  // Get current timestamp and week
  const archiveDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  const currentWeek = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");

  // Read data from source sheet
  const sections = [
    {name: "CP Current Base", range: "A21:I25"},
    {name: "CP Old Base", range: "A29:I33"},
    {name: "KB Current Base", range: "A37:I41"},
    {name: "KB Old Base", range: "A45:I49"}
  ];

  let archivedRows = [];

  sections.forEach(section => {
    const data = sourceSheet.getRange(section.range).getValues();

    data.forEach(row => {
      // Row format: [Week, Rank, Manager Name, Sales, WoW, Cash Generated, ARPU, Upsell Share, Region]
      const rank = row[1];
      const managerName = row[2];
      const sales = row[3];
      const wow = row[4];
      const cashGenerated = row[5];
      const arpu = row[6];
      const upsellShare = row[7];
      const region = row[8];

      // Only archive rows with data
      if (rank && managerName) {
        archivedRows.push([
          archiveDate,
          currentWeek,
          section.name,
          rank,
          managerName,
          sales,
          wow,
          cashGenerated,
          arpu,
          upsellShare,
          region
        ]);
      }
    });
  });

  // Archive Secondary Sales Plan
  const salesPlanData = sourceSheet.getRange("A3:E6").getValues();
  salesPlanData.forEach(row => {
    if (row[0] && row[1]) {  // If metric name and plan value exist
      archivedRows.push([
        archiveDate,
        currentWeek,
        `Sales Plan: ${row[0]}`,  // Metric name
        "-",
        "-",
        "-",
        "-",
        "-",
        row[1],  // Plan value (stored in ARPU column)
        row[2],  // Forecast (stored in Upsell Share column)
        "-"
      ]);
    }
  });

  // Archive Reactivation Results
  const reactivationData = sourceSheet.getRange("A116:E120").getValues();
  reactivationData.forEach(row => {
    const rank = row[1];
    const managerName = row[2];
    const numReturns = row[3];
    const region = row[4];

    if (rank && managerName) {
      archivedRows.push([
        archiveDate,
        currentWeek,
        "Reactivations",
        rank,
        managerName,
        numReturns,  // Use sales column for number of returns
        "-",
        "-",
        "-",
        "-",
        region
      ]);
    }
  });

  // Append to archive sheet
  if (archivedRows.length > 0) {
    const nextRow = archiveSheet.getLastRow() + 1;
    archiveSheet.getRange(nextRow, 1, archivedRows.length, 11).setValues(archivedRows);

    // Add borders to new data
    archiveSheet.getRange(nextRow, 1, archivedRows.length, 11).setBorder(
      true, true, true, true, true, true,
      "#CCCCCC",
      SpreadsheetApp.BorderStyle.SOLID
    );

    // Alternate row colors for readability
    for (let i = 0; i < archivedRows.length; i++) {
      if (i % 2 === 0) {
        archiveSheet.getRange(nextRow + i, 1, 1, 11).setBackground("#F5F5F5");
      }
    }

    SpreadsheetApp.getUi().alert(
      "✅ Archive Complete!",
      `Successfully archived ${archivedRows.length} rows from week ${currentWeek}.\n\n` +
      `The data has been saved to the "Weekly Archive" sheet.\n\n` +
      `You can now update the Weekly Leaderboard for next week.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    SpreadsheetApp.getUi().alert(
      "⚠️ No Data to Archive",
      "No leaderboard data found to archive. Please fill in the Weekly Leaderboard first.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * GET LAST WEEK'S DATA FOR A MANAGER
 * Looks up manager's performance from previous week for WoW calculations
 */
function getLastWeekData(managerName, section) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const archiveSheet = ss.getSheetByName("Weekly Archive");

  if (!archiveSheet) {
    return null;
  }

  const data = archiveSheet.getDataRange().getValues();

  // Get current week number
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekNum = Utilities.formatDate(lastWeek, Session.getScriptTimeZone(), "yyyy-'W'ww");

  // Find manager's data from last week
  for (let i = data.length - 1; i >= 2; i--) {  // Start from bottom (most recent)
    const row = data[i];
    const week = row[1];
    const sectionName = row[2];
    const name = row[4];
    const sales = row[5];

    if (week === lastWeekNum && name === managerName && sectionName === section) {
      return {
        sales: sales,
        arpu: row[8],
        upsellShare: row[9]
      };
    }
  }

  return null;
}

/**
 * AUTO-CALCULATE WOW FOR ALL MANAGERS
 * Looks up last week's archive data and fills in WoW column automatically
 */
function autoCalculateWoW() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("Weekly Leaderboard");
  const archiveSheet = ss.getSheetByName("Weekly Archive");

  if (!sourceSheet) {
    SpreadsheetApp.getUi().alert("Error", "Weekly Leaderboard sheet not found!", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  if (!archiveSheet) {
    SpreadsheetApp.getUi().alert(
      "No Archive Found",
      "No Weekly Archive sheet found. Archive data from at least one previous week first.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  const sections = [
    {name: "CP Current Base", range: "D21:E25"},  // Sales and WoW columns
    {name: "CP Old Base", range: "D29:E33"},
    {name: "KB Current Base", range: "D37:E41"},
    {name: "KB Old Base", range: "D45:E49"}
  ];

  let updatedCount = 0;

  sections.forEach(section => {
    const managerNameRange = section.range.replace(/D(\d+):E(\d+)/, "C$1:C$2");
    const managers = sourceSheet.getRange(managerNameRange).getValues();
    const salesWoW = sourceSheet.getRange(section.range).getValues();

    for (let i = 0; i < managers.length; i++) {
      const managerName = managers[i][0];
      const currentSales = salesWoW[i][0];

      if (managerName && currentSales) {
        const lastWeekData = getLastWeekData(managerName, section.name);

        if (lastWeekData && lastWeekData.sales) {
          const diff = currentSales - lastWeekData.sales;
          const wowValue = diff >= 0 ? `+${diff}` : `${diff}`;

          salesWoW[i][1] = wowValue;  // Update WoW column
          updatedCount++;
        }
      }
    }

    // Write back WoW values
    sourceSheet.getRange(section.range).setValues(salesWoW);
  });

  SpreadsheetApp.getUi().alert(
    "✅ WoW Calculated!",
    `Auto-calculated Week-over-Week for ${updatedCount} managers based on archive data.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * ADD MENU ITEMS
 * Adds custom menu for all leaderboard and automation functions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('📊 Weekly Leaderboard')
    .addSubMenu(ui.createMenu('📦 Archive & History')
      .addItem('📦 Archive Current Week', 'archiveCurrentWeek')
      .addItem('📈 Auto-Calculate WoW', 'autoCalculateWoW')
      .addItem('📊 View Archive Sheet', 'viewArchiveSheet'))
    .addSeparator()
    .addSubMenu(ui.createMenu('📋 Template & Setup')
      .addItem('📋 Create New Leaderboard', 'createLeaderboardTemplateV2')
      .addItem('🔧 Refresh Template', 'refreshLeaderboardTemplate'))
    .addSeparator()
    .addSubMenu(ui.createMenu('📤 Slack Automation')
      .addItem('⚙️ Manage Automations', 'openSlackAutomationUI')
      .addItem('📤 Send to Slack Now', 'sendLeaderboardToSlackNow')
      .addItem('🧪 Test Slack Message', 'testLeaderboardSlackMessage')
      .addSeparator()
      .addItem('📝 Edit Message Template', 'editMessageTemplate')
      .addItem('💬 Manage Sent Messages', 'openMessageManager')
      .addSeparator()
      .addItem('⏰ Setup Schedule', 'showScheduleSetup')
      .addItem('📋 View Automations', 'viewSlackAutomations')
      .addSeparator()
      .addItem('🔧 Configure Channels', 'configureSlackChannels'))
    .addSeparator()
    .addItem('ℹ️ Help & Instructions', 'showInstructions')
    .addToUi();
}

/**
 * HELPER FUNCTIONS FOR MENU ITEMS
 */

function viewArchiveSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const archiveSheet = ss.getSheetByName("Weekly Archive");

  if (archiveSheet) {
    ss.setActiveSheet(archiveSheet);
    SpreadsheetApp.getUi().alert(
      "📊 Weekly Archive",
      "Viewing the Weekly Archive sheet with historical data.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    SpreadsheetApp.getUi().alert(
      "No Archive Found",
      "No Weekly Archive sheet exists yet. Run 'Archive Current Week' first to create it.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

function refreshLeaderboardTemplate() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '🔧 Refresh Template',
    'This will update the Weekly Leaderboard template structure to the latest version.\n\n' +
    'WARNING: This will NOT delete your data, but will update formatting and add any new sections.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    createLeaderboardTemplateV2();
  }
}

function sendLeaderboardToSlackNow() {
  const ui = SpreadsheetApp.getUi();

  // Check if automation exists
  const automations = typeof getSlackAutomations === 'function' ? getSlackAutomations() : [];
  const leaderboardAuto = automations.find(a =>
    a.targetSheet === "Weekly Leaderboard" ||
    a.name.toLowerCase().includes('leaderboard')
  );

  if (!leaderboardAuto) {
    ui.alert(
      "⚠️ No Automation Found",
      "No Slack automation found for the Weekly Leaderboard.\n\n" +
      "Please set up an automation first using 'Setup Schedule' or the Slack Automation Builder.",
      ui.ButtonSet.OK
    );
    return;
  }

  // Send immediately
  if (typeof buildCombinedLeaderboardFromSheet === 'function') {
    try {
      const message = buildCombinedLeaderboardFromSheet(leaderboardAuto);

      // Send to Slack
      const webhookUrl = leaderboardAuto.slackWebhookUrl;
      if (webhookUrl) {
        const options = {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(message),
          muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(webhookUrl, options);

        if (response.getResponseCode() === 200) {
          ui.alert(
            "✅ Sent to Slack!",
            "The Weekly Leaderboard has been sent to Slack successfully!",
            ui.ButtonSet.OK
          );
        } else {
          ui.alert(
            "❌ Error Sending",
            "Failed to send to Slack. Response: " + response.getContentText(),
            ui.ButtonSet.OK
          );
        }
      } else {
        ui.alert(
          "⚠️ No Webhook URL",
          "No Slack webhook URL configured. Please set up your automation first.",
          ui.ButtonSet.OK
        );
      }
    } catch (error) {
      ui.alert(
        "❌ Error",
        "Error sending to Slack: " + error.message,
        ui.ButtonSet.OK
      );
    }
  } else {
    ui.alert(
      "⚠️ Function Not Found",
      "buildCombinedLeaderboardFromSheet function not found. Make sure SlackAutomationBuilder.gs is included.",
      ui.ButtonSet.OK
    );
  }
}

function testLeaderboardSlackMessage() {
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    "🧪 Test Message",
    "This will generate a preview of how your Slack message will look.\n\n" +
    "The message will be logged to Apps Script logs (View > Logs).\n\n" +
    "Click OK to generate preview.",
    ui.ButtonSet.OK
  );

  const automations = typeof getSlackAutomations === 'function' ? getSlackAutomations() : [];
  const leaderboardAuto = automations.find(a =>
    a.targetSheet === "Weekly Leaderboard" ||
    a.name.toLowerCase().includes('leaderboard')
  ) || { targetSheet: "Weekly Leaderboard", slackWebhookUrl: "" };

  if (typeof buildCombinedLeaderboardFromSheet === 'function') {
    const message = buildCombinedLeaderboardFromSheet(leaderboardAuto);
    Logger.log("=== SLACK MESSAGE PREVIEW ===");
    Logger.log(JSON.stringify(message, null, 2));

    ui.alert(
      "✅ Preview Generated",
      "Message preview has been logged!\n\n" +
      "Go to: View > Logs to see the message structure.\n\n" +
      "Blocks count: " + (message.blocks ? message.blocks.length : 0),
      ui.ButtonSet.OK
    );
  }
}

function showScheduleSetup() {
  const ui = SpreadsheetApp.getUi();

  const html = `
    <div style="padding: 20px; font-family: Arial;">
      <h2>⏰ Schedule Setup</h2>
      <p>To schedule automated Slack messages:</p>

      <h3>Option 1: Time-Driven Trigger (Recommended)</h3>
      <ol>
        <li>Go to: <b>Extensions > Apps Script</b></li>
        <li>Click the <b>clock icon ⏰</b> (Triggers) on the left</li>
        <li>Click <b>+ Add Trigger</b></li>
        <li>Choose function: <b>executeBulkSlackAutomation</b></li>
        <li>Set event source: <b>Time-driven</b></li>
        <li>Choose: <b>Week timer</b></li>
        <li>Select day/time: e.g., <b>Monday 9-10am</b></li>
        <li>Click <b>Save</b></li>
      </ol>

      <h3>Option 2: Use Existing Automation</h3>
      <p>If you already have a Slack automation configured, make sure:</p>
      <ul>
        <li>Target Sheet: <b>Weekly Leaderboard</b></li>
        <li>Webhook URL is set</li>
        <li>Schedule is enabled</li>
      </ul>

      <p><b>Current Triggers:</b></p>
      <p>Go to <b>Apps Script > Triggers</b> to view/manage.</p>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(500)
    .setHeight(500);

  ui.showModalDialog(htmlOutput, '⏰ Schedule Setup Guide');
}

function viewSlackAutomations() {
  const ui = SpreadsheetApp.getUi();

  if (typeof getSlackAutomations === 'function') {
    const automations = getSlackAutomations();

    let message = "📋 Configured Slack Automations:\n\n";

    if (automations.length === 0) {
      message += "No automations found.\n\n";
      message += "To create an automation, you need to use the Slack Automation Builder functions.";
    } else {
      automations.forEach((auto, idx) => {
        message += `${idx + 1}. ${auto.name || 'Unnamed'}\n`;
        message += `   Sheet: ${auto.targetSheet}\n`;
        message += `   Enabled: ${auto.enabled ? 'Yes' : 'No'}\n`;
        message += `   Schedule: ${auto.schedule && auto.schedule.enabled ? 'Yes' : 'No'}\n`;
        message += `\n`;
      });
    }

    ui.alert("📋 Slack Automations", message, ui.ButtonSet.OK);
  } else {
    ui.alert(
      "⚠️ Function Not Found",
      "getSlackAutomations function not found. Make sure SlackAutomationBuilder.gs is included.",
      ui.ButtonSet.OK
    );
  }
}

function showInstructions() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const instructionSheet = ss.getSheetByName("Leaderboard Instructions");

  if (instructionSheet) {
    ss.setActiveSheet(instructionSheet);
    ui.alert(
      "📖 Instructions",
      "Viewing the Leaderboard Instructions sheet.",
      ui.ButtonSet.OK
    );
  } else {
    ui.alert(
      "📖 Quick Help",
      "WEEKLY WORKFLOW:\n\n" +
      "1. 📦 Archive Current Week (before updating data)\n" +
      "2. Update sales numbers in Weekly Leaderboard\n" +
      "3. 📈 Auto-Calculate WoW (fills WoW column)\n" +
      "4. 📤 Send to Slack Now (or wait for scheduled send)\n\n" +
      "SETUP:\n" +
      "• ⏰ Setup Schedule - Configure weekly automation\n" +
      "• 📋 Create New Leaderboard - Generate template\n\n" +
      "TIPS:\n" +
      "• Update ARPU Plans monthly (Section 15)\n" +
      "• Archive weekly for WoW calculations\n" +
      "• Use Test Slack Message to preview",
      ui.ButtonSet.OK
    );
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SLACK AUTOMATION UI FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * OPEN SLACK AUTOMATION UI
 * Opens the comprehensive Slack automation configuration interface
 */
function openSlackAutomationUI() {
  const html = HtmlService.createHtmlOutputFromFile('SlackAutomationScheduler')
    .setWidth(1200)
    .setHeight(800)
    .setTitle('📤 Slack Automation Manager');

  SpreadsheetApp.getUi().showModalDialog(html, '📤 Slack Automation Manager');
}

/**
 * GET SLACK CONFIGURATION
 * Returns Slack bot token status and available channels for the UI
 */
function getSlackConfiguration() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('SLACK_BOT_TOKEN');
  const channelsStr = props.getProperty('SLACK_CHANNELS');
  const defaultChannel = props.getProperty('SLACK_CHANNEL');

  let channels = [];

  // Parse SLACK_CHANNELS (comma-separated)
  if (channelsStr) {
    channels = channelsStr.split(',').map(ch => ch.trim()).filter(ch => ch);
  }

  // Add default channel if exists
  if (defaultChannel && !channels.includes(defaultChannel)) {
    channels.push(defaultChannel);
  }

  // Add example channels if none configured
  if (channels.length === 0) {
    channels = ['#weekly-updates', '#daily-reports', '#alerts'];
  }

  return {
    hasBotToken: !!botToken,
    channels: channels,
    defaultChannel: defaultChannel || channels[0] || '#weekly-updates'
  };
}

/**
 * GET DATA FOR SLACK AUTOMATION FORM
 * Returns all data needed by the SlackAutomationScheduler UI
 */
function getDataForSlackAutomationForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const sheetNames = sheets.map(sheet => sheet.getName());

  // Get existing automations
  const existingAutomations = getSlackAutomations();

  // Get sample sheet data for the first sheet
  let sampleData = [];
  let headerRow = [];
  if (sheets.length > 0) {
    const firstSheet = sheets[0];
    const lastRow = Math.min(firstSheet.getLastRow(), 10);
    const lastCol = firstSheet.getLastColumn();

    if (lastRow > 0 && lastCol > 0) {
      headerRow = firstSheet.getRange(1, 1, 1, lastCol).getValues()[0];
      if (lastRow > 1) {
        sampleData = firstSheet.getRange(2, 1, Math.min(lastRow - 1, 5), lastCol).getValues();
      }
    }
  }

  return {
    sheets: sheetNames,
    existingAutomations: existingAutomations,
    sampleData: sampleData,
    headerRow: headerRow
  };
}

/**
 * GET WEB APP URL
 * Returns the web app URL for templates (if deployed)
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * GET USE CASES
 * Returns template/use case examples for the UI
 */
function getUseCases() {
  return {
    templates: [
      {
        title: "Weekly Leaderboard",
        description: "Send weekly performance leaderboard to Slack",
        triggerType: "bulkCriteria",
        schedule: {enabled: true, days: ["Monday"], hour: 9}
      },
      {
        title: "Daily Sales Report",
        description: "Send daily sales summary",
        triggerType: "bulkCriteria",
        schedule: {enabled: true, days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], hour: 8}
      },
      {
        title: "New Row Alert",
        description: "Send notification when new row is added",
        triggerType: "onNewRow"
      }
    ]
  };
}

/**
 * DELETE AUTOMATION
 * Deletes a Slack automation by ID
 */
function deleteAutomation(automationId) {
  try {
    const automations = getSlackAutomations();
    const updatedAutomations = automations.filter(a => a.id !== automationId);

    // Delete associated triggers
    deleteSlackTriggers(automationId);

    // Save updated list
    PropertiesService.getScriptProperties().setProperty(
      'slackAutomations',
      JSON.stringify(updatedAutomations)
    );

    return {success: true, message: 'Automation deleted successfully'};
  } catch (e) {
    return {success: false, error: e.message};
  }
}

/**
 * OPEN MESSAGE MANAGER
 * Opens the message management interface
 */
function openMessageManager() {
  const ui = SpreadsheetApp.getUi();
  const html = `
    <div style="padding: 20px; font-family: Arial;">
      <h2>💬 Message Manager</h2>
      <p>To manage sent Slack messages, use the main <b>Slack Automation Manager</b>:</p>
      <ol>
        <li>Go to: <b>📊 Weekly Leaderboard > 📤 Slack Automation > ⚙️ Manage Automations</b></li>
        <li>Click the <b>"Manage Messages"</b> button in the header</li>
        <li>You can view, edit, and delete sent messages</li>
      </ol>

      <h3>Requirements:</h3>
      <ul>
        <li>✅ <b>SLACK_BOT_TOKEN</b> must be configured in Script Properties</li>
        <li>✅ Only messages sent with Bot Token can be managed</li>
        <li>✅ Messages sent with webhooks cannot be deleted</li>
      </ul>

      <h3>Quick Actions:</h3>
      <p><b>Delete a message:</b> Find it in Message Manager and click Delete</p>
      <p><b>Edit a message:</b> Use the Edit Message Template option</p>
      <p><b>Bulk delete old messages:</b> Use the "Clear Old Messages" button</p>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(500)
    .setHeight(450);

  ui.showModalDialog(htmlOutput, '💬 Message Manager Guide');
}

/**
 * EDIT MESSAGE TEMPLATE
 * Opens interface to edit message template for automations
 */
function editMessageTemplate() {
  const ui = SpreadsheetApp.getUi();
  const html = `
    <div style="padding: 20px; font-family: Arial;">
      <h2>📝 Edit Message Template</h2>
      <p>To edit your Slack message template:</p>

      <h3>Option 1: Use Automation Manager (Recommended)</h3>
      <ol>
        <li>Go to: <b>📊 Weekly Leaderboard > 📤 Slack Automation > ⚙️ Manage Automations</b></li>
        <li>Click on an existing automation to edit it</li>
        <li>Update the message template in the "Message Template" field</li>
        <li>Use placeholders like <code>{{Column Name}}</code> for dynamic content</li>
        <li>Click Save</li>
      </ol>

      <h3>Option 2: Edit Code Directly</h3>
      <ol>
        <li>Go to: <b>Extensions > Apps Script</b></li>
        <li>Find <b>SlackAutomationBuilder.gs</b></li>
        <li>Locate the <code>buildCombinedLeaderboardFromSheet</code> function</li>
        <li>Edit the message formatting code</li>
        <li>Save and test with <b>🧪 Test Slack Message</b></li>
      </ol>

      <h3>Available Placeholders:</h3>
      <ul>
        <li><code>{{Column Name}}</code> - Insert value from specific column</li>
        <li><code>{{Row Number}}</code> - Current row number</li>
        <li><b>Emojis:</b> Use any emoji directly (✅, 🏆, 📊, etc.)</li>
        <li><b>Formatting:</b> Use Slack markdown (*bold*, _italic_)</li>
        <li><b>Mentions:</b> Use <code>&lt;@USER_ID&gt;</code> or <code>&lt;!channel&gt;</code></li>
      </ul>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(500);

  ui.showModalDialog(htmlOutput, '📝 Edit Message Template');
}

/**
 * CONFIGURE SLACK CHANNELS
 * Opens interface to configure Slack channels
 */
function configureSlackChannels() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const currentChannels = props.getProperty('SLACK_CHANNELS') || '';
  const botToken = props.getProperty('SLACK_BOT_TOKEN') || '';

  const html = `
    <div style="padding: 20px; font-family: Arial;">
      <h2>🔧 Configure Slack Channels</h2>

      <h3>Current Configuration:</h3>
      <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0;">
        <p><b>Bot Token:</b> ${botToken ? '✅ Configured' : '❌ Not configured'}</p>
        <p><b>Channels:</b> ${currentChannels || '❌ Not configured'}</p>
      </div>

      <h3>Setup Instructions:</h3>
      <ol>
        <li>Go to: <b>Extensions → Apps Script</b></li>
        <li>Click <b>Project Settings ⚙️</b> (gear icon on left)</li>
        <li>Scroll to <b>Script Properties</b></li>
        <li>Add/Edit the following properties:</li>
      </ol>

      <h4>Required Properties:</h4>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tr style="background: #e3f2fd;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Property</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Value</th>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><code>SLACK_BOT_TOKEN</code></td>
          <td style="border: 1px solid #ddd; padding: 8px;">Your bot token (starts with <code>xoxb-</code>)</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><code>SLACK_CHANNELS</code></td>
          <td style="border: 1px solid #ddd; padding: 8px;">Comma-separated list: <code>#weekly-updates,#daily-reports,#alerts</code></td>
        </tr>
      </table>

      <h3>Channel Formats:</h3>
      <ul>
        <li><b>Channel name:</b> <code>#weekly-updates</code></li>
        <li><b>Channel ID:</b> <code>C01234ABCD</code></li>
        <li><b>Multiple channels:</b> <code>#weekly-updates,#daily-reports,C01234ABCD</code></li>
      </ul>

      <h3>After Configuring:</h3>
      <ol>
        <li>Refresh your Google Sheet (close and reopen)</li>
        <li>Go to <b>⚙️ Manage Automations</b></li>
        <li>Create or edit an automation</li>
        <li>You'll see your channels in the dropdown!</li>
      </ol>

      <p style="background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107;">
        <b>💡 Tip:</b> If you don't have a bot token yet, see the documentation for how to create one in your Slack workspace settings.
      </p>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(700)
    .setHeight(600);

  ui.showModalDialog(htmlOutput, '🔧 Configure Slack Channels');
}
