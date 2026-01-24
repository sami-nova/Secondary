# 🚀 NEW LEADERBOARD FEATURES - SETUP GUIDE

This guide will help you set up and use the 6 new features added to your leaderboard system.

---

## 📋 Features Overview

1. **🔥 Streak Tracking** - Track consecutive weeks in Top 3
2. **🏆 Achievement Badges** - Award badges for special accomplishments
3. **💡 Automatic Insights** - AI-generated commentary and highlights
4. **📅 Multi-Frequency Options** - Daily/Weekly/Monthly formats
5. **🎯 Interactive Buttons** - Clickable buttons for more details
6. **📱 Mobile Optimization** - Clean format for mobile devices

---

## ⚙️ SETUP INSTRUCTIONS

### 1️⃣ Create New Tracking Sheets

Run these functions **once** to create the tracking sheets:

```javascript
// In Google Apps Script Editor, run each function:

createStreakTrackingSheet()      // Creates: "Streak Tracking" sheet
createAchievementsSheet()         // Creates: "Achievements" sheet
createInsightsSheet()             // Creates: "Insights" sheet (optional)
```

**What this creates:**
- **Streak Tracking**: Tracks consecutive weeks in Top 3
- **Achievements**: Stores earned badges and accomplishments
- **Insights**: Allows manual editing of insights (optional - auto-generates if not created)

---

### 2️⃣ Test the New Features

Run this to see everything working:

```javascript
testEnhancedLeaderboard()
```

This will:
- Build the enhanced leaderboard
- Update streaks automatically
- Check for new achievements
- Generate insights
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

### 🏆 2. Achievement Badges

**Available Badges:**
- 🏆 First Time Winner - First time reaching #1
- 🎩 Hat Trick - Top 3 for 3 consecutive weeks
- 🔥 Hot Streak - 5+ consecutive weeks
- 💎 Legend - 10+ consecutive weeks
- 🌟 Consistency - Top 3 for 10+ weeks total
- 🎯 Perfect Week - 100%+ target achievement

**How it works:**
- Automatically awarded when criteria met
- Displayed next to manager names
- Announced when newly earned

**Manual Control:**
Open "Achievements" sheet to:
- View all earned badges
- See latest achievements
- Manually award special badges

**Display:**
Names show with badges:
- `John Smith 🔥3 🏆 🎩` = Streak + First Winner + Hat Trick

---

### 💡 3. Automatic Insights

**What it generates:**
- Performance trends ("TR region grew 23%!")
- New record announcements
- Comeback stories
- Top performer highlights
- Target achievements

**How it works:**
1. Analyzes current week data
2. Compares with historical data
3. Generates 3-5 key insights
4. Displays at top of leaderboard

**Manual Override:**
Want to customize insights?

1. Open "Insights" sheet
2. Find current week row
3. Edit the insight text
4. Leave blank to use auto-generated

**Example Insights:**
```
💡 WEEKLY INSIGHTS
1. 🎉 John Smith earned 🏆 First Time Winner!
2. 🌟 IT region leads KB with 40% paid rate!
3. 🏆 Maria crushed it with 52 CP sales!
```

---

### 📅 4. Multi-Frequency Options

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

### 🎯 5. Interactive Buttons

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

### 📱 6. Mobile Optimization

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
createAchievementsSheet()
createInsightsSheet()

// Step 2: Test everything
testEnhancedLeaderboard()

// Step 3: Use in your automation
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
✅ Display date

### Streak Tracking Sheet
✅ Current streaks
✅ Best streaks
✅ Total weeks
✅ Badges

### Achievements Sheet
✅ Badges earned
✅ Award new badges
✅ Remove badges

### Insights Sheet
✅ Write custom insights
✅ Override auto-generated
✅ Remove insights

**Everything updates automatically when you post!**

---

## 🧪 TESTING FUNCTIONS

Test individual features:

```javascript
// Test streak tracking
updateStreaks("2026-W04")
getTopStreaks(5)

// Test achievements
checkAchievements("2026-W04")
getLatestAchievements(3)

// Test insights
generateInsights()
getInsightsForDisplay("2026-W04")

// Test formats
testAllFormats()

// Test buttons
testButtonResponses()

// Test mobile vs desktop
compareMobileVsDesktop()
```

---

## ⚠️ TROUBLESHOOTING

**Streaks not updating?**
- Make sure "Streak Tracking" sheet exists
- Check that leaderboard has data
- Run `updateStreaks(currentWeek)` manually

**Badges not showing?**
- Create "Achievements" sheet
- Run `checkAchievements(currentWeek)`
- Check "Achievements" sheet for data

**Insights not appearing?**
- They auto-generate if no manual ones exist
- Check "Insights" sheet (create with `createInsightsSheet()`)
- Run `generateInsights()` to test

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

### Add New Achievements
Edit `checkAchievements()` in `AchievementBadges.gs`:
```javascript
// Example: Award for 20+ sales
if (sales >= 20 && !hasAchievement(managerName, "💯")) {
  newAchievements.push({
    manager: managerName,
    badge: "💯",
    name: "Century Maker",
    week: currentWeek
  });
}
```

### Customize Insights
Edit `generateInsights()` in `AutomaticInsights.gs`:
```javascript
// Add your own insight rules
if (grandTotal >= 600) {
  insights.push(`🎊 RECORD BREAKER: ${grandTotal} sales!`);
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
