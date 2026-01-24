/**
 * STREAK TRACKING SYSTEM
 *
 * Tracks consecutive weeks managers appear in Top 3
 * Automatically awards streak badges: 🔥 (3 weeks), ⚡ (5 weeks), 💎 (10 weeks)
 *
 * Features:
 * - Automatic tracking when leaderboard is posted
 * - Manual sheet for viewing/editing streaks
 * - Streak badges displayed next to manager names
 */

/**
 * CREATE STREAK TRACKING SHEET
 * Run this once to create the tracking sheet
 */
function createStreakTrackingSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Streak Tracking");

  if (sheet) {
    const response = SpreadsheetApp.getUi().alert(
      'Sheet Exists',
      'Streak Tracking sheet already exists. Recreate it?\n\nWARNING: This will delete all streak data!',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );

    if (response === SpreadsheetApp.getUi().Button.YES) {
      ss.deleteSheet(sheet);
    } else {
      return;
    }
  }

  sheet = ss.insertSheet("Streak Tracking");

  // Header
  sheet.getRange("A1").setValue("🔥 STREAK TRACKING - TOP 3 APPEARANCES");
  sheet.getRange("A1:F1").merge();
  sheet.getRange("A1:F1").setBackground("#FF5722").setFontColor("white").setFontWeight("bold").setFontSize(14);

  // Column headers
  const headers = ["Manager Name", "Current Streak", "Best Streak", "Total Weeks in Top 3", "Last Appeared", "Badge"];
  sheet.getRange("A2:F2").setValues([headers]);
  sheet.getRange("A2:F2").setBackground("#FFCCBC").setFontWeight("bold");

  // Sample data
  const sampleData = [
    ["John Smith", 3, 5, 12, "2026-W04", "🔥"],
    ["Sarah Johnson", 2, 3, 8, "2026-W04", ""],
    ["Maria Garcia", 5, 8, 15, "2026-W04", "⚡"],
    ["Ahmed Hassan", 1, 2, 4, "2026-W04", ""],
    ["James Lee", 10, 10, 20, "2026-W04", "💎"]
  ];
  sheet.getRange("A3:F7").setValues(sampleData);

  // Set column widths
  sheet.setColumnWidth(1, 150);  // Manager Name
  sheet.setColumnWidth(2, 120);  // Current Streak
  sheet.setColumnWidth(3, 120);  // Best Streak
  sheet.setColumnWidth(4, 150);  // Total Weeks
  sheet.setColumnWidth(5, 120);  // Last Appeared
  sheet.setColumnWidth(6, 80);   // Badge

  // Borders
  sheet.getRange("A2:F7").setBorder(true, true, true, true, true, true);

  // Instructions
  sheet.getRange("A9").setValue("📝 INSTRUCTIONS:");
  sheet.getRange("A9").setFontWeight("bold").setFontSize(11);

  const instructions = [
    ["• Current Streak: Consecutive weeks in Top 3 (auto-updated)"],
    ["• Best Streak: All-time longest streak (auto-updated)"],
    ["• Badge: 🔥 = 3+ weeks, ⚡ = 5+ weeks, 💎 = 10+ weeks"],
    ["• You can manually edit any values if needed"],
    ["• Streaks reset to 0 when manager drops out of Top 3"]
  ];
  sheet.getRange("A10:A14").setValues(instructions);
  sheet.setColumnWidth(1, 500);

  Logger.log("✅ Streak Tracking sheet created!");

  SpreadsheetApp.getUi().alert(
    '✅ Created!',
    'Streak Tracking sheet has been created.\n\n' +
    'This will automatically track:\n' +
    '• Consecutive weeks in Top 3\n' +
    '• Best streaks\n' +
    '• Award badges (🔥⚡💎)\n\n' +
    'Streaks are updated when you post the leaderboard.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * UPDATE STREAKS BASED ON CURRENT LEADERBOARD
 * Call this when posting the leaderboard
 */
function updateStreaks(currentWeek) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get current top 3 from all sections
    const leaderboardSheet = ss.getSheetByName("Weekly Leaderboard");
    if (!leaderboardSheet) {
      Logger.log("⚠️ Weekly Leaderboard sheet not found");
      return;
    }

    // Get streak tracking sheet
    let streakSheet = ss.getSheetByName("Streak Tracking");
    if (!streakSheet) {
      Logger.log("⚠️ Streak Tracking sheet not found - creating it...");
      createStreakTrackingSheet();
      streakSheet = ss.getSheetByName("Streak Tracking");
    }

    // Collect all managers in Top 3 this week
    const topManagers = new Set();

    // Read all 4 leaderboard sections
    const sections = [
      leaderboardSheet.getRange("A3:F5").getValues(),  // Churn Current
      leaderboardSheet.getRange("A9:F11").getValues(), // Churn Old
      leaderboardSheet.getRange("A15:F17").getValues(), // Killer Current
      leaderboardSheet.getRange("A21:F23").getValues()  // Killer Old
    ];

    sections.forEach(section => {
      section.forEach(row => {
        const managerName = row[2] ? String(row[2]).trim() : '';
        if (managerName) {
          topManagers.add(managerName);
        }
      });
    });

    Logger.log(`📊 Found ${topManagers.size} unique managers in Top 3 this week`);

    // Get existing streak data
    const streakData = streakSheet.getDataRange().getValues();
    const streakMap = new Map();

    // Skip header rows (row 0 is title, row 1 is headers)
    for (let i = 2; i < streakData.length; i++) {
      const row = streakData[i];
      const name = row[0] ? String(row[0]).trim() : '';
      if (name) {
        streakMap.set(name, {
          rowIndex: i + 1,
          currentStreak: row[1] || 0,
          bestStreak: row[2] || 0,
          totalWeeks: row[3] || 0,
          lastAppeared: row[4] || '',
          badge: row[5] || ''
        });
      }
    }

    // Update streaks
    const updates = [];

    topManagers.forEach(manager => {
      if (streakMap.has(manager)) {
        // Existing manager - increment streak
        const data = streakMap.get(manager);
        data.currentStreak += 1;
        data.totalWeeks += 1;
        data.bestStreak = Math.max(data.bestStreak, data.currentStreak);
        data.lastAppeared = currentWeek;
        data.badge = getStreakBadge(data.currentStreak);

        updates.push({
          range: `A${data.rowIndex}:F${data.rowIndex}`,
          values: [[manager, data.currentStreak, data.bestStreak, data.totalWeeks, data.lastAppeared, data.badge]]
        });

        Logger.log(`✓ ${manager}: Streak = ${data.currentStreak} ${data.badge}`);
      } else {
        // New manager - add to sheet
        const newRow = streakData.length + 1;
        updates.push({
          range: `A${newRow}:F${newRow}`,
          values: [[manager, 1, 1, 1, currentWeek, '']]
        });
        Logger.log(`✓ ${manager}: New entry (Streak = 1)`);
      }
    });

    // Reset streaks for managers not in Top 3 this week
    streakMap.forEach((data, manager) => {
      if (!topManagers.has(manager) && data.currentStreak > 0) {
        data.currentStreak = 0;
        data.badge = '';

        updates.push({
          range: `A${data.rowIndex}:F${data.rowIndex}`,
          values: [[manager, 0, data.bestStreak, data.totalWeeks, data.lastAppeared, '']]
        });

        Logger.log(`✓ ${manager}: Streak reset (not in Top 3)`);
      }
    });

    // Apply all updates
    updates.forEach(update => {
      streakSheet.getRange(update.range).setValues(update.values);
    });

    Logger.log(`✅ Updated ${updates.length} streak records`);

  } catch (error) {
    Logger.log(`❌ Error updating streaks: ${error.message}`);
  }
}

/**
 * GET STREAK BADGE BASED ON CURRENT STREAK
 */
function getStreakBadge(streak) {
  if (streak >= 10) return '💎';  // Diamond - 10+ weeks
  if (streak >= 5) return '⚡';   // Lightning - 5+ weeks
  if (streak >= 3) return '🔥';   // Fire - 3+ weeks
  return '';
}

/**
 * GET MANAGER'S STREAK INFO
 * Returns streak data for display in leaderboard
 */
function getManagerStreak(managerName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const streakSheet = ss.getSheetByName("Streak Tracking");

    if (!streakSheet) {
      return { streak: 0, badge: '', bestStreak: 0 };
    }

    const data = streakSheet.getDataRange().getValues();

    // Find manager (skip header rows)
    for (let i = 2; i < data.length; i++) {
      const name = data[i][0] ? String(data[i][0]).trim() : '';
      if (name === managerName) {
        return {
          streak: data[i][1] || 0,
          badge: data[i][5] || '',
          bestStreak: data[i][2] || 0,
          totalWeeks: data[i][3] || 0
        };
      }
    }

    return { streak: 0, badge: '', bestStreak: 0, totalWeeks: 0 };
  } catch (error) {
    Logger.log(`Error getting streak for ${managerName}: ${error.message}`);
    return { streak: 0, badge: '', bestStreak: 0, totalWeeks: 0 };
  }
}

/**
 * ADD STREAK INFO TO MANAGER NAME
 * Format: "John Smith 🔥3"
 */
function addStreakToName(managerName) {
  const streakInfo = getManagerStreak(managerName);

  if (streakInfo.streak > 0 && streakInfo.badge) {
    return `${managerName} ${streakInfo.badge}${streakInfo.streak}`;
  }

  return managerName;
}

/**
 * GET TOP STREAKS FOR INSIGHTS
 * Returns managers with longest current streaks
 */
function getTopStreaks(limit = 3) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const streakSheet = ss.getSheetByName("Streak Tracking");

    if (!streakSheet) return [];

    const data = streakSheet.getDataRange().getValues();
    const streaks = [];

    // Skip header rows
    for (let i = 2; i < data.length; i++) {
      const name = data[i][0] ? String(data[i][0]).trim() : '';
      const currentStreak = data[i][1] || 0;
      const badge = data[i][5] || '';

      if (name && currentStreak > 0) {
        streaks.push({ name, streak: currentStreak, badge });
      }
    }

    // Sort by streak descending
    streaks.sort((a, b) => b.streak - a.streak);

    return streaks.slice(0, limit);
  } catch (error) {
    Logger.log(`Error getting top streaks: ${error.message}`);
    return [];
  }
}
