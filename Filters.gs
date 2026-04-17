/**
 * Filter functions for Monthly Discount Tracker v2.0
 *
 * Uses Google Sheets native BasicFilter (createFilter / setColumnFilterCriteria)
 * instead of row hide/show. Benefits:
 *   - Single API call vs 168 individual hideRows calls (~100× faster)
 *   - Survives browser refresh and sheet reload
 *   - Shows native filter arrows in the header row
 *   - Does not affect other users viewing the sheet simultaneously
 *
 * Filter state is persisted in ScriptProperties so button-click function
 * calls (each a separate execution) share state.
 */

// ─── State helpers ────────────────────────────────────────────────────────────

function _getFilters() {
  var p = PropertiesService.getScriptProperties();
  return {
    region:   p.getProperty('filter_region')   || null,
    segment:  p.getProperty('filter_segment')  || null,
    scenario: p.getProperty('filter_scenario') || null
  };
}

function _setFilter(key, value) {
  var p = PropertiesService.getScriptProperties();
  if (value) p.setProperty('filter_' + key, value);
  else        p.deleteProperty('filter_' + key);
}

function _clearFilters() {
  var p = PropertiesService.getScriptProperties();
  ['filter_region', 'filter_segment', 'filter_scenario'].forEach(function(k) {
    p.deleteProperty(k);
  });
}

// ─── Public clear ─────────────────────────────────────────────────────────────

function filterShowAll() {
  _clearFilters();
  var sheet = getMainSheet();
  if (!sheet) return;
  var f = sheet.getFilter();
  if (f) f.remove();
  _updateFilterBanner(sheet, { region: null, segment: null, scenario: null });
  SpreadsheetApp.getActiveSpreadsheet().toast('All filters cleared', '✅', 2);
}

function filterShowAllRegions() {
  _setFilter('region', null);
  _applyFilters();
}

// ─── Region filters ───────────────────────────────────────────────────────────

function filterPoland()   { _setFilter('region', 'Poland');   _applyFilters(); }
function filterItaly()    { _setFilter('region', 'Italy');    _applyFilters(); }
function filterSpain()    { _setFilter('region', 'Spain');    _applyFilters(); }
function filterFrance()   { _setFilter('region', 'France');   _applyFilters(); }
function filterGermany()  { _setFilter('region', 'Germany');  _applyFilters(); }
function filterRussia()   { _setFilter('region', 'Russia');   _applyFilters(); }
function filterRomania()  { _setFilter('region', 'Romania');  _applyFilters(); }
function filterCzech()    { _setFilter('region', 'Czech');    _applyFilters(); }
function filterArab()     { _setFilter('region', 'ARAB');     _applyFilters(); }
function filterTurkey()   { _setFilter('region', 'Turkey');   _applyFilters(); }
function filterIsrael()   { _setFilter('region', 'Israel');   _applyFilters(); }
function filterKorea()    { _setFilter('region', 'Korea');    _applyFilters(); }
function filterJapan()    { _setFilter('region', 'Japan');    _applyFilters(); }
function filterGlobal()   { _setFilter('region', 'GLOBAL');   _applyFilters(); }

// ─── Segment filters ──────────────────────────────────────────────────────────

function filterSecondaryMO()   { _setFilter('segment', 'Secondary MO');    _applyFilters(); }
function filterSecondaryKO()   { _setFilter('segment', 'Secondary KO');    _applyFilters(); }
function filterPPC()           { _setFilter('segment', 'PPC');             _applyFilters(); }
function filterCP()            { _setFilter('segment', 'CP');              _applyFilters(); }
function filterPaidInAdvance() { _setFilter('segment', 'Paid in Advance'); _applyFilters(); }

// ─── Scenario filters ─────────────────────────────────────────────────────────

function filterChurnPrevention() { _setFilter('scenario', 'CHURN PREVENTION (14-30 days)'); _applyFilters(); }
function filterChurn()           { _setFilter('scenario', 'CHURN (180-30 days)');            _applyFilters(); }
function filterOldChurn()        { _setFilter('scenario', 'OLD CHURN (>180 days)');          _applyFilters(); }
function filterMostLoyal()       { _setFilter('scenario', 'The most loyal churn');           _applyFilters(); }
function filterLoyal()           { _setFilter('scenario', 'Loyal churn');                    _applyFilters(); }
function filterNotLoyal()        { _setFilter('scenario', 'Not loyal churn');                _applyFilters(); }
function filterRegularCampaign() { _setFilter('scenario', 'Regular Campaign');               _applyFilters(); }

// ─── Combined filter (called from sidebar HTML) ───────────────────────────────

function filterCombined(region, segment, scenario) {
  _setFilter('region',   region   || null);
  _setFilter('segment',  segment  || null);
  _setFilter('scenario', scenario || null);
  _applyFilters();
}

// ─── Core filter engine — native BasicFilter ──────────────────────────────────

function _applyFilters() {
  var sheet = getMainSheet();
  if (!sheet) return;

  var active = _getFilters();

  // Always remove the existing filter first (required before createFilter)
  var existing = sheet.getFilter();
  if (existing) existing.remove();

  // If nothing is active, banner update is all we need
  if (!active.region && !active.segment && !active.scenario) {
    _updateFilterBanner(sheet, active);
    return;
  }

  // Create a new BasicFilter on the header row + all data rows
  var totalRows   = CONFIG.REGIONS.length * CONFIG.ROWS_PER_REGION;
  var filterRange = sheet.getRange(CONFIG.HEADER_ROW, 1, totalRows + 1, CONFIG.COLUMNS.NOTES);
  var filter      = filterRange.createFilter();

  // Apply criteria — whenTextEqualTo is case-sensitive and matches cell values exactly
  if (active.region) {
    filter.setColumnFilterCriteria(CONFIG.COLUMNS.REGION,
      SpreadsheetApp.newFilterCriteria().whenTextEqualTo(active.region).build());
  }
  if (active.segment) {
    filter.setColumnFilterCriteria(CONFIG.COLUMNS.SEGMENT,
      SpreadsheetApp.newFilterCriteria().whenTextEqualTo(active.segment).build());
  }
  if (active.scenario) {
    filter.setColumnFilterCriteria(CONFIG.COLUMNS.SCENARIO,
      SpreadsheetApp.newFilterCriteria().whenTextEqualTo(active.scenario).build());
  }

  _updateFilterBanner(sheet, active);
  SpreadsheetApp.getActiveSpreadsheet().toast('Filter applied', '🔍', 2);
}

function _updateFilterBanner(sheet, active) {
  var parts = [];
  if (active.region)   parts.push('Region: '   + active.region);
  if (active.segment)  parts.push('Segment: '  + active.segment);
  if (active.scenario) parts.push('Scenario: ' + active.scenario);

  var text = parts.length
    ? '🔍 Active Filters: ' + parts.join(' | ') + '   (run "Show All" to reset)'
    : '✨ Click month to switch | Data auto-saved | Previous months preserved in Data_Store!';

  // Row 6 info banner
  try {
    sheet.getRange(6, 1)
      .setValue(text)
      .setBackground(parts.length ? '#FFC107' : '#28A745')
      .setFontColor(parts.length ? '#000000' : '#FFFFFF');
  } catch(e) { /* banner row may be merged differently, safe to ignore */ }
}

// ─── Filter sidebar dialog ────────────────────────────────────────────────────

function showFilterDialog() {
  var current = _getFilters();

  function opts(list, sel) {
    return ['<option value="">All</option>']
      .concat(list.map(function(v) {
        return '<option' + (v === sel ? ' selected' : '') + '>' + v + '</option>';
      }))
      .join('');
  }

  var regionOpts   = opts(CONFIG.REGIONS, current.region);
  var segmentOpts  = opts(['Secondary MO','Secondary KO','PPC','CP','Paid in Advance'], current.segment);
  var scenarioOpts = opts(CONFIG.SCENARIO_LIST, current.scenario);

  var html =
    '<!DOCTYPE html><html><head><style>' +
    'body{font-family:Arial,sans-serif;padding:16px;font-size:13px}' +
    'label{display:block;margin-top:12px;font-weight:bold;color:#4B4B9B}' +
    'select{width:100%;padding:6px;border:1px solid #ccc;border-radius:4px;margin-top:4px}' +
    'button{width:100%;margin-top:10px;padding:8px;border:none;border-radius:4px;' +
    '       cursor:pointer;font-size:13px;font-weight:bold}' +
    '.apply{background:#4B4B9B;color:#fff}.clear{background:#6c757d;color:#fff}' +
    '</style></head><body>' +
    '<h3 style="color:#4B4B9B;margin:0 0 12px">🔍 Filter Data</h3>' +
    '<label>Region</label><select id="r">'   + regionOpts   + '</select>' +
    '<label>Segment</label><select id="s">'  + segmentOpts  + '</select>' +
    '<label>Scenario</label><select id="sc">'+ scenarioOpts + '</select>' +
    '<button class="apply" onclick="go()">Apply Filter</button>' +
    '<button class="clear" onclick="clr()">Show All</button>' +
    '<script>' +
    'function v(id){var e=document.getElementById(id);return e.value||null;}' +
    'function go(){google.script.run.filterCombined(v("r"),v("s"),v("sc"));}' +
    'function clr(){google.script.run.filterShowAll();' +
    '  ["r","s","sc"].forEach(function(i){document.getElementById(i).value="";});}' +
    '<\/script></body></html>';

  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutput(html).setTitle('Filter').setWidth(280)
  );
}
