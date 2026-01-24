/**
 * HIGHEST PAYMENTS THIS WEEK
 *
 * Tracks top earners by cash generated
 * Shows: Manager name, Region, Payment amount, User ID (for @mentions)
 *
 * Manual editing in sheet before posting
 */

/**
 * CREATE HIGHEST PAYMENTS SHEET
 * Run this to create the tracking sheet
 */
function createHighestPaymentsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Highest Payments");

  if (sheet) {
    const response = SpreadsheetApp.getUi().alert(
      'Sheet Exists',
      'Highest Payments sheet already exists. Recreate it?',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );

    if (response === SpreadsheetApp.getUi().Button.YES) {
      ss.deleteSheet(sheet);
    } else {
      return;
    }
  }

  sheet = ss.insertSheet("Highest Payments");

  // Header
  sheet.getRange("A1").setValue("💰 HIGHEST PAYMENTS THIS WEEK - TOP 5");
  sheet.getRange("A1:E1").merge();
  sheet.getRange("A1:E1").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(14);

  // Column headers
  const headers = ["Week", "Rank", "Manager Name", "Region", "Payment ($)", "Slack User ID"];
  sheet.getRange("A2:F2").setValues([headers]);
  sheet.getRange("A2:F2").setBackground("#C8E6C9").setFontWeight("bold");

  // Sample data
  const currentWeek = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");
  const sampleData = [
    [currentWeek, 1, "John Smith", "TR", 16100, "U02905GQ32R"],
    [currentWeek, 2, "Maria Garcia", "ES", 14500, "U02905GQ33S"],
    [currentWeek, 3, "Omar Al-Farsi", "ARAB", 13200, "U02905GQ34T"],
    [currentWeek, 4, "James Lee", "PL", 12800, "U02905GQ35U"],
    [currentWeek, 5, "Rachel Green", "CZ", 12500, "U02905GQ36V"]
  ];
  sheet.getRange("A3:F7").setValues(sampleData);

  // Set column widths
  sheet.setColumnWidth(1, 100);  // Week
  sheet.setColumnWidth(2, 60);   // Rank
  sheet.setColumnWidth(3, 150);  // Manager Name
  sheet.setColumnWidth(4, 100);  // Region
  sheet.setColumnWidth(5, 120);  // Payment
  sheet.setColumnWidth(6, 150);  // User ID

  // Borders
  sheet.getRange("A2:F7").setBorder(true, true, true, true, true, true);

  // Instructions
  sheet.getRange("A9").setValue("📝 INSTRUCTIONS:");
  sheet.getRange("A9").setFontWeight("bold").setFontSize(11);

  const instructions = [
    ["• Update this weekly with top 5 earners by cash generated"],
    ["• Rank: 1-5 based on payment amount"],
    ["• Manager Name: Full name (or use @mentions like '@Sami')"],
    ["• Region: Country code (TR, ES, ARAB, etc.)"],
    ["• Payment: Dollar amount (no $ symbol, just number like 16100)"],
    ["• Slack User ID: User's Slack ID for @mentions (e.g., U02905GQ32R)"],
    [""],
    ["💡 TIP: If you put '@Sami' in Manager Name AND provide User ID,"],
    ["         the system will tag them in Slack when posting!"]
  ];
  sheet.getRange("A10:A18").setValues(instructions);

  Logger.log("✅ Highest Payments sheet created!");

  SpreadsheetApp.getUi().alert(
    '✅ Created!',
    'Highest Payments sheet has been created.\n\n' +
    'Update it weekly with:\n' +
    '• Top 5 earners\n' +
    '• Manager names (can use @mentions)\n' +
    '• Payment amounts\n' +
    '• Slack User IDs for tagging\n\n' +
    'The leaderboard will show: "💰 HIGHEST PAYMENTS THIS WEEK"',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * GET HIGHEST PAYMENTS DATA
 * Returns formatted data for display in leaderboard
 */
function getHighestPaymentsData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Highest Payments");

    if (!sheet) {
      Logger.log("⚠️ Highest Payments sheet not found");
      return [];
    }

    // Get data (skip header rows)
    const data = sheet.getRange("A3:F7").getValues();
    const payments = [];

    data.forEach(row => {
      const week = row[0];
      const rank = row[1];
      const managerName = row[2] ? String(row[2]).trim() : '';
      const region = row[3] ? String(row[3]).trim() : '';
      const payment = row[4];
      const userId = row[5] ? String(row[5]).trim() : '';

      if (managerName && payment) {
        payments.push({
          rank: rank,
          managerName: managerName,
          region: region,
          payment: payment,
          userId: userId
        });
      }
    });

    return payments;

  } catch (error) {
    Logger.log(`Error getting highest payments: ${error.message}`);
    return [];
  }
}

/**
 * BUILD HIGHEST PAYMENTS BLOCK FOR LEADERBOARD
 * Returns formatted block for Slack display
 */
function buildHighestPaymentsBlock() {
  const paymentsData = getHighestPaymentsData();

  if (paymentsData.length === 0) {
    return null;
  }

  let paymentsText = "";

  paymentsData.forEach(payment => {
    const rankEmoji = getRankEmoji(payment.rank);
    const regionEmoji = getRegionSlackEmoji(payment.region);

    // Format payment with commas
    const formattedPayment = typeof payment.payment === 'number'
      ? payment.payment.toLocaleString('en-US')
      : payment.payment;

    // Process manager name for @mentions
    let displayName = payment.managerName;

    // If user ID is provided, create Slack mention
    if (payment.userId && payment.userId.startsWith('U') && payment.userId.length >= 9) {
      // Replace @Name with <@USERID> for Slack
      if (displayName.startsWith('@')) {
        displayName = `<@${payment.userId}>`;
      } else {
        // Or just show name with optional mention
        displayName = `*${displayName}*`;
      }
    } else {
      // Apply manager mentions function if available
      displayName = typeof applyManagerMentions === 'function'
        ? applyManagerMentions(displayName)
        : `*${displayName}*`;
    }

    paymentsText += `${rankEmoji} ${displayName}`;
    if (regionEmoji) {
      paymentsText += ` ${regionEmoji}`;
    }
    paymentsText += `\n   └ Payment: *$${formattedPayment}*`;
    if (payment.region) {
      paymentsText += ` | ${payment.region}`;
    }
    paymentsText += `\n\n`;
  });

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*💰 HIGHEST PAYMENTS THIS WEEK - TOP 5*\n\n${paymentsText}`
    }
  };
}
