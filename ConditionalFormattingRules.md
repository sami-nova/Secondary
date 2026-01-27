# No-Code Alternative: Conditional Formatting Rules

If you prefer not to use Google Apps Script, you can implement auto-coloring using conditional formatting rules directly in Google Sheets.

## Setting Up Conditional Formatting

### Step 1: Select the Range

1. Select all schedule cells (D2:AH27 or whatever your date range is)
2. **Tip**: Select the first month's data, then copy the formatting to other months

### Step 2: Open Conditional Formatting

1. Go to **Format** > **Conditional formatting**
2. The sidebar will open on the right

### Step 3: Add Rules (in this order)

#### Rule 1: Holiday (Yellow)

- **Apply to range**: D2:AH100 (adjust to your data range)
- **Format rules**: "Text contains"
- **Value**: Holiday
- **Formatting style**: Fill color = Yellow (#FFEB3B)

#### Rule 2: Vacation (Green)

- **Apply to range**: D2:AH100
- **Format rules**: "Text contains"
- **Value**: Vacation
- **Formatting style**: Fill color = Green (#4CAF50)

#### Rule 3: Sick Leave (Red)

- **Apply to range**: D2:AH100
- **Format rules**: "Text contains"
- **Value**: Sick
- **Formatting style**: Fill color = Red (#F44336)

#### Rule 4: Day Off (Blue)

- **Apply to range**: D2:AH100
- **Format rules**: "Text contains"
- **Value**: Day off
- **Formatting style**: Fill color = Blue (#2196F3)

#### Rule 5: Work Hours (White/Light)

- **Apply to range**: D2:AH100
- **Format rules**: Custom formula is
- **Formula**: `=ISNUMBER(SEARCH(":", D2))`
- **Formatting style**: Fill color = White (#FFFFFF)

---

## Summary Formulas (Manual Setup)

Add these formulas in your summary columns:

### Work Days Count (Column AI)

```
=SUMPRODUCT(--ISNUMBER(SEARCH(":", D2:AH2)))
```

### Vacations Count (Column AJ)

```
=COUNTIF(D2:AH2, "*Vacation*")
```

### Holidays Count (Column AK)

```
=COUNTIF(D2:AH2, "*Holiday*")
```

### Sick Days Count (Column AL)

```
=COUNTIF(D2:AH2, "*Sick*")
```

### Day Off Count (Optional)

```
=COUNTIF(D2:AH2, "*Day off*")
```

---

## Creating Dropdowns (Data Validation)

### For Schedule Cells

1. Select your schedule cells (D2:AH100)
2. Go to **Data** > **Data validation**
3. Choose **Dropdown (from a range)** or **Dropdown**
4. Enter these options:
   ```
   9:00-18:00
   9:30-18:30
   10:00-19:00
   10:30-19:30
   11:00-20:00
   13:00-22:00
   16:00-01:00
   8:00-17:00
   Day off
   Holiday
   Vacation
   Sick Leave
   ```
5. Click **Done**

### For Region Column

1. Select column B (Region)
2. Go to **Data** > **Data validation**
3. Enter your regions:
   ```
   Arab
   CZ
   DE
   ES
   FR
   IL
   IT
   PL
   RO
   RU
   TR
   ```

---

## Limitations of No-Code Approach

| Feature | Apps Script | Conditional Formatting Only |
|---------|-------------|----------------------------|
| Auto-coloring | Yes | Yes |
| Monthly sheet generation | Yes | No (manual copy) |
| Email reminders | Yes | No |
| Coverage reports | Yes | No (manual) |
| Summary formulas | Auto-generated | Manual setup |

**Recommendation**: Use the Apps Script approach for full automation capabilities.
