/**
 * Key Metrics Weekly Template Creator
 * Creates a pre-formatted "Key Metrics Weekly" sheet with all sections and sample data
 *
 * Run createKeyMetricsWeeklySheet() to create the template
 */

function createKeyMetricsWeeklySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check if sheet already exists
  let sheet = ss.getSheetByName("Key Metrics Weekly");
  if (sheet) {
    const response = Browser.msgBox(
      'Sheet Already Exists',
      'A sheet named "Key Metrics Weekly" already exists. Do you want to delete it and create a new one?',
      Browser.Buttons.YES_NO
    );

    if (response === 'yes') {
      ss.deleteSheet(sheet);
    } else {
      Logger.log('Cancelled: Sheet already exists');
      return;
    }
  }

  // Create new sheet
  sheet = ss.insertSheet("Key Metrics Weekly");

  // Set column widths
  sheet.setColumnWidth(1, 180);  // A - Region/Category
  sheet.setColumnWidth(2, 120);  // B - Last week / Fact
  sheet.setColumnWidth(3, 120);  // C - Today / Plan
  sheet.setColumnWidth(4, 120);  // D - Forecast
  sheet.setColumnWidth(5, 120);  // E - Plan / Purch%
  sheet.setColumnWidth(6, 140);  // F - Status Icon / Revenue
  sheet.setColumnWidth(7, 140);  // G - Plan Revenue
  sheet.setColumnWidth(8, 120);  // H - Rev%

  let currentRow = 1;

  // ============================================
  // SECTION 1: KEY METRICS OVERVIEW
  // ============================================
  sheet.getRange("A1").setValue("📊 KEY METRICS OVERVIEW");
  sheet.getRange("A1:H1").merge();
  sheet.getRange("A1:H1").setBackground("#4A90E2").setFontColor("white").setFontWeight("bold").setFontSize(12).setHorizontalAlignment("center");

  currentRow = 2;

  // Headers
  const overviewHeaders = ["Metric", "Value", "Plan / Target", "Delta / WoW"];
  sheet.getRange("A2:D2").setValues([overviewHeaders]);
  sheet.getRange("A2:D2").setBackground("#D6EAF8").setFontWeight("bold").setHorizontalAlignment("center");

  // Sample data
  const overviewData = [
    ["Total Net Churn", "4.54%", "4.76%", "-0.22pp ✅"],
    ["ARPU Secondary", "$45.50", "$44.00", "+3.4% ↗️"],
    ["Total Purchase %", "94.8%", "90.0%", "+4.8pp ✅"],
    ["Total Revenue", "$1,517,158", "$1,500,000", "+1.1% ↗️"]
  ];
  sheet.getRange("A3:D6").setValues(overviewData);
  sheet.getRange("A3:D6").setBorder(true, true, true, true, true, true);

  currentRow = 8;

  // ============================================
  // SECTION 2: NET CHURN BY REGION
  // ============================================
  sheet.getRange("A8").setValue("📍 NET CHURN BY REGION");
  sheet.getRange("A8:F8").merge();
  sheet.getRange("A8:F8").setBackground("#E67E22").setFontColor("white").setFontWeight("bold").setFontSize(12).setHorizontalAlignment("center");

  currentRow = 9;

  // Headers
  const netChurnHeaders = ["Region", "Last week", "Today", "Forecast", "Plan", "Status"];
  sheet.getRange("A9:F9").setValues([netChurnHeaders]);
  sheet.getRange("A9:F9").setBackground("#FCE4D6").setFontWeight("bold").setHorizontalAlignment("center");

  // Sample data with all regions
  const netChurnData = [
    ["Total", "4.08%", "4.54%", "5.19%", "4.76%", "✅"],
    ["Arab", "7.44%", "9.35%", "10.70%", "10.54%", "✅"],
    ["TR", "4.32%", "6.10%", "6.98%", "5.74%", "❌"],
    ["PL", "3.07%", "2.95%", "3.38%", "2.76%", "❌"],
    ["IL", "3.16%", "4.21%", "4.82%", "6.48%", "✅"],
    ["DE", "2.41%", "1.47%", "1.68%", "3.86%", "✅"],
    ["IT", "3.77%", "2.81%", "3.21%", "2.78%", "❌"],
    ["RU", "5.94%", "6.68%", "7.65%", "6.99%", "❌"],
    ["RO", "5.86%", "5.00%", "5.72%", "6.20%", "✅"],
    ["ES", "3.85%", "2.45%", "2.80%", "0.56%", "❌"],
    ["FR", "3.97%", "3.92%", "4.48%", "4.10%", "✅"],
    ["CZ", "3.19%", "2.62%", "3.00%", "1.19%", "❌"],
    ["JP", "1.74%", "1.32%", "1.51%", "3.82%", "✅"],
    ["KR", "3.97%", "5.95%", "6.81%", "9.08%", "✅"]
  ];
  sheet.getRange("A10:F23").setValues(netChurnData);
  sheet.getRange("A10:F23").setBorder(true, true, true, true, true, true);

  // Highlight Total row
  sheet.getRange("A10:F10").setBackground("#FFF9E6").setFontWeight("bold");

  currentRow = 25;

  // ============================================
  // SECTION 3: SALES PERFORMANCE BY REGION
  // ============================================
  sheet.getRange("A25").setValue("💰 SALES PERFORMANCE BY REGION");
  sheet.getRange("A25:H25").merge();
  sheet.getRange("A25:H25").setBackground("#27AE60").setFontColor("white").setFontWeight("bold").setFontSize(12).setHorizontalAlignment("center");

  currentRow = 26;

  // Headers
  const salesHeaders = ["Region", "Fact Purchase", "Plan Purchase", "Forecast Purch", "Purch %", "Fact Revenue", "Plan Revenue", "Revenue %"];
  sheet.getRange("A26:H26").setValues([salesHeaders]);
  sheet.getRange("A26:H26").setBackground("#D5F4E6").setFontWeight("bold").setHorizontalAlignment("center");

  // Sample data
  const salesData = [
    ["Total", 10880, 54651, 51804, "94.8%", "$1,517,158", "$7,241,463", "100.0%"],
    ["TR", 3095, 15234, 14766, "96.9%", "$379,455", "$1,576,520", "115.8%"],
    ["PL", 1879, 9713, 8964, "92.3%", "$267,193", "$1,369,629", "93.3%"],
    ["IL", 1407, 7353, 6721, "91.4%", "$225,091", "$1,119,731", "96.1%"],
    ["AE/AR/SA", 517, 2798, 2469, "88.3%", "$73,425", "$369,796", "94.6%"],
    ["FR", 727, 3548, 3465, "97.7%", "$92,165", "$441,511", "99.1%"],
    ["IT", 644, 3231, 3073, "95.1%", "$92,126", "$456,860", "96.2%"],
    ["RU", 685, 3375, 3249, "95.3%", "$74,819", "$371,788", "94.7%"],
    ["DE/NL/CH/AT", 417, 2064, 1991, "96.4%", "$85,572", "$395,659", "103.2%"],
    ["ES", 431, 2041, 2058, "100.8%", "$56,732", "$276,029", "98.1%"],
    ["CZ/SK", 242, 1908, 1147, "87.7%", "$35,606", "$214,738", "78.7%"],
    ["RO", 360, 1596, 1714, "107.4%", "$57,904", "$246,029", "112.6%"],
    ["KR", 105, 474, 497, "104.8%", "$22,460", "$97,469", "108.6%"],
    ["JP", 67, 447, 309, "69.2%", "$17,162", "$117,902", "65.9%"]
  ];
  sheet.getRange("A27:H40").setValues(salesData);
  sheet.getRange("A27:H40").setBorder(true, true, true, true, true, true);

  // Highlight Total row
  sheet.getRange("A27:H27").setBackground("#FFF9E6").setFontWeight("bold");

  // Color-code Revenue % column based on performance
  for (let i = 28; i <= 40; i++) {
    const revPercent = sheet.getRange(`H${i}`).getValue();
    const revNum = parseFloat(String(revPercent).replace('%', ''));
    if (!isNaN(revNum)) {
      if (revNum >= 100) {
        sheet.getRange(`H${i}`).setBackground("#D5F4E6"); // Green
      } else if (revNum >= 95) {
        sheet.getRange(`H${i}`).setBackground("#FFF9E6"); // Yellow
      } else if (revNum >= 85) {
        sheet.getRange(`H${i}`).setBackground("#FFE5CC"); // Orange
      } else {
        sheet.getRange(`H${i}`).setBackground("#FADBD8"); // Red
      }
    }
  }

  currentRow = 42;

  // ============================================
  // SECTION 4: PLAN VS FACT BY CATEGORY
  // ============================================
  sheet.getRange("A42").setValue("📦 PLAN VS FACT - BY CATEGORY");
  sheet.getRange("A42:G42").merge();
  sheet.getRange("A42:G42").setBackground("#8E44AD").setFontColor("white").setFontWeight("bold").setFontSize(12).setHorizontalAlignment("center");

  currentRow = 43;

  // Headers
  const categoryHeaders = ["Category", "Fact Purchase", "Plan Purchase", "Forecast Purch", "Purch %", "Fact Revenue", "Plan Revenue"];
  sheet.getRange("A43:G43").setValues([categoryHeaders]);
  sheet.getRange("A43:G43").setBackground("#E8DAEF").setFontWeight("bold").setHorizontalAlignment("center");

  // Sample data
  const categoryData = [
    ["Total", 10880, 54651, 51804, "94.8%", "$1,517,158", "$7,241,463"],
    ["paid on time", 9166, 46430, 43416, "93.5%", "$1,095,178", "$5,280,881"],
    ["paid in advance", 642, 3725, 2968, "79.7%", "$185,819", "$1,066,372"],
    ["churn prevention", 536, 2404, 2699, "112.3%", "$92,426", "$432,946"],
    ["churn", 536, 2092, 2722, "130.1%", "$143,735", "$461,264"]
  ];
  sheet.getRange("A44:G48").setValues(categoryData);
  sheet.getRange("A44:G48").setBorder(true, true, true, true, true, true);

  // Highlight Total row
  sheet.getRange("A44:G44").setBackground("#FFF9E6").setFontWeight("bold");

  // Color-code Purch % column based on performance
  for (let i = 45; i <= 48; i++) {
    const purchPercent = sheet.getRange(`E${i}`).getValue();
    const purchNum = parseFloat(String(purchPercent).replace('%', ''));
    if (!isNaN(purchNum)) {
      if (purchNum >= 100) {
        sheet.getRange(`E${i}`).setBackground("#D5F4E6"); // Green
      } else if (purchNum >= 90) {
        sheet.getRange(`E${i}`).setBackground("#FFF9E6"); // Yellow
      } else if (purchNum >= 80) {
        sheet.getRange(`E${i}`).setBackground("#FFE5CC"); // Orange
      } else {
        sheet.getRange(`E${i}`).setBackground("#FADBD8"); // Red
      }
    }
  }

  // Freeze header rows
  sheet.setFrozenRows(1);

  // Set all cells to Arial 10pt
  sheet.getRange("A1:H50").setFontFamily("Arial").setFontSize(10);

  Logger.log("✅ Key Metrics Weekly sheet created successfully!");
  Browser.msgBox(
    'Success!',
    'The "Key Metrics Weekly" sheet has been created with sample data.\n\n' +
    'You can now edit the values and use the buildKeyMetricsWeeklyUpdate() function to generate Slack messages.',
    Browser.Buttons.OK
  );
}

/**
 * Helper function to delete the Key Metrics Weekly sheet
 */
function deleteKeyMetricsWeeklySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Key Metrics Weekly");

  if (sheet) {
    ss.deleteSheet(sheet);
    Logger.log("✅ Key Metrics Weekly sheet deleted");
  } else {
    Logger.log("❌ Key Metrics Weekly sheet not found");
  }
}
