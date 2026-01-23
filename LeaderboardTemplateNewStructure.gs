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
  sheet.getRange("A1:F1").merge();
  sheet.getRange("A1:F1").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const churnCurrentHeaders = ["Week", "Rank", "Manager Name", "Sales", "Cash Generated", "Region"];
  sheet.getRange("A2:F2").setValues([churnCurrentHeaders]);
  sheet.getRange("A2:F2").setBackground("#E8F5E9").setFontWeight("bold");

  const churnCurrentData = [
    [currentWeek, 1, "John Smith", 45, "$12,500", "TR"],
    [currentWeek, 2, "Sarah Johnson", 42, "$11,800", "FR"],
    [currentWeek, 3, "Mike Chen", 38, "$10,200", "DE"]
  ];
  sheet.getRange("A3:F5").setValues(churnCurrentData);

  // ============================================
  // SECTION 2: CHURN PREVENTION - OLD BASE - TOP 3
  // ============================================
  sheet.getRange("A7").setValue("🏆 CHURN PREVENTION - OLD BASE - TOP 3");
  sheet.getRange("A7:F7").merge();
  sheet.getRange("A7:F7").setBackground("#66BB6A").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const churnOldHeaders = ["Week", "Rank", "Manager Name", "Sales", "Cash Generated", "Region"];
  sheet.getRange("A8:F8").setValues([churnOldHeaders]);
  sheet.getRange("A8:F8").setBackground("#E8F5E9").setFontWeight("bold");

  const churnOldData = [
    [currentWeek, 1, "Maria Garcia", 52, "$14,500", "ES"],
    [currentWeek, 2, "Ahmed Hassan", 48, "$13,200", "ARAB"],
    [currentWeek, 3, "Lisa Anderson", 44, "$12,100", "IT"]
  ];
  sheet.getRange("A9:F11").setValues(churnOldData);

  // ============================================
  // SECTION 3: KILLER BASE - CURRENT BASE - TOP 3
  // ============================================
  sheet.getRange("A13").setValue("💪 KILLER BASE - CURRENT BASE - TOP 3");
  sheet.getRange("A13:F13").merge();
  sheet.getRange("A13:F13").setBackground("#2196F3").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const killerCurrentHeaders = ["Week", "Rank", "Manager Name", "Sales", "Cash Generated", "Region"];
  sheet.getRange("A14:F14").setValues([killerCurrentHeaders]);
  sheet.getRange("A14:F14").setBackground("#E3F2FD").setFontWeight("bold");

  const killerCurrentData = [
    [currentWeek, 1, "James Lee", 55, "$15,200", "PL"],
    [currentWeek, 2, "Rachel Green", 50, "$14,000", "CZ"],
    [currentWeek, 3, "Carlos Silva", 46, "$12,800", "RO"]
  ];
  sheet.getRange("A15:F17").setValues(killerCurrentData);

  // ============================================
  // SECTION 4: KILLER BASE - OLD BASE - TOP 3
  // ============================================
  sheet.getRange("A19").setValue("💪 KILLER BASE - OLD BASE - TOP 3");
  sheet.getRange("A19:F19").merge();
  sheet.getRange("A19:F19").setBackground("#42A5F5").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const killerOldHeaders = ["Week", "Rank", "Manager Name", "Sales", "Cash Generated", "Region"];
  sheet.getRange("A20:F20").setValues([killerOldHeaders]);
  sheet.getRange("A20:F20").setBackground("#E3F2FD").setFontWeight("bold");

  const killerOldData = [
    [currentWeek, 1, "Omar Al-Farsi", 58, "$16,100", "ARAB"],
    [currentWeek, 2, "Sophie Martin", 54, "$15,000", "FR"],
    [currentWeek, 3, "Yuki Tanaka", 51, "$14,200", "RU"]
  ];
  sheet.getRange("A21:F23").setValues(killerOldData);

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
  // SECTION 6: REGIONAL PERFORMANCE
  // ============================================
  sheet.getRange("A36").setValue("🌍 REGIONAL PERFORMANCE SUMMARY");
  sheet.getRange("A36:I36").merge();
  sheet.getRange("A36:I36").setBackground("#FF9800").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const regionHeaders = ["Week", "Region", "Total Sales", "Total Cash", "Churn Current", "Churn Old", "Killer Current", "Killer Old", "Top Manager"];
  sheet.getRange("A37:I37").setValues([regionHeaders]);
  sheet.getRange("A37:I37").setBackground("#FFF3E0").setFontWeight("bold");

  const regionData = [
    [currentWeek, "TR", 156, "$43,400", 33, 41, 40, 42, "John Smith"],
    [currentWeek, "ARAB", 143, "$39,800", 42, 44, 50, 54, "Rachel Green"],
    [currentWeek, "RU", 128, "$35,600", 38, 38, 55, 51, "James Lee"],
    [currentWeek, "ES", 112, "$31,200", 35, 52, 46, 47, "Maria Garcia"]
  ];
  sheet.getRange("A38:I41").setValues(regionData);

  // ============================================
  // Formatting
  // ============================================

  // Set column widths
  sheet.setColumnWidth(1, 100);  // Week
  sheet.setColumnWidth(2, 60);   // Rank
  sheet.setColumnWidth(3, 150);  // Manager Name
  sheet.setColumnWidth(4, 80);   // Sales
  sheet.setColumnWidth(5, 130);  // Cash Generated
  sheet.setColumnWidth(6, 120);  // Region
  sheet.setColumnWidth(7, 100);  // Churn Current
  sheet.setColumnWidth(8, 100);  // Churn Old
  sheet.setColumnWidth(9, 150);  // Top Manager

  // Add borders to all sections (Top 3 structure)
  sheet.getRange("A2:F5").setBorder(true, true, true, true, true, true);
  sheet.getRange("A8:F11").setBorder(true, true, true, true, true, true);
  sheet.getRange("A14:F17").setBorder(true, true, true, true, true, true);
  sheet.getRange("A20:F23").setBorder(true, true, true, true, true, true);
  sheet.getRange("A26:B34").setBorder(true, true, true, true, true, true);
  sheet.getRange("A37:I41").setBorder(true, true, true, true, true, true);

  // Add instructions
  const instructionSheet = ss.getSheetByName("Leaderboard Instructions") || ss.insertSheet("Leaderboard Instructions");

  const instructions = [
    ["📊 WEEKLY LEADERBOARD - INSTRUCTIONS (TOP 3 STRUCTURE)"],
    [""],
    ["NEW STRUCTURE - CURRENT BASE VS OLD BASE - TOP 3:"],
    ["✓ Section 1-2: Churn Prevention (Current Base & Old Base) - TOP 3 EACH"],
    ["✓ Section 3-4: Killer Base (Current Base & Old Base) - TOP 3 EACH"],
    ["✓ Section 5: Regional Performance Summary"],
    [""],
    ["COLUMNS IN EACH SECTION:"],
    ["• Week - Current week (2026-W04)"],
    ["• Rank - Position (1-3)"],
    ["• Manager Name - Full name (NO 'private channel' text!)"],
    ["• Sales - Number of sales"],
    ["• Cash Generated - Revenue amount (e.g., $12,500)"],
    ["• Region - Country/region with flag emoji"],
    [""],
    ["HOW TO UPDATE WEEKLY:"],
    ["1. Update Week column to current week"],
    ["2. Update Sales and Cash Generated for each manager"],
    ["3. Re-rank managers by Sales (sort descending)"],
    ["4. Update Rank column (1, 2, 3)"],
    ["5. Update Regional Performance totals"],
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
    ["• Churn Current Base: A3:F5 (3 rows)"],
    ["• Churn Old Base: A9:F11 (3 rows)"],
    ["• Killer Current Base: A15:F17 (3 rows)"],
    ["• Killer Old Base: A21:F23 (3 rows)"],
    ["• Regional Performance: A27:I30 (4 regions)"]
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
