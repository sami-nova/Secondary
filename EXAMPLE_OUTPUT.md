# Example Slack Output

This document shows what your Slack message will look like when using the automation scripts.

## Block Kit Version (SlackReportAutomation.gs)

The Block Kit version creates structured, visually appealing messages with clear sections:

---

### 📊 SECONDARY SALES WEEKLY REPORT

**Week Ending:** 2025-12-22

---

### 🎯 KEY METRICS OVERVIEW

| **💰 Total Revenue** | **Change** |
|:---|:---|
| $125,000 | 📈 +5.2% |

| **🛒 Total Purchases** | **Change** |
|:---|:---|
| 450 | 📈 +3.1% |

| **📊 ARPU** | **Change** |
|:---|:---|
| $278 | 📈 +2.0% |

| **📈 Plan Achievement** | **Target** |
|:---|:---|
| 95.5% | 100% |

---

### 📋 PROCEDURE PERFORMANCE

| **👁️ Killer Base (KB)** | **Status** |
|:---|:---|
|  | ⚠️ Below Target |

| **Field** | **Value** |
|:---|:---|
| Call Rate: 75.0% | Process Rate: 45.0% |
| Paid Rate: 40.0% | Target: 80% / 50% / Reg |

| **💧 Churn Prevention (CP)** | **Status** |
|:---|:---|
|  | ⚠️ Below Target |

| **Field** | **Value** |
|:---|:---|
| Call Rate: 85.0% | Process Rate: 80.0% |
| Paid Rate: 75.0% | Target: 90% / 85% / Reg |

---

### 📊 CATEGORY BREAKDOWN

| **✅ Paid on Time** | **ARPU** |
|:---|:---|
|  | $250 |

| **Purchases** | **Revenue** |
|:---|:---|
| 200 (44.4%) | $50,000 (40.0%) |

| **⏰ Paid in Advance** | **ARPU** |
|:---|:---|
|  | $300 |

| **Purchases** | **Revenue** |
|:---|:---|
| 150 (33.3%) | $45,000 (36.0%) |

| **💧 Churn Prevention** | **ARPU** |
|:---|:---|
|  | $200 |

| **Purchases** | **Revenue** |
|:---|:---|
| 100 (22.2%) | $30,000 (24.0%) |

**TOTAL:** 450 purchases • $125,000 revenue

---

### 🌟 TOP REGIONAL PERFORMERS

| **🥇 North Region** | **Plan** |
|:---|:---|
|  | 110.5% |

| **Revenue** | **ARPU** |
|:---|:---|
| $45,000 | $300 |

> 📝 Exceeded target by 10.5%

| **🥈 South Region** | **Plan** |
|:---|:---|
|  | 98.2% |

| **Revenue** | **ARPU** |
|:---|:---|
| $40,000 | $280 |

| **🥉 East Region** | **Plan** |
|:---|:---|
|  | 95.8% |

| **Revenue** | **ARPU** |
|:---|:---|
| $30,000 | $250 |

---

## Simple Text Version (SlackReportAutomation-Simple.gs)

The simple text version uses formatted code blocks for a cleaner table-free layout:

---

📊 **SECONDARY SALES WEEKLY REPORT**
Week Ending: 2025-12-22
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🎯 KEY METRICS OVERVIEW**
```
💰 Total Revenue:      $125,000 (+5.2% ↑)
🛒 Total Purchases:    450 (+3.1% ↑)
📊 ARPU:               $278 (+2.0% ↑)
📈 Plan Achievement:   95.5% / Target: 100.0%
```

**📋 PROCEDURE PERFORMANCE**
```
👁️  Killer Base (KB)
   Call: 75.0% | Process: 45.0% | Paid: 40.0%
   Target: 80% / 50% / Reg | Status: Below Target ⚠️

💧 Churn Prevention (CP)
   Call: 85.0% | Process: 80.0% | Paid: 75.0%
   Target: 90% / 85% / Reg | Status: Below Target ⚠️
```

**📊 CATEGORY BREAKDOWN**
```
✅ Paid on Time
   Purchases: 200 (44.4%) | Revenue: $50,000 (40.0%) | ARPU: $250
⏰ Paid in Advance
   Purchases: 150 (33.3%) | Revenue: $45,000 (36.0%) | ARPU: $300
💧 Churn Prevention
   Purchases: 100 (22.2%) | Revenue: $30,000 (24.0%) | ARPU: $200

TOTAL: 450 purchases | $125,000 revenue
```

**🌟 TOP REGIONAL PERFORMERS**
```
🥇 North Region
   Revenue: $45,000 | Plan: 110.5% | ARPU: $300
   📝 Exceeded target by 10.5%
🥈 South Region
   Revenue: $40,000 | Plan: 98.2% | ARPU: $280
🥉 East Region
   Revenue: $30,000 | Plan: 95.8% | ARPU: $250
```

---

## Key Differences

### Block Kit Version (Recommended)
**Pros:**
- More visually appealing
- Better structure and separation
- Native Slack formatting
- Looks professional on mobile
- Fields are clearly organized

**Cons:**
- Slightly more complex code
- 50 block limit (rarely an issue)

### Simple Text Version
**Pros:**
- Easier to understand code
- No block limits
- Faster to modify
- Works everywhere

**Cons:**
- Less visually appealing
- May not align perfectly on all devices
- Harder to scan quickly

---

## Tips for Best Results

1. **Use Block Kit for executive reports** - More professional appearance
2. **Use Simple Text for technical teams** - Easier to read in code blocks
3. **Test both versions** - See which your team prefers
4. **Customize emojis** - Match your company culture
5. **Keep sections concise** - Don't overwhelm with too much data

---

## Preview in Slack

Both versions will:
- Display with markdown formatting
- Show emojis properly
- Be readable on mobile devices
- Work in all Slack channels
- Support threading and reactions

The Block Kit version will have:
- Better visual hierarchy
- Clearer section boundaries
- More professional appearance
- Better accessibility features

---

## Next Steps

1. Copy the script to your Google Sheet
2. Configure webhook URL and sheet name
3. Adjust cell references to match your layout
4. Test with `sendWeeklyReportToSlack()`
5. Set up automatic triggers if desired

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions!
