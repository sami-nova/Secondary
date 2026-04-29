# Daily Manager Schedule Tracker — Setup Guide

> **Google Apps Script** · 28 managers · 10 regions · Slack Block Kit

---

## Files in This Project

| File | Purpose |
|---|---|
| `01_Config.gs` | Global config, colour palette, manager roster, holidays |
| `02_Builder.gs` | Sheet builder, conditional formatting, `updateMonth()` |
| `03_Slack.gs` | `postScheduleToSlack()` + Block Kit message builder |
| `04_Triggers.gs` | Custom menu (`onOpen`) + time-driven trigger helpers |

---

## Part 1 — Create the Google Sheet & Paste the Script

### Step 1 — Create a new Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **blank spreadsheet**.
2. Rename it to something memorable, e.g. **"Manager Schedule Tracker"**.

### Step 2 — Open the Apps Script editor

1. Click **Extensions → Apps Script**.
2. The editor opens with a default `Code.gs` file.

### Step 3 — Create four script files

> **Delete** the default `Code.gs` content (or rename the file to `01_Config.gs`).

For each of the four `.gs` files in this repo, create a matching file in Apps Script:

1. Click the **+** icon next to "Files" → choose **Script**.
2. Name it exactly as shown (e.g. `01_Config`). Apps Script adds `.gs` automatically.
3. **Paste** the full contents of the corresponding file.
4. Repeat for all four files.

### Step 4 — Save the project

Press **Ctrl+S** (or **⌘+S** on Mac) in the editor, or click the floppy-disk icon.  
Name the project e.g. **"Schedule Tracker"**.

---

## Part 2 — Customise the Roster & Config

Open **`01_Config.gs`** and update:

### Manager roster

Replace the sample names/IDs in the `MANAGERS` array with your real team:

```js
{ name: 'Your Manager Name', region: 'TR', procedure: 'Churn Prevention', id: 'MGR-TR-001' },
```

Valid **regions**: `TR · ES · IL · RU · IT · CZ/SK · AE/ARAB/SA · FR · PL · RO`  
Valid **procedures**: `Churn Prevention · Killer Base · Active Retention`

### Public holidays

Add dates as `'YYYY-MM-DD'` strings to the `PUBLIC_HOLIDAYS` array:

```js
const PUBLIC_HOLIDAYS = [
  '2026-01-01',   // New Year's Day
  '2026-05-01',   // Labour Day
];
```

Holiday columns are automatically filled with `DO` and coloured **orange** when the sheet is built.

### Working hours

Change the default shift string if needed:

```js
WORKING_HOURS : '09:00-18:00',
```

Any other free-text value a manager types (e.g. `10:00-19:00`) is also supported — the Slack post reads the raw cell value.

---

## Part 3 — Build the Sheet for the First Time

1. In the Apps Script editor, select function **`buildScheduleSheet`** from the dropdown.
2. Click **Run** ▶.
3. You will be asked to **authorise** the script — follow the prompts and grant the required permissions.
4. Switch back to your Google Sheet. A tab named **"Schedule"** will appear, fully populated.

> **Tip:** From now on, use the custom **"📅 Schedule Management"** menu inside the Sheet itself — you don't need to return to the script editor.

---

## Part 4 — Slack Webhook Setup

### Step 1 — Create a Slack Incoming Webhook

**Option A — Classic Incoming Webhooks (simplest)**

1. Go to **api.slack.com/apps** → click **Create New App → From scratch**.
2. Name it (e.g. "Schedule Bot") and pick your workspace.
3. In the left sidebar click **Incoming Webhooks** → toggle **Activate Incoming Webhooks** ON.
4. Click **Add New Webhook to Workspace** → choose the target channel → click **Allow**.
5. Copy the **Webhook URL** (starts with `https://hooks.slack.com/services/…`).

**Option B — Slack Workflow Builder Webhook**

1. Open Slack → click **Automations** (lightning bolt icon).
2. Create a new workflow → choose **"From a webhook"** trigger.
3. Add a "Send a message" step → publish.
4. Copy the webhook URL from the trigger step.

### Step 2 — Paste the webhook into the script

Open **`01_Config.gs`** and replace the placeholder:

```js
SLACK_WEBHOOK : 'YOUR_SLACK_WEBHOOK_URL_HERE',
```

with your actual URL (the URL you copied from the Slack app configuration page):

```js
// Paste the full webhook URL between the quotes:
SLACK_WEBHOOK : '<paste-your-webhook-url-here>',
```

> The URL will look like: `hooks.slack.com/services/` followed by three slash-separated token segments. Copy it directly from the Slack app settings page — do **not** share it publicly.

Save the file (**Ctrl+S**).

### Step 3 — Test the Slack post

In the Sheet, click **📅 Schedule Management → 📤 Post Today's Schedule → Slack**.  
A formatted message will appear in your chosen Slack channel within seconds.

---

## Part 5 — Automate Daily 8 AM Posts

1. In the Sheet, click **📅 Schedule Management → ⏰ Create Daily 8 AM Slack Trigger**.
2. A toast notification confirms the trigger was created.
3. The trigger fires every day at **08:00** in the **script's timezone**.

> **Checking / changing the timezone:**  
> In the Apps Script editor → **Project Settings** (gear icon) → **Time zone**.  
> Set it to match your team's primary timezone.

To remove the trigger later: **📅 Schedule Management → 🗑️ Remove All Triggers**.

---

## Part 6 — Monthly Workflow

| When | What to do |
|---|---|
| **Last week of the month** | Click **🔄 Update to Next Month** — rebuilds columns for next month, resets all cells to defaults |
| **Daily** | Triggered automatically at 8 AM (or post manually anytime) |
| **Ad-hoc shift changes** | Edit cells directly in the sheet — the Slack post always reads the current live values |

---

## Part 7 — Filtering by Region or Procedure

The sheet has a native Google Sheets filter on the first four columns:

- Click the **filter dropdown** on the **Region** column (B) to show only one or more regions.
- Click the **filter dropdown** on the **Procedure** column (C) to drill into a specific squad.
- Combine both filters for a precise squad view.

> The region separator rows also contain their region name in column B, so they remain visible alongside their managers when you filter.

---

## Colour Reference

| Colour | Meaning |
|---|---|
| 🟢 Light green | Manager is working (`09:00-18:00` or any custom shift) |
| 🔴 Light red | Day Off (`DO`) |
| 🟠 Light orange | Public holiday |
| 🔵 Blue-grey header | Weekend day column |
| 🟡 Amber border | Today's date column |
| 🟣 Lavender row | Region group separator |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Menu doesn't appear | Reload the sheet; `onOpen` runs on open |
| "Authorization required" on first run | Grant permissions in the pop-up dialog |
| Slack post returns HTTP 400 | Check the webhook URL is correct and the app is still installed |
| Slack post returns HTTP 403/404 | Webhook was revoked — create a new one |
| Wrong timezone on trigger | Set timezone in Apps Script → Project Settings |
| Columns shift after rebuild | Rebuild resets everything; don't rely on column letters for external formulas |
