# How to Use Message Formats with Templates

## 🎯 Overview

You now have full control over:
1. **Which fields** appear in your Slack messages (via template)
2. **How they're formatted** (via format dropdown)

Both work together for ALL trigger types (new row, column update, bulk).

---

## 📝 Step-by-Step Guide

### Step 1: Choose Your Fields (Template)

In the **Message Template** field, specify which columns you want to show:

```
{{Region}} {{Yesterday}} {{Today}} {{Forecast}} {{Plan}}
```

**Important:**
- Only fields in the template will appear in the message
- Field names MUST match your sheet's column headers exactly
- Use double curly braces: `{{FieldName}}`

### Step 2: Choose Your Format

Select from the **Message Format** dropdown:

| Format | Best For | Example Output |
|--------|----------|----------------|
| **Inline Text** | Quick summaries, mobile | `*Region:* Arab  *Yesterday:* 8.79%  *Today:* 9.14%` |
| **Table Format** | Numeric data, comparisons | ASCII table with aligned columns |
| **Bullet List** | Detailed reading | Each field on its own line with bullets |
| **Compact Cards** | Visual appeal | 2-column card layout |
| **Plain Text** | Simple, no formatting | Plain text without markdown |

### Step 3: Test It!

Click the **Test** button to see how your message will look in Slack.

---

## 💡 Examples

### Example 1: Sales Summary (Inline Format)

**Template:**
```
{{Region}} {{Yesterday}} {{Today}} {{Forecast}} {{Plan}}
```

**Format:** Inline Text

**Slack Output:**
```
📊 Net Churn
📅 Generated: 12/24/2025, 7:42:17 PM

━━━━━━━━━━━━━━━━━━━━

*Region:* Arab  *Yesterday:* 8.79%  *Today:* 9.14%  *Forecast:* 12.29%  *Plan:* 13.34%

━━━━━━━━━━━━━━━━━━━━

*Region:* TR  *Yesterday:* 4.16%  *Today:* 4.41%  *Forecast:* 5.81%  *Plan:* 6.09%
```

---

### Example 2: KPI Report (Compact Cards)

**Template:**
```
{{Region}} {{Call Rate}} {{Process Rate}} {{Paid Rate}} {{Status}}
```

**Format:** Compact Cards

**Slack Output:**
```
📊 Workload Tracker
📅 Generated: 12/24/2025, 7:43:05 PM

━━━━━━━━━━━━━━━━━━━━

┌─────────────────────┬─────────────────────┐
│ *Region:*           │ *Call Rate:*        │
│ Arab                │ 80.00%              │
├─────────────────────┼─────────────────────┤
│ *Process Rate:*     │ *Paid Rate:*        │
│ 90.00%              │ 15.00%              │
├─────────────────────┼─────────────────────┤
│ *Status:*           │                     │
│ ✅ All KPIs Met     │                     │
└─────────────────────┴─────────────────────┘
```

---

### Example 3: Detailed View (Bullet List)

**Template:**
```
{{Region}} {{Call Rate}} {{Process Rate}} {{Paid Rate}}
```

**Format:** Bullet List

**Slack Output:**
```
📊 Performance Report
📅 Generated: 12/24/2025, 7:45:00 PM

━━━━━━━━━━━━━━━━━━━━

• *Region:* Arab
• *Call Rate:* 80.00%
• *Process Rate:* 90.00%
• *Paid Rate:* 15.00%

━━━━━━━━━━━━━━━━━━━━

• *Region:* TR
• *Call Rate:* 90.00%
• *Process Rate:* 90.00%
• *Paid Rate:* 15.00%
```

---

### Example 4: Data Table (Table Format)

**Template:**
```
{{Region}} {{Call Rate}} {{Process Rate}} {{Paid Rate}}
```

**Format:** Table Format

**Slack Output:**
```
📊 Regional Metrics
📅 Generated: 12/24/2025, 7:46:00 PM

━━━━━━━━━━━━━━━━━━━━

```
Region     | Call Rate  | Process Rat | Paid Rate
───────────┼────────────┼─────────────┼────────────
Arab       | 80.00%     | 90.00%      | 15.00%
TR         | 90.00%     | 90.00%      | 15.00%
PL         | 85.00%     | 90.00%      | 15.00%
```
```

---

## 🔧 Common Scenarios

### Scenario 1: Show Only Specific Metrics

**Goal:** Only show Region and Today's performance

**Template:**
```
{{Region}} {{Today}}
```

**Format:** Inline Text

**Result:** Message shows ONLY Region and Today fields

---

### Scenario 2: All Fields from Sheet

**Goal:** Show every column from the sheet

**Template:** Leave empty or include all fields

**Format:** Any format

**Result:** All columns will appear

---

### Scenario 3: Custom Order

**Goal:** Show fields in different order than sheet

**Template:**
```
{{Plan}} {{Forecast}} {{Today}} {{Yesterday}} {{Region}}
```

**Format:** Any format

**Result:** Fields appear in the order you specified in template

---

## ⚙️ Technical Details

### How Template Filtering Works

1. **Template Parsing**: System extracts field names from `{{FieldName}}` placeholders
2. **Field Matching**: Matches template fields to sheet column headers (exact match, case-sensitive)
3. **Data Filtering**: Only matched columns are included in the message
4. **Format Application**: Selected format is applied to the filtered data

### Special Placeholders

These DON'T affect field filtering (you can use them in template):

- `{{ROW_NUMBER}}` - Current row number
- `{{TIMESTAMP}}` - Current date and time
- `{{DATE}}` - Current date only
- `{{TIME}}` - Current time only

---

## ✅ Best Practices

### 1. Match Field Names Exactly

❌ **Wrong:**
```
{{region}} {{yesterday}}
```
(lowercase, headers are "Region" and "Yesterday")

✅ **Correct:**
```
{{Region}} {{Yesterday}}
```

### 2. Choose Format Based on Data

- **Numbers/Percentages** → Table Format or Inline Text
- **Status/Categories** → Bullet List or Compact Cards
- **Mixed Data** → Inline Text (most versatile)
- **Mobile Users** → Inline Text (most compact)

### 3. Limit Fields for Readability

❌ **Too Many Fields:**
```
{{Field1}} {{Field2}} {{Field3}} {{Field4}} {{Field5}} {{Field6}} {{Field7}} {{Field8}}
```

✅ **Optimal (3-5 fields):**
```
{{Region}} {{Today}} {{Forecast}} {{Status}}
```

### 4. Test Before Scheduling

Always click **Test** button before enabling automation to see the actual output in Slack.

---

## 🐛 Troubleshooting

### Issue: No fields showing

**Cause:** Field names in template don't match sheet headers

**Solution:**
1. Check exact spelling of column headers in your sheet
2. Match capitalization exactly
3. Check for extra spaces in header names

---

### Issue: Still seeing all fields

**Cause:** Old automation created before template filtering was added

**Solution:**
1. Edit the automation
2. Re-save it (even without changes)
3. Test again

---

### Issue: Format not changing

**Cause:** Automation might be using legacy "simple" or "rich" format

**Solution:**
1. Edit automation
2. Select a specific format (Inline, Table, List, Cards, or Plain)
3. Save and test

---

## 📋 Quick Reference

### Supported Formats:

```
inline  → Compact inline text (default, recommended)
table   → ASCII table with aligned columns
list    → Bullet point list
cards   → 2-column card layout
plain   → Plain text without formatting
```

### Template Syntax:

```
{{FieldName}}       → Include field from sheet
{{ROW_NUMBER}}      → Row number
{{TIMESTAMP}}       → Full date/time
{{DATE}}            → Date only
{{TIME}}            → Time only
```

### Works With:

✅ When new row is added (onNewRow)
✅ When specific column is updated (onColumnUpdate)
✅ Bulk send based on criteria (bulkCriteria)

---

## 🎓 Advanced Tips

### Tip 1: Combine with Criteria

Use template to control fields + criteria to control which rows:

**Template:**
```
{{Region}} {{Status}} {{Call Rate}}
```

**Criteria:**
- Field: Status
- Operator: Equals
- Value: Partial

**Result:** Only shows Region, Status, Call Rate for rows where Status = "Partial"

---

### Tip 2: Different Formats for Different Sheets

Create multiple automations with different formats:

- **Sales Sheet** → Table Format (numeric data)
- **Tasks Sheet** → Bullet List (detailed info)
- **Dashboard Sheet** → Compact Cards (visual)

---

### Tip 3: Use Message Header

Set a clear header to identify the report:

**Message Header:**
```
Net Churn Weekly Report
```

Appears at the top of every message, making it easy to identify.

---

## 📞 Need Help?

1. Check **MESSAGE_FORMAT_GUIDE.md** for visual examples of each format
2. Check **TROUBLESHOOTING.md** for common issues
3. Use the **Test** button frequently while configuring

---

**Last Updated:** 2025-12-24
