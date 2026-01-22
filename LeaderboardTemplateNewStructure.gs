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
  // SECTION 1: CHURN PREVENTION - CURRENT BASE
  // ============================================
  sheet.getRange("A1").setValue("🏆 CHURN PREVENTION - CURRENT BASE - TOP 5");
  sheet.getRange("A1:F1").merge();
  sheet.getRange("A1:F1").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const churnCurrentHeaders = ["Week", "Rank", "Manager Name", "Sales", "Cash Generated", "Region"];
  sheet.getRange("A2:F2").setValues([churnCurrentHeaders]);
  sheet.getRange("A2:F2").setBackground("#E8F5E9").setFontWeight("bold");

  const churnCurrentData = [
    [currentWeek, 1, "John Smith", 45, "$12,500", "🇺🇸 NA"],
    [currentWeek, 2, "Sarah Johnson", 42, "$11,800", "🇪🇺 EMEA"],
    [currentWeek, 3, "Mike Chen", 38, "$10,200", "🌏 APAC"],
    [currentWeek, 4, "Emily Davis", 35, "$9,500", "🌎 LATAM"],
    [currentWeek, 5, "David Wilson", 33, "$8,900", "🇺🇸 NA"]
  ];
  sheet.getRange("A3:F7").setValues(churnCurrentData);

  // ============================================
  // SECTION 2: CHURN PREVENTION - OLD BASE
  // ============================================
  sheet.getRange("A9").setValue("🏆 CHURN PREVENTION - OLD BASE - TOP 5");
  sheet.getRange("A9:F9").merge();
  sheet.getRange("A9:F9").setBackground("#66BB6A").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const churnOldHeaders = ["Week", "Rank", "Manager Name", "Sales", "Cash Generated", "Region"];
  sheet.getRange("A10:F10").setValues([churnOldHeaders]);
  sheet.getRange("A10:F10").setBackground("#E8F5E9").setFontWeight("bold");

  const churnOldData = [
    [currentWeek, 1, "Maria Garcia", 52, "$14,500", "🌎 LATAM"],
    [currentWeek, 2, "Ahmed Hassan", 48, "$13,200", "🇸🇦 ARAB"],
    [currentWeek, 3, "Lisa Anderson", 44, "$12,100", "🇪🇺 EMEA"],
    [currentWeek, 4, "Tom Brown", 41, "$11,500", "🇺🇸 NA"],
    [currentWeek, 5, "Anna Martinez", 39, "$10,800", "🇪🇸 ES"]
  ];
  sheet.getRange("A11:F15").setValues(churnOldData);

  // ============================================
  // SECTION 3: KILLER BASE - CURRENT BASE
  // ============================================
  sheet.getRange("A17").setValue("💪 KILLER BASE - CURRENT BASE - TOP 5");
  sheet.getRange("A17:F17").merge();
  sheet.getRange("A17:F17").setBackground("#2196F3").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const killerCurrentHeaders = ["Week", "Rank", "Manager Name", "Sales", "Cash Generated", "Region"];
  sheet.getRange("A18:F18").setValues([killerCurrentHeaders]);
  sheet.getRange("A18:F18").setBackground("#E3F2FD").setFontWeight("bold");

  const killerCurrentData = [
    [currentWeek, 1, "James Lee", 55, "$15,200", "🌏 APAC"],
    [currentWeek, 2, "Rachel Green", 50, "$14,000", "🇪🇺 EMEA"],
    [currentWeek, 3, "Carlos Silva", 46, "$12,800", "🌎 LATAM"],
    [currentWeek, 4, "Nina Patel", 43, "$11,900", "🇮🇳 IN"],
    [currentWeek, 5, "Alex Johnson", 40, "$11,000", "🇺🇸 NA"]
  ];
  sheet.getRange("A19:F23").setValues(killerCurrentData);

  // ============================================
  // SECTION 4: KILLER BASE - OLD BASE
  // ============================================
  sheet.getRange("A25").setValue("💪 KILLER BASE - OLD BASE - TOP 5");
  sheet.getRange("A25:F25").merge();
  sheet.getRange("A25:F25").setBackground("#42A5F5").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const killerOldHeaders = ["Week", "Rank", "Manager Name", "Sales", "Cash Generated", "Region"];
  sheet.getRange("A26:F26").setValues([killerOldHeaders]);
  sheet.getRange("A26:F26").setBackground("#E3F2FD").setFontWeight("bold");

  const killerOldData = [
    [currentWeek, 1, "Omar Al-Farsi", 58, "$16,100", "🇸🇦 ARAB"],
    [currentWeek, 2, "Sophie Martin", 54, "$15,000", "🇫🇷 FR"],
    [currentWeek, 3, "Yuki Tanaka", 51, "$14,200", "🇯🇵 JP"],
    [currentWeek, 4, "Pedro Costa", 47, "$13,100", "🇧🇷 BR"],
    [currentWeek, 5, "Elena Ivanova", 44, "$12,200", "🇷🇺 RU"]
  ];
  sheet.getRange("A27:F31").setValues(killerOldData);

  // ============================================
  // SECTION 5: REGIONAL PERFORMANCE SUMMARY
  // ============================================
  sheet.getRange("A33").setValue("🌍 REGIONAL PERFORMANCE SUMMARY");
  sheet.getRange("A33:I33").merge();
  sheet.getRange("A33:I33").setBackground("#FF9800").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const regionHeaders = ["Week", "Region", "Total Sales", "Total Cash", "Churn Current", "Churn Old", "Killer Current", "Killer Old", "Top Manager"];
  sheet.getRange("A34:I34").setValues([regionHeaders]);
  sheet.getRange("A34:I34").setBackground("#FFF3E0").setFontWeight("bold");

  const regionData = [
    [currentWeek, "🇺🇸 NA", 156, "$43,400", 33, 41, 40, 42, "John Smith"],
    [currentWeek, "🇪🇺 EMEA", 143, "$39,800", 42, 44, 50, 54, "Rachel Green"],
    [currentWeek, "🌏 APAC", 128, "$35,600", 38, 38, 55, 51, "James Lee"],
    [currentWeek, "🌎 LATAM", 112, "$31,200", 35, 52, 46, 47, "Maria Garcia"]
  ];
  sheet.getRange("A35:I38").setValues(regionData);

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

  // Add borders to all sections
  sheet.getRange("A2:F7").setBorder(true, true, true, true, true, true);
  sheet.getRange("A10:F15").setBorder(true, true, true, true, true, true);
  sheet.getRange("A18:F23").setBorder(true, true, true, true, true, true);
  sheet.getRange("A26:F31").setBorder(true, true, true, true, true, true);
  sheet.getRange("A34:I38").setBorder(true, true, true, true, true, true);

  // Add instructions
  const instructionSheet = ss.getSheetByName("Leaderboard Instructions") || ss.insertSheet("Leaderboard Instructions");

  const instructions = [
    ["📊 WEEKLY LEADERBOARD - INSTRUCTIONS (NEW STRUCTURE)"],
    [""],
    ["NEW STRUCTURE - CURRENT BASE VS OLD BASE:"],
    ["✓ Section 1-2: Churn Prevention (Current Base & Old Base)"],
    ["✓ Section 3-4: Killer Base (Current Base & Old Base)"],
    ["✓ Section 5: Regional Performance Summary"],
    [""],
    ["COLUMNS IN EACH SECTION:"],
    ["• Week - Current week (2026-W04)"],
    ["• Rank - Position (1-5)"],
    ["• Manager Name - Full name"],
    ["• Sales - Number of sales"],
    ["• Cash Generated - Revenue amount (e.g., $12,500)"],
    ["• Region - Country/region with flag emoji"],
    [""],
    ["HOW TO UPDATE WEEKLY:"],
    ["1. Update Week column to current week"],
    ["2. Update Sales and Cash Generated for each manager"],
    ["3. Re-rank managers by Sales (sort descending)"],
    ["4. Update Rank column (1, 2, 3, 4, 5)"],
    ["5. Update Regional Performance totals"],
    [""],
    ["TIPS:"],
    ["• Add country flag emojis directly in Region column (🇺🇸 NA, 🇸🇦 ARAB, etc.)"],
    ["• Cash Generated format: $12,500 (with comma separator)"],
    ["• Current Base = New customers or recent deals"],
    ["• Old Base = Existing/legacy customers"],
    ["• Keep data clean - no extra text like 'private channel'"],
    [""],
    ["AUTOMATION SETUP:"],
    ["1. Use 'Combined Leaderboard' format"],
    ["2. Point to 'Weekly Leaderboard' sheet"],
    ["3. Schedule: Weekly, Monday 9:00 AM"],
    ["4. All 4 sections + Regional summary in ONE message!"],
    [""],
    ["SHEET RANGES (FOR REFERENCE):"],
    ["• Churn Current Base: A3:F7"],
    ["• Churn Old Base: A11:F15"],
    ["• Killer Current Base: A19:F23"],
    ["• Killer Old Base: A27:F31"],
    ["• Regional Performance: A35:I38"]
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
