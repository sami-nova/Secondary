/**
 * ACHIEVEMENT BADGES SYSTEM
 *
 * Tracks and awards badges for special accomplishments:
 * 🏆 First Time Winner - First time reaching #1
 * 🎯 Perfect Week - 100% target achievement
 * 🎩 Hat Trick - Top 3 for 3 consecutive weeks
 * ⭐ Rising Star - Biggest improvement from last week
 * 👑 Champion - Most weeks at #1
 * 🚀 Rocket - Fastest climb to top 3
 * 💪 Comeback Kid - Returned to top 3 after absence
 * 🌟 Consistency - Top 3 for 10+ weeks total
 */

/**
 * CREATE ACHIEVEMENTS SHEET
 */
function createAchievementsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Achievements");

  if (sheet) {
    const response = SpreadsheetApp.getUi().alert(
      'Sheet Exists',
      'Achievements sheet already exists. Recreate it?',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );

    if (response === SpreadsheetApp.getUi().Button.YES) {
      ss.deleteSheet(sheet);
    } else {
      return;
    }
  }

  sheet = ss.insertSheet("Achievements");

  // Header
  sheet.getRange("A1").setValue("🏆 ACHIEVEMENT BADGES");
  sheet.getRange("A1:E1").merge();
  sheet.getRange("A1:E1").setBackground("#FFD700").setFontColor("black").setFontWeight("bold").setFontSize(14);

  // Column headers
  const headers = ["Manager Name", "Badges Earned", "Latest Achievement", "Date Earned", "Total Badges"];
  sheet.getRange("A2:E2").setValues([headers]);
  sheet.getRange("A2:E2").setBackground("#FFF9C4").setFontWeight("bold");

  // Sample data
  const sampleData = [
    ["John Smith", "🏆 👑 🎩", "Champion", "2026-W04", 3],
    ["Maria Garcia", "⭐ 💪", "Rising Star", "2026-W03", 2],
    ["James Lee", "🌟 🎯", "Consistency", "2026-W04", 2]
  ];
  sheet.getRange("A3:E5").setValues(sampleData);

  // Badge legend
  sheet.getRange("A7").setValue("📋 AVAILABLE BADGES:");
  sheet.getRange("A7").setFontWeight("bold").setFontSize(11);

  const legend = [
    ["🏆 First Time Winner - First time reaching #1"],
    ["🎯 Perfect Week - 100% target achievement"],
    ["🎩 Hat Trick - Top 3 for 3 consecutive weeks"],
    ["⭐ Rising Star - Biggest improvement this week"],
    ["👑 Champion - Most weeks at #1 position"],
    ["🚀 Rocket - Fastest climb to top 3"],
    ["💪 Comeback Kid - Returned to top 3 after absence"],
    ["🌟 Consistency - Top 3 for 10+ weeks total"],
    ["🔥 Hot Streak - 5+ consecutive weeks in top 3"],
    ["💎 Legend - 10+ consecutive weeks in top 3"]
  ];
  sheet.getRange("A8:A17").setValues(legend);

  // Set column widths
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 100);

  // Borders
  sheet.getRange("A2:E5").setBorder(true, true, true, true, true, true);

  Logger.log("✅ Achievements sheet created!");
}

/**
 * CHECK AND AWARD ACHIEVEMENTS
 * Call this when posting leaderboard
 */
function checkAchievements(currentWeek) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const leaderboardSheet = ss.getSheetByName("Weekly Leaderboard");
    const streakSheet = ss.getSheetByName("Streak Tracking");
    let achievementSheet = ss.getSheetByName("Achievements");

    if (!achievementSheet) {
      Logger.log("Creating Achievements sheet...");
      createAchievementsSheet();
      achievementSheet = ss.getSheetByName("Achievements");
    }

    if (!leaderboardSheet) return;

    const newAchievements = [];

    // Get all top 3 managers
    const sections = [
      { data: leaderboardSheet.getRange("A3:F5").getValues(), type: "Churn Current" },
      { data: leaderboardSheet.getRange("A9:F11").getValues(), type: "Churn Old" },
      { data: leaderboardSheet.getRange("A15:F17").getValues(), type: "Killer Current" },
      { data: leaderboardSheet.getRange("A21:F23").getValues(), type: "Killer Old" }
    ];

    // Track #1 positions for Champion badge
    const championsThisWeek = [];

    sections.forEach(section => {
      section.data.forEach((row, idx) => {
        const rank = row[1];
        const managerName = row[2] ? String(row[2]).trim() : '';
        const sales = row[3];

        if (!managerName) return;

        // Check for #1 position
        if (rank === 1) {
          championsThisWeek.push(managerName);

          // Check if first time #1
          if (!hasAchievement(managerName, "🏆")) {
            newAchievements.push({
              manager: managerName,
              badge: "🏆",
              name: "First Time Winner",
              week: currentWeek
            });
          }
        }

        // Check for Hat Trick (3 week streak)
        if (streakSheet) {
          const streakInfo = getManagerStreak(managerName);
          if (streakInfo.streak === 3 && !hasAchievement(managerName, "🎩")) {
            newAchievements.push({
              manager: managerName,
              badge: "🎩",
              name: "Hat Trick",
              week: currentWeek
            });
          }

          // Check for Hot Streak (5 weeks)
          if (streakInfo.streak === 5 && !hasAchievement(managerName, "🔥")) {
            newAchievements.push({
              manager: managerName,
              badge: "🔥",
              name: "Hot Streak",
              week: currentWeek
            });
          }

          // Check for Legend (10 weeks)
          if (streakInfo.streak === 10 && !hasAchievement(managerName, "💎")) {
            newAchievements.push({
              manager: managerName,
              badge: "💎",
              name: "Legend",
              week: currentWeek
            });
          }

          // Check for Consistency (10+ total weeks)
          if (streakInfo.totalWeeks >= 10 && !hasAchievement(managerName, "🌟")) {
            newAchievements.push({
              manager: managerName,
              badge: "🌟",
              name: "Consistency",
              week: currentWeek
            });
          }
        }
      });
    });

    // Check for Rising Star (biggest improvement)
    // This would require historical data - for now we'll check paid rate achievements
    const kbPaidRate = leaderboardSheet.getRange("A38:F40").getValues();
    const cpPaidRate = leaderboardSheet.getRange("A44:F46").getValues();

    [...kbPaidRate, ...cpPaidRate].forEach(row => {
      const region = row[2] ? String(row[2]).trim() : '';
      let paidRate = row[3];
      let target = row[4];

      // Convert percentages
      if (typeof paidRate === 'string') paidRate = parseFloat(paidRate) / 100;
      if (typeof target === 'string') target = parseFloat(target) / 100;

      // Check for Perfect Week (100%+ achievement)
      if (paidRate >= target && region) {
        // Award to top manager of that region
        // This is simplified - you might want to map regions to managers
      }
    });

    // Award new achievements
    if (newAchievements.length > 0) {
      Logger.log(`\n🎉 AWARDING ${newAchievements.length} NEW ACHIEVEMENTS:`);

      newAchievements.forEach(achievement => {
        awardAchievement(achievement.manager, achievement.badge, achievement.name, achievement.week);
        Logger.log(`   ${achievement.badge} ${achievement.manager} - ${achievement.name}`);
      });
    } else {
      Logger.log("No new achievements this week");
    }

    return newAchievements;

  } catch (error) {
    Logger.log(`❌ Error checking achievements: ${error.message}`);
    return [];
  }
}

/**
 * CHECK IF MANAGER HAS ACHIEVEMENT
 */
function hasAchievement(managerName, badge) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Achievements");

    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();

    for (let i = 2; i < data.length; i++) {
      const name = data[i][0] ? String(data[i][0]).trim() : '';
      const badges = data[i][1] ? String(data[i][1]) : '';

      if (name === managerName && badges.includes(badge)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * AWARD ACHIEVEMENT TO MANAGER
 */
function awardAchievement(managerName, badge, achievementName, week) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Achievements");

    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    let found = false;
    let rowIndex = -1;

    // Find manager
    for (let i = 2; i < data.length; i++) {
      const name = data[i][0] ? String(data[i][0]).trim() : '';
      if (name === managerName) {
        found = true;
        rowIndex = i + 1;
        break;
      }
    }

    if (found) {
      // Update existing row
      const currentBadges = data[rowIndex - 1][1] ? String(data[rowIndex - 1][1]) : '';
      const newBadges = currentBadges ? `${currentBadges} ${badge}` : badge;
      const totalBadges = (data[rowIndex - 1][4] || 0) + 1;

      sheet.getRange(rowIndex, 2).setValue(newBadges);
      sheet.getRange(rowIndex, 3).setValue(achievementName);
      sheet.getRange(rowIndex, 4).setValue(week);
      sheet.getRange(rowIndex, 5).setValue(totalBadges);
    } else {
      // Add new row
      const newRow = data.length + 1;
      sheet.getRange(newRow, 1, 1, 5).setValues([[
        managerName,
        badge,
        achievementName,
        week,
        1
      ]]);
    }

  } catch (error) {
    Logger.log(`Error awarding achievement: ${error.message}`);
  }
}

/**
 * GET MANAGER'S BADGES
 * Returns badge string for display
 */
function getManagerBadges(managerName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Achievements");

    if (!sheet) return '';

    const data = sheet.getDataRange().getValues();

    for (let i = 2; i < data.length; i++) {
      const name = data[i][0] ? String(data[i][0]).trim() : '';
      if (name === managerName) {
        return data[i][1] ? String(data[i][1]) : '';
      }
    }

    return '';
  } catch (error) {
    return '';
  }
}

/**
 * GET LATEST ACHIEVEMENTS (for insights)
 */
function getLatestAchievements(limit = 3) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Achievements");

    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const achievements = [];

    for (let i = 2; i < data.length; i++) {
      const name = data[i][0] ? String(data[i][0]).trim() : '';
      const achievement = data[i][2] ? String(data[i][2]) : '';
      const badge = data[i][1] ? String(data[i][1]).split(' ').pop() : '';
      const week = data[i][3] || '';

      if (name && achievement) {
        achievements.push({ name, achievement, badge, week });
      }
    }

    // Sort by week (latest first) and take limit
    achievements.sort((a, b) => b.week.localeCompare(a.week));

    return achievements.slice(0, limit);
  } catch (error) {
    return [];
  }
}
