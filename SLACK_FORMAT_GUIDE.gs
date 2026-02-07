/**
 * SLACK MESSAGE FORMAT GUIDE
 *
 * This document lists all available formats for Slack automations
 * Use these format names in your Slack Automation Settings
 */

/**
 * AVAILABLE FORMATS:
 * ==================
 *
 * 1. "inline" (Default)
 *    - Simple inline text format
 *    - Example: *Label:* Value  *Label:* Value
 *    - Best for: Quick updates, simple data
 *
 * 2. "table"
 *    - Formatted table with borders
 *    - Monospaced columns for alignment
 *    - Best for: Structured data, comparisons
 *
 * 3. "list"
 *    - Bulleted list format
 *    - Each row as a separate bullet
 *    - Best for: Action items, summaries
 *
 * 4. "cards"
 *    - Card-style layout with sections
 *    - Visual separators between items
 *    - Best for: Detailed information, profiles
 *
 * 5. "plain"
 *    - Plain text without formatting
 *    - No markdown or special characters
 *    - Best for: Simple notifications
 *
 * 6. "context"
 *    - Contextual information format
 *    - Small text, suitable for metadata
 *    - Best for: Timestamps, footnotes
 *
 * 7. "quote"
 *    - Block quote format
 *    - Indented with quote styling
 *    - Best for: Highlights, important messages
 *
 * 8. "compact"
 *    - Compact format with minimal spacing
 *    - Fits more data in less space
 *    - Best for: Space-constrained messages
 *
 * 9. "rich"
 *    - Rich format with colors and emojis
 *    - Enhanced visual styling
 *    - Best for: Engaging, colorful reports
 *
 * 10. "leaderboard"
 *     - Simple leaderboard format
 *     - Shows rankings and scores
 *     - Best for: Performance tracking
 *
 * 11. "leaderboard_combined" ⭐ RECOMMENDED FOR WEEKLY LEADERBOARD
 *     - Combined leaderboard from "Weekly Leaderboard" sheet
 *     - Shows all sections in one message:
 *       * Churn Prevention - Current Base TOP 3
 *       * Churn Prevention - Old Base TOP 3
 *       * Killer Base - Current Base TOP 3
 *       * Killer Base - Old Base TOP 3
 *       * KB Paid Rate TOP 3
 *       * CP Paid Rate TOP 3
 *       * Highest Payments TOP 3
 *       * Manager of the Week
 *     - Features:
 *       * Region flag emojis (🇹🇷 🇵🇱 🇮🇱 etc.)
 *       * WoW change indicators (🔥 📈 ➕ 📉)
 *       * Manager tagging (@mentions)
 *       * Channel tagging (#channels)
 *       * Optional sections (hide if empty)
 *     - Best for: Weekly manager performance reports
 *     - Sheet name: "Weekly Leaderboard"
 *     - Setup: Run createLeaderboardTemplateV2() to create sheet
 *
 * 12. "key_metrics_weekly" ⭐ NEW!
 *     - Key metrics weekly update from "Key Metrics Weekly" sheet
 *     - Shows 4 sections in one message:
 *       * Key Metrics Overview (Net Churn, ARPU, Purchase %, Revenue)
 *       * Net Churn by Region (table with all regions)
 *       * Sales Performance by Region (Purchase %, Revenue %)
 *       * Plan vs Fact by Category (performance by category)
 *     - Features:
 *       * Region flag emojis (🇹🇷 🇵🇱 🇮🇱 etc.)
 *       * Status icons (🔥 ✅ ⚠️ ❌)
 *       * Monospaced tables for perfect alignment
 *       * Short currency format ($1.5M)
 *       * Optional sections (hide if empty)
 *       * Auto-generated status based on performance
 *     - Best for: Weekly executive metrics reports
 *     - Sheet name: "Key Metrics Weekly"
 *     - Setup: Run createKeyMetricsWeeklySheet() to create sheet
 */

/**
 * HOW TO USE FORMATS:
 * ===================
 *
 * OPTION 1: In Slack Automation Settings Sheet
 * ---------------------------------------------
 * 1. Open your "Slack Automation Settings" sheet
 * 2. Find the "Format" column
 * 3. Enter one of the format names above (e.g., "key_metrics_weekly")
 * 4. Save and run your automation
 *
 * OPTION 2: In Script Properties
 * -------------------------------
 * 1. Create an automation object with the format field:
 *    {
 *      name: "My Report",
 *      format: "key_metrics_weekly",
 *      sheetName: "Key Metrics Weekly",
 *      ...
 *    }
 * 2. Save to PropertiesService
 *
 * OPTION 3: Direct Function Call
 * -------------------------------
 * Call the builder function directly:
 * - For key metrics: buildKeyMetricsWeeklyUpdate(automation)
 * - For leaderboard: buildCombinedLeaderboardFromSheet(automation)
 */

/**
 * EXAMPLES:
 * =========
 *
 * Example 1: Key Metrics Weekly Report
 * -------------------------------------
 * Format: "key_metrics_weekly"
 * Sheet: "Key Metrics Weekly"
 * Setup: createKeyMetricsWeeklySheet()
 * Function: buildKeyMetricsWeeklyUpdate()
 *
 * Example 2: Manager Leaderboard
 * -------------------------------
 * Format: "leaderboard_combined"
 * Sheet: "Weekly Leaderboard"
 * Setup: createLeaderboardTemplateV2()
 * Function: buildCombinedLeaderboardFromSheet()
 *
 * Example 3: Simple Table Report
 * -------------------------------
 * Format: "table"
 * Sheet: Any sheet with data
 * Setup: No special setup needed
 * Function: buildTableFormat()
 */

/**
 * QUICK REFERENCE FOR KEY FORMATS:
 * =================================
 *
 * Weekly Manager Leaderboard:
 *   Format: "leaderboard_combined"
 *   Sheet: "Weekly Leaderboard"
 *   Setup: createLeaderboardTemplateV2()
 *
 * Weekly Key Metrics Report:
 *   Format: "key_metrics_weekly"
 *   Sheet: "Key Metrics Weekly"
 *   Setup: createKeyMetricsWeeklySheet()
 *
 * General Data Table:
 *   Format: "table"
 *   Sheet: Any data sheet
 *   Setup: None
 */

/**
 * Function to list all available formats (for reference)
 */
function listAvailableFormats() {
  const formats = [
    { name: "inline", description: "Simple inline text format (default)" },
    { name: "table", description: "Formatted table with borders" },
    { name: "list", description: "Bulleted list format" },
    { name: "cards", description: "Card-style layout with sections" },
    { name: "plain", description: "Plain text without formatting" },
    { name: "context", description: "Contextual information format" },
    { name: "quote", description: "Block quote format" },
    { name: "compact", description: "Compact format with minimal spacing" },
    { name: "rich", description: "Rich format with colors and emojis" },
    { name: "leaderboard", description: "Simple leaderboard format" },
    { name: "leaderboard_combined", description: "⭐ Combined manager leaderboard (Weekly Leaderboard sheet)" },
    { name: "key_metrics_weekly", description: "⭐ Key metrics weekly report (Key Metrics Weekly sheet)" }
  ];

  Logger.log("=".repeat(80));
  Logger.log("AVAILABLE SLACK MESSAGE FORMATS");
  Logger.log("=".repeat(80));

  formats.forEach((format, idx) => {
    Logger.log(`\n${idx + 1}. "${format.name}"`);
    Logger.log(`   ${format.description}`);
  });

  Logger.log("\n" + "=".repeat(80));
  Logger.log("To use a format, set the 'format' field in your automation to one of these names.");
  Logger.log("=".repeat(80));

  return formats;
}
