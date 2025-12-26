# UI Updates for Bot Token Support

## 🎉 What's New

The UI has been completely updated to support your new bot token permissions! Here's everything that changed:

---

## ✅ Major Changes

### **1. Webhook URL is Now Optional**
**Before:** Webhook URL was required ❌
**After:** Webhook URL is optional if you have bot token ✅

When you configure `SLACK_BOT_TOKEN` in Script Properties, the webhook URL field becomes optional. The UI will show a success message: "Bot Token configured - webhook URL is now optional!"

### **2. Channel Dropdown**
**Before:** Manual text input for channel
**After:** Smart dropdown with your configured channels

- Select from pre-configured channels
- Or type a custom channel (e.g., `#new-channel` or `C01234ABCD`)
- Loads channels from `SLACK_CHANNELS` Script Property
- Shows channels with # prefix for clarity

### **3. Message Management Interface**
**New Feature:** "Manage Messages" button in header

Click to open a full message manager where you can:
- View all sent messages (last 100)
- Delete individual messages
- Bulk delete old messages
- See which automation sent which message
- Track message metadata (channel, timestamp, row count)

---

## 🚀 Setup Instructions

### **Step 1: Configure Bot Token** (If you haven't already)

1. Open your Google Sheet
2. **Extensions → Apps Script**
3. **Project Settings** ⚙️ → **Script Properties**
4. Add property:
   - **Property:** `SLACK_BOT_TOKEN`
   - **Value:** Your `xoxb-...` token

### **Step 2: Configure Channels** (NEW!)

Still in Script Properties, add your channels:

#### **Option A: Multiple Channels (Recommended)**
```
Property: SLACK_CHANNELS
Value: #weekly-updates,#daily-reports,#alerts,C01234ABCD
```
Comma-separated list of all channels you want to use.

#### **Option B: Single Default Channel**
```
Property: SLACK_CHANNEL
Value: #weekly-updates
```
One default channel for all automations.

#### **Or Both!**
You can configure both - the UI will show all of them in the dropdown.

### **Step 3: Refresh the UI**

1. Open **Extensions → Apps Script → SlackAutomationScheduler.html**
2. Click **Run** or refresh your browser
3. You should see:
   - ✅ Success message about bot token
   - ✅ "Manage Messages" button in header
   - ✅ Channel dropdown with your configured channels

---

## 📋 UI Features

### **1. Create/Edit Automation**

#### **Slack Configuration Section:**

**Slack Webhook URL (Optional)**
- Input field
- Placeholder: "Leave blank to use Bot Token"
- Help text explains bot token is recommended

**Slack Channel (Required)**
- Dropdown with filterable search
- Shows configured channels
- Can type custom channel
- Help text explains how to configure channels

**How it looks:**
```
┌─────────────────────────────────────────┐
│ Slack Webhook URL (Optional)            │
│ ┌─────────────────────────────────────┐ │
│ │ https://hooks.slack.com/...         │ │
│ └─────────────────────────────────────┘ │
│ Optional if SLACK_BOT_TOKEN is set      │
│                                         │
│ Slack Channel (Required) *              │
│ ┌─────────────────────────────────────┐ │
│ │ Select or enter channel         ▼  │ │
│ ├─────────────────────────────────────┤ │
│ │ # weekly-updates                    │ │
│ │ # daily-reports                     │ │
│ │ # alerts                            │ │
│ │ C01234ABCD                          │ │
│ └─────────────────────────────────────┘ │
│ Configure in Script Properties          │
└─────────────────────────────────────────┘
```

### **2. Message Manager**

Click **"Manage Messages"** button (appears when bot token is configured).

**Features:**
```
┌──────────────────────────────────────────────────────────┐
│ Manage Sent Messages                                [×]  │
├──────────────────────────────────────────────────────────┤
│ Total Messages: 15                                       │
│ Only messages sent with Bot Token can be deleted         │
│                                                           │
│ [Refresh] [Clear Old Messages]                           │
├──────────────────────────────────────────────────────────┤
│ Automation       | Channel  | Sent At      | Actions     │
├──────────────────────────────────────────────────────────┤
│ Churn prevent... | #weekly  | 12/26, 11:06 | [Delete]    │
│ Daily Report     | #daily   | 12/25, 09:00 | [Delete]    │
│ Weekly Summary   | #weekly  | 12/24, 08:00 | [Delete]    │
└──────────────────────────────────────────────────────────┘
```

**Columns:**
- **Automation**: Name of automation that sent the message
- **Channel**: Which Slack channel
- **Sent At**: Formatted timestamp
- **Rows**: Number of rows in message
- **Message ID**: Slack timestamp (for reference)
- **Actions**: Delete button

**Actions:**
- **Delete**: Deletes individual message (with confirmation)
- **Clear Old Messages**: Bulk delete with day prompt
- **Refresh**: Reload message list

---

## 💡 Usage Examples

### **Example 1: Multiple Channels Setup**

**Script Properties:**
```
SLACK_BOT_TOKEN = xoxb-1234567890-...
SLACK_CHANNELS = #weekly-updates,#daily-reports,#emergency-alerts
```

**Result:**
- Webhook URL is optional
- Dropdown shows 3 channels
- Can still type custom channels
- "Manage Messages" button visible

### **Example 2: Different Channels per Automation**

**Automation 1:**
- Name: "Daily Sales Report"
- Channel: `#daily-reports`

**Automation 2:**
- Name: "Weekly Summary"
- Channel: `#weekly-updates`

**Automation 3:**
- Name: "Critical Alerts"
- Channel: `#emergency-alerts`

All use the same bot token, different channels!

### **Example 3: Message Deletion Workflow**

1. Send several test messages
2. Click **"Manage Messages"** in header
3. See list of sent messages
4. Click **Delete** on unwanted message
5. Confirm deletion
6. Message removed from Slack
7. List automatically refreshes

### **Example 4: Bulk Cleanup**

1. Click **"Manage Messages"**
2. Click **"Clear Old Messages"**
3. Enter: `7` (delete messages older than 7 days)
4. Confirm
5. All old messages deleted
6. See success message: "Deleted 12 messages"

---

## 🔧 Validation Changes

### **Old Validation:**
```javascript
❌ Required: Webhook URL
✅ Required: Channel
```

### **New Validation:**
```javascript
✅ Required: Channel
⚠️ Optional: Webhook URL (if bot token is configured)
❌ Error: If BOTH webhook and bot token are missing
```

**Error Messages:**
- "Please fill in all required fields" (missing channel)
- "Please provide either a Slack Webhook URL or configure SLACK_BOT_TOKEN" (no Slack config)

---

## 📊 Backend Functions

### **New Function: `getSlackConfiguration()`**

Returns Slack configuration for UI:

```javascript
{
  hasBotToken: true,
  channels: ['#weekly-updates', '#daily-reports', '#alerts'],
  defaultChannel: '#weekly-updates'
}
```

**How it works:**
1. Reads `SLACK_BOT_TOKEN` from Script Properties
2. Reads `SLACK_CHANNELS` (comma-separated list)
3. Reads `SLACK_CHANNEL` (default)
4. Returns combined configuration
5. Falls back to example channels if none configured

**Called by UI on load:**
- `mounted()` hook calls `loadSlackConfig()`
- Updates `hasBotToken` and `availableChannels`
- Shows success message if bot token found

---

## 🎨 UI States

### **State 1: No Bot Token**
- Webhook URL field shows as required
- "Manage Messages" button hidden
- Channel dropdown works normally
- Validation requires webhook URL

### **State 2: Bot Token Configured**
- ✅ Success message: "Bot Token configured..."
- ✅ Webhook URL shows as optional
- ✅ "Manage Messages" button visible
- ✅ Channels loaded from properties
- ✅ Validation allows empty webhook

### **State 3: Message Manager Open**
- Dialog shows full-screen
- Table loads sent messages
- Loading spinner while fetching
- Empty state if no messages
- All buttons functional

---

## 🚫 Troubleshooting

### **"No channels in dropdown"**

**Solution:** Add to Script Properties:
```
SLACK_CHANNELS = #weekly-updates,#daily-reports
```
Refresh the UI.

### **"Webhook URL still required"**

**Check:**
1. Is `SLACK_BOT_TOKEN` set in Script Properties?
2. Did you refresh the UI after adding it?
3. Check browser console for errors

**Fix:** Open UI, it should show success message on load.

### **"Manage Messages button not showing"**

**Reason:** No bot token detected.

**Fix:**
1. Add `SLACK_BOT_TOKEN` to Script Properties
2. Refresh the UI
3. Button will appear in header

### **"No messages in Message Manager"**

**Reasons:**
- No messages sent yet with bot token
- Messages sent with webhook (not tracked)
- Messages older than tracking started

**Note:** Only messages sent AFTER bot token was configured are tracked.

---

## 📱 Mobile/Responsive

The UI works on all screen sizes:
- Message Manager dialog: 80% width on desktop
- Table: Scrollable on mobile
- Dropdowns: Native mobile support
- Buttons: Touch-friendly sizes

---

## 🔄 Migration Guide

### **From Webhook to Bot Token:**

**Step 1:** Add bot token to Script Properties
```
SLACK_BOT_TOKEN = xoxb-...
```

**Step 2:** Add channels
```
SLACK_CHANNELS = #weekly-updates,#daily-reports
```

**Step 3:** Edit existing automations
1. Open automation in UI
2. Leave webhook URL blank (or remove it)
3. Select channel from dropdown
4. Save

**Step 4:** Test
1. Click "Test This Automation"
2. Check Slack for message
3. Open "Manage Messages" to see it tracked

### **Keep Using Webhooks:**

You can still use webhooks if you prefer:
1. Keep webhook URL filled in
2. Script will use webhook instead of bot token
3. Message deletion won't work
4. Everything else works normally

### **Mix Both:**

You can have some automations use webhook, some use bot token:
- Automation 1: Has webhook URL → Uses webhook
- Automation 2: No webhook URL → Uses bot token
- Both work simultaneously

---

## 🎁 New Capabilities

With the updated UI you can now:

✅ **Manage multiple channels easily** - Dropdown selection
✅ **Skip webhook configuration** - Use bot token only
✅ **Delete messages visually** - No coding required
✅ **Track message history** - See what was sent when
✅ **Bulk cleanup** - Delete old messages by date
✅ **Per-automation channels** - Different channels per automation
✅ **Quick channel switching** - Edit automation, change channel
✅ **Better validation** - Clear error messages

---

## 📚 Related Guides

- **SWITCH_TO_BOT_TOKEN.md** - Detailed bot token setup
- **SLACK_BOT_TOKEN_SETUP.md** - Original bot token guide
- **USING_YOUR_OWN_EMOJIS.md** - Emoji usage in messages

---

## 🎯 Quick Start Checklist

- [ ] Add `SLACK_BOT_TOKEN` to Script Properties
- [ ] Add `SLACK_CHANNELS` to Script Properties (comma-separated)
- [ ] Refresh the Slack Automation UI
- [ ] See success message about bot token
- [ ] See "Manage Messages" button in header
- [ ] Create new automation with channel dropdown
- [ ] Leave webhook URL blank
- [ ] Test automation
- [ ] Check "Manage Messages" to see tracked message
- [ ] Try deleting a message

**You're all set!** Enjoy your new bot-powered Slack automation! 🚀
