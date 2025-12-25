# How to Delete Slack Messages - Bot Token Setup

## 🎯 Overview

To delete Slack messages, you need a **Slack Bot Token** (webhooks can't delete messages). The good news: **you don't need admin rights** to create a Slack App!

---

## ✅ What You Can Do

### **With Webhook URL (Current Setup):**
- ✅ Send messages
- ❌ Cannot delete messages
- ❌ Cannot edit messages
- ❌ No message history

### **With Bot Token (Enhanced Setup):**
- ✅ Send messages
- ✅ **Delete messages** ⭐
- ✅ Edit messages
- ✅ Track message history
- ✅ All 9 format options still work

---

## 📋 Step-by-Step: Create a Slack App

### **Step 1: Create Your Slack App**

1. Go to https://api.slack.com/apps
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Fill in:
   - **App Name:** `Google Sheets Reporter` (or any name you like)
   - **Pick a workspace:** Select your workspace
5. Click **"Create App"**

✅ **You don't need admin rights for this!**

---

### **Step 2: Add Bot Permissions**

1. In your app's page, go to **"OAuth & Permissions"** (left sidebar)
2. Scroll down to **"Scopes"** section
3. Under **"Bot Token Scopes"**, click **"Add an OAuth Scope"**
4. Add these scopes:
   - `chat:write` - Send messages
   - `chat:write.public` - Send to public channels
   - `channels:read` - View public channel info

**Optional but recommended:**
   - `chat:write.customize` - Customize bot name/icon
   - `files:write` - Send files (future feature)

---

### **Step 3: Install App to Workspace**

1. Scroll up to **"OAuth Tokens for Your Workspace"**
2. Click **"Install to Workspace"**
3. Review permissions and click **"Allow"**

✅ **This installs the app to your workspace**

---

### **Step 4: Get Your Bot Token**

1. After installation, you'll see **"Bot User OAuth Token"**
2. It starts with `xoxb-`
3. **Copy this token** (keep it secret!)

Example: `xoxb-YOUR-WORKSPACE-ID-YOUR-APP-ID-YOUR-TOKEN-STRING`

---

### **Step 5: Add Bot to Channels**

For each channel you want to use:

1. Open the Slack channel
2. Click channel name at top
3. Go to **"Integrations"** tab
4. Click **"Add apps"**
5. Find and add your app

**Or use slash command:**
```
/invite @Google Sheets Reporter
```

✅ **You only need channel access (not admin) to do this!**

---

### **Step 6: Add Token to Apps Script**

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Click **Project Settings** (gear icon, left sidebar)
4. Scroll to **"Script Properties"**
5. Click **"Add script property"**
6. Add:
   - **Property:** `SLACK_BOT_TOKEN`
   - **Value:** Your bot token (the `xoxb-...` token)
7. Click **"Save script properties"**

---

## 🔧 How to Use Message Deletion

### **Option 1: View All Sent Messages**

Run this function in Apps Script:

```javascript
function viewSentMessages() {
  const messages = getSentMessages();
  console.log(`Total messages: ${messages.length}`);
  messages.forEach((msg, idx) => {
    console.log(`[${idx + 1}] ${msg.automationName} - ${msg.sentAt} (${msg.rowCount} rows)`);
    console.log(`    Channel: ${msg.channel}, ID: ${msg.timestamp}`);
  });
}
```

### **Option 2: Delete Last Message**

```javascript
function deleteLastMessage() {
  const messages = getSentMessages();
  if (messages.length === 0) {
    console.log("No messages to delete");
    return;
  }

  const lastMsg = messages[0];
  const result = deleteSlackMessage(lastMsg.channel, lastMsg.timestamp);

  if (result.success) {
    console.log("✅ Message deleted successfully!");
  } else {
    console.log("❌ Error: " + result.error);
  }
}
```

### **Option 3: Delete Messages Older Than X Days**

```javascript
function deleteOldMessages() {
  const result = clearOldMessages(7); // Delete messages older than 7 days
  console.log(`Deleted: ${result.deleted}, Failed: ${result.failed}`);
}
```

### **Option 4: Delete Specific Message**

```javascript
function deleteSpecificMessage() {
  const messages = getSentMessages();

  // View all messages
  messages.forEach((msg, idx) => {
    console.log(`[${idx}] ${msg.automationName} - ${msg.sentAt}`);
  });

  // Delete message at index 0 (first message)
  const msgToDelete = messages[0];
  deleteSlackMessage(msgToDelete.channel, msgToDelete.timestamp);
}
```

---

## 🎨 Enhanced Features with Bot Token

### **1. Automatic Message History**

When you send messages with bot token, they're automatically tracked:
- Message timestamp
- Channel
- Automation name
- Number of rows sent
- When it was sent

**Last 100 messages** are stored automatically.

### **2. Bulk Delete**

Delete multiple messages at once:

```javascript
function deleteMultipleByName() {
  const messages = getSentMessages();

  // Find all messages from specific automation
  const toDelete = messages
    .filter(m => m.automationName === "Daily Sales Report")
    .map(m => m.timestamp);

  const result = deleteMultipleMessages(toDelete);
  console.log(`Deleted: ${result.deleted}`);
}
```

### **3. Clean Up Old Messages**

Schedule cleanup of old messages:

```javascript
// Run this weekly to clean up messages older than 30 days
function weeklyCleanup() {
  clearOldMessages(30);
}
```

---

## ⚙️ Switching from Webhook to Bot Token

### **Current Setup (Webhook):**
Your automation has:
```javascript
{
  slackWebhookUrl: "https://hooks.slack.com/services/...",
  slackChannel: "#reports"
}
```

### **New Setup (Bot Token):**

**Option 1: Keep Both** (Recommended during transition)
- Add bot token to Script Properties
- Webhook still works as backup
- New messages use bot token automatically
- Can delete messages sent with bot token

**Option 2: Switch Completely**
1. Add bot token to Script Properties
2. Remove webhook URL from automations
3. The script will automatically use bot token
4. All features work + deletion capability

---

## 🚨 Important Notes

### **Permissions Required:**

**For Creating App:**
- ❌ No admin rights needed
- ✅ Any workspace member can create apps

**For Adding to Channels:**
- ❌ No admin rights needed for **public channels**
- ✅ Any channel member can add apps
- ⚠️ **Private channels** require channel owner permission

### **What Bot Can Delete:**

✅ **Can delete:**
- Messages sent by the bot itself
- Only in channels bot has access to

❌ **Cannot delete:**
- Messages sent by other users
- Messages sent via webhook (before bot token)
- Messages in channels bot doesn't have access to

### **Security Best Practices:**

1. **Keep token secret** - Never share your bot token
2. **Don't commit to git** - Store in Script Properties only
3. **Rotate if compromised** - Regenerate token at api.slack.com/apps
4. **Limit permissions** - Only add scopes you need

---

## 🐛 Troubleshooting

### **Error: "Slack Bot Token not configured"**

**Problem:** Bot token not set up

**Solution:**
1. Get token from https://api.slack.com/apps → Your App → OAuth & Permissions
2. Add to Script Properties with key `SLACK_BOT_TOKEN`

---

### **Error: "not_in_channel"**

**Problem:** Bot not added to channel

**Solution:**
1. Go to Slack channel
2. Type `/invite @YourAppName`
3. Or add via channel settings → Integrations

---

### **Error: "token_revoked" or "invalid_auth"**

**Problem:** Token was revoked or invalid

**Solution:**
1. Go to https://api.slack.com/apps → Your App
2. Go to **OAuth & Permissions**
3. Click **"Reinstall to Workspace"**
4. Copy new token
5. Update Script Properties

---

### **Can't Find Sent Messages**

**Problem:** Messages were sent with webhook (before bot token setup)

**Solution:**
- Only messages sent with bot token are tracked
- Previous webhook messages cannot be deleted
- Set up bot token now for future messages

---

## 📊 Comparison: Webhook vs Bot Token

| Feature | Webhook | Bot Token |
|---------|---------|-----------|
| Send messages | ✅ | ✅ |
| All 9 formats | ✅ | ✅ |
| Delete messages | ❌ | ✅ |
| Edit messages | ❌ | ✅ |
| Message history | ❌ | ✅ |
| Custom bot name | ⚠️ Limited | ✅ Full control |
| Setup complexity | Easy | Medium |
| Permissions needed | Channel access | Channel access + app install |

---

## 🎯 Recommended Setup

### **For Your Use Case:**

Since you don't have admin rights but want deletion capability:

1. ✅ **Create Slack App** (no admin needed)
2. ✅ **Add to channels you use** (channel member access enough)
3. ✅ **Get bot token**
4. ✅ **Add to Script Properties**
5. ✅ **Keep existing automations** (they'll auto-switch to bot token)

**Benefits:**
- All current features work
- **Plus** deletion capability
- **Plus** message tracking
- **Plus** better control

---

## 📝 Quick Start Commands

Once bot token is set up, you can run these in Apps Script:

```javascript
// View all sent messages
viewSentMessages()

// Delete last message
deleteLastMessage()

// Delete messages older than 7 days
clearOldMessages(7)

// View and delete specific message
function manageMessages() {
  const msgs = getSentMessages();
  msgs.forEach((m, i) => console.log(`${i}: ${m.automationName} - ${m.sentAt}`));
  // Then delete specific one:
  // deleteSlackMessage(msgs[0].channel, msgs[0].timestamp)
}
```

---

## ✅ Summary

**Yes, you can delete Slack messages!**

**Requirements:**
1. Create Slack App (no admin needed)
2. Get bot token
3. Add token to Script Properties
4. Add bot to channels (no admin needed for public channels)

**What you get:**
- ✅ Full deletion capability
- ✅ Message history (last 100)
- ✅ Bulk delete options
- ✅ Auto-cleanup of old messages

**What doesn't change:**
- ✅ All 9 formats still work
- ✅ All automations work the same
- ✅ No code changes in automations needed

---

**Last Updated:** 2025-12-25
