/**
 * NEW WEEKLY LEADERBOARD TEMPLATE - CURRENT BASE VS OLD BASE
 *
 * This creates a template with:
 * - Churn Prevention: Current Base Top 5 & Old Base Top 5
 * - Killer Base: Current Base Top 5 & Old Base Top 5
 * - Regional Performance Summary
 *
 * Each section includes Cash Generated column
 */

/**
 * CREATE NEW LEADERBOARD TEMPLATE WITH CURRENT/OLD BASE STRUCTURE
 * Run this to create the updated template
 */
function createLeaderboardTemplateV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check if sheet already exists
  let sheet = ss.getSheetByName("Weekly Leaderboard");
  if (sheet) {
    const response = SpreadsheetApp.getUi().alert(
      'Sheet Already Exists',
      'A sheet named "Weekly Leaderboard" already exists. Do you want to recreate it?\n\nWARNING: This will delete all existing data!',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );

    if (response === SpreadsheetApp.getUi().Button.YES) {
      ss.deleteSheet(sheet);
    } else {
      return;
    }
  }

  // Create new sheet
  sheet = ss.insertSheet("Weekly Leaderboard");

  const currentWeek = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");

  // ============================================
  // SECTION 1: CHURN PREVENTION - CURRENT BASE - TOP 3
  // ============================================
  sheet.getRange("A1").setValue("🏆 CHURN PREVENTION - CURRENT BASE - TOP 3");
  sheet.getRange("A1:G1").merge();
  sheet.getRange("A1:G1").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const churnCurrentHeaders = ["Week", "Rank", "Manager Name", "Sales", "WoW", "Cash Generated", "Region"];
  sheet.getRange("A2:G2").setValues([churnCurrentHeaders]);
  sheet.getRange("A2:G2").setBackground("#E8F5E9").setFontWeight("bold");

  const churnCurrentData = [
    [currentWeek, 1, "John Smith", 45, "+15", "$12,500", "TR"],
    [currentWeek, 2, "Sarah Johnson", 42, "+8", "$11,800", "FR"],
    [currentWeek, 3, "Mike Chen", 38, "+5", "$10,200", "DE"]
  ];
  sheet.getRange("A3:G5").setValues(churnCurrentData);

  // ============================================
  // SECTION 2: CHURN PREVENTION - OLD BASE - TOP 3
  // ============================================
  sheet.getRange("A7").setValue("🏆 CHURN PREVENTION - OLD BASE - TOP 3");
  sheet.getRange("A7:G7").merge();
  sheet.getRange("A7:G7").setBackground("#66BB6A").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const churnOldHeaders = ["Week", "Rank", "Manager Name", "Sales", "WoW", "Cash Generated", "Region"];
  sheet.getRange("A8:G8").setValues([churnOldHeaders]);
  sheet.getRange("A8:G8").setBackground("#E8F5E9").setFontWeight("bold");

  const churnOldData = [
    [currentWeek, 1, "Maria Garcia", 52, "+20", "$14,500", "ES"],
    [currentWeek, 2, "Ahmed Hassan", 48, "+12", "$13,200", "ARAB"],
    [currentWeek, 3, "Lisa Anderson", 44, "-3", "$12,100", "IT"]
  ];
  sheet.getRange("A9:G11").setValues(churnOldData);

  // ============================================
  // SECTION 3: KILLER BASE - CURRENT BASE - TOP 3
  // ============================================
  sheet.getRange("A13").setValue("💪 KILLER BASE - CURRENT BASE - TOP 3");
  sheet.getRange("A13:G13").merge();
  sheet.getRange("A13:G13").setBackground("#2196F3").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const killerCurrentHeaders = ["Week", "Rank", "Manager Name", "Sales", "WoW", "Cash Generated", "Region"];
  sheet.getRange("A14:G14").setValues([killerCurrentHeaders]);
  sheet.getRange("A14:G14").setBackground("#E3F2FD").setFontWeight("bold");

  const killerCurrentData = [
    [currentWeek, 1, "James Lee", 55, "+25", "$15,200", "PL"],
    [currentWeek, 2, "Rachel Green", 50, "+10", "$14,000", "CZ"],
    [currentWeek, 3, "Carlos Silva", 46, "+7", "$12,800", "RO"]
  ];
  sheet.getRange("A15:G17").setValues(killerCurrentData);

  // ============================================
  // SECTION 4: KILLER BASE - OLD BASE - TOP 3
  // ============================================
  sheet.getRange("A19").setValue("💪 KILLER BASE - OLD BASE - TOP 3");
  sheet.getRange("A19:G19").merge();
  sheet.getRange("A19:G19").setBackground("#42A5F5").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const killerOldHeaders = ["Week", "Rank", "Manager Name", "Sales", "WoW", "Cash Generated", "Region"];
  sheet.getRange("A20:G20").setValues([killerOldHeaders]);
  sheet.getRange("A20:G20").setBackground("#E3F2FD").setFontWeight("bold");

  const killerOldData = [
    [currentWeek, 1, "Omar Al-Farsi", 58, "+18", "$16,100", "ARAB"],
    [currentWeek, 2, "Sophie Martin", 54, "+14", "$15,000", "FR"],
    [currentWeek, 3, "Yuki Tanaka", 51, "+6", "$14,200", "RU"]
  ];
  sheet.getRange("A21:G23").setValues(killerOldData);

  // ============================================
  // SECTION 5: TOTALS SUMMARY (for you to update manually)
  // ============================================
  sheet.getRange("A25").setValue("📊 TOTALS SUMMARY");
  sheet.getRange("A25:B25").merge();
  sheet.getRange("A25:B25").setBackground("#FFA726").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const totalsHeaders = ["Metric", "Value"];
  sheet.getRange("A26:B26").setValues([totalsHeaders]);
  sheet.getRange("A26:B26").setBackground("#FFE0B2").setFontWeight("bold");

  const totalsData = [
    ["Display Date (e.g., Jan 26th)", "Jan 26th"],
    ["Grand Total Sales", 539],
    ["Churn Prevention Total", 260],
    ["Churn Current Base", 125],
    ["Churn Old Base", 135],
    ["Killer Base Total", 279],
    ["Killer Current Base", 151],
    ["Killer Old Base", 128]
  ];
  sheet.getRange("A27:B34").setValues(totalsData);

  // Add borders to totals section
  sheet.getRange("A25:B34").setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  Logger.log("✓ Totals summary section added");

  // ============================================
  // SECTION 6: KB PAID RATE CONTACTED 14DAY - TOP 3
  // ============================================
  sheet.getRange("A36").setValue("💪 KB PAID RATE CONTACTED 14DAY - TOP 3");
  sheet.getRange("A36:F36").merge();
  sheet.getRange("A36:F36").setBackground("#2196F3").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const kbPaidRateHeaders = ["Week", "Rank", "Region", "Paid Rate %", "Target %", "Total Payments"];
  sheet.getRange("A37:F37").setValues([kbPaidRateHeaders]);
  sheet.getRange("A37:F37").setBackground("#E3F2FD").setFontWeight("bold");

  const kbPaidRateData = [
    [currentWeek, 1, "IT", "40%", "20%", "$14"],
    [currentWeek, 2, "PL", "33.33%", "20%", "$22"],
    [currentWeek, 3, "RO", "22.15%", "11%", "$33"]
  ];
  sheet.getRange("A38:F40").setValues(kbPaidRateData);

  // ============================================
  // SECTION 7: CP PAID RATE CONTACTED 14DAY - TOP 3
  // ============================================
  sheet.getRange("A42").setValue("🏆 CP PAID RATE CONTACTED 14DAY - TOP 3");
  sheet.getRange("A42:F42").merge();
  sheet.getRange("A42:F42").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const cpPaidRateHeaders = ["Week", "Rank", "Region", "Paid Rate %", "Target %", "Total Payments"];
  sheet.getRange("A43:F43").setValues([cpPaidRateHeaders]);
  sheet.getRange("A43:F43").setBackground("#E8F5E9").setFontWeight("bold");

  const cpPaidRateData = [
    [currentWeek, 1, "TR", "35%", "25%", "$120"],
    [currentWeek, 2, "FR", "28%", "20%", "$95"],
    [currentWeek, 3, "DE", "22%", "20%", "$78"]
  ];
  sheet.getRange("A44:F46").setValues(cpPaidRateData);

  // ============================================
  // SECTION 8: HIGHEST PAYMENTS THIS WEEK - TOP 3
  // ============================================
  sheet.getRange("A48").setValue("💰 HIGHEST PAYMENTS THIS WEEK - TOP 3");
  sheet.getRange("A48:F48").merge();
  sheet.getRange("A48:F48").setBackground("#FF9800").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const highestPaymentsHeaders = ["Week", "Rank", "Manager Name", "Region", "Payment ($)", "Slack User ID"];
  sheet.getRange("A49:F49").setValues([highestPaymentsHeaders]);
  sheet.getRange("A49:F49").setBackground("#FFE0B2").setFontWeight("bold");

  const highestPaymentsData = [
    [currentWeek, 1, "@Sami", "TR", 16100, "U02905GQ32R"],
    [currentWeek, 2, "Maria Garcia", "ES", 14500, ""],
    [currentWeek, 3, "Omar Al-Farsi", "ARAB", 13200, ""]
  ];
  sheet.getRange("A50:F52").setValues(highestPaymentsData);

  // ============================================
  // Formatting
  // ============================================

  // Set column widths
  sheet.setColumnWidth(1, 100);  // Week
  sheet.setColumnWidth(2, 60);   // Rank
  sheet.setColumnWidth(3, 150);  // Manager Name/Region
  sheet.setColumnWidth(4, 100);  // Region/Paid Rate %
  sheet.setColumnWidth(5, 130);  // Payment/Target %
  sheet.setColumnWidth(6, 130);  // Total Payments

  // Add borders to all sections (Top 3 structure)
  sheet.getRange("A2:G5").setBorder(true, true, true, true, true, true);
  sheet.getRange("A8:G11").setBorder(true, true, true, true, true, true);
  sheet.getRange("A14:G17").setBorder(true, true, true, true, true, true);
  sheet.getRange("A20:G23").setBorder(true, true, true, true, true, true);
  sheet.getRange("A26:B34").setBorder(true, true, true, true, true, true);
  sheet.getRange("A37:F40").setBorder(true, true, true, true, true, true);
  sheet.getRange("A43:F46").setBorder(true, true, true, true, true, true);
  sheet.getRange("A49:F52").setBorder(true, true, true, true, true, true);

  // Add instructions
  const instructionSheet = ss.getSheetByName("Leaderboard Instructions") || ss.insertSheet("Leaderboard Instructions");

  const instructions = [
    ["📊 WEEKLY LEADERBOARD - INSTRUCTIONS (TOP 3 STRUCTURE)"],
    [""],
    ["NEW STRUCTURE - CURRENT BASE VS OLD BASE - TOP 3:"],
    ["✓ Section 1-2: Churn Prevention (Current Base & Old Base) - TOP 3 EACH"],
    ["✓ Section 3-4: Killer Base (Current Base & Old Base) - TOP 3 EACH"],
    ["✓ Section 5: Totals Summary (editable)"],
    ["✓ Section 6: KB Paid Rate Contacted 14day - TOP 3 REGIONS"],
    ["✓ Section 7: CP Paid Rate Contacted 14day - TOP 3 REGIONS"],
    ["✓ Section 8: Highest Payments This Week - TOP 3"],
    ["✓ NEW: WoW column in each leaderboard section (inline with sales)"],
    [""],
    ["COLUMNS IN EACH LEADERBOARD SECTION (Sections 1-4):"],
    ["• Week - Current week (2026-W04)"],
    ["• Rank - Position (1-3)"],
    ["• Manager Name - Full name (NO 'private channel' text!)"],
    ["• Sales - Number of sales this week"],
    ["• WoW - Week over Week change (e.g., '+15', '-5', or empty)"],
    ["• Cash Generated - Revenue amount (e.g., $12,500)"],
    ["• Region - Country/region with flag emoji"],
    [""],
    ["HOW TO UPDATE WEEKLY:"],
    ["1. Update Week column to current week"],
    ["2. Update Sales, WoW, and Cash Generated for each manager"],
    ["3. Re-rank managers by Sales (sort descending)"],
    ["4. Update Rank column (1, 2, 3)"],
    ["5. Update WoW column with week-over-week change (e.g., '+15', '-8')"],
    ["6. Update Regional Performance totals"],
    ["7. Update Highest Payments section"],
    [""],
    ["WEEK OVER WEEK (WoW) COLUMN:"],
    ["• Shows performance change from previous week"],
    ["• Format: '+15' (gained 15 sales) or '-5' (lost 5 sales)"],
    ["• Can be EMPTY at start of month or if no comparison data"],
    ["• Displayed inline: '45 sales (+15 WoW)' or '45 sales'"],
    ["• Fully editable - just enter the number with + or - sign"],
    [""],
    ["IMPORTANT - DATA CLEANING:"],
    ["• DO NOT include 'private channel' text in Manager Name or Region"],
    ["• DO NOT include channel IDs or other metadata"],
    ["• Keep data clean - just the actual names and regions"],
    ["• Example GOOD: 'John Smith' and 'TR'"],
    ["• Example BAD: '🔒private channel John Smith'"],
    [""],
    ["TIPS:"],
    ["• Use region codes only in Region column (TR, ARAB, FR, DE, etc.)"],
    ["• Slack emojis will be added automatically by the automation"],
    ["• Cash Generated format: $12,500 (with comma separator)"],
    ["• Current Base = New customers or recent deals"],
    ["• Old Base = Existing/legacy customers"],
    ["• Only TOP 3 performers shown in each section"],
    [""],
    ["AUTOMATION SETUP:"],
    ["1. Use 'Combined Leaderboard' format"],
    ["2. Point to 'Weekly Leaderboard' sheet"],
    ["3. Schedule: Weekly, Monday 9:00 AM"],
    ["4. All 4 sections (Top 3 each) + Regional summary in ONE message!"],
    [""],
    ["SHEET RANGES (FOR REFERENCE):"],
    ["• Churn Current Base: A3:G5 (3 rows, includes WoW column)"],
    ["• Churn Old Base: A9:G11 (3 rows, includes WoW column)"],
    ["• Killer Current Base: A15:G17 (3 rows, includes WoW column)"],
    ["• Killer Old Base: A21:G23 (3 rows, includes WoW column)"],
    ["• Totals Summary: A27:B34 (8 metrics)"],
    ["• KB Paid Rate 14day: A38:F40 (3 regions)"],
    ["• CP Paid Rate 14day: A44:F46 (3 regions)"],
    ["• Highest Payments: A50:F52 (3 managers)"]
  ];

  instructionSheet.getRange(1, 1, instructions.length, 1).setValues(instructions);
  instructionSheet.getRange("A1").setBackground("#673AB7").setFontColor("white").setFontWeight("bold").setFontSize(14);
  instructionSheet.setColumnWidth(1, 700);

  SpreadsheetApp.getUi().alert(
    '✅ NEW Template Created!',
    'The "Weekly Leaderboard" sheet has been created with the new structure:\n\n' +
    '✓ Churn Prevention: Current Base + Old Base\n' +
    '✓ Killer Base: Current Base + Old Base\n' +
    '✓ Cash Generated column added\n' +
    '✓ Regional Performance with detailed breakdown\n\n' +
    'Next steps:\n' +
    '1. Review the sample data\n' +
    '2. Update with your actual data\n' +
    '3. Update the automation code to read new ranges',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
