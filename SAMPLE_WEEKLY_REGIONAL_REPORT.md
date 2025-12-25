# Sample Weekly Regional Report - Google Sheet Structure

## Recommended Sheet Setup for Slack Automation

### Sheet Name: `Weekly_Regional_Report`

### Column Structure:

| Region | Fact_Purchase | Plan_Purchase | Purchase_% | Fact_Revenue | Plan_Revenue | Revenue_% | Call_Rate_% | Response_Rate_% |
|--------|---------------|---------------|------------|--------------|--------------|-----------|-------------|-----------------|
| Total | 39,083 | 52,859 | 99.0% | $5,169,679 | $6,941,629 | 102.1% | 85.2% | 42.5% |
| TR | 10,862 | 13,788 | 105.4% | $1,137,144 | $1,398,162 | 110.5% | 94.3% | 35.2% |
| PL | 6,863 | 9,654 | 95.9% | $924,199 | $1,330,940 | 96.2% | 67.7% | 24.1% |
| IL | 5,441 | 6,949 | 104.2% | $852,957 | $1,032,176 | 112.3% | 75.6% | 27.5% |
| AE/AR/AB/SA | 1,967 | 3,024 | 87.9% | $259,661 | $388,537 | 91.4% | 94.3% | 10% |
| FR | 2,538 | 3,339 | 101.2% | $319,010 | $424,508 | 102.0% | 43.0% | 20.7% |
| IT | 2,275 | 3,006 | 102.2% | $312,099 | $424,462 | 102.3% | 72.0% | 27.5% |
| RO | 2,398 | 3,413 | 93.9% | $269,513 | $377,618 | 97.1% | 74.4% | 15.2% |
| DE/NL/CH/AT | 1,399 | 2,016 | 93.8% | $268,065 | $399,624 | 92.6% | 76.3% | 7.4% |
| ES | 1,460 | 1,993 | 98.1% | $203,153 | $284,385 | 98.1% | 84.3% | 6.3% |
| CZ/SK | 898 | 1,235 | 97.1% | $133,416 | $187,373 | 96.3% | 63.0% | 0% |
| RU | 1,182 | 1,698 | 94.0% | $180,674 | $256,949 | 96.7% | 94.4% | 23.0% |

---

## Column Descriptions:

1. **Region** - Region code (TR, PL, IL, etc.)
2. **Fact_Purchase** - Actual purchases this week
3. **Plan_Purchase** - Planned/target purchases
4. **Purchase_%** - Achievement percentage (Fact/Plan * 100)
5. **Fact_Revenue** - Actual revenue this week
6. **Plan_Revenue** - Planned/target revenue
7. **Revenue_%** - Achievement percentage
8. **Call_Rate_%** - Call rate percentage
9. **Response_Rate_%** - Response rate percentage

---

## Tips for Your Sheet:

### 1. **Use Formulas for Percentages**
Instead of manually entering percentages, use formulas:
```
=IF(C2=0, 0, (B2/C2)*100)
```
This auto-calculates Purchase_% based on Fact vs Plan

### 2. **Color Coding (Optional)**
- Green: ≥100% achievement
- Yellow: 90-99% achievement
- Red: <90% achievement

### 3. **Update Total Row**
Make Total row use SUM formulas:
```
=SUM(B3:B13)
```

### 4. **Date Tracking**
Add a "Week_Ending" column at the start to track which week the data is for:
| Week_Ending | Region | Fact_Purchase | ... |
|-------------|--------|---------------|-----|
| 2025-12-21 | Total | 39,083 | ... |

---

## Slack Automation Setup:

### Message Template Example:
```
📊 Weekly Regional Performance Report
Week Ending: {Week_Ending}

🎯 Top Performers:
• Revenue: {best region}
• Purchases: {best region}

📈 Key Metrics by Region:
{Region} | Purchases: {Fact_Purchase}/{Plan_Purchase} ({Purchase_%}) | Revenue: {Fact_Revenue}/{Plan_Revenue} ({Revenue_%})

📞 Engagement:
• Call Rate: {Call_Rate_%}
• Response Rate: {Response_Rate_%}
```

### Recommended Filters:
- **Filter 1**: Region = "Total" (for summary message)
- **Filter 2**: Purchase_% >= 100 (for celebrating over-achievers)
- **Filter 3**: Purchase_% < 90 (for attention needed)

---

## Format Comparison for Your Data:

### Table Format (Recommended):
```
Region          | Purchases    | Revenue      | Call Rate
─────────────────────────────────────────────────────────
TR              | 10,862/13,788 | $1.1M/1.4M   | 94.3%
PL              | 6,863/9,654   | $924K/1.3M   | 67.7%
IL              | 5,441/6,949   | $853K/1.0M   | 75.6%
```
✅ Clean, professional, easy to compare

### Context Format (Alternative):
```
TR: Purchases: 10,862/13,788 • Revenue: $1.1M/$1.4M • Call Rate: 94.3%
PL: Purchases: 6,863/9,654 • Revenue: $924K/$1.3M • Call Rate: 67.7%
```
✅ More compact, fits more data

### Cards Format (Alternative):
```
┌─────────────────────┐
│ 🇹🇷 TR              │
│ Purchases: 10,862   │
│ Revenue: $1.1M      │
│ Call Rate: 94.3%    │
└─────────────────────┘
```
✅ Visual separation, easier to focus on one region

---

## Quick Start:

1. Create new sheet named "Weekly_Regional_Report"
2. Add columns as shown above
3. Enter your 11 regions as rows
4. Use formulas for percentages
5. Set up Slack automation with:
   - Trigger: Weekly schedule (e.g., Monday 9am)
   - Format: Table
   - Template: Include key metrics you want
6. Test with "Test This Automation" button

---

## Advanced: Multiple Messages

You could set up 3 different automations:

1. **Summary Message** (Total row only)
   - Format: Cards
   - Shows overall performance

2. **Detailed Report** (All regions)
   - Format: Table
   - Shows all regions with metrics

3. **Alerts** (Under-performing regions)
   - Format: Quote (for emphasis)
   - Filter: Purchase_% < 90
   - Highlights areas needing attention
