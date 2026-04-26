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
 * Adds custom menu for archive functions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Weekly Leaderboard')
    .addItem('📦 Archive Current Week', 'archiveCurrentWeek')
    .addItem('📈 Auto-Calculate WoW', 'autoCalculateWoW')
    .addSeparator()
    .addItem('📋 Create New Leaderboard', 'createLeaderboardTemplateV2')
    .addToUi();
}
