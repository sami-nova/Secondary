# Monthly Discount Tracker v2.0 – Scenarios Solution

Google Apps Script implementation for the **Monthly Discount Tracker** spreadsheet.
Adds a **Scenario** dimension to every campaign row, expanding from 70 rows to **196 rows** (14 regions × 14 rows each).

---

## File Overview

| File | Purpose |
|------|---------|
| `Code.gs` | `CONFIG` object, `onOpen` menu, sheet/month helpers |
| `Setup.gs` | Initialize 196-row structure, colors, dropdowns, filter area |
| `DataStore.gs` | Save / load with 4-field composite key |
| `MonthSwitch.gs` | Month switching with auto-save |
| `Filters.gs` | Region / Segment / Scenario filters + sidebar dialog |
| `Dashboard.gs` | Live campaign metrics dashboard |

---

## Structure

```
14 regions × 14 rows/region = 196 total data rows

Per region:
  Row 0  Secondary MO | CHURN PREVENTION (14-30 days)   🟢
  Row 1  Secondary MO | CHURN (180-30 days)              🟡
  Row 2  Secondary MO | OLD CHURN (>180 days)            🔴
  Row 3  Secondary MO | [Custom – blank]
  Row 4  Secondary KO | The most loyal churn             🔵
  Row 5  Secondary KO | Loyal churn                      ⚪
  Row 6  Secondary KO | Not loyal churn                  🟠
  Row 7  Secondary KO | [Custom – blank]
  Row 8  PPC          | Regular Campaign
  Row 9  PPC          | [Custom – blank]
  Row 10 CP           | Regular Campaign
  Row 11 CP           | [Custom – blank]
  Row 12 Paid in Adv. | Regular Campaign
  Row 13 Paid in Adv. | [Custom – blank]
```

---

## New Column Layout (v2.0)

```
A: Region | B: Segment | C: Scenario ← NEW | D: Discount % | E: Promo Code |
F: Condition | G: Code Effect | H: Status | I: Start Date | J: End Date |
K: Banner | L: PopUp | M: InApp | N: WA | O: Push | P: SMS | Q: Notes
```

---

## Data_Store Key Format

**Old (v1):** `"May 2026 | Poland | Secondary MO"`  
**New (v2):** `"May 2026 | Poland | Secondary MO | CHURN PREVENTION (14-30 days)"`

Each scenario row is saved and loaded independently.

---

## Setup Instructions

1. Open your Google Sheet (Monthly Discount Tracker)
2. Open **Extensions → Apps Script**
3. Copy all six `.gs` files into the project (one file each)
4. Save and reload the spreadsheet
5. Use the **🎯 Discount Tracker** menu → **Setup & Tools → Initialize Full Structure**
6. Create Drawing buttons over the colored filter cells and assign the script names shown in the small grey text beneath each cell

---

## Filter Combinations

```
Example 1: Poland + MO  → shows 4 Poland MO rows
Example 2: All + KO + Loyal churn → 14 rows (one per region)
Example 3: All regions + All segments → all 196 rows
```

Use **🔍 Filter Data** in the menu for the interactive sidebar, or click the drawing buttons on the sheet.
