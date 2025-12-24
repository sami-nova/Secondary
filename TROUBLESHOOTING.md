# Troubleshooting Guide

## Test Button Not Working

If clicking the "Test" button does nothing, follow these steps:

### Step 1: Copy All Required Files

Make sure you have copied **ALL** these files to your Google Apps Script project:

1. **SlackAutomationBuilder.gs** - Main message building logic
2. **SlackLib.gs** - Helper library (REQUIRED - newly added!)
3. **SlackReportFormatter.gs** - Advanced formatting functions

**How to copy:**
1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. For each file:
   - Click the **+** next to **Files**
   - Select **Script**
   - Name it exactly as shown above (e.g., `SlackAutomationBuilder`)
   - Copy and paste the entire content from the repository file
   - Click **Save** (Ctrl+S or Cmd+S)

### Step 2: Check Execution Logs

1. In Apps Script editor, click **Executions** (icon on left sidebar)
2. Click **Test** button in your sheet
3. Check if any execution appears
4. If execution appears, click on it to see the logs
5. Look for error messages in red

**Common errors and fixes:**
- `"Automation not found"` → The automation ID is incorrect, try recreating the automation
- `"Sheet not found"` → Check that the target sheet name matches exactly
- `"Webhook URL missing"` → Set your Slack webhook URL in the automation config
- `"No rows match criteria"` → Remove filter criteria or adjust them

### Step 3: Verify Webhook URL

1. In your automation config, make sure you have a valid Slack webhook URL
2. Format should be: `https://hooks.slack.com/services/T.../B.../XXX...`
3. Test the webhook URL separately if needed

**To get a webhook URL:**
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Go to **Incoming Webhooks**
4. Click **Add New Webhook to Workspace**
5. Select channel and authorize
6. Copy the webhook URL

### Step 4: Test with Simple Data

Create a test sheet with simple data:

```
| Name    | Status   | Amount |
|---------|----------|--------|
| Test 1  | Complete | 100    |
| Test 2  | Pending  | 200    |
```

Then create an automation:
- Target Sheet: Your test sheet
- Trigger: Bulk send based on criteria
- No criteria (send all rows)
- Slack Webhook: Your webhook URL
- Message Template: `{{📊 SECONDARY SALES WEEKLY REPORT}}`

Click **Test** - you should see a message in Slack.

### Step 5: Check Browser Console

1. Open browser developer tools (F12 or Ctrl+Shift+I)
2. Go to **Console** tab
3. Click **Test** button
4. Look for JavaScript errors

**Common issues:**
- `"google.script.run is not defined"` → You're not in a Google Apps Script environment
- Network errors → Check your internet connection
- Timeout errors → Your script is taking too long (>30 seconds)

### Step 6: Add Failure Handler to HTML

If errors aren't showing up, you might need to update your HTML file. In `SlackAutomationScheduler.html`, find the `testAutomation` function and make sure it has both success and failure handlers:

```javascript
testAutomation(automationId) {
  google.script.run
    .withSuccessHandler((result) => {
      if (result.success) {
        this.$message.success("Test message sent successfully");
      } else {
        this.$message.error("Error: " + result.error);
      }
    })
    .withFailureHandler((error) => {
      console.error("Server error:", error);
      this.$message.error("Server error: " + error.message);
    })
    .testSlackAutomation(automationId);
}
```

### Step 7: Check Automation Configuration

Your automation must have:

✅ **Name** - Any descriptive name
✅ **Target Sheet** - Must match an existing sheet name exactly
✅ **Trigger Type** - Select one (we recommend "Bulk send based on criteria")
✅ **Slack Webhook URL** - Valid webhook from Slack
✅ **Slack Channel** - Channel name (e.g., #personal-space)
✅ **Message Template** - Can be just `{{📊 SECONDARY SALES WEEKLY REPORT}}`

### Step 8: Manual Test via Script Editor

Try running the test directly from the script editor:

1. Open **Apps Script** editor
2. Select `testSlackAutomation` function from dropdown
3. Click **Run** (▶️ button)
4. Check the **Execution log** (View → Logs)

This will show you the exact error message.

## Common Issues

### Issue: "Nothing happens when clicking Test"

**Causes:**
1. Missing SlackLib.gs file
2. JavaScript error in browser
3. Automation not saved properly

**Solution:**
1. Copy **SlackLib.gs** to your Apps Script project
2. Check browser console (F12) for errors
3. Delete and recreate the automation

### Issue: "Message sent but looks messy in Slack"

**Cause:** Using old code version

**Solution:**
1. Replace `SlackAutomationBuilder.gs` with the latest version
2. Make sure you're using the updated `buildBeautifulReport()` function

### Issue: "No rows match the automation criteria"

**Cause:** Filter criteria too restrictive or incorrect

**Solution:**
1. Edit your automation
2. Remove all criteria (leave empty)
3. Test again
4. Then add criteria back one by one

### Issue: "Sheet not found"

**Causes:**
1. Sheet name doesn't match exactly (case-sensitive!)
2. Sheet was renamed or deleted

**Solution:**
1. Check exact sheet name (including spaces, capitals)
2. Update automation to use correct sheet name

### Issue: "Webhook URL missing"

**Cause:** No webhook URL configured

**Solution:**
1. Edit automation
2. Paste valid Slack webhook URL
3. Format: `https://hooks.slack.com/services/...`

### Issue: "Test succeeds but nothing in Slack"

**Causes:**
1. Wrong webhook URL
2. Wrong channel
3. Slack app not authorized

**Solution:**
1. Verify webhook URL is correct
2. Check if webhook is for correct workspace/channel
3. Test webhook with curl or Postman

## Getting Help

If you're still stuck:

1. **Check Execution Logs:**
   - Apps Script → Executions (left sidebar)
   - Look for your test execution
   - Read the full error message

2. **Enable Detailed Logging:**
   - All functions now have Logger.log() statements
   - Check View → Logs after running test

3. **Simplify Your Test:**
   - Create automation with minimal settings
   - Use simple test data
   - No criteria/filters
   - Once working, add complexity back

## Debug Checklist

- [ ] Copied SlackLib.gs file
- [ ] Copied SlackAutomationBuilder.gs file
- [ ] Copied SlackReportFormatter.gs file
- [ ] Automation has valid Slack webhook URL
- [ ] Target sheet exists and has data
- [ ] No criteria set (for initial test)
- [ ] Checked execution logs for errors
- [ ] Checked browser console for errors
- [ ] Tested webhook URL separately

## Quick Test Script

Run this in Apps Script editor to test basic functionality:

```javascript
function quickTest() {
  // Test 1: Check if automations exist
  const automations = getSlackAutomations();
  Logger.log(`Found ${automations.length} automations`);

  if (automations.length === 0) {
    Logger.log("❌ No automations found. Create one first!");
    return;
  }

  // Test 2: Check first automation
  const auto = automations[0];
  Logger.log(`Testing automation: ${auto.name}`);
  Logger.log(`Target sheet: ${auto.targetSheet}`);
  Logger.log(`Webhook URL: ${auto.slackWebhookUrl ? '✅ Set' : '❌ Missing'}`);

  // Test 3: Check if sheet exists
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(auto.targetSheet);

  if (!sheet) {
    Logger.log(`❌ Sheet "${auto.targetSheet}" not found!`);
    return;
  }

  Logger.log(`✅ Sheet found with ${sheet.getLastRow()} rows`);

  // Test 4: Try sending test message
  const result = testSlackAutomation(auto.id);
  Logger.log(`Test result: ${JSON.stringify(result)}`);
}
```

---

**Last Updated:** 2025-12-24
