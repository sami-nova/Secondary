/**
 * TROUBLESHOOTING: Bot Auto-Sending Messages
 *
 * If the bot is sending messages automatically without scheduling:
 *
 * 1. CHECK TIME-BASED TRIGGERS:
 *    - Go to Apps Script Editor
 *    - Click on "Triggers" (clock icon on left sidebar)
 *    - Look for any triggers running executeBulkSlackAutomation or buildKeyMetricsWeeklyUpdate
 *    - Delete any unwanted triggers
 *
 * 2. CHECK AUTOMATION SETTINGS:
 *    - Open "Slack Automation Settings" sheet (if you have one)
 *    - Check if any automation has "Enabled" = TRUE
 *    - Check if any automation has scheduling enabled
 *    - Disable automations you don't want to run
 *
 * 3. CHECK PROPERTIES:
 *    - File > Project Properties > Script Properties
 *    - Look for "SlackAutomations" property
 *    - Check if any automation is enabled
 *
 * 4. DISABLE ALL AUTO-SENDING:
 *    Run this function to disable all triggers:
 */
function disableAllSlackTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    const handlerFunction = trigger.getHandlerFunction();
    if (handlerFunction === "executeBulkSlackAutomation" ||
        handlerFunction === "sendWeeklyReportToSlack" ||
        handlerFunction === "buildKeyMetricsWeeklyUpdate") {
      ScriptApp.deleteTrigger(trigger);
      Logger.log(`Deleted trigger: ${handlerFunction}`);
    }
  });
  Logger.log("All Slack triggers have been disabled.");
}

/**
 * View all active triggers
 */
function viewAllActiveTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  Logger.log("=".repeat(80));
  Logger.log("ACTIVE TRIGGERS");
  Logger.log("=".repeat(80));

  if (triggers.length === 0) {
    Logger.log("No triggers found.");
    return;
  }

  triggers.forEach((trigger, index) => {
    Logger.log(`\nTrigger ${index + 1}:`);
    Logger.log(`  Function: ${trigger.getHandlerFunction()}`);
    Logger.log(`  Type: ${trigger.getEventType()}`);
    Logger.log(`  Trigger ID: ${trigger.getUniqueId()}`);
  });

  Logger.log("\n" + "=".repeat(80));
}
