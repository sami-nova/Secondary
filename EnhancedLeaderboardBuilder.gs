/**
 * ENHANCED LEADERBOARD BUILDER
 *
 * Integrates enhanced features:
 * ✅ Streak tracking
 * ✅ Highest payments section
 * ✅ Multi-frequency formats
 * ✅ Interactive buttons
 * ✅ Mobile optimization
 *
 * This is the new master function that replaces buildCombinedLeaderboardFromSheet
 */

/**
 * BUILD ENHANCED LEADERBOARD WITH FEATURES
 * This is the main function to use going forward
 */
function buildEnhancedLeaderboardWithFeatures(automation) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(automation.targetSheet || "Weekly Leaderboard");

    if (!sheet) {
      Logger.log("Weekly Leaderboard sheet not found");
      return { text: "Weekly Leaderboard sheet not found. Please create it first." };
    }

    Logger.log("\n🚀 BUILDING ENHANCED LEADERBOARD WITH FEATURES\n");

    // Get current week
    const currentWeek = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-'W'ww");

    // STEP 1: Update streaks (automatic tracking)
    Logger.log("1️⃣ Updating streaks...");
    if (typeof updateStreaks === 'function') {
      updateStreaks(currentWeek);
    }

    // STEP 2: Build leaderboard based on format preference
    Logger.log("2️⃣ Building leaderboard blocks...");

    // Check if mobile format is preferred
    if (shouldUseMobileFormat(automation)) {
      return buildMobileOptimizedLeaderboard(automation);
    }

    // Otherwise build full enhanced leaderboard
    return buildFullEnhancedLeaderboard(automation, currentWeek);

  } catch (error) {
    Logger.log(`❌ Error building enhanced leaderboard: ${error.message}`);
    Logger.log(error.stack);
    return { text: `Error building leaderboard: ${error.message}` };
  }
}

/**
 * BUILD FULL ENHANCED LEADERBOARD
 * Desktop version with all features
 */
function buildFullEnhancedLeaderboard(automation, currentWeek) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(automation.targetSheet || "Weekly Leaderboard");

  // Get all data sections
  const churnCurrentData = sheet.getRange("A3:F5").getValues();
  const churnOldData = sheet.getRange("A9:F11").getValues();
  const killerCurrentData = sheet.getRange("A15:F17").getValues();
  const killerOldData = sheet.getRange("A21:F23").getValues();
  const totalsData = sheet.getRange("A27:B34").getValues();
  const kbPaidRateData = sheet.getRange("A38:F40").getValues();
  const cpPaidRateData = sheet.getRange("A44:F46").getValues();

  const blocks = [];

  // Get display date
  const displayDate = totalsData.length > 0 && totalsData[0][1] ? String(totalsData[0][1]) : "Jan 26th";

  // HEADER
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `🏆 WEEKLY PERFORMANCE LEADERBOARD - ${displayDate}`,
      emoji: true
    }
  });

  blocks.push({ type: "divider" });

  // SECTION 1: CP CURRENT - with streaks
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🏆 CHURN PREVENTION - CURRENT BASE - TOP 3*"
    }
  });

  let cpCurrentText = "";
  churnCurrentData.forEach((row, idx) => {
    const rank = row[1];
    const managerName = row[2] ? String(row[2]).trim() : '';
    const sales = row[3];
    const cashRaw = row[4];
    const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
    const region = row[5] ? String(row[5]).trim() : '';

    if (!rank || !managerName) return;

    const rankEmoji = getRankEmoji(rank);
    const regionEmoji = region ? getRegionSlackEmoji(region) : "";

    // ADD STREAK if function available
    let displayName = `*${managerName}*`;
    if (typeof getManagerStreak === 'function') {
      const streakInfo = getManagerStreak(managerName);
      if (streakInfo.badge) {
        displayName += ` ${streakInfo.badge}${streakInfo.streak}`;
      }
    }

    cpCurrentText += `${rankEmoji} ${displayName}\n`;
    cpCurrentText += `   └ ${sales} sales | 💰 ${cashGenerated}`;
    if (region) {
      cpCurrentText += ` | ${regionEmoji} ${region}`;
    }
    cpCurrentText += `\n\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: cpCurrentText || "_No data available_"
    }
  });

  blocks.push({ type: "divider" });

  // SECTION 2: CP OLD
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🏆 CHURN PREVENTION - OLD BASE - TOP 3*"
    }
  });

  let cpOldText = "";
  churnOldData.forEach((row, idx) => {
    const rank = row[1];
    const managerName = row[2] ? String(row[2]).trim() : '';
    const sales = row[3];
    const cashRaw = row[4];
    const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
    const region = row[5] ? String(row[5]).trim() : '';

    if (!rank || !managerName) return;

    const rankEmoji = getRankEmoji(rank);
    const regionEmoji = region ? getRegionSlackEmoji(region) : "";

    let displayName = `*${managerName}*`;
    if (typeof getManagerStreak === 'function') {
      const streakInfo = getManagerStreak(managerName);
      if (streakInfo.badge) displayName += ` ${streakInfo.badge}${streakInfo.streak}`;
    }

    cpOldText += `${rankEmoji} ${displayName}\n`;
    cpOldText += `   └ ${sales} sales | 💰 ${cashGenerated}`;
    if (region) cpOldText += ` | ${regionEmoji} ${region}`;
    cpOldText += `\n\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: cpOldText || "_No data available_"
    }
  });

  blocks.push({ type: "divider" });

  // SECTION 3: KB CURRENT
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*💪 KILLER BASE - CURRENT BASE - TOP 3*"
    }
  });

  let kbCurrentText = "";
  killerCurrentData.forEach((row, idx) => {
    const rank = row[1];
    const managerName = row[2] ? String(row[2]).trim() : '';
    const sales = row[3];
    const cashRaw = row[4];
    const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
    const region = row[5] ? String(row[5]).trim() : '';

    if (!rank || !managerName) return;

    const rankEmoji = getRankEmoji(rank);
    const regionEmoji = region ? getRegionSlackEmoji(region) : "";

    let displayName = `*${managerName}*`;
    if (typeof getManagerStreak === 'function') {
      const streakInfo = getManagerStreak(managerName);
      if (streakInfo.badge) displayName += ` ${streakInfo.badge}${streakInfo.streak}`;
    }

    kbCurrentText += `${rankEmoji} ${displayName}\n`;
    kbCurrentText += `   └ ${sales} sales | 💰 ${cashGenerated}`;
    if (region) kbCurrentText += ` | ${regionEmoji} ${region}`;
    kbCurrentText += `\n\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: kbCurrentText || "_No data available_"
    }
  });

  blocks.push({ type: "divider" });

  // SECTION 4: KB OLD
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*💪 KILLER BASE - OLD BASE - TOP 3*"
    }
  });

  let kbOldText = "";
  killerOldData.forEach((row, idx) => {
    const rank = row[1];
    const managerName = row[2] ? String(row[2]).trim() : '';
    const sales = row[3];
    const cashRaw = row[4];
    const cashGenerated = typeof cashRaw === 'number' ? `$${cashRaw.toLocaleString('en-US')}` : cashRaw;
    const region = row[5] ? String(row[5]).trim() : '';

    if (!rank || !managerName) return;

    const rankEmoji = getRankEmoji(rank);
    const regionEmoji = region ? getRegionSlackEmoji(region) : "";

    let displayName = `*${managerName}*`;
    if (typeof getManagerStreak === 'function') {
      const streakInfo = getManagerStreak(managerName);
      if (streakInfo.badge) displayName += ` ${streakInfo.badge}${streakInfo.streak}`;
    }

    kbOldText += `${rankEmoji} ${displayName}\n`;
    kbOldText += `   └ ${sales} sales | 💰 ${cashGenerated}`;
    if (region) kbOldText += ` | ${regionEmoji} ${region}`;
    kbOldText += `\n\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: kbOldText || "_No data available_"
    }
  });

  blocks.push({ type: "divider" });

  // SECTION 5: KB PAID RATE
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*💪 KB PAID RATE CONTACTED 14DAY - TOP 3*"
    }
  });

  let kbPaidRateText = "";
  kbPaidRateData.forEach((row, idx) => {
    const rank = row[1];
    const region = row[2] ? String(row[2]).trim() : '';
    let paidRate = row[3];
    let target = row[4];
    const totalPayments = row[5];

    if (!rank || !region) return;

    // Format percentages
    if (typeof paidRate === 'number' && paidRate < 1) {
      paidRate = (paidRate * 100).toFixed(2) + '%';
    } else if (typeof paidRate === 'string' && !paidRate.includes('%')) {
      const num = parseFloat(paidRate);
      if (!isNaN(num) && num < 1) {
        paidRate = (num * 100).toFixed(2) + '%';
      }
    }

    if (typeof target === 'number' && target < 1) {
      target = (target * 100).toFixed(2) + '%';
    } else if (typeof target === 'string' && !target.includes('%')) {
      const num = parseFloat(target);
      if (!isNaN(num) && num < 1) {
        target = (num * 100).toFixed(2) + '%';
      }
    }

    const rankEmoji = getRankEmoji(rank);
    const regionEmoji = getRegionSlackEmoji(region);

    kbPaidRateText += `${rankEmoji} ${regionEmoji} *${region}*\n`;
    kbPaidRateText += `   └ Paid Rate: *${paidRate}* | Target: ${target} | Total Payments: ${totalPayments}\n\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: kbPaidRateText || "_No data available_"
    }
  });

  blocks.push({ type: "divider" });

  // SECTION 6: CP PAID RATE
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🏆 CP PAID RATE CONTACTED 14DAY - TOP 3*"
    }
  });

  let cpPaidRateText = "";
  cpPaidRateData.forEach((row, idx) => {
    const rank = row[1];
    const region = row[2] ? String(row[2]).trim() : '';
    let paidRate = row[3];
    let target = row[4];
    const totalPayments = row[5];

    if (!rank || !region) return;

    // Format percentages
    if (typeof paidRate === 'number' && paidRate < 1) {
      paidRate = (paidRate * 100).toFixed(2) + '%';
    } else if (typeof paidRate === 'string' && !paidRate.includes('%')) {
      const num = parseFloat(paidRate);
      if (!isNaN(num) && num < 1) {
        paidRate = (num * 100).toFixed(2) + '%';
      }
    }

    if (typeof target === 'number' && target < 1) {
      target = (target * 100).toFixed(2) + '%';
    } else if (typeof target === 'string' && !target.includes('%')) {
      const num = parseFloat(target);
      if (!isNaN(num) && num < 1) {
        target = (num * 100).toFixed(2) + '%';
      }
    }

    const rankEmoji = getRankEmoji(rank);
    const regionEmoji = getRegionSlackEmoji(region);

    cpPaidRateText += `${rankEmoji} ${regionEmoji} *${region}*\n`;
    cpPaidRateText += `   └ Paid Rate: *${paidRate}* | Target: ${target} | Total Payments: ${totalPayments}\n\n`;
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: cpPaidRateText || "_No data available_"
    }
  });

  blocks.push({ type: "divider" });

  // NEW SECTION: HIGHEST PAYMENTS THIS WEEK
  if (typeof buildHighestPaymentsBlock === 'function') {
    const highestPaymentsBlock = buildHighestPaymentsBlock();
    if (highestPaymentsBlock) {
      blocks.push(highestPaymentsBlock);
      blocks.push({ type: "divider" });
    }
  }

  // FOOTER with totals
  const grandTotal = totalsData[1][1] || 0;
  const churnTotal = totalsData[2][1] || 0;
  const churnCurrent = totalsData[3][1] || 0;
  const churnOld = totalsData[4][1] || 0;
  const killerTotal = totalsData[5][1] || 0;
  const killerCurrent = totalsData[6][1] || 0;
  const killerOld = totalsData[7][1] || 0;

  blocks.push({
    type: "context",
    elements: [{
      type: "mrkdwn",
      text: `📊 *Grand Total:* ${grandTotal} sales | 🏆 CP: ${churnTotal} (${churnCurrent} Current + ${churnOld} Old) | 💪 KB: ${killerTotal} (${killerCurrent} Current + ${killerOld} Old) | Updated: ${new Date().toLocaleString()}`
    }]
  });

  // ADD INTERACTIVE BUTTONS (if enabled)
  if (automation.interactiveButtons && automation.interactiveButtons.enabled) {
    Logger.log("3️⃣ Adding interactive buttons...");
    if (typeof addInteractiveButtons === 'function') {
      addInteractiveButtons(blocks, automation);
    }
  }

  Logger.log(`\n✅ Enhanced leaderboard built with ${blocks.length} blocks`);
  return { blocks: blocks };
}

/**
 * WRAPPER TO MAINTAIN BACKWARDS COMPATIBILITY
 * Redirects old function calls to new enhanced version
 */
function buildCombinedLeaderboardFromSheetEnhanced(automation) {
  return buildEnhancedLeaderboardWithFeatures(automation);
}
