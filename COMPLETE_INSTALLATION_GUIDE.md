# 🚀 Complete Installation Guide - Updated Leaderboard System

## ✅ What You Need to Copy

You need to update **3 files** in your Google Apps Script project:

---

## 📁 File 1: SlackAutomationBuilder.gs

**Status:** ✅ UPDATED (Slack message improvements added)

**Location:** `/home/user/Secondary/SlackAutomationBuilder.gs`

**What Changed:**
- ✅ Compact summary block at top of messages
- ✅ Fixed Rising Stars format consistency
- ✅ Cleaned up WoW format (removed parentheses)
- ✅ Added ARPU vs Plan comparison logic
- ✅ Added labeled section separators
- ✅ Fixed duplicate variable declarations

**How to Copy:**
```bash
# In your terminal:
cat /home/user/Secondary/SlackAutomationBuilder.gs
```

Then:
1. Open Google Apps Script
2. Find `SlackAutomationBuilder.gs` in your project
3. Select ALL the old code (Ctrl+A)
4. Delete it
5. Paste the NEW code from the file above
6. Click **Save** 💾

---

## 📁 File 2: LeaderboardTemplateNewStructure.gs

**Status:** ✅ UPDATED (ARPU Plans section added)

**Location:** `/home/user/Secondary/LeaderboardTemplateNewStructure.gs`

**What Changed:**
- ✅ Added Section 15: ARPU Plans by Region (A124:C135)
- ✅ Updated all row references (shifted +3 rows)
- ✅ Updated documentation

**How to Copy:**
```bash
# In your terminal:
cat /home/user/Secondary/LeaderboardTemplateNewStructure.gs
```

Then:
1. Open Google Apps Script
2. Find `LeaderboardTemplateNewStructure.gs` in your project
3. Select ALL the old code (Ctrl+A)
4. Delete it
5. Paste the NEW code from the file above
6. Click **Save** 💾

---

## 📁 File 3: WeeklyArchive.gs

**Status:** ✅ NEW FILE (Archive & Menu system)

**Location:** `/home/user/Secondary/WeeklyArchive.gs`

**What's In It:**
- ✅ Archive Current Week function
- ✅ Auto-Calculate WoW function
- ✅ Complete menu system with ALL options
- ✅ Helper functions for menu items

**How to Add:**
```bash
# In your terminal:
cat /home/user/Secondary/WeeklyArchive.gs
```

Then:
1. Open Google Apps Script
2. Click **+ (Add file)** → **Script**
3. Name it: **`WeeklyArchive`** (no .gs extension)
4. Paste the code from the file above
5. Click **Save** 💾

---

## 🔍 Quick Verification

After copying all 3 files, verify:

### Check 1: Files Exist
In your Apps Script editor, you should see:
- ✅ SlackAutomationBuilder.gs
- ✅ LeaderboardTemplateNewStructure.gs
- ✅ WeeklyArchive.gs (NEW)

### Check 2: Menu Appears
1. Close Apps Script
2. Refresh your Google Sheet
3. You should see: **📊 Weekly Leaderboard** menu
4. Click it - you should see:
   - 📦 Archive & History
   - 📋 Template & Setup
   - 📤 Slack Automation
   - ℹ️ Help & Instructions

### Check 3: No Errors
1. In Apps Script, click **Save All** (floppy disk icon)
2. If you see errors, check:
   - File names are correct
   - All code was copied completely
   - No extra characters at start/end

---

## 📋 Step-by-Step Copy Instructions

### For SlackAutomationBuilder.gs (UPDATED):

**Step 1:** Open terminal and run:
```bash
cat /home/user/Secondary/SlackAutomationBuilder.gs | head -100
```
This shows the first 100 lines. Look for the compact summary block code.

**Step 2:** To see the full file:
```bash
# Option A: Open in editor
nano /home/user/Secondary/SlackAutomationBuilder.gs

# Option B: Copy to clipboard (if you have xclip)
cat /home/user/Secondary/SlackAutomationBuilder.gs | xclip -selection clipboard

# Option C: Save to a temporary location
cp /home/user/Secondary/SlackAutomationBuilder.gs ~/Desktop/
```

**Step 3:** Copy ALL content into Google Apps Script

---

### For LeaderboardTemplateNewStructure.gs (UPDATED):

```bash
# View the file
cat /home/user/Secondary/LeaderboardTemplateNewStructure.gs

# Or copy to desktop
cp /home/user/Secondary/LeaderboardTemplateNewStructure.gs ~/Desktop/
```

Then copy ALL content into Google Apps Script

---

### For WeeklyArchive.gs (NEW FILE):

```bash
# View the file
cat /home/user/Secondary/WeeklyArchive.gs

# Or copy to desktop
cp /home/user/Secondary/WeeklyArchive.gs ~/Desktop/
```

Then:
1. Apps Script → **+ Add file** → **Script**
2. Name: **WeeklyArchive**
3. Paste ALL content
4. Save

---

## 🎯 What You'll Get After Installing

### Slack Messages Will Show:
```
📊 Jan 26th | Grand Total: 539 sales
🏆 CP: 260 | 💪 KB: 279
📈 ARPU: $79.35 / Plan: $81.34 ⚠️ (↓2%)
🔄 Reactivations: 118 customers returned
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SECONDARY SALES PLAN
...

━━━━━━━━ 🏆 LEADERBOARDS ━━━━━━━━

🏆 CHURN PREVENTION - CURRENT BASE - TOP 3

🥇 *John Smith*
   └ 45 sales  🔥 +15 | 💰 $12,500 | ARPU: $42.30 ✅ | 🇹🇷 TR
```

### Menu Will Show:
```
📊 Weekly Leaderboard
  ├─ 📦 Archive & History
  │   ├─ Archive Current Week
  │   ├─ Auto-Calculate WoW
  │   └─ View Archive Sheet
  ├─ ────────────
  ├─ 📋 Template & Setup
  │   ├─ Create New Leaderboard
  │   └─ Refresh Template
  ├─ ────────────
  ├─ 📤 Slack Automation
  │   ├─ Send to Slack Now ⭐
  │   ├─ Test Slack Message
  │   ├─ Setup Schedule
  │   └─ View Automations
  └─ ℹ️ Help & Instructions
```

---

## ❓ Need Help?

**If you see the menu but get errors when clicking:**
- Make sure ALL 3 files are copied completely
- Check that file names match exactly
- Try clicking **Save All** in Apps Script

**If you don't see the menu:**
- Refresh your Google Sheet (close and reopen)
- Check that WeeklyArchive.gs was added successfully
- Check Apps Script logs: View → Logs

**If Slack sending doesn't work:**
- Make sure your existing Slack automation is configured
- Check webhook URL is set
- Use "Test Slack Message" to debug

---

## 🚀 Ready to Copy?

Let me know if you need me to:
1. ✅ Show you the complete code for any specific file
2. ✅ Create a single merged file
3. ✅ Help troubleshoot any errors

Just say which file you want to see and I'll display it!
