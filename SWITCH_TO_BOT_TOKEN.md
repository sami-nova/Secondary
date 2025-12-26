# Switch from Webhook to Bot Token

## ✅ You're Ready!

You've already added all the necessary bot permissions. Now let's switch from webhook to bot token for full message control!

---

## 🎯 Benefits of Bot Token vs Webhook

| Feature | Webhook | Bot Token |
|---------|---------|-----------|
| Send messages | ✅ | ✅ |
| Delete messages | ❌ | ✅ |
| Edit messages | ❌ | ✅ |
| Thread replies | ❌ | ✅ |
| Message tracking | ❌ | ✅ |
| User mentions | Limited | ✅ |
| File uploads | ❌ | ✅ |

**Recommendation:** Use Bot Token (you have all the permissions already!)

---

## 📋 Your Bot Permissions (Already Added)

From your screenshot, you have:
- ✅ `channels:read` - View public channels
- ✅ `chat:write` - Send messages as @Weekly updates
- ✅ `commands` - Add shortcuts/slash commands
- ✅ `files:read` - View files in channels
- ✅ `incoming-webhook` - Post to specific channels
- ✅ `remote_files:read` - View remote files
- ✅ `users:read` - View people in workspace
- ✅ `users:read.email` - View email addresses

**Perfect! You're all set.** 🎉

---

## 🚀 Quick Setup (3 Steps)

### **Step 1: Get Your Bot Token**

1. Go to your Slack App settings: https://api.slack.com/apps
2. Click on your **"Weekly updates"** app
3. Go to **"OAuth & Permissions"** (left sidebar)
4. Copy the **"Bot User OAuth Token"**
   - It starts with `xoxb-`
   - Example: `xoxb-YOUR-WORKSPACE-ID-YOUR-APP-ID-YOUR-SECRET-TOKEN`

### **Step 2: Add Bot Token to Script Properties**

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Click **Project Settings** ⚙️ (left sidebar)
4. Scroll to **"Script Properties"**
5. Click **"Add script property"**
6. Enter:
   - **Property:** `SLACK_BOT_TOKEN`
   - **Value:** Your bot token (paste the `xoxb-...` token)
7. Click **"Save script properties"**

### **Step 3: Add Your Slack Channel**

You can set the channel in two ways:

#### **Option A: Global Channel (Recommended)**

Set one default channel for all automations:

1. In **Script Properties** (same place as Step 2)
2. Click **"Add script property"**
3. Enter:
   - **Property:** `SLACK_CHANNEL`
   - **Value:** Your channel (see formats below)
4. Click **"Save"**

**Channel Formats:**
- Channel ID: `C01234ABCD` (preferred)
- Channel name: `#weekly-updates`
- Direct message: `@username` or `U01234ABCD`

**How to find Channel ID:**
1. Right-click on channel in Slack
2. Select "View channel details"
3. Scroll to bottom → Copy "Channel ID"

#### **Option B: Per-Automation Channel**

Set different channels for different automations:

1. Open your Slack Automation UI
2. When creating/editing automation
3. Fill in **"Slack Channel"** field
4. Use channel ID or #channel-name

---

## 🧪 Test It!

1. **Go to your Slack Automation UI**
2. **Edit your "Churn prevention MTD" automation**
3. **Remove the Webhook URL** (leave it blank)
   - The script will automatically use bot token instead
4. **Fill in "Slack Channel"**
   - Example: `#weekly-updates` or `C01234ABCD`
5. **Click "Test This Automation"**
6. **Check Slack** - message should appear!

---

## 🔍 How It Works

The script now automatically:

1. **Checks for Bot Token** in Script Properties
2. **If bot token exists** → Uses `chat.postMessage` API
3. **If no bot token** → Falls back to webhook URL

**Priority:**
```
Bot Token (SLACK_BOT_TOKEN) → Webhook URL → Error
```

**Message Tracking:**
- ✅ Messages sent with bot token are automatically tracked
- ✅ Last 100 messages stored with metadata
- ✅ Can be deleted using `deleteSlackMessage()` function

---

## 🗑️ Message Deletion

Once you're using bot token, you can delete messages!

### **View Sent Messages:**

1. Go to **Extensions → Apps Script**
2. Open **SlackAutomationBuilder.gs**
3. Click **Run** → Select `getSentMessages`
4. Check **Execution log** to see tracked messages

### **Delete a Message:**

```javascript
// In Apps Script console
deleteSlackMessage("C01234ABCD", "1234567890.123456")
```

Or use the helper functions:

```javascript
// Delete messages older than 7 days
clearOldMessages(7)

// Delete multiple messages
deleteMultipleMessages(["ts1", "ts2", "ts3"])
```

See `SLACK_BOT_TOKEN_SETUP.md` for complete deletion guide.

---

## ⚙️ Advanced Configuration

### **Multiple Channels**

Send different automations to different channels:

1. **Automation 1:** Daily metrics → `#daily-reports`
2. **Automation 2:** Weekly summary → `#weekly-updates`
3. **Automation 3:** Alerts → `#alerts`

Just set `slackChannel` differently for each automation!

### **Direct Messages**

Send to a specific user:

1. Get user ID from Slack:
   - Click on user's profile
   - "More" → "Copy member ID"
2. Use in channel field: `U01234ABCD`

### **Private Channels**

To send to private channels:

1. Add bot to the private channel first:
   - Go to private channel in Slack
   - Click channel name → "Integrations"
   - Click "Add apps" → Add "Weekly updates"
2. Then use channel ID in automation

---

## 🔧 Troubleshooting

### **Error: "not_in_channel"**

**Problem:** Bot hasn't been invited to the channel

**Solution:**
1. Go to the Slack channel
2. Type `/invite @Weekly updates`
3. Or: Channel menu → Integrations → Add "Weekly updates"

### **Error: "channel_not_found"**

**Problem:** Invalid channel ID or name

**Solutions:**
- Use channel ID instead of name
- Make sure channel name includes `#` (e.g., `#weekly-updates`)
- Verify channel exists and bot has access

### **Error: "invalid_auth"**

**Problem:** Bot token is invalid or expired

**Solutions:**
1. Go to Slack App settings
2. OAuth & Permissions → Reinstall to Workspace
3. Copy new bot token
4. Update `SLACK_BOT_TOKEN` in Script Properties

### **Messages Still Using Webhook?**

**Check:**
1. Is `SLACK_BOT_TOKEN` set in Script Properties?
2. Is `SLACK_CHANNEL` set (globally or per-automation)?
3. Check Execution log for "Using bot token with channel: ..."
   - If you see "Sending to webhook...", bot token isn't configured

---

## 📊 Comparison Example

### **Before (Webhook):**
```javascript
automation = {
  name: "Daily Report",
  slackWebhookUrl: "https://hooks.slack.com/services/T.../B.../xxx",
  messageFormat: "table"
}
```

**Limitations:**
- ❌ Can't delete messages
- ❌ Fixed channel (set in webhook URL)
- ❌ No message tracking

### **After (Bot Token):**
```javascript
automation = {
  name: "Daily Report",
  slackChannel: "#daily-reports",  // Can be changed!
  messageFormat: "table"
}

// Script Properties:
// SLACK_BOT_TOKEN = xoxb-...
```

**Benefits:**
- ✅ Can delete messages
- ✅ Dynamic channel selection
- ✅ Automatic message tracking
- ✅ Can edit, reply in threads
- ✅ Better error messages

---

## 🎉 Next Steps

1. **Remove webhook URLs** from your automations (leave blank)
2. **Set SLACK_CHANNEL** in Script Properties
3. **Test each automation** to ensure they work
4. **Try message deletion** with tracked messages

You're now using the modern Slack API with full capabilities! 🚀

---

## 📚 Additional Resources

- Full deletion guide: `SLACK_BOT_TOKEN_SETUP.md`
- Message formats: `ALL_FORMAT_EXAMPLES.md`
- Emoji usage: `USING_YOUR_OWN_EMOJIS.md`
- Regional reports: `REGIONAL_REPORT_FORMAT_COMPARISON.md`

**Need help?** Check the guides or test with simple automations first!
