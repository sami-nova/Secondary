# 🏆 Weekly Leaderboard Setup Guide

Complete guide to setting up and using the weekly performance leaderboard automation.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Sheet Template Setup](#sheet-template-setup)
3. [Slack Automation Setup](#slack-automation-setup)
4. [Weekly Update Process](#weekly-update-process)
5. [Format Examples](#format-examples)
6. [Recommendations & Best Practices](#recommendations--best-practices)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Step 1: Create the Sheet Template

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. In the script editor, find the **LeaderboardTemplate.gs** file
4. Run the function: `createLeaderboardTemplate()`
5. Grant permissions when prompted
6. A new sheet named **"Weekly Leaderboard"** will be created with sample data

### Step 2: Set Up Slack Automation

1. Open **Slack Automation Scheduler** (from your Google Sheet menu)
2. Click **"+ New Automation"**
3. Configure as described in [Slack Automation Setup](#slack-automation-setup)

### Step 3: Test & Schedule

1. Click **"Test Now"** to verify it works
2. Enable scheduling (Weekly, Monday 9:00 AM recommended)
3. Update your sheet weekly with new data

---

## 📊 Sheet Template Setup

### Template Structure

The template creates one sheet with **3 sections**:

#### Section 1: Churn Prevention Leaderboard (Rows 1-7)

```
| Week    | Rank | Manager Name   | Wins | Change vs Last Week | Region |
|---------|------|----------------|------|---------------------|--------|
| 2026-W04| 1    | John Smith     | 45   | +5                  | NA     |
| 2026-W04| 2    | Sarah Johnson  | 42   | +8                  | EMEA   |
| 2026-W04| 3    | Mike Chen      | 38   | -2                  | APAC   |
| 2026-W04| 4    | Emily Davis    | 35   | +12                 | LATAM  |
| 2026-W04| 5    | David Wilson   | 33   | +3                  | NA     |
```

#### Section 2: Killer Base Leaderboard (Rows 9-15)

```
| Week    | Rank | Manager Name    | Wins | Change vs Last Week | Region |
|---------|------|-----------------|------|---------------------|--------|
| 2026-W04| 1    | Lisa Anderson   | 52   | +7                  | EMEA   |
| 2026-W04| 2    | Tom Brown       | 48   | +4                  | NA     |
| 2026-W04| 3    | Anna Martinez   | 44   | +6                  | LATAM  |
| 2026-W04| 4    | James Lee       | 41   | -1                  | APAC   |
| 2026-W04| 5    | Rachel Green    | 39   | +9                  | EMEA   |
```

#### Section 3: Regional Performance (Rows 17-22)

```
| Week    | Region | Total Wins | Churn Wins | Killer Wins | Top Manager    |
|---------|--------|------------|------------|-------------|----------------|
| 2026-W04| NA     | 156        | 78         | 78          | John Smith     |
| 2026-W04| EMEA   | 143        | 67         | 76          | Lisa Anderson  |
| 2026-W04| APAC   | 128        | 62         | 66          | Mike Chen      |
| 2026-W04| LATAM  | 112        | 54         | 58          | Anna Martinez  |
```

### Column Descriptions

- **Week**: Format as `YYYY-Www` (e.g., `2026-W04` for week 4 of 2026)
- **Rank**: Position (1-5 for top performers)
- **Manager Name**: Full name of the manager
- **Wins**: Number of successful outcomes
- **Change vs Last Week**: Use `+5`, `-2`, `0` format (include + or - sign)
- **Region**: Region code (NA, EMEA, APAC, LATAM, etc.)

---

## ⚙️ Slack Automation Setup

### Create 3 Separate Automations

You'll create **3 automations** - one for each leaderboard section.

---

### Automation 1: Churn Prevention Leaderboard

**Basic Settings:**
- **Automation Name**: `Weekly Churn Prevention Leaderboard`
- **Trigger Type**: Bulk Criteria
- **Target Sheet**: `Weekly Leaderboard`
- **Slack Channel**: Your channel (e.g., `C087LTQ843T`)
- **Message Format**: **Leaderboard** 🏆

**Criteria Builder:**
- **Criterion 1**: `Rank` equals `1` OR
- **Criterion 2**: `Rank` equals `2` OR
- **Criterion 3**: `Rank` equals `3` OR
- **Criterion 4**: `Rank` equals `4` OR
- **Criterion 5**: `Rank` equals `5`

**Alternative (simpler):**
- **Criterion 1**: `Rank` less_than `6`

**Message Header:**
```
🏆 CHURN PREVENTION LEADERBOARD - TOP 5
```

**Schedule:**
- **Frequency**: Weekly
- **Day**: Monday
- **Time**: 9:00 AM

---

### Automation 2: Killer Base Leaderboard

**Basic Settings:**
- **Automation Name**: `Weekly Killer Base Leaderboard`
- **Trigger Type**: Bulk Criteria
- **Target Sheet**: `Weekly Leaderboard`
- **Slack Channel**: Your channel
- **Message Format**: **Leaderboard** 💪

**Criteria Builder:**
- **Criterion 1**: `Manager Name` not_equals `` (to skip empty rows)
- AND filter for rows 11-15 in the sheet

**Alternative approach:**
- Create a separate sheet tab for Killer Base with just those 5 rows
- Point automation to that sheet

**Message Header:**
```
💪 KILLER BASE LEADERBOARD - TOP 5
```

**Schedule:**
- **Frequency**: Weekly
- **Day**: Monday
- **Time**: 9:05 AM (5 minutes after Churn)

---

### Automation 3: Regional Performance

**Basic Settings:**
- **Automation Name**: `Weekly Regional Performance`
- **Trigger Type**: Bulk Criteria
- **Target Sheet**: `Weekly Leaderboard`
- **Slack Channel**: Your channel
- **Message Format**: **Leaderboard** 🌍

**Criteria Builder:**
- **Criterion 1**: `Region` not_equals `` (to get all regions with data)

**Message Header:**
```
🌍 REGIONAL PERFORMANCE SUMMARY
```

**Schedule:**
- **Frequency**: Weekly
- **Day**: Monday
- **Time**: 9:10 AM (after both manager leaderboards)

---

## 🔄 Weekly Update Process

### Easy 5-Minute Update

Every week (e.g., Monday morning before 9 AM):

#### Step 1: Update Week Number
- Change the `Week` column from `2026-W04` to `2026-W05` (current week)
- Use formula: `=TEXT(TODAY(),"YYYY-'W'ww")` to auto-generate

#### Step 2: Update Manager Performance

**Churn Prevention (Rows 3-7):**
1. Update `Manager Name` if rankings changed
2. Update `Wins` with current week's numbers
3. Update `Change vs Last Week` (calculate: current week - previous week)
4. Update `Region` if manager transferred
5. Sort by `Wins` column (descending) to get correct ranking
6. Update `Rank` column (1, 2, 3, 4, 5)

**Killer Base (Rows 11-15):**
- Repeat the same process for Killer Base section

#### Step 3: Update Regional Performance (Rows 19-22)

1. Update `Total Wins` = sum of all wins in that region
2. Update `Churn Wins` = sum of churn wins for that region
3. Update `Killer Wins` = sum of killer wins for that region
4. Update `Top Manager` = manager with highest wins in that region

#### Step 4: Verify Automation

- Wait for scheduled time (9:00 AM) OR
- Go to Slack Automation Scheduler and click **"Test Now"** on each automation
- Check your Slack channel to see the leaderboards

---

## 🎨 Format Examples

### What It Looks Like in Slack

#### Churn Prevention Leaderboard

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 CHURN PREVENTION LEADERBOARD - TOP 5 - Week 2026-W04
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥇 #1 John Smith
   └ 45 wins 📈 +5 | 🇺🇸 NA

🥈 #2 Sarah Johnson
   └ 42 wins 📈 +8 | 🇪🇺 EMEA

🥉 #3 Mike Chen
   └ 38 wins 📉 -2 | 🌏 APAC

4️⃣ #4 Emily Davis
   └ 35 wins 📈 +12 | 🌎 LATAM

5️⃣ #5 David Wilson
   └ 33 wins 📈 +3 | 🇺🇸 NA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total Wins: 193 | Average: 38.6 | Top Performers: 5

Updated: Jan 22, 2026 at 09:00
```

#### Regional Performance

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 REGIONAL PERFORMANCE SUMMARY - Week 2026-W04
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🇺🇸 NA
├ Total Wins: 156 (🏆 78 Churn + 💪 78 Killer)
└ Top Performer: John Smith

🇪🇺 EMEA
├ Total Wins: 143 (🏆 67 Churn + 💪 76 Killer)
└ Top Performer: Lisa Anderson

🌏 APAC
├ Total Wins: 128 (🏆 62 Churn + 💪 66 Killer)
└ Top Performer: Mike Chen

🌎 LATAM
├ Total Wins: 112 (🏆 54 Churn + 💪 58 Killer)
└ Top Performer: Anna Martinez

Updated: Jan 22, 2026 at 09:10
```

---

## 💡 Recommendations & Best Practices

### 1. **Best Slack Format: Leaderboard**

✅ **Why "Leaderboard" format is recommended:**
- **Trophy emojis** (🥇🥈🥉) make rankings instantly recognizable
- **Change indicators** (📈📉) show momentum and trends
- **Regional flags** (🇺🇸🇪🇺🌏) add visual context
- **Summary stats** provide context at a glance
- **Mobile-friendly** - looks great on phones
- **Engaging** - team members love seeing rankings with emojis

### 2. **Timing & Frequency**

✅ **Recommended Schedule:**
- **Day**: Monday (start of work week)
- **Time**: 9:00 AM (when people check Slack)
- **Frequency**: Weekly (consistent cadence)

**Stagger the 3 messages:**
- 9:00 AM - Churn Prevention
- 9:05 AM - Killer Base
- 9:10 AM - Regional Performance

This prevents overwhelming the channel and creates anticipation.

### 3. **Column Naming Tips**

✅ **Use these exact column names for auto-detection:**
- `Rank` - The format automatically adds trophy emojis
- `Manager Name` or `Name` - Detected as primary identifier
- `Wins` - Used for statistics
- `Change` or `Change vs Last Week` - Auto-formats with 📈📉
- `Region` - Auto-converts to flag emojis

### 4. **Change Tracking Best Practices**

Use this format for the "Change" column:
- `+12` for increases
- `-5` for decreases
- `0` for no change
- `NEW` for new entries

The automation will add the appropriate emoji (📈📉➖).

### 5. **Regional Codes & Flags**

Supported region codes (auto-converts to flags):
- `NA` → 🇺🇸
- `EMEA` → 🇪🇺
- `APAC` → 🌏
- `LATAM` → 🌎
- `US`, `UK`, `DE`, `FR`, `JP`, `KR`, `CN`, `IN`, `BR`, `MX`, `AU`, etc.

Add more regions in the code if needed!

### 6. **Advanced Features You Can Enable**

#### A. @channel Notifications (Mondays only)
- Enable "Channel Notifications" in Advanced Features
- Set condition: "Day of Week equals Monday"
- Everyone gets notified for weekly leaderboards

#### B. Auto-Reactions
- Add 🏆 reaction automatically when posted
- Helps team find leaderboards quickly

#### C. Message Update Strategy
- Use "Update Last Message" to refresh leaderboards in place
- Keeps channel clean instead of posting 3 new messages weekly

#### D. Progress Bars
- Add progress bars showing % of team goal
- Requires adding a "Goal" column

### 7. **Creating Competition & Engagement**

**Add these elements to boost engagement:**

1. **Weekly Highlights Comment**
   - Add a comment after posting manually
   - Example: "🔥 Congrats @John Smith on jumping +5 spots!"

2. **Month-End Prizes**
   - Track monthly winners
   - Announce prizes for #1 overall

3. **Streaks**
   - Add a "Weeks at #1" column
   - Celebrate multi-week champions

4. **Team Goals**
   - Set team-wide win targets
   - Show % to goal in Regional Performance

### 8. **Data Source Integration**

**Where to pull data from:**

Option A: **Manual Entry**
- Update spreadsheet weekly from your reports

Option B: **Automated Import**
- Use Google Sheets formulas to pull from other sheets
- Example: `=QUERY(DataSheet!A:F, "SELECT B, SUM(E) WHERE F='Churn Prevention' GROUP BY B ORDER BY SUM(E) DESC LIMIT 5")`

Option C: **External Database**
- Use Apps Script to fetch from your CRM/database
- Schedule daily import, auto-calculate weekly stats

### 9. **Archive Historical Data**

**Best practice for tracking trends:**

1. Create a "Historical Leaderboards" sheet
2. Every Monday before updating, copy current data to archive
3. Use for year-end analysis and annual awards

**Example Archive Structure:**
```
| Week     | Rank | Manager    | Wins | Category         |
|----------|------|------------|------|------------------|
| 2026-W03 | 1    | John Smith | 42   | Churn Prevention |
| 2026-W03 | 2    | Sarah J.   | 38   | Churn Prevention |
...
```

### 10. **Troubleshooting Common Issues**

**Issue**: No data shows in Slack
- ✅ Check criteria filters match your data
- ✅ Verify "Rank" column has values 1-5

**Issue**: Wrong emojis or no emojis
- ✅ Make sure format is set to "Leaderboard"
- ✅ Check column names match recommended names

**Issue**: Ranks are wrong
- ✅ Sort your sheet by Wins (descending) before running
- ✅ Update Rank column to match actual order

**Issue**: Region flags not showing
- ✅ Use standard region codes (NA, EMEA, APAC, LATAM)
- ✅ Check for extra spaces in region column

---

## 🎯 Advanced Customization

### Add Custom Icons/Emojis

Edit `LeaderboardTemplate.gs` to customize:

```javascript
// Change header icons
let headerIcon = '🏆';  // Change to any emoji

// Add more rank emojis
function getRankEmoji(rank) {
  switch(parseInt(rank)) {
    case 1: return "🥇";  // Customize these
    case 2: return "🥈";
    case 3: return "🥉";
    // Add more ranks...
  }
}

// Add more regions
function getRegionEmoji(region) {
  const regionMap = {
    'MYREGION': '🏴',  // Add custom regions here
    // ...
  };
}
```

### Create Department Leaderboards

Duplicate the setup for other departments:
- Sales Leaderboard
- Customer Success Leaderboard
- Support Team Leaderboard

Just create new sheet sections and automations!

---

## 📞 Support

**Need help?**
- Check the "Leaderboard Instructions" sheet in your workbook
- Test automations using the "Test Now" button
- Check Google Apps Script logs for errors (View > Logs)

---

## 🎉 Quick Wins

**Get started in 10 minutes:**
1. Run `createLeaderboardTemplate()` - **2 minutes**
2. Update sample data with your real data - **3 minutes**
3. Create 1 Slack automation (Churn Prevention) - **3 minutes**
4. Test it - **1 minute**
5. Schedule it - **1 minute**

**Week 2 and beyond:**
- Just update the numbers each week - **5 minutes**
- Everything else is automated!

---

**Built for easy weekly tracking of top performers. Make your team competitive! 🏆**
