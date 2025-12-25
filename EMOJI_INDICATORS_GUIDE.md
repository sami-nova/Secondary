# Emoji Indicators Guide

## Overview

All message formats now support **automatic emoji indicators** to make your Slack reports more visual and easier to understand at a glance.

---

## 🎯 Performance Indicators (Automatic)

Performance emojis are **automatically added** to any column with "%" in the name:

| Performance Level | Emoji | Criteria |
|-------------------|-------|----------|
| **Excellent** | ✅ | ≥ 100% |
| **Warning** | ⚠️ | 90-99% |
| **Critical** | ❌ | < 90% |

### Example:
```
Purchase_%: 105.4% ✅
Revenue_%: 94.2% ⚠️
Call_Rate_%: 85.0% ❌
```

**Works with various formats:**
- `99.0%` ← Standard percentage
- `0.99` ← Decimal format (automatically converted to 99%)
- `99` ← Number (treated as percentage)

---

## 🌍 Region Flags (Automatic)

When you have a column named "Region" (case-insensitive), the system automatically adds country flag emojis:

| Region Code | Flag | Country |
|-------------|------|---------|
| TR | 🇹🇷 | Turkey |
| PL | 🇵🇱 | Poland |
| IL | 🇮🇱 | Israel |
| FR | 🇫🇷 | France |
| IT | 🇮🇹 | Italy |
| RO | 🇷🇴 | Romania |
| ES | 🇪🇸 | Spain |
| RU | 🇷🇺 | Russia |
| DE/NL/CH/AT | 🇩🇪 | Germany (first in group) |
| CZ/SK | 🇨🇿 | Czech Republic (first in group) |
| AE/AR/AB/SA | 🇦🇪 | UAE (first in group) |
| TOTAL | 🌍 | Global |

### Example:
```
🇹🇷 TR
Purchase_%: 105.4% ✅
Revenue_%: 110.5% ✅

🇵🇱 PL
Purchase_%: 95.9% ⚠️
Revenue_%: 96.2% ⚠️
```

---

## 💡 Field Type Indicators (Automatic)

Emojis are automatically added based on field/column names:

| Field Type | Emoji | Triggers |
|------------|-------|----------|
| Revenue | 💰 | "revenue" in name |
| Purchase | 🛒 | "purchase" in name |
| Call Rate | 📞 | "call" in name |
| Response | 💬 | "response" in name |
| Payment | 💳 | "payment" in name |
| ARPU | 📊 | "arpu" in name |
| Target/Plan | 🎯 | "target" or "plan" in name |
| Date | 📅 | "date" in name |
| Time | 🕐 | "time" in name |
| Status | 🚦 | "status" in name |
| Region | 🌍 | "region" in name |
| Other | ▪️ | Default |

### Example:
```
💰 Fact_Revenue: $1,137,144
💰 Plan_Revenue: $1,398,162
💰 Revenue_%: 110.5% ✅
📞 Call_Rate_%: 94.3% ✅
💬 Response_Rate_%: 35.2% ❌
```

---

## 📊 Format-Specific Emoji Features

### **Table Format**
- ✅ Performance emojis in percentage columns
- ✅ Performance legend at bottom
- ✅ Overall summary (if "Total" row exists)

**Example:**
```
Region    | Purchase_%  | Revenue_%
──────────────────────────────────────
Total     | 99.0% ⚠️   | 102.1% ✅
TR        | 105.4% ✅  | 110.5% ✅
PL        | 95.9% ⚠️   | 96.2% ⚠️

Overall: Purchase_%: 99.0% ⚠️ • Revenue_%: 102.1% ✅
Performance Legend: ✅ ≥100% | ⚠️ 90-99% | ❌ <90%
```

### **Cards Format** (Improved!)
- ✅ Region flags in card headers
- ✅ Performance emojis in header (main metric)
- ✅ Field type emojis for all metrics
- ✅ Performance emojis on percentage fields
- ✅ Clean, organized 2-column layout

**Example:**
```
┌───────────────────────────────┐
│ 🇹🇷 TR ✅                     │
│                               │
│ 🛒 Fact_Purchase:    10,862   │  💰 Fact_Revenue:  $1,137,144
│ 🛒 Plan_Purchase:    13,788   │  💰 Plan_Revenue:  $1,398,162
│ 🛒 Purchase_%:    105.4% ✅   │  💰 Revenue_%:     110.5% ✅
│ 📞 Call_Rate_%:      94.3% ✅ │  💬 Response_Rate: 35.2% ❌
└───────────────────────────────┘
```

### **List Format**
- ✅ Region flags in headers
- ✅ Field type emojis for all fields
- ✅ Performance emojis on percentages

**Example:**
```
🇹🇷 TR
🛒 Fact_Purchase: 10,862
🛒 Plan_Purchase: 13,788
🛒 Purchase_%: 105.4% ✅
💰 Fact_Revenue: $1,137,144
💰 Plan_Revenue: $1,398,162
💰 Revenue_%: 110.5% ✅
📞 Call_Rate_%: 94.3% ✅
💬 Response_Rate_%: 35.2% ❌
```

### **Inline Format**
- ✅ Region flags in headers
- ✅ Field type emojis
- ✅ Performance emojis on percentages
- ✅ Compact horizontal layout

**Example:**
```
🇹🇷 TR
🛒 Fact_Purchase: 10,862   🛒 Plan_Purchase: 13,788   🛒 Purchase_%: 105.4% ✅   💰 Fact_Revenue: $1,137,144   💰 Plan_Revenue: $1,398,162   💰 Revenue_%: 110.5% ✅   📞 Call_Rate_%: 94.3% ✅
```

### **Rich Format**
Already had emoji support, now enhanced with:
- ✅ Performance indicators on percentages
- ✅ Region flags
- ✅ Field type emojis

---

## 🎨 Customization Options

### How to Customize Performance Thresholds

If you want different thresholds (e.g., 95% = warning instead of 90%), edit the `getPerformanceEmoji` function in SlackAutomationBuilder.gs:

```javascript
function getPerformanceEmoji(valueStr) {
  // ... parsing code ...

  // CUSTOMIZE THESE THRESHOLDS:
  if (numValue >= 100) return " ✅";  // Excellent
  if (numValue >= 95) return " ⚠️";   // Warning (changed from 90)
  return " ❌";                        // Critical
}
```

### How to Add Custom Region Flags

Edit the `getRegionFlag` function in SlackAutomationBuilder.gs:

```javascript
function getRegionFlag(region) {
  const r = String(region).toUpperCase().trim();

  // ADD YOUR CUSTOM REGIONS HERE:
  if (r === "BR" || r.includes("BRAZIL")) return "🇧🇷";
  if (r === "MX" || r.includes("MEXICO")) return "🇲🇽";
  if (r === "JP" || r.includes("JAPAN")) return "🇯🇵";

  // ... existing regions ...

  return "📍"; // Default emoji
}
```

### How to Add Custom Field Emojis

Edit the `getEmojiForHeader` function in SlackAutomationBuilder.gs:

```javascript
function getEmojiForHeader(header) {
  const lower = header.toLowerCase();

  // ADD YOUR CUSTOM FIELDS HERE:
  if (lower.includes("churn")) return "❌";
  if (lower.includes("retention")) return "🔒";
  if (lower.includes("conversion")) return "✅";

  // ... existing fields ...

  return "▪️"; // Default emoji
}
```

---

## 🚀 Best Practices

### ✅ DO:
1. **Use "%" in column names** for automatic performance indicators
   - Good: `Purchase_%`, `Revenue_%`, `Call_Rate_%`
   - Also works: `Purchase_Percent`, `Revenue_Achievement_%`

2. **Name region column "Region"** for automatic flags
   - Good: `Region`, `region`, `REGION`, `Region_Code`

3. **Use descriptive column names** for automatic field emojis
   - Good: `Fact_Revenue`, `Call_Rate_%`, `Response_Rate_%`

4. **Keep percentage values consistent**
   - Use `99.0%` or `0.99` format
   - System handles both automatically

### ❌ DON'T:
1. **Don't use generic column names** if you want emojis
   - Bad: `Column_A`, `Value_1`, `Metric_X`
   - Good: `Purchase_Value`, `Revenue_Total`, `Call_Rate`

2. **Don't mix percentage formats within same column**
   - Bad: Some rows as `99%`, others as `0.99`, others as `99`
   - Good: Pick one format and stick with it

---

## 📋 Quick Reference

### When Emojis Appear:

| Feature | Automatic? | Column Requirement | Format Support |
|---------|------------|-------------------|----------------|
| Performance (✅⚠️❌) | Yes | Name contains "%" | All formats |
| Region Flags (🇹🇷🇵🇱🇮🇱) | Yes | Column named "Region" | All formats |
| Field Icons (💰🛒📞) | Yes | Keyword in name | All formats except Table* |
| Record Count | Yes | Automatic | All formats |
| Performance Legend | Yes | Has % columns | Table format only |
| Overall Summary | Yes | First row = "Total" | Table format only |

*Table format shows field emojis in the summary section below the table.

---

## 💡 Examples by Use Case

### **Weekly Regional Report (Recommended: Table Format)**
Perfect for stakeholder reports with 11 regions:
```
Region    | Purchase_%  | Revenue_%   | Call_Rate_%
──────────────────────────────────────────────────────
Total     | 99.0% ⚠️   | 102.1% ✅  | 85.2% ❌
TR        | 105.4% ✅  | 110.5% ✅  | 94.3% ✅
PL        | 95.9% ⚠️   | 96.2% ⚠️   | 67.7% ❌
...

Overall: Purchase_%: 99.0% ⚠️ • Revenue_%: 102.1% ✅
Performance Legend: ✅ ≥100% | ⚠️ 90-99% | ❌ <90%
```

### **Daily Alert (Recommended: Cards or List)**
Focus on regions needing attention:
```
┌────────────────────────────┐
│ 🇵🇱 PL ⚠️                 │
│ 🛒 Purchase_%: 95.9% ⚠️   │
│ 💰 Revenue_%: 96.2% ⚠️    │
│ 📞 Call_Rate: 67.7% ❌    │
│ Action needed!             │
└────────────────────────────┘
```

### **Executive Summary (Recommended: Inline or Context)**
Quick overview for leadership:
```
🌍 Total
🛒 Purchase_%: 99.0% ⚠️   💰 Revenue_%: 102.1% ✅   📞 Call_Rate: 85.2% ❌
```

---

## 🔧 Troubleshooting

### **Emojis not showing?**
1. Check column names contain keywords (see Field Type Indicators table)
2. For percentage emojis, ensure "%" is in column name
3. For region flags, ensure column is named "Region"

### **Wrong emoji appearing?**
1. Column name might match multiple keywords (e.g., "Plan_Revenue" triggers both 🎯 and 💰)
2. First match wins - check getEmojiForHeader() function order

### **Performance emoji wrong?**
1. Check value format (should be "99%", "0.99", or 99)
2. Verify value is numeric and not text
3. Check getPerformanceEmoji() thresholds

### **Region flag not showing?**
1. Ensure column is named "Region" (case-insensitive)
2. Check region code matches getRegionFlag() mappings
3. Add custom region if needed (see Customization section)

---

## 🎁 Benefits

### **At a Glance Understanding**
- ✅ Instantly spot high performers
- ⚠️ Quickly identify areas needing attention
- ❌ Immediately see critical issues
- 🌍 Recognize regions without reading codes

### **Better Engagement**
- Colorful emojis make reports more engaging
- Team more likely to read and act on data
- Reduces "report fatigue"

### **Mobile-Friendly**
- Emojis are universally recognized on all devices
- Color and symbols work even on small screens
- No need to zoom in to read percentages

### **Professional but Friendly**
- Maintains professionalism with tasteful use
- Makes data accessible to non-technical stakeholders
- Adds visual hierarchy to complex reports

---

## 📚 Related Guides

- See `REGIONAL_REPORT_FORMAT_COMPARISON.md` for format examples with your data
- See `SAMPLE_WEEKLY_REGIONAL_REPORT.md` for setup instructions
- See `ALL_FORMAT_EXAMPLES.md` for complete format documentation

---

**Note:** All emoji features work automatically based on your column names and data. No configuration required! 🎉
