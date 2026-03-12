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
  // SECTION 0: SECONDARY SALES PLAN
  // ============================================
  sheet.getRange("A1").setValue("📊 SECONDARY SALES PLAN");
  sheet.getRange("A1:C1").merge();
  sheet.getRange("A1:C1").setBackground("#9C27B0").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const teamPerfHeaders = ["Metric", "Purchase Plan Execution", "Revenue Plan Execution"];
  sheet.getRange("A2:C2").setValues([teamPerfHeaders]);
  sheet.getRange("A2:C2").setBackground("#E1BEE7").setFontWeight("bold");

  const teamPerfData = [
    ["Plan Execution %", 1.109, 1.026]
  ];
  sheet.getRange("A3:C3").setValues(teamPerfData);
  sheet.getRange("A2:C3").setBorder(true, true, true, true, true, true);

  // ============================================
  // SECTION 0.5: REGIONAL CHAMPIONS
  // ============================================
  sheet.getRange("A5").setValue("🌍 REGIONAL CHAMPIONS");
  sheet.getRange("A5:C5").merge();
  sheet.getRange("A5:C5").setBackground("#FF5722").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const champHeaders = ["Category", "Region", "Performance"];
  sheet.getRange("A6:C6").setValues([champHeaders]);
  sheet.getRange("A6:C6").setBackground("#FFCCBC").setFontWeight("bold");

  const champData = [
    ["Churn Prevention", "TR", "47 sales | $18,234"],
    ["Killer Base", "PL", "52 sales | $21,456"]
  ];
  sheet.getRange("A7:C8").setValues(champData);
  sheet.getRange("A6:C8").setBorder(true, true, true, true, true, true);

  // ============================================
  // SECTION 0.75: UPSELL METRICS SUMMARY
  // ============================================
  sheet.getRange("A10").setValue("📊 UPSELL METRICS SUMMARY");
  sheet.getRange("A10:E10").merge();
  sheet.getRange("A10:E10").setBackground("#9C27B0").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const upsellSummaryHeaders = ["Metric", "CP", "KB", "Overall", "Top Manager"];
  sheet.getRange("A11:E11").setValues([upsellSummaryHeaders]);
  sheet.getRange("A11:E11").setBackground("#E1BEE7").setFontWeight("bold");

  const upsellSummaryData = [
    ["Overall ARPU", "$45.20", "$52.30", "$48.75", "@Merve Odali"],
    ["Upsell Share", "15.5%", "18.2%", "16.85%", "@Selen Orcan"],
    ["N# of Sales (Total)", "125", "151", "276", "@Merve Odali - 45"]
  ];
  sheet.getRange("A12:E14").setValues(upsellSummaryData);
  sheet.getRange("A11:E14").setBorder(true, true, true, true, true, true);

  // ============================================
  // SECTION 1: CHURN PREVENTION - CURRENT BASE - TOP 5 (Ranks 1-3 + Rising Stars 4-5)
  // ============================================
  sheet.getRange("A16").setValue("🏆 CHURN PREVENTION - CURRENT BASE - TOP 5");
  sheet.getRange("A16:G16").merge();
  sheet.getRange("A16:G16").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const churnCurrentHeaders = ["Week", "Rank", "Manager Name", "Sales", "WoW", "Cash Generated", "Region"];
  sheet.getRange("A17:G17").setValues([churnCurrentHeaders]);
  sheet.getRange("A17:G17").setBackground("#E8F5E9").setFontWeight("bold");

  const churnCurrentData = [
    [currentWeek, 1, "John Smith", 45, "+15", "$12,500", "TR"],
    [currentWeek, 2, "Sarah Johnson", 42, "+8", "$11,800", "FR"],
    [currentWeek, 3, "Mike Chen", 38, "+5", "$10,200", "DE"],
    [currentWeek, 4, "Emily Davis", 35, "+12", "$9,500", "PL"],
    [currentWeek, 5, "David Wilson", 33, "+3", "$9,100", "IL"]
  ];
  sheet.getRange("A18:G22").setValues(churnCurrentData);

  // ============================================
  // SECTION 2: CHURN PREVENTION - OLD BASE - TOP 5 (Ranks 1-3 + Rising Stars 4-5)
  // ============================================
  sheet.getRange("A24").setValue("🏆 CHURN PREVENTION - OLD BASE - TOP 5");
  sheet.getRange("A24:G24").merge();
  sheet.getRange("A24:G24").setBackground("#66BB6A").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const churnOldHeaders = ["Week", "Rank", "Manager Name", "Sales", "WoW", "Cash Generated", "Region"];
  sheet.getRange("A25:G25").setValues([churnOldHeaders]);
  sheet.getRange("A25:G25").setBackground("#E8F5E9").setFontWeight("bold");

  const churnOldData = [
    [currentWeek, 1, "Maria Garcia", 52, "+20", "$14,500", "ES"],
    [currentWeek, 2, "Ahmed Hassan", 48, "+12", "$13,200", "ARAB"],
    [currentWeek, 3, "Lisa Anderson", 44, "-3", "$12,100", "IT"],
    [currentWeek, 4, "Tom Rodriguez", 41, "+7", "$11,500", "RO"],
    [currentWeek, 5, "Nina Petrova", 39, "+5", "$10,800", "RU"]
  ];
  sheet.getRange("A26:G30").setValues(churnOldData);

  // ============================================
  // SECTION 3: KILLER BASE - CURRENT BASE - TOP 5 (Ranks 1-3 + Rising Stars 4-5)
  // ============================================
  sheet.getRange("A32").setValue("💪 KILLER BASE - CURRENT BASE - TOP 5");
  sheet.getRange("A32:G32").merge();
  sheet.getRange("A32:G32").setBackground("#2196F3").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const killerCurrentHeaders = ["Week", "Rank", "Manager Name", "Sales", "WoW", "Cash Generated", "Region"];
  sheet.getRange("A33:G33").setValues([killerCurrentHeaders]);
  sheet.getRange("A33:G33").setBackground("#E3F2FD").setFontWeight("bold");

  const killerCurrentData = [
    [currentWeek, 1, "James Lee", 55, "+25", "$15,200", "PL"],
    [currentWeek, 2, "Rachel Green", 50, "+10", "$14,000", "CZ"],
    [currentWeek, 3, "Carlos Silva", 46, "+7", "$12,800", "RO"],
    [currentWeek, 4, "Anna Kowalski", 43, "+14", "$12,200", "PL"],
    [currentWeek, 5, "Marco Rossi", 40, "+6", "$11,600", "IT"]
  ];
  sheet.getRange("A34:G38").setValues(killerCurrentData);

  // ============================================
  // SECTION 4: KILLER BASE - OLD BASE - TOP 5 (Ranks 1-3 + Rising Stars 4-5)
  // ============================================
  sheet.getRange("A40").setValue("💪 KILLER BASE - OLD BASE - TOP 5");
  sheet.getRange("A40:G40").merge();
  sheet.getRange("A40:G40").setBackground("#42A5F5").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const killerOldHeaders = ["Week", "Rank", "Manager Name", "Sales", "WoW", "Cash Generated", "Region"];
  sheet.getRange("A41:G41").setValues([killerOldHeaders]);
  sheet.getRange("A41:G41").setBackground("#E3F2FD").setFontWeight("bold");

  const killerOldData = [
    [currentWeek, 1, "Omar Al-Farsi", 58, "+18", "$16,100", "ARAB"],
    [currentWeek, 2, "Sophie Martin", 54, "+14", "$15,000", "FR"],
    [currentWeek, 3, "Yuki Tanaka", 51, "+6", "$14,200", "RU"],
    [currentWeek, 4, "Klaus Schmidt", 48, "+11", "$13,500", "DE"],
    [currentWeek, 5, "Lucia Fernandez", 45, "+8", "$12,900", "ES"]
  ];
  sheet.getRange("A42:G46").setValues(killerOldData);

  // ============================================
  // SECTION 5: TOTALS SUMMARY (for you to update manually)
  // ============================================
  sheet.getRange("A48").setValue("📊 TOTALS SUMMARY");
  sheet.getRange("A48:B48").merge();
  sheet.getRange("A48:B48").setBackground("#FFA726").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const totalsHeaders = ["Metric", "Value"];
  sheet.getRange("A49:B49").setValues([totalsHeaders]);
  sheet.getRange("A49:B49").setBackground("#FFE0B2").setFontWeight("bold");

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
  sheet.getRange("A50:B57").setValues(totalsData);

  // Add borders to totals section
  sheet.getRange("A48:B57").setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  Logger.log("✓ Totals summary section added");

  // ============================================
  // SECTION 5.5: MANAGER OF THE WEEK (EDITABLE)
  // ============================================
  sheet.getRange("A59").setValue("⭐ MANAGER OF THE WEEK");
  sheet.getRange("A59:E59").merge();
  sheet.getRange("A59:E59").setBackground("#FFD700").setFontColor("black").setFontWeight("bold").setFontSize(12);

  const managerOfWeekHeaders = ["Manager Name", "Sales", "Cash Generated", "WoW", "Description"];
  sheet.getRange("A60:E60").setValues([managerOfWeekHeaders]);
  sheet.getRange("A60:E60").setBackground("#FFF9C4").setFontWeight("bold");

  const managerOfWeekData = [
    ["Omar Al-Farsi", 58, "$16,100", "+18", "Leading in KB Old"]
  ];
  sheet.getRange("A61:E61").setValues(managerOfWeekData);

  // Add borders
  sheet.getRange("A59:E61").setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  Logger.log("✓ Manager of the Week section added");

  // ============================================
  // SECTION 6: KB PAID RATE CONTACTED 14DAY - TOP 3
  // ============================================
  sheet.getRange("A63").setValue("💪 KB PAID RATE CONTACTED 14DAY - TOP 3");
  sheet.getRange("A63:F63").merge();
  sheet.getRange("A63:F63").setBackground("#2196F3").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const kbPaidRateHeaders = ["Week", "Rank", "Region", "Paid Rate %", "Target %", "Total Payments"];
  sheet.getRange("A64:F64").setValues([kbPaidRateHeaders]);
  sheet.getRange("A64:F64").setBackground("#E3F2FD").setFontWeight("bold");

  const kbPaidRateData = [
    [currentWeek, 1, "IT", "40%", "20%", "$14"],
    [currentWeek, 2, "PL", "33.33%", "20%", "$22"],
    [currentWeek, 3, "RO", "22.15%", "11%", "$33"]
  ];
  sheet.getRange("A65:F67").setValues(kbPaidRateData);

  // ============================================
  // SECTION 7: CP PAID RATE CONTACTED 14DAY - TOP 3
  // ============================================
  sheet.getRange("A69").setValue("🏆 CP PAID RATE CONTACTED 14DAY - TOP 3");
  sheet.getRange("A69:F69").merge();
  sheet.getRange("A69:F69").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const cpPaidRateHeaders = ["Week", "Rank", "Region", "Paid Rate %", "Target %", "Total Payments"];
  sheet.getRange("A70:F70").setValues([cpPaidRateHeaders]);
  sheet.getRange("A70:F70").setBackground("#E8F5E9").setFontWeight("bold");

  const cpPaidRateData = [
    [currentWeek, 1, "TR", "35%", "25%", "$120"],
    [currentWeek, 2, "FR", "28%", "20%", "$95"],
    [currentWeek, 3, "DE", "22%", "20%", "$78"]
  ];
  sheet.getRange("A71:F73").setValues(cpPaidRateData);

  // ============================================
  // SECTION 8: HIGHEST PAYMENTS THIS WEEK - TOP 3
  // ============================================
  sheet.getRange("A75").setValue("💰 HIGHEST PAYMENTS THIS WEEK - TOP 3");
  sheet.getRange("A75:F75").merge();
  sheet.getRange("A75:F75").setBackground("#FF9800").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const highestPaymentsHeaders = ["Week", "Rank", "Manager Name", "Region", "Payment ($)", "Slack User ID"];
  sheet.getRange("A76:F76").setValues([highestPaymentsHeaders]);
  sheet.getRange("A76:F76").setBackground("#FFE0B2").setFontWeight("bold");

  const highestPaymentsData = [
    [currentWeek, 1, "@Sami", "TR", 16100, "U02905GQ32R"],
    [currentWeek, 2, "Maria Garcia", "ES", 14500, ""],
    [currentWeek, 3, "Omar Al-Farsi", "ARAB", 13200, ""]
  ];
  sheet.getRange("A77:F79").setValues(highestPaymentsData);

  // ============================================
  // SECTION 9: CP UPSELL - TOP 3 MANAGERS
  // ============================================
  sheet.getRange("A81").setValue("🏆 CP UPSELL - TOP 3 MANAGERS");
  sheet.getRange("A81:G81").merge();
  sheet.getRange("A81:G81").setBackground("#4CAF50").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const cpUpsellHeaders = ["Week", "Rank", "Manager Name", "N# of Sales", "ARPU", "Upsell Share", "Region"];
  sheet.getRange("A82:G82").setValues([cpUpsellHeaders]);
  sheet.getRange("A82:G82").setBackground("#E8F5E9").setFontWeight("bold");

  const cpUpsellData = [
    [currentWeek, 1, "@Merve Odali", 10, "$45.50", "18%", "TR"],
    [currentWeek, 2, "@Ipek Oztufekcı", 10, "$42.80", "15%", "TR"],
    [currentWeek, 3, "@Marta Lewandowska", 8, "$38.20", "12%", "PL"]
  ];
  sheet.getRange("A83:G85").setValues(cpUpsellData);

  // ============================================
  // SECTION 10: KB UPSELL - TOP 3 MANAGERS
  // ============================================
  sheet.getRange("A87").setValue("💪 KB UPSELL - TOP 3 MANAGERS");
  sheet.getRange("A87:G87").merge();
  sheet.getRange("A87:G87").setBackground("#2196F3").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const kbUpsellHeaders = ["Week", "Rank", "Manager Name", "N# of Sales", "ARPU", "Upsell Share", "Region"];
  sheet.getRange("A88:G88").setValues([kbUpsellHeaders]);
  sheet.getRange("A88:G88").setBackground("#E3F2FD").setFontWeight("bold");

  const kbUpsellData = [
    [currentWeek, 1, "@Selen Orcan", 18, "$52.30", "22%", "TR"],
    [currentWeek, 2, "@Abdallah", 15, "$48.60", "18%", "ARAB"],
    [currentWeek, 3, "@Valeria Lvova", 9, "$41.90", "14%", "IL"]
  ];
  sheet.getRange("A89:G91").setValues(kbUpsellData);

  // ============================================
  // SECTION 11: BIGGEST ARPU SALE OF THE WEEK
  // ============================================
  sheet.getRange("A93").setValue("📈 BIGGEST ARPU SALE OF THE WEEK");
  sheet.getRange("A93:F93").merge();
  sheet.getRange("A93:F93").setBackground("#9C27B0").setFontColor("white").setFontWeight("bold").setFontSize(12);

  const biggestArpuHeaders = ["Week", "Manager Name", "Client", "Previous ARPU ($)", "New ARPU ($)", "Region"];
  sheet.getRange("A94:F94").setValues([biggestArpuHeaders]);
  sheet.getRange("A94:F94").setBackground("#E1BEE7").setFontWeight("bold");

  const biggestArpuSampleData = [
    [currentWeek, "Omar Al-Farsi", "Client A", 15, 75, "ARAB"],
    [currentWeek, "Sophie Martin", "Client B", 20, 60, "FR"],
    ["", "", "", "", "", ""]
  ];
  sheet.getRange("A95:F97").setValues(biggestArpuSampleData);

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

  // Add borders to all sections
  sheet.getRange("A17:G22").setBorder(true, true, true, true, true, true);  // Churn Current (now with 5 rows)
  sheet.getRange("A25:G30").setBorder(true, true, true, true, true, true);  // Churn Old (now with 5 rows)
  sheet.getRange("A33:G38").setBorder(true, true, true, true, true, true);  // Killer Current (now with 5 rows)
  sheet.getRange("A41:G46").setBorder(true, true, true, true, true, true);  // Killer Old (now with 5 rows)
  sheet.getRange("A49:B57").setBorder(true, true, true, true, true, true);  // Totals Summary
  sheet.getRange("A60:E61").setBorder(true, true, true, true, true, true);  // Manager of the Week
  sheet.getRange("A64:F67").setBorder(true, true, true, true, true, true);  // KB Paid Rate
  sheet.getRange("A70:F73").setBorder(true, true, true, true, true, true);  // CP Paid Rate
  sheet.getRange("A76:F79").setBorder(true, true, true, true, true, true);  // Highest Payments
  sheet.getRange("A82:G85").setBorder(true, true, true, true, true, true);  // CP Upsell Top 3
  sheet.getRange("A88:G91").setBorder(true, true, true, true, true, true);  // KB Upsell Top 3
  sheet.getRange("A94:F97").setBorder(true, true, true, true, true, true);  // Biggest ARPU Sale

  // Add instructions
  const instructionSheet = ss.getSheetByName("Leaderboard Instructions") || ss.insertSheet("Leaderboard Instructions");

  const instructions = [
    ["📊 WEEKLY LEADERBOARD - INSTRUCTIONS (TOP 5 STRUCTURE WITH RISING STARS)"],
    [""],
    ["NEW STRUCTURE - WITH SECONDARY SALES PLAN, REGIONAL CHAMPIONS, UPSELL METRICS & RISING STARS:"],
    ["✓ Section 0: Secondary Sales Plan (EDITABLE)"],
    ["✓ Section 0.5: Regional Champions - CP & KB top regions (EDITABLE)"],
    ["✓ Section 0.75: Upsell Metrics Summary - Overall ARPU, Upsell Share, N# of Sales (EDITABLE)"],
    ["✓ Section 1-2: Churn Prevention (Current Base & Old Base) - TOP 5 EACH (Ranks 1-3 + Rising Stars 4-5)"],
    ["✓ Section 3-4: Killer Base (Current Base & Old Base) - TOP 5 EACH (Ranks 1-3 + Rising Stars 4-5)"],
    ["✓ Section 5: Totals Summary (editable)"],
    ["✓ Section 5.5: Manager of the Week (EDITABLE)"],
    ["✓ Section 6: KB Paid Rate Contacted 14day - TOP 3 REGIONS"],
    ["✓ Section 7: CP Paid Rate Contacted 14day - TOP 3 REGIONS"],
    ["✓ Section 8: Highest Payments This Week - TOP 3"],
    ["✓ Section 9: CP Upsell - TOP 3 MANAGERS with ARPU & Upsell Share (OPTIONAL - leave empty to skip)"],
    ["✓ Section 10: KB Upsell - TOP 3 MANAGERS with ARPU & Upsell Share (OPTIONAL - leave empty to skip)"],
    ["✓ Section 11: Biggest ARPU Sale of the Week (OPTIONAL - leave empty to skip)"],
    ["✓ NEW: WoW column in each leaderboard section (inline with sales)"],
    ["✓ NEW: Rising Stars (#4 and #5) shown as honorable mentions"],
    [""],
    ["SECTION 0: SECONDARY SALES PLAN (A3:C3) - EDITABLE:"],
    ["• Purchase Plan Execution - Enter as decimal (e.g., 1.109 for 110.9%)"],
    ["• Revenue Plan Execution - Enter as decimal (e.g., 1.026 for 102.6%)"],
    ["• Values are automatically converted to percentages in Slack message"],
    [""],
    ["SECTION 0.5: REGIONAL CHAMPIONS (A7:C8) - EDITABLE:"],
    ["• Row 1: Churn Prevention champion region"],
    ["• Row 2: Killer Base champion region"],
    ["• Format: Category | Region | Performance (e.g., 'TR | 47 sales | $18,234')"],
    ["• Update these weekly to highlight top performing regions"],
    [""],
    ["COLUMNS IN EACH LEADERBOARD SECTION (Sections 1-4):"],
    ["• Week - Current week (2026-W04)"],
    ["• Rank - Position (1-5) - Ranks 1-3 shown as main, 4-5 as Rising Stars"],
    ["• Manager Name - Full name (NO 'private channel' text!)"],
    ["• Sales - Number of sales this week"],
    ["• WoW - Week over Week change (e.g., '+15', '-5', or empty)"],
    ["• Cash Generated - Revenue amount (e.g., $12,500)"],
    ["• Region - Country/region with flag emoji"],
    [""],
    ["HOW TO UPDATE WEEKLY:"],
    ["1. Update Secondary Sales Plan (A3:C3) with plan execution as decimals (e.g., 1.109, 1.026)"],
    ["2. Update Regional Champions (A7:C8) with top CP and KB regions"],
    ["3. Update Week column to current week in all leaderboard sections"],
    ["4. Update Sales, WoW, and Cash Generated for each manager"],
    ["5. Re-rank managers by Sales (sort descending)"],
    ["6. Update Rank column (1, 2, 3, 4, 5) - Top 5 per section"],
    ["7. Update WoW column with week-over-week change (e.g., '+15', '-8')"],
    ["8. Update Regional Performance totals"],
    ["9. Update Manager of the Week section (A55)"],
    ["10. Update Highest Payments section"],
    [""],
    ["RISING STARS (HONORABLE MENTIONS):"],
    ["• Ranks #4 and #5 are automatically shown as 'Rising Stars'"],
    ["• Displayed separately below the top 3 in each section"],
    ["• Recognizes strong performers who just missed the podium"],
    ["• Format: '#4 Manager Name - 35 sales | $9,500 | 🇹🇷 TR'"],
    [""],
    ["MANAGER OF THE WEEK (EDITABLE):"],
    ["• Highlight the top performer of the week"],
    ["• Fields: Manager Name | Sales | Cash Generated | WoW | Description"],
    ["• Description examples: 'Leading in CP Current', 'Top performer across all sections'"],
    ["• Fully editable - override automatic selection if needed"],
    ["• If left empty, will auto-calculate from #1 ranked managers ONLY (not Rising Stars)"],
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
    ["• TOP 5 performers tracked per section (Top 3 + Rising Stars)"],
    [""],
    ["AUTOMATION SETUP:"],
    ["1. Use 'Combined Leaderboard' format"],
    ["2. Point to 'Weekly Leaderboard' sheet"],
    ["3. Schedule: Weekly, Monday 9:00 AM"],
    ["4. All sections + Secondary Sales Plan + Regional Champions in ONE message!"],
    [""],
    ["SHEET RANGES (FOR REFERENCE):"],
    ["• Secondary Sales Plan: A3:C3 (1 row, editable)"],
    ["• Regional Champions: A7:C8 (2 rows, editable)"],
    ["• Upsell Metrics Summary: A12:E14 (3 rows, editable)"],
    ["• Churn Current Base: A18:G22 (5 rows, includes WoW column, ranks 1-5)"],
    ["• Churn Old Base: A26:G30 (5 rows, includes WoW column, ranks 1-5)"],
    ["• Killer Current Base: A34:G38 (5 rows, includes WoW column, ranks 1-5)"],
    ["• Killer Old Base: A42:G46 (5 rows, includes WoW column, ranks 1-5)"],
    ["• Totals Summary: A50:B57 (8 metrics)"],
    ["• Manager of the Week: A61:E61 (1 row, editable)"],
    ["• KB Paid Rate 14day: A65:F67 (3 regions)"],
    ["• CP Paid Rate 14day: A71:F73 (3 regions)"],
    ["• Highest Payments: A77:F79 (3 managers)"],
    ["• CP Upsell Top 3: A83:G85 (3 managers, OPTIONAL)"],
    ["• KB Upsell Top 3: A89:G91 (3 managers, OPTIONAL)"],
    ["• Biggest ARPU Sale: A95:F97 (up to 3 entries, OPTIONAL)"],
    [""],
    ["UPSELL METRICS SUMMARY (Section 0.75) - EDITABLE:"],
    ["• Row 1: Overall ARPU for CP, KB, and Overall + Top Manager"],
    ["• Row 2: Upsell Share percentage for CP, KB, and Overall + Top Manager"],
    ["• Row 3: Total N# of Sales for CP, KB, and Overall + Top Manager with their count"],
    ["• Format: Metric | CP Value | KB Value | Overall Value | Top Manager"],
    ["• Update these weekly to show upsell performance summary"],
    [""],
    ["CP UPSELL / KB UPSELL SECTIONS (Sections 9 & 10) - OPTIONAL:"],
    ["• Columns: Week | Rank | Manager Name | N# of Sales | ARPU | Upsell Share | Region"],
    ["• N# of Sales: Number of sales for this manager"],
    ["• ARPU: Average Revenue Per User (e.g., $45.50)"],
    ["• Upsell Share: Percentage of upsells (e.g., 18%)"],
    ["• Rank managers by Upsell Share or N# of Sales (descending)"],
    ["• Leave all 3 rows empty to skip section in Slack message"],
    ["• Manager mentions work the same as other sections"],
    [""],
    ["BIGGEST ARPU SALE OF THE WEEK (Section 11) - OPTIONAL:"],
    ["• Columns: Week | Manager Name | Client | Previous ARPU ($) | New ARPU ($) | Region"],
    ["• Enter the client's previous ARPU and new ARPU after upsell"],
    ["• ARPU uplift is automatically calculated (New ARPU - Previous ARPU)"],
    ["• Leave rows empty to skip section in Slack message"],
    ["• Example: Manager 'Omar Al-Farsi' upgraded Client A from $15 → $75 ARPU"]
  ];

  instructionSheet.getRange(1, 1, instructions.length, 1).setValues(instructions);
  instructionSheet.getRange("A1").setBackground("#673AB7").setFontColor("white").setFontWeight("bold").setFontSize(14);
  instructionSheet.setColumnWidth(1, 700);

  SpreadsheetApp.getUi().alert(
    '✅ NEW Template Created!',
    'The "Weekly Leaderboard" sheet has been created with the new structure:\n\n' +
    '✓ Secondary Sales Plan (Purchase & Revenue Plan Execution)\n' +
    '✓ Regional Champions (CP & KB top regions)\n' +
    '✓ NEW: Upsell Metrics Summary (Overall ARPU, Upsell Share, N# of Sales)\n' +
    '✓ Churn Prevention: Current Base + Old Base - TOP 5 each\n' +
    '✓ Killer Base: Current Base + Old Base - TOP 5 each\n' +
    '✓ Rising Stars: Ranks 4-5 shown separately\n' +
    '✓ Cash Generated column and WoW tracking\n' +
    '✓ Regional Performance with detailed breakdown\n' +
    '✓ CP Upsell Top 3 with ARPU & Upsell Share (optional - leave empty to skip)\n' +
    '✓ KB Upsell Top 3 with ARPU & Upsell Share (optional - leave empty to skip)\n' +
    '✓ Biggest ARPU Sale of the Week (optional - leave empty to skip)\n\n' +
    'Next steps:\n' +
    '1. Review the sample data\n' +
    '2. Update Secondary Sales Plan (A3:C3) and Regional Champions (A7:C8)\n' +
    '3. Update Upsell Metrics Summary (A12:E14) with overall metrics\n' +
    '4. Update with your actual leaderboard data (5 managers per section)\n' +
    '5. Use the automation - it will automatically split Top 3 and Rising Stars!',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
