# Message Format Options Guide

## Overview

Your Slack automation now supports **5 different message formats** that you can choose from when creating or editing automations. Each format has a different visual style in Slack.

## Available Formats

### 1. **Inline Text** (Default)
Clean, compact format with labels and values on the same line.

**Example:**
```
📊 Net Churn
📅 Generated: 12/24/2025, 4:20:29 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━

*Region:* Total  *Today:* 4.37%  *Yesterday:* 4.21%  *Forecast:* 5.88%  *Plan:* 6.00%

━━━━━━━━━━━━━━━━━━━━━━━━━━

*Region:* Arab  *Today:* 9.14%  *Yesterday:* 8.79%  *Forecast:* 12.29%  *Plan:* 13.34%
```

**Best for:** Quick summaries, mobile viewing, concise reports

---

### 2. **Table Format**
ASCII table in a code block - great for data that needs alignment.

**Example:**
```
📊 Net Churn
📅 Generated: 12/24/2025, 4:20:29 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Region          | Today    | Yesterday | Forecast  | Plan
────────────────┼──────────┼───────────┼───────────┼──────────
Total           | 4.37%    | 4.21%     | 5.88%     | 6.00%
Arab            | 9.14%    | 8.79%     | 12.29%    | 13.34%
TR              | 4.41%    | 4.16%     | 5.81%     | 6.09%
```
```

**Best for:** Numeric data, comparisons, spreadsheet-like views

---

### 3. **Bullet List**
Each field on its own line with bullet points.

**Example:**
```
📊 Net Churn
📅 Generated: 12/24/2025, 4:20:29 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━

• *Region:* Total
• *Today:* 4.37%
• *Yesterday:* 4.21%
• *Forecast:* 5.88%
• *Plan:* 6.00%

━━━━━━━━━━━━━━━━━━━━━━━━━━

• *Region:* Arab
• *Today:* 9.14%
• *Yesterday:* 8.79%
• *Forecast:* 12.29%
• *Plan:* 13.34%
```

**Best for:** Detailed reading, fewer rows, important details

---

### 4. **Compact Cards**
Two-column card layout with fields - more visual and structured.

**Example:**
```
📊 Net Churn
📅 Generated: 12/24/2025, 4:20:29 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────┬─────────────────────┐
│ *Region:*           │ *Today:*            │
│ Total               │ 4.37%               │
├─────────────────────┼─────────────────────┤
│ *Yesterday:*        │ *Forecast:*         │
│ 4.21%               │ 5.88%               │
└─────────────────────┴─────────────────────┘
```

**Best for:** Visual appeal, moderate data, dashboards

---

### 5. **Plain Text**
Simple text without markdown formatting - just the facts.

**Example:**
```
📊 Net Churn
Generated: 12/24/2025, 4:20:29 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━

Region: Total  Today: 4.37%  Yesterday: 4.21%  Forecast: 5.88%  Plan: 6.00%

━━━━━━━━━━━━━━━━━━━━━━━━━━

Region: Arab  Today: 9.14%  Yesterday: 8.79%  Forecast: 12.29%  Plan: 13.34%
```

**Best for:** Plain text channels, copying data, accessibility

---

## How to Add Format Selector to Your UI

### Step 1: Open SlackAutomationScheduler.html

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Find and open `SlackAutomationScheduler.html`

### Step 2: Find the Message Configuration Section

Look for the section with "Slack Configuration" - it should have fields for webhook URL, channel, etc.

### Step 3: Add the Message Format Dropdown

Add this code in the Slack Configuration section (after the channel field):

```html
<!-- Message Format Selection -->
<el-form-item label="Message Format" prop="messageFormat">
  <el-select
    v-model="automationForm.messageFormat"
    placeholder="Select format style"
    style="width: 100%">
    <el-option
      label="Inline Text (Default)"
      value="inline">
      <span style="float: left">Inline Text</span>
      <span style="float: right; color: #8492a6; font-size: 13px">
        Compact, mobile-friendly
      </span>
    </el-option>
    <el-option
      label="Table Format"
      value="table">
      <span style="float: left">Table Format</span>
      <span style="float: right; color: #8492a6; font-size: 13px">
        Aligned columns
      </span>
    </el-option>
    <el-option
      label="Bullet List"
      value="list">
      <span style="float: left">Bullet List</span>
      <span style="float: right; color: #8492a6; font-size: 13px">
        Detailed view
      </span>
    </el-option>
    <el-option
      label="Compact Cards"
      value="cards">
      <span style="float: left">Compact Cards</span>
      <span style="float: right; color: #8492a6; font-size: 13px">
        Visual layout
      </span>
    </el-option>
    <el-option
      label="Plain Text"
      value="plain">
      <span style="float: left">Plain Text</span>
      <span style="float: right; color: #8492a6; font-size: 13px">
        No formatting
      </span>
    </el-option>
  </el-select>
</el-form-item>
```

### Step 4: Update the Data Model

Find the `data()` section in your Vue component and make sure `automationForm` includes `messageFormat`:

```javascript
data() {
  return {
    automationForm: {
      name: '',
      targetSheet: '',
      triggerType: '',
      slackWebhookUrl: '',
      slackChannel: '',
      messageFormat: 'inline', // Add this line - default to inline
      messageTemplate: '',
      // ... other fields
    }
  }
}
```

### Step 5: Save and Test

1. Save the HTML file (Ctrl+S or Cmd+S)
2. Refresh your Google Sheet
3. Open the automation builder
4. You should now see the "Message Format" dropdown with 5 options

---

## Testing Each Format

### Quick Test Steps:

1. Open your automation builder
2. Create a new automation or edit existing one
3. **Select a message format** from the dropdown
4. Configure other settings (sheet, webhook, etc.)
5. Click **Test** to see how it looks in Slack
6. Try different formats to find your favorite!

### Tips for Choosing:

- **Lots of data rows?** → Use **Table** or **Inline**
- **Few rows, important details?** → Use **Bullet List** or **Cards**
- **Mobile users?** → Use **Inline** (most compact)
- **Need to copy data?** → Use **Plain Text** or **Table**
- **Visual dashboards?** → Use **Cards**

---

## Technical Details

### How It Works:

1. When you select a format in the UI, it's saved as `messageFormat` in your automation config
2. When the automation runs, it checks the `messageFormat` property
3. The appropriate formatter function is called:
   - `inline` → `buildInlineFormat()`
   - `table` → `buildTableFormat()`
   - `list` → `buildListFormat()`
   - `cards` → `buildCardsFormat()`
   - `plain` → `buildPlainFormat()`
4. The formatted message is sent to Slack

### Default Behavior:

If no format is specified, it defaults to **"inline"** format (the current clean format you're already using).

### Changing Format on Existing Automations:

1. Edit the automation
2. Select a new format from the dropdown
3. Save the automation
4. Next time it runs, it will use the new format

---

## Format Comparison Chart

| Format        | Rows | Compact | Visual | Mobile | Copy-Friendly |
|---------------|------|---------|--------|--------|---------------|
| Inline        | ⭐⭐⭐  | ⭐⭐⭐    | ⭐⭐    | ⭐⭐⭐   | ⭐⭐           |
| Table         | ⭐⭐⭐  | ⭐⭐     | ⭐⭐    | ⭐⭐    | ⭐⭐⭐          |
| Bullet List   | ⭐⭐   | ⭐      | ⭐⭐⭐   | ⭐⭐    | ⭐⭐           |
| Compact Cards | ⭐⭐   | ⭐⭐     | ⭐⭐⭐   | ⭐⭐    | ⭐            |
| Plain Text    | ⭐⭐⭐  | ⭐⭐⭐    | ⭐     | ⭐⭐⭐   | ⭐⭐⭐          |

**Legend:**
- **Rows**: How many rows it can display well
- **Compact**: How space-efficient it is
- **Visual**: How visually appealing it is
- **Mobile**: How well it works on mobile devices
- **Copy-Friendly**: How easy it is to copy/paste the data

---

## Troubleshooting

### Format Not Changing

**Problem:** Selected different format but still seeing old format

**Solution:**
1. Make sure you saved the automation after selecting new format
2. Check that SlackAutomationBuilder.gs has all the format functions
3. Try deleting the automation and creating a new one

### Missing Format Dropdown

**Problem:** Don't see the format dropdown in UI

**Solution:**
1. Make sure you added the HTML code to SlackAutomationScheduler.html
2. Save the HTML file and refresh your Google Sheet
3. Close and reopen the automation builder

### Error: "buildTableFormat is not defined"

**Problem:** Getting error when testing

**Solution:**
1. Update SlackAutomationBuilder.gs with the latest version from repository
2. Make sure all 5 format functions are present:
   - buildInlineFormat()
   - buildTableFormat()
   - buildListFormat()
   - buildCardsFormat()
   - buildPlainFormat()

---

## Example HTML Placement

Here's where to add the format selector in your HTML:

```html
<!-- Slack Configuration -->
<el-form-item label="Slack Webhook URL" prop="slackWebhookUrl">
  <el-input v-model="automationForm.slackWebhookUrl"
            placeholder="https://hooks.slack.com/services/...">
  </el-input>
</el-form-item>

<el-form-item label="Slack Channel" prop="slackChannel">
  <el-input v-model="automationForm.slackChannel"
            placeholder="#channel-name">
  </el-input>
</el-form-item>

<!-- ✨ ADD MESSAGE FORMAT SELECTOR HERE ✨ -->
<el-form-item label="Message Format" prop="messageFormat">
  <el-select v-model="automationForm.messageFormat"
             placeholder="Select format style"
             style="width: 100%">
    <!-- ... options from Step 3 above ... -->
  </el-select>
</el-form-item>

<!-- Continue with message template, etc. -->
<el-form-item label="Message Template" prop="messageTemplate">
  ...
</el-form-item>
```

---

## Summary

You now have **5 professional message format options** to choose from:

✅ **Inline Text** - Current default, clean and compact
✅ **Table Format** - ASCII table for aligned data
✅ **Bullet List** - Detailed view with bullet points
✅ **Compact Cards** - Visual 2-column layout
✅ **Plain Text** - Simple text without markdown

Just add the dropdown to your HTML UI and start experimenting with different formats to find what works best for your reports!

---

**Last Updated:** 2025-12-24
