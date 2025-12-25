# All 9 Slack Message Formats - Complete Guide

You now have **9 different format options** to choose from! Each is optimized for different use cases.

---

## 📊 Format Comparison Chart

| Format | Rows/Block | Data Density | Visual Appeal | Best For |
|--------|------------|--------------|---------------|----------|
| **Inline Text** | 1 | ⭐⭐⭐ | ⭐⭐ | General use, mobile |
| **Table Format** | All | ⭐⭐ | ⭐⭐ | Numeric data, comparisons |
| **Bullet List** | 1 | ⭐ | ⭐⭐⭐ | Detailed reading |
| **Compact Cards** | 1 | ⭐⭐ | ⭐⭐⭐ | Visual dashboards |
| **Plain Text** | 1 | ⭐⭐⭐ | ⭐ | Plain channels, copying |
| **Context Format** | 1 | ⭐⭐⭐⭐ | ⭐⭐ | Large datasets (40+ rows) |
| **Quote Format** | 1 | ⭐⭐ | ⭐⭐⭐ | Emphasis, alerts |
| **Compact Format** | 5 | ⭐⭐⭐⭐⭐ | ⭐ | Very large data (50+ rows) |
| **Rich Format** | 1 | ⭐⭐⭐ | ⭐⭐⭐⭐ | Dashboards, reports |

---

## 1️⃣ Inline Text (Default)

**Best for:** General use, mobile viewing, quick summaries

**Template:**
```
{{Region}} {{Yesterday}} {{Today}} {{Forecast}} {{Plan}}
```

**Slack Output:**
```
📊 Net Churn
📅 Generated: 12/24/2025, 7:42:17 PM

━━━━━━━━━━━━━━━━━━━━

*Region:* Arab  *Yesterday:* 8.79%  *Today:* 9.14%  *Forecast:* 12.29%  *Plan:* 13.34%

━━━━━━━━━━━━━━━━━━━━

*Region:* TR  *Yesterday:* 4.16%  *Today:* 4.41%  *Forecast:* 5.81%  *Plan:* 6.09%
```

**Pros:**
- ✅ Compact and space-efficient
- ✅ Mobile-friendly
- ✅ Clean and professional
- ✅ Works for any data type

**Cons:**
- ❌ Can be hard to scan for specific values
- ❌ Long text wraps awkwardly

---

## 2️⃣ Table Format

**Best for:** Numeric data, comparisons, spreadsheet-like views

**Template:**
```
{{Region}} {{Call Rate}} {{Process Rate}} {{Paid Rate}}
```

**Slack Output:**
```
📊 Workload Tracker
📅 Generated: 12/24/2025, 8:22:24 PM

━━━━━━━━━━━━━━━━━━━━

```
Region     | Call Rate  | Process Rat | Paid Rate
───────────┼────────────┼─────────────┼────────────
Arab       | 80.00%     | 90.00%      | 15.00%
TR         | 90.00%     | 90.00%      | 15.00%
PL         | 85.00%     | 90.00%      | 15.00%
DE         | 80.00%     | 90.00%      | 15.00%
```
```

**Pros:**
- ✅ Aligned columns easy to scan
- ✅ Professional spreadsheet look
- ✅ Great for numeric comparisons
- ✅ Can fit more data

**Cons:**
- ❌ Doesn't work well on mobile
- ❌ Long field names get truncated
- ❌ Fixed-width font required

---

## 3️⃣ Bullet List

**Best for:** Detailed reading, fewer rows, important details

**Template:**
```
{{Region}} {{Call Rate}} {{Process Rate}} {{Paid Rate}} {{Status}}
```

**Slack Output:**
```
📊 Performance Report
📅 Generated: 12/24/2025, 8:30:00 PM

━━━━━━━━━━━━━━━━━━━━

• *Region:* Arab
• *Call Rate:* 80.00%
• *Process Rate:* 90.00%
• *Paid Rate:* 15.00%
• *Status:* ✅ All KPIs Met

━━━━━━━━━━━━━━━━━━━━

• *Region:* TR
• *Call Rate:* 90.00%
• *Process Rate:* 90.00%
• *Paid Rate:* 15.00%
• *Status:* ✅ All KPIs Met
```

**Pros:**
- ✅ Very readable
- ✅ Each field clearly separated
- ✅ Works well on mobile
- ✅ Professional appearance

**Cons:**
- ❌ Takes up more vertical space
- ❌ Not ideal for many rows
- ❌ Harder to compare values across rows

---

## 4️⃣ Compact Cards

**Best for:** Visual appeal, dashboards, moderate data

**Template:**
```
{{Region}} {{Yesterday}} {{Today}} {{Forecast}} {{Plan}}
```

**Slack Output:**
```
📊 Net Churn
📅 Generated: 12/24/2025, 8:35:00 PM

━━━━━━━━━━━━━━━━━━━━

┌─────────────────────┬─────────────────────┐
│ *Region:*           │ *Yesterday:*        │
│ Arab                │ 8.79%               │
├─────────────────────┼─────────────────────┤
│ *Today:*            │ *Forecast:*         │
│ 9.14%               │ 12.29%              │
├─────────────────────┼─────────────────────┤
│ *Plan:*             │                     │
│ 13.34%              │                     │
└─────────────────────┴─────────────────────┘
```

**Pros:**
- ✅ Very visual and appealing
- ✅ Easy to scan
- ✅ Professional dashboard look
- ✅ 2-column layout saves space

**Cons:**
- ❌ Limited to 10 fields per row
- ❌ Not as compact as other formats
- ❌ Odd number of fields leaves empty space

---

## 5️⃣ Plain Text

**Best for:** Plain text channels, copying data, accessibility

**Template:**
```
{{Region}} {{Call Rate}} {{Process Rate}}
```

**Slack Output:**
```
📊 Workload Tracker
Generated: 12/24/2025, 8:40:00 PM

━━━━━━━━━━━━━━━━━━━━

Region: Arab  Call Rate: 80.00%  Process Rate: 90.00%

━━━━━━━━━━━━━━━━━━━━

Region: TR  Call Rate: 90.00%  Process Rate: 90.00%
```

**Pros:**
- ✅ Works everywhere (no markdown required)
- ✅ Easy to copy/paste
- ✅ Simple and clean
- ✅ Accessible

**Cons:**
- ❌ No visual emphasis
- ❌ Harder to distinguish labels from values
- ❌ Less visually appealing

---

## 6️⃣ Context Format ⭐ NEW!

**Best for:** Large datasets (40+ rows), subtle secondary information

**Template:**
```
{{Region}} {{Yesterday}} {{Today}} {{Forecast}}
```

**Slack Output:**
```
📊 Net Churn - All Regions
📅 Generated: 12/24/2025, 8:45:00 PM

━━━━━━━━━━━━━━━━━━━━

*Region:* Arab  *Yesterday:* 8.79%  *Today:* 9.14%  *Forecast:* 12.29%
(shown in smaller, subtle gray text)

*Region:* TR  *Yesterday:* 4.16%  *Today:* 4.41%  *Forecast:* 5.81%
(shown in smaller, subtle gray text)

... up to 40 rows ...
```

**Pros:**
- ✅ Very compact (smaller text)
- ✅ Can fit 40+ rows in one message
- ✅ Subtle and unobtrusive
- ✅ Perfect for background data

**Cons:**
- ❌ Smaller text harder to read
- ❌ Not suitable for important/urgent data
- ❌ Less visual emphasis

**When to use:**
- Large datasets that need to fit in one message
- Secondary/background information
- Logs or historical data
- When you need to show many rows without overwhelming the channel

---

## 7️⃣ Quote Format ⭐ NEW!

**Best for:** Emphasis, alerts, highlighting important data

**Template:**
```
{{Region}} {{Status}} {{Call Rate}} {{Process Rate}}
```

**Slack Output:**
```
📊 Critical KPI Alerts
📅 Generated: 12/24/2025, 8:50:00 PM

━━━━━━━━━━━━━━━━━━━━

> *Region:* PL
> *Status:* ⚡ Partial
> *Call Rate:* 85.00%
> *Process Rate:* 90.00%

━━━━━━━━━━━━━━━━━━━━

> *Region:* DE
> *Status:* ⚡ Partial
> *Call Rate:* 80.00%
> *Process Rate:* 90.00%
```

**Pros:**
- ✅ Draws attention with quote styling
- ✅ Great for alerts and important data
- ✅ Each field stands out
- ✅ Professional emphasis

**Cons:**
- ❌ Takes more vertical space
- ❌ Can be overwhelming with many rows
- ❌ Not ideal for routine reports

**When to use:**
- Alert notifications
- Critical metrics that need attention
- Highlighting exceptions or issues
- Important announcements

---

## 8️⃣ Compact Format ⭐ NEW!

**Best for:** Very large datasets (50+ rows), maximum data density

**Template:**
```
{{Region}} {{Call Rate}} {{Process Rate}} {{Paid Rate}}
```

**Slack Output:**
```
📊 Workload Tracker - All Regions
📅 Generated: 12/24/2025, 8:55:00 PM | Total Records: 50

━━━━━━━━━━━━━━━━━━━━

*#1:* Region: Arab • Call Rate: 80.00% • Process Rate: 90.00% • Paid Rate: 15.00%
*#2:* Region: TR • Call Rate: 90.00% • Process Rate: 90.00% • Paid Rate: 15.00%
*#3:* Region: PL • Call Rate: 85.00% • Process Rate: 90.00% • Paid Rate: 15.00%
*#4:* Region: DE • Call Rate: 80.00% • Process Rate: 90.00% • Paid Rate: 15.00%
*#5:* Region: IL • Call Rate: 80.00% • Process Rate: 90.00% • Paid Rate: 15.00%

*#6:* Region: RU • Call Rate: 75.00% • Process Rate: 85.00% • Paid Rate: 12.00%
*#7:* Region: RO • Call Rate: 70.00% • Process Rate: 80.00% • Paid Rate: 10.00%
... (continues with 5 rows per block)
```

**Pros:**
- ✅ MAXIMUM data density (5 rows per block)
- ✅ Can fit 50+ rows easily
- ✅ Shows record numbers for reference
- ✅ Includes total count in header
- ✅ Efficient use of Slack block limits

**Cons:**
- ❌ Dense - can be hard to scan
- ❌ Not as visually appealing
- ❌ Better for data dumps than analysis

**When to use:**
- Very large datasets (50+ rows)
- Data dumps or exports
- When you need to show everything
- When visual appeal is less important than completeness

---

## 9️⃣ Rich Format ⭐ NEW!

**Best for:** Dashboards, reports, visual engagement

**Template:**
```
{{Region}} {{Call Rate}} {{Process Rate}} {{Paid Rate}} {{Status}}
```

**Slack Output:**
```
📊 Daily Performance Dashboard
📅 *Generated:* 12/24/2025, 9:00:00 PM | 📈 *Total:* 12 records

━━━━━━━━━━━━━━━━━━━━

🌍 *Region:* Arab  📞 *Call Rate:* 80.00%  ⚙️ *Process Rate:* 90.00%  💳 *Paid Rate:* 15.00%  🚦 *Status:* ✅ All KPIs Met

━━━━━━━━━━━━━━━━━━━━

🌍 *Region:* TR  📞 *Call Rate:* 90.00%  ⚙️ *Process Rate:* 90.00%  💳 *Paid Rate:* 15.00%  🚦 *Status:* ✅ All KPIs Met

━━━━━━━━━━━━━━━━━━━━

🌍 *Region:* PL  📞 *Call Rate:* 85.00%  ⚙️ *Process Rate:* 90.00%  💳 *Paid Rate:* 15.00%  🚦 *Status:* ⚡ Partial
```

**Pros:**
- ✅ Very visual and engaging
- ✅ Auto-adds relevant emojis
- ✅ Easy to scan quickly
- ✅ Great for dashboards
- ✅ Professional yet friendly

**Cons:**
- ❌ Emojis may not suit all contexts
- ❌ Can look cluttered with many fields
- ❌ Not suitable for formal/serious reports

**When to use:**
- Team dashboards
- Daily/weekly reports
- Performance metrics
- When visual engagement matters
- Casual team channels

**Emoji Mapping:**
- Region → 🌍
- Call Rate → 📞
- Process Rate → ⚙️
- Paid Rate → 💳
- Status → 🚦
- Revenue → 💰
- Purchase → 🛒
- Date → 📅
- And more!

---

## 🎯 Quick Selection Guide

### Choose based on your data:

**Few rows (1-5):**
- Bullet List ⭐
- Compact Cards
- Quote Format (for emphasis)

**Moderate rows (5-20):**
- Inline Text ⭐ (recommended)
- Rich Format
- Bullet List

**Many rows (20-40):**
- Inline Text
- Context Format ⭐ (recommended)
- Table Format

**Very many rows (40+):**
- Compact Format ⭐ (recommended)
- Context Format
- Table Format

### Choose based on purpose:

**Daily reports:**
- Inline Text
- Rich Format ⭐

**Alerts/Urgent:**
- Quote Format ⭐
- Rich Format

**Data dumps:**
- Compact Format ⭐
- Table Format

**Dashboards:**
- Rich Format ⭐
- Compact Cards

**Professional/Formal:**
- Inline Text ⭐
- Table Format
- Plain Text

**Mobile users:**
- Inline Text ⭐
- Bullet List
- Context Format

---

## 💡 Pro Tips

### 1. Test Different Formats

Use the **Test** button to try different formats with your actual data before committing to one.

### 2. Mix and Match

Create multiple automations for the same sheet with different formats:
- **Daily summary** → Rich Format
- **Full data export** → Compact Format
- **Alerts** → Quote Format

### 3. Consider Your Audience

- **Executives** → Inline Text, Compact Cards
- **Data analysts** → Table Format, Compact Format
- **Team members** → Rich Format, Bullet List

### 4. Field Selection Matters

Fewer fields work better with:
- Compact Cards (max 10 fields)
- Bullet List

More fields work better with:
- Inline Text
- Compact Format

### 5. Template Tips

```
// Good for Rich Format (shows emojis well)
{{Region}} {{Revenue}} {{Target}} {{Status}}

// Good for Table Format (numeric data)
{{Region}} {{Call Rate}} {{Process Rate}} {{Paid Rate}}

// Good for Compact Format (many fields, many rows)
{{ID}} {{Name}} {{Status}} {{Date}} {{Value}} {{Notes}}
```

---

## 📋 Format Specifications

### Block Limits

All formats respect Slack's limits:
- **Max blocks:** 50 (we use max 48 for safety)
- **Max fields per section:** 10
- **Max text per block:** 3000 characters
- **Max header text:** 150 characters

### Row Limits by Format

| Format | Max Rows | Why |
|--------|----------|-----|
| Context | 40 | Context blocks are compact |
| Compact | 50 | 5 rows per block = more density |
| Table | 30 | Tables take more space |
| Inline, Plain | 30 | Standard row limit |
| List, Quote | 25 | Each row needs more blocks |
| Cards | 20 | Field arrays limit rows |
| Rich | 25 | Emojis add visual weight |

---

## ✅ Summary

You now have **9 different formats** optimized for different scenarios:

1. **Inline Text** - Best all-around choice ⭐
2. **Table Format** - For numeric comparisons
3. **Bullet List** - For detailed reading
4. **Compact Cards** - For visual appeal
5. **Plain Text** - For accessibility
6. **Context Format** - For large datasets ⭐ NEW
7. **Quote Format** - For emphasis ⭐ NEW
8. **Compact Format** - For maximum data density ⭐ NEW
9. **Rich Format** - For visual engagement ⭐ NEW

Experiment with different formats to find what works best for your use case!

---

**Last Updated:** 2025-12-25
