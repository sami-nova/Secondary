# 🗑️ HOW THE DELETE FUNCTION WORKS

## ⚠️ IMPORTANT: The Delete Function is NOT in Slack!

**It's a button in the WEB UI** that deletes messages **FROM Slack**.

---

## 📍 WHERE TO FIND THE DELETE BUTTON

### Step 1: Open Your Slack Automation Web UI

The URL looks like:
```
https://script.google.com/macros/s/YOUR-SCRIPT-ID/exec
```

### Step 2: Look at the TOP of the Page

You'll see a header with several buttons:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Slack Automation Manager                                          │
│                                                                     │
│  [🔄 Refresh]  [🗑️ Manage Messages]  [📄 View Templates]  [➕ New]  │
│                      ↑                                              │
│                THIS BUTTON                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### What the Button Looks Like:

- **Icon**: 🗑️ Trash can / Delete icon
- **Color**: Yellow/Orange (warning color)
- **Text**: "Manage Messages"
- **Position**: Between "Refresh" and "View Templates"

---

## 🎯 STEP-BY-STEP: HOW TO DELETE MESSAGES

### Step 1: Click "Manage Messages" Button

When you click it, a dialog box (popup) will appear:

```
╔═══════════════════════════════════════════════════════════╗
║            📬 Manage Sent Messages                        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Automation Name    | Channel        | Sent At  | Actions║
║  ───────────────────┼────────────────┼──────────┼────────║
║  Net Churn Daily    | #personal-space| 2m ago   | Delete ║
║  Weekly Report      | #testing       | 5m ago   | Delete ║
║  Support Tickets    | #personal-space| 10m ago  | Delete ║
║                                                           ║
║                                          [ Close ]        ║
╚═══════════════════════════════════════════════════════════╝
```

### Step 2: Find the Message You Want to Delete

Each row shows:
- **Automation Name**: Which automation sent it
- **Channel**: Which Slack channel it was sent to
- **Sent At**: How long ago (e.g., "2 minutes ago")
- **Actions**: A red "Delete" button

### Step 3: Click the "Delete" Button

A confirmation dialog will appear:

```
╔═══════════════════════════════════════╗
║  ⚠️  Warning                          ║
║                                       ║
║  Delete this message from Slack?      ║
║                                       ║
║        [ Cancel ]    [ Delete ]       ║
╚═══════════════════════════════════════╝
```

### Step 4: Confirm Deletion

Click **Delete** to confirm.

### Step 5: Success!

You'll see a green success message:
```
✅ Message deleted from Slack
```

The message is now **DELETED FROM SLACK** and disappears from the list.

---

## 🔍 WHAT GETS TRACKED FOR DELETION

### ✅ Messages That CAN Be Deleted:

- Messages sent **using Bot Token** (not webhook)
- Messages sent **after** tracking was implemented
- **Last 100 messages** sent (older messages are removed from tracker)

### ❌ Messages That CANNOT Be Deleted:

- Messages sent **using Webhook URL** (webhooks can't delete)
- Messages sent **before** bot token setup
- Messages older than the last 100 tracked

---

## 🚫 WHY BUTTON MIGHT NOT APPEAR

### If you don't see the "Manage Messages" button:

1. **Bot token is not configured**
   - The button only appears when `SLACK_BOT_TOKEN` is set in Script Properties

2. **Config didn't load**
   - Open browser console (F12)
   - Look for: `hasBotToken: true`
   - If it says `false`, bot token wasn't detected

3. **Web app not redeployed**
   - After code changes, you MUST redeploy
   - See COMPLETE_FIX_GUIDE.md Step 1

4. **Old browser tab cached**
   - Close all tabs with the UI
   - Open a fresh tab
   - Clear browser cache (Ctrl+Shift+Delete)

---

## 🧪 TEST IF DELETE FUNCTION WORKS

### Quick Test:

1. **Send a test message**:
   - Edit any automation
   - Make sure Webhook URL is EMPTY (uses bot token)
   - Click "Test" button
   - Check your Slack channel - message should appear

2. **Delete the test message**:
   - Click "Manage Messages" button
   - You should see your test message in the list
   - Click "Delete" next to it
   - Confirm deletion
   - Check Slack - message should be GONE!

---

## 📊 DELETE MESSAGE DIALOG FEATURES

### What You Can See:

- **All tracked messages** (last 100)
- **Which automation** sent each message
- **Which channel** it was sent to
- **How long ago** it was sent

### What You Can Do:

- **Delete individual messages** - Click Delete on any row
- **See empty state** - "No messages tracked yet" if none sent
- **Close dialog** - Click Close button to go back

### What You CANNOT Do:

- **Delete all messages at once** - Must delete one by one
- **Delete messages older than last 100** - Not tracked
- **Delete webhook messages** - Only bot token messages

---

## ⚙️ BEHIND THE SCENES: HOW IT WORKS

### When You Send a Message:

1. Script sends message using `chat.postMessage` API
2. Slack returns a **timestamp** (message ID)
3. Script saves: `{automationName, channel, timestamp, sentAt}` to Script Properties
4. Keeps last 100 messages only

### When You Delete a Message:

1. Click Delete → Script calls `chat.delete` API
2. Provides: `channel` + `timestamp`
3. Slack deletes the message
4. Script updates the tracker to remove that entry

### Requirements:

- **Bot Token**: Required (webhooks can't delete)
- **Permission**: `chat:write` permission on bot
- **Channel Access**: Bot must be in the channel

---

## 🔐 PERMISSIONS NEEDED

Your bot needs these permissions:

### Required:
- ✅ `chat:write` - Send messages
- ✅ `channels:read` - List public channels
- ✅ `groups:read` - List private channels

### Optional (for more features):
- ⭕ `chat:write.customize` - Custom username/icon
- ⭕ `files:write` - Send files (future feature)

---

## 💡 PRO TIPS

### Tip 1: Only Use Bot Token (Not Webhook)

If you want to be able to delete messages:
- Leave **Webhook URL** field blank
- Set **SLACK_BOT_TOKEN** in Script Properties
- All messages will be sent via bot token
- All messages will be deletable

### Tip 2: Old Messages Auto-Cleanup

The script only keeps last 100 messages to save space:
- Older messages are automatically removed from tracker
- They remain in Slack, just not tracked for deletion
- This prevents Script Properties from getting too large

### Tip 3: Check Logs

After deleting, check the Execution Log:
```
Apps Script Editor → Executions → View logs
```

You should see:
```
Deleting message: {channel: "#personal-space", timestamp: "1234567890.123456"}
Message deleted successfully
```

---

## 🆘 TROUBLESHOOTING DELETE ISSUES

### "Message not found" Error

**Cause**: Message was already deleted manually in Slack

**Fix**: The message is gone, just close the dialog and refresh

### "Not authorized" Error

**Cause**: Bot doesn't have permission in that channel

**Fix**:
1. Go to Slack channel
2. Type `/invite @YourBotName`
3. Try deleting again

### "Invalid timestamp" Error

**Cause**: Message data corrupted or too old

**Fix**:
1. Open Apps Script Editor
2. Project Settings → Script Properties
3. Delete `sentSlackMessages` property
4. This clears the tracker - start fresh

### Delete Button Does Nothing

**Cause**: JavaScript error or network issue

**Fix**:
1. Open browser console (F12)
2. Look for errors (red text)
3. Screenshot and share with developer
4. Try different browser

---

## 📝 SUMMARY

| Question | Answer |
|----------|--------|
| Where is delete button? | In web UI header, labeled "Manage Messages" |
| What does it delete? | Messages in Slack channels |
| Where does it delete from? | From Slack (not the UI) |
| Which messages can be deleted? | Only those sent via bot token, last 100 |
| Do I need admin rights? | No! Just bot token with chat:write |
| Does it work with webhooks? | No, webhooks can't delete messages |
| How do I track messages? | Automatic - happens when sent via bot token |

---

## ✅ EXPECTED WORKFLOW

### Normal Usage:

1. Configure bot token once in Script Properties
2. Create automations with empty webhook URL
3. Messages send automatically via bot token
4. Messages appear in "Manage Messages" dialog
5. Click Delete on any message to remove from Slack
6. Message disappears from both Slack and tracker

### One-Time Setup:

1. Set `SLACK_BOT_TOKEN` in Script Properties
2. Redeploy web app
3. Refresh UI - "Manage Messages" button appears
4. From now on, all new messages are deletable!

---

**That's it! The delete function is simple once you know where to look.** 🎉

The key thing to remember: **It's not in Slack, it's in the web UI!**
