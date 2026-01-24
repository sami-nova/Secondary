# 🚀 NEW LEADERBOARD FEATURES - SETUP GUIDE

This guide will help you set up and use the 5 new features added to your leaderboard system.

---

## 📋 Features Overview

1. **🔥 Streak Tracking** - Track consecutive weeks in Top 3
2. **💰 Highest Payments** - Show top 5 earners with user tagging
3. **📅 Multi-Frequency Options** - Daily/Weekly/Monthly formats
4. **🎯 Interactive Buttons** - Clickable buttons for more details
5. **📱 Mobile Optimization** - Clean format for mobile devices

---

## ⚙️ SETUP INSTRUCTIONS

### 1️⃣ Create New Tracking Sheets

Run these functions **once** to create the tracking sheets:

```javascript
// In Google Apps Script Editor, run each function:

createStreakTrackingSheet()      // Creates: "Streak Tracking" sheet
createHighestPaymentsSheet()     // Creates: "Highest Payments" sheet
```

**What this creates:**
- **Streak Tracking**: Tracks consecutive weeks in Top 3
- **Highest Payments**: Shows top 5 earners by cash generated with regions, manager names, and Slack user IDs for @mentions

---

### 2️⃣ Test the New Features

Run this to see everything working:

```javascript
testEnhancedLeaderboard()
```

This will:
- Build the enhanced leaderboard
- Update streaks automatically
- Display highest payments section
- Show you the full output

---

### 3️⃣ Update Your Automation

**Option A: Use the Enhanced Function**

Replace your current function call from:
```javascript
buildCombinedLeaderboardFromSheet(automation)
```

To:
```javascript
buildEnhancedLeaderboardWithFeatures(automation)
```

**Option B: Keep Same Function (Recommended)**

The original function still works! All new features are automatically integrated.

---

## 🎮 HOW TO USE EACH FEATURE

### 🔥 1. Streak Tracking

**How it works:**
- Automatically tracks when leaderboard is posted
- Managers in Top 3 = streak continues
- Managers NOT in Top 3 = streak resets to 0

**Streak Badges:**
- 🔥 Fire = 3+ consecutive weeks
- ⚡ Lightning = 5+ consecutive weeks
- 💎 Diamond = 10+ consecutive weeks

**Manual Control:**
Open "Streak Tracking" sheet to:
- View all streaks
- Manually edit if needed
- See best all-time streaks

**Display:**
Names automatically show with streak:
- `John Smith 🔥3` = 3-week streak
- `Maria Garcia ⚡5` = 5-week streak

---

### 💰 2. Highest Payments

**What it shows:**
- Top 5 earners by cash generated this week
- Manager names (can use @mentions like '@Sami')
- Regions (TR, ES, ARAB, etc.)
- Payment amounts with proper formatting ($16,100)
- Slack User IDs for automatic tagging

**How it works:**
1. Open "Highest Payments" sheet
2. Update weekly with top 5 earners:
   - Rank: 1-5 based on payment amount
   - Manager Name: Full name or @mention format
   - Region: Country code (TR, ES, ARAB, etc.)
   - Payment: Dollar amount (just number like 16100, no $ symbol)
   - Slack User ID: User's Slack ID for @mentions (e.g., U02905GQ32R)
3. When leaderboard posts, section automatically appears

**Slack User ID Tagging:**
If you provide a Slack User ID:
- Manager names starting with @ will become clickable mentions
- Example: `@Sami` with User ID `U02905GQ32R` becomes a tagged mention in Slack

**Manual Control:**
Edit "Highest Payments" sheet before posting:
- Update top performers each week
- Change payment amounts
- Add/update Slack User IDs for tagging
- Adjust regions

**Display:**
```
💰 HIGHEST PAYMENTS THIS WEEK - TOP 5

🥇 @Sami 🇹🇷
   └ Payment: $16,100 | TR

🥈 Maria Garcia 🇪🇸
   └ Payment: $14,500 | ES

🥉 Omar Al-Farsi 🇸🇦
   └ Payment: $13,200 | ARAB
```

---

### 📅 3. Multi-Frequency Options

**Three Format Modes:**

**DAILY DIGEST** (Compact)
- Shows only #1 from each category
- Quick stats summary
- Perfect for daily updates

**WEEKLY COMPREHENSIVE** (Full)
- Complete leaderboard (current format)
- All Top 3 in every category
- Full insights and achievements

**MONTHLY CHAMPIONS** (Special Edition)
- Month's MVP
- Best streaks
- All achievements earned
- Month totals

**How to use:**

```javascript
// Daily update
buildLeaderboardByFrequency(automation, 'daily')

// Weekly full
buildLeaderboardByFrequency(automation, 'weekly')

// Monthly champions
buildLeaderboardByFrequency(automation, 'monthly')
```

**Manual Control:**
All formats read from the same sheet! Just update the sheet once, all formats work.

---

### 🎯 4. Interactive Buttons

**Buttons Added:**
- 📊 View Full Stats - Detailed breakdown
- 📈 Compare Last Week - Week-over-week changes
- 🏆 Achievements - See all badges

**Setup Required:**

1. Deploy script as web app:
   - Click: **Deploy** → **New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy the web app URL

2. Configure Slack App:
   - Go to: https://api.slack.com/apps
   - Select your app
   - **Interactivity & Shortcuts** → Turn ON
   - Paste web app URL in **Request URL**
   - Save Changes

3. Test it:
   - Post leaderboard
   - Click a button
   - See response!

**Without Setup:**
Buttons won't appear. Feature gracefully skips if not configured.

---

### 📱 5. Mobile Optimization

**What it does:**
- Shorter blocks (less scrolling)
- Compact Top 3 lists
- Essential info only
- Touch-friendly buttons

**When it activates:**
- Daily digest format
- If explicitly enabled in automation
- Can be forced via settings

**Manual Control:**

Enable mobile format:
```javascript
automation.mobileFormat = {
  enabled: true
};
```

**Compare Formats:**
```javascript
compareMobileVsDesktop()  // See side-by-side comparison
```

---

## 🎯 QUICK START GUIDE

**Fastest Way to Get Everything Working:**

```javascript
// Step 1: Create all sheets (run once)
createStreakTrackingSheet()
createHighestPaymentsSheet()

// Step 2: Update Highest Payments sheet with this week's top earners
// (Open the sheet and manually enter top 5 earners with their payment amounts and user IDs)

// Step 3: Test everything
testEnhancedLeaderboard()

// Step 4: Use in your automation
// Your existing automation automatically gets all features!
// Just post the leaderboard as normal
```

---

## 📊 MANUAL EDITING CAPABILITIES

**You can manually edit ALL of these before posting:**

### Weekly Leaderboard Sheet
✅ All sales data
✅ Manager names
✅ Regions
✅ Cash amounts
✅ Paid rate percentages
✅ Display date

### Streak Tracking Sheet
✅ Current streaks
✅ Best streaks
✅ Total weeks
✅ Badges

### Highest Payments Sheet
✅ Top earner names
✅ Payment amounts
✅ Regions
✅ Slack User IDs for tagging
✅ Rankings

**Everything updates automatically when you post!**

---

## 🧪 TESTING FUNCTIONS

Test individual features:

```javascript
// Test streak tracking
updateStreaks("2026-W04")
getTopStreaks(5)

// Test highest payments
getHighestPaymentsData()
buildHighestPaymentsBlock()

// Test formats
testAllFormats()

// Test buttons
testButtonResponses()

// Test mobile vs desktop
compareMobileVsDesktop()

// Test all features at once
testIndividualFeatures()
```

---

## ⚠️ TROUBLESHOOTING

**Streaks not updating?**
- Make sure "Streak Tracking" sheet exists
- Check that leaderboard has data
- Run `updateStreaks(currentWeek)` manually

**Highest payments not showing?**
- Create "Highest Payments" sheet with `createHighestPaymentsSheet()`
- Make sure sheet has data (at least one row filled)
- Check that payment amounts are numbers, not text
- Verify Slack User IDs are valid (start with U, at least 9 characters)

**User mentions not working?**
- Verify Slack User ID format (e.g., U02905GQ32R)
- Manager name should start with @ for tagging
- Both manager name and user ID must be filled
- Check that bot has permissions to mention users

**Buttons not working?**
- Deploy as web app first
- Configure Slack app interactivity
- Check execution logs for errors

**Mobile format not activating?**
- Set `automation.mobileFormat.enabled = true`
- Or use `buildMobileOptimizedLeaderboard(automation)`

---

## 💾 BACKUP & SAFETY

**All your existing functionality is preserved!**

- Original leaderboard still works
- Sheet structure unchanged (only adds new sheets)
- New features are additive
- Can disable any feature by not creating its sheet

**To disable a feature:**
1. Don't create its tracking sheet
2. Feature gracefully skips
3. Leaderboard posts normally

---

## 🎨 CUSTOMIZATION

### Change Streak Thresholds
Edit `getStreakBadge()` in `StreakTracking.gs`:
```javascript
if (streak >= 15) return '👑';  // King - 15+ weeks
if (streak >= 10) return '💎';  // Diamond - 10+ weeks
if (streak >= 5) return '⚡';   // Lightning - 5+ weeks
if (streak >= 3) return '🔥';   // Fire - 3+ weeks
```

### Customize Highest Payments Display
Edit `buildHighestPaymentsBlock()` in `HighestPayments.gs`:
```javascript
// Change number of top earners shown (default 5)
const data = sheet.getRange("A3:F7").getValues();  // Change F7 to show more/less

// Change title
text: `*💰 HIGHEST PAYMENTS THIS WEEK - TOP 5*\n\n${paymentsText}`
```

### Add More Interactive Buttons
Edit `addInteractiveButtons()` in `InteractiveButtons.gs`:
```javascript
// Add a new button
{
  type: "button",
  text: { type: "plain_text", text: "📊 Your Custom Button" },
  value: "custom_action",
  action_id: "button_custom"
}
```

---

## 📞 SUPPORT

If something isn't working:

1. Check execution logs (View → Logs)
2. Verify sheets exist and have data
3. Test individual functions
4. Check this guide's troubleshooting section

---

## 🎉 ENJOY YOUR ENHANCED LEADERBOARD!

All features work automatically once sheets are created.
Update your sheet manually as always - everything else is automatic! 🚀
