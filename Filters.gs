/**
 * Filter functions for Monthly Discount Tracker v2.0
 *
 * Filter state is persisted in ScriptProperties so it survives
 * between independent button-click function calls.
 *
 * Supported filters: Region | Segment | Scenario (combinable)
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
  p.deleteProperty('filter_region');
  p.deleteProperty('filter_segment');
  p.deleteProperty('filter_scenario');
}

// ─── Public clear ─────────────────────────────────────────────────────────────

function filterShowAll() {
  _clearFilters();
  _applyFilters();
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

function filterSecondaryMO()   { _setFilter('segment', 'Secondary MO');   _applyFilters(); }
function filterSecondaryKO()   { _setFilter('segment', 'Secondary KO');   _applyFilters(); }
function filterPPC()           { _setFilter('segment', 'PPC');            _applyFilters(); }
function filterCP()            { _setFilter('segment', 'CP');             _applyFilters(); }
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

// ─── Core filter engine ───────────────────────────────────────────────────────

function _applyFilters() {
  var sheet = getMainSheet();
  if (!sheet) return;

  var active   = _getFilters();
  var template = CONFIG.REGION_ROW_TEMPLATE;
  var regions  = CONFIG.REGIONS;

  SpreadsheetApp.getActiveSpreadsheet().toast('Applying filters…', '🔍', 1);

  regions.forEach(function(region, r) {
    var regionMatch = !active.region || active.region === region;

    template.forEach(function(tpl, t) {
      var rowNum       = getRowForRegionAndOffset(r, t);
      var segmentMatch = !active.segment  || active.segment  === tpl.segment;
      var scenarioMatch= !active.scenario || active.scenario === tpl.scenario;

      if (regionMatch && segmentMatch && scenarioMatch) {
        sheet.showRows(rowNum);
      } else {
        sheet.hideRows(rowNum);
      }
    });
  });

  _updateFilterBanner(sheet, active);
}

function _updateFilterBanner(sheet, active) {
  var parts = [];
  if (active.region)   parts.push('Region: '   + active.region);
  if (active.segment)  parts.push('Segment: '  + active.segment);
  if (active.scenario) parts.push('Scenario: ' + active.scenario);

  var text = parts.length
    ? '🔍 Active Filters: ' + parts.join(' | ') + '   (run "Show All" to reset)'
    : '✅ Showing all data';

  sheet.getRange(6, 1)
    .setValue(text)
    .setBackground(parts.length ? '#FFC107' : '#28A745')
    .setFontColor(parts.length ? '#000000' : '#FFFFFF');
}

// ─── Filter sidebar dialog ────────────────────────────────────────────────────

function showFilterDialog() {
  var current = _getFilters();

  function opts(list, current) {
    return ['<option value="">All</option>']
      .concat(list.map(function(v) {
        return '<option' + (v === current ? ' selected' : '') + '>' + v + '</option>';
      }))
      .join('');
  }

  var regionOpts   = opts(CONFIG.REGIONS,       current.region);
  var segmentOpts  = opts(['Secondary MO','Secondary KO','PPC','CP','Paid in Advance'], current.segment);
  var scenarioOpts = opts(CONFIG.SCENARIO_LIST, current.scenario);

  var html = '<!DOCTYPE html><html><head><style>' +
    'body{font-family:Arial,sans-serif;padding:16px;font-size:13px}' +
    'label{display:block;margin-top:12px;font-weight:bold;color:#4B4B9B}' +
    'select{width:100%;padding:6px;border:1px solid #ccc;border-radius:4px;margin-top:4px}' +
    'button{width:100%;margin-top:10px;padding:8px;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:bold}' +
    '.btn-apply{background:#4B4B9B;color:#fff}' +
    '.btn-clear{background:#6c757d;color:#fff}' +
    '</style></head><body>' +
    '<h3 style="color:#4B4B9B;margin-top:0">🔍 Filter Data</h3>' +
    '<label>Region</label><select id="r">' + regionOpts + '</select>' +
    '<label>Segment</label><select id="s">' + segmentOpts + '</select>' +
    '<label>Scenario</label><select id="sc">' + scenarioOpts + '</select>' +
    '<button class="btn-apply" onclick="apply()">Apply Filter</button>' +
    '<button class="btn-clear" onclick="clear_()">Show All</button>' +
    '<script>' +
    'function v(id){var el=document.getElementById(id);return el.value||null;}' +
    'function apply(){google.script.run.filterCombined(v("r"),v("s"),v("sc"));}' +
    'function clear_(){google.script.run.filterShowAll();["r","s","sc"].forEach(function(id){document.getElementById(id).value="";})}' +
    '</script></body></html>';

  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutput(html).setTitle('Filter Discount Tracker').setWidth(300)
  );
}
