// ============================================================
//  DAILY MANAGER SCHEDULE TRACKER — Google Apps Script v1.0
//  File 1 of 4: Configuration, Colour Palette, Manager Roster
//  28 managers · 10 regions · Slack Block Kit reporting
// ============================================================

// ─────────────────────────────────────────────────────────────
//  CONFIGURATION  ← edit these values before your first run
// ─────────────────────────────────────────────────────────────
const CFG = {
  SHEET_NAME     : 'Schedule',
  SLACK_WEBHOOK  : 'YOUR_SLACK_WEBHOOK_URL_HERE',  // ← paste webhook here
  POST_HOUR      : 8,            // 24-hour clock; uses the script's timezone
  WORKING_HOURS  : '09:00-18:00',
  DAY_OFF        : 'DO',
  HEADER_ROW     : 2,            // row index for column headers (1-based)
  DATA_START_ROW : 3,            // first manager/separator row
  FROZEN_COLS    : 4,            // Manager Name · Region · Procedure · ID
};

// ─────────────────────────────────────────────────────────────
//  COLOUR PALETTE
// ─────────────────────────────────────────────────────────────
const C = {
  TITLE_BG  : '#1a237e',   // deep indigo   – title bar
  TITLE_FG  : '#ffffff',
  HDR_BG    : '#283593',   // indigo        – column headers
  HDR_FG    : '#ffffff',
  WKND_BG   : '#546e7a',   // blue-grey     – weekend header cells
  WKND_FG   : '#ffffff',
  RGN_BG    : '#e8eaf6',   // lavender      – region separator rows
  RGN_FG    : '#1a237e',
  WORK_BG   : '#e8f5e9',   // light green   – working-day cells (CF)
  WORK_FG   : '#1b5e20',
  OFF_BG    : '#ffebee',   // light red     – day-off cells (CF)
  OFF_FG    : '#b71c1c',
  HOL_BG    : '#fff3e0',   // light orange  – public holiday cells (CF)
  HOL_FG    : '#e65100',
  TODAY_BDR : '#f57f17',   // amber         – today column border
  ODD_BG    : '#f8f9ff',   // near-white    – alternating row tint
  EVN_BG    : '#ffffff',
  BORDER    : '#c5cae9',   // light indigo  – cell borders
};

// ─────────────────────────────────────────────────────────────
//  SORT ORDERS
// ─────────────────────────────────────────────────────────────
const REGION_ORDER = [
  'TR', 'ES', 'IL', 'RU', 'IT', 'CZ/SK', 'AE/ARAB/SA', 'FR', 'PL', 'RO',
];

const PROCEDURE_ORDER = [
  'Churn Prevention', 'Killer Base', 'Active Retention',
];

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─────────────────────────────────────────────────────────────
//  MANAGER ROSTER — 28 managers
//  Edit names / IDs to match your real team.
// ─────────────────────────────────────────────────────────────
const MANAGERS = [
  // ── TR (Turkey) ──────────────────────────────────────────
  { name: 'Ahmet Yilmaz',       region: 'TR',          procedure: 'Churn Prevention', id: 'MGR-TR-001' },
  { name: 'Fatma Kaya',         region: 'TR',          procedure: 'Killer Base',       id: 'MGR-TR-002' },
  { name: 'Mehmet Demir',       region: 'TR',          procedure: 'Active Retention',  id: 'MGR-TR-003' },
  // ── ES (Spain) ───────────────────────────────────────────
  { name: 'Carlos García',      region: 'ES',          procedure: 'Churn Prevention', id: 'MGR-ES-001' },
  { name: 'María López',        region: 'ES',          procedure: 'Active Retention',  id: 'MGR-ES-002' },
  { name: 'Rodrigo Silva',      region: 'ES',          procedure: 'Killer Base',       id: 'MGR-ES-003' },
  // ── IL (Israel) ──────────────────────────────────────────
  { name: 'Avi Cohen',          region: 'IL',          procedure: 'Killer Base',       id: 'MGR-IL-001' },
  { name: 'Noa Levi',           region: 'IL',          procedure: 'Active Retention',  id: 'MGR-IL-002' },
  // ── RU (Russia) ──────────────────────────────────────────
  { name: 'Ivan Petrov',        region: 'RU',          procedure: 'Churn Prevention', id: 'MGR-RU-001' },
  { name: 'Anna Smirnova',      region: 'RU',          procedure: 'Active Retention',  id: 'MGR-RU-002' },
  { name: 'Dmitri Volkov',      region: 'RU',          procedure: 'Killer Base',       id: 'MGR-RU-003' },
  // ── IT (Italy) ───────────────────────────────────────────
  { name: 'Marco Rossi',        region: 'IT',          procedure: 'Churn Prevention', id: 'MGR-IT-001' },
  { name: 'Giulia Ferrari',     region: 'IT',          procedure: 'Active Retention',  id: 'MGR-IT-002' },
  { name: 'Hans Mueller',       region: 'IT',          procedure: 'Killer Base',       id: 'MGR-IT-003' },
  // ── CZ/SK (Czech / Slovakia) ─────────────────────────────
  { name: 'Jan Novák',          region: 'CZ/SK',       procedure: 'Killer Base',       id: 'MGR-CZ-001' },
  { name: 'Eva Svoboda',        region: 'CZ/SK',       procedure: 'Churn Prevention', id: 'MGR-CZ-002' },
  // ── AE/ARAB/SA (Gulf) ────────────────────────────────────
  { name: 'Omar Al-Rashid',     region: 'AE/ARAB/SA',  procedure: 'Active Retention',  id: 'MGR-AE-001' },
  { name: 'Layla Khalid',       region: 'AE/ARAB/SA',  procedure: 'Churn Prevention', id: 'MGR-AE-002' },
  { name: 'Yusuf Hassan',       region: 'AE/ARAB/SA',  procedure: 'Killer Base',       id: 'MGR-AE-003' },
  // ── FR (France) ──────────────────────────────────────────
  { name: 'Pierre Dubois',      region: 'FR',          procedure: 'Churn Prevention', id: 'MGR-FR-001' },
  { name: 'Sophie Martin',      region: 'FR',          procedure: 'Active Retention',  id: 'MGR-FR-002' },
  { name: 'Lucie Bernard',      region: 'FR',          procedure: 'Killer Base',       id: 'MGR-FR-003' },
  // ── PL (Poland) ──────────────────────────────────────────
  { name: 'Piotr Kowalski',     region: 'PL',          procedure: 'Killer Base',       id: 'MGR-PL-001' },
  { name: 'Agnieszka Wójcik',   region: 'PL',          procedure: 'Churn Prevention', id: 'MGR-PL-002' },
  { name: 'Tomasz Wiśniewski',  region: 'PL',          procedure: 'Active Retention',  id: 'MGR-PL-003' },
  // ── RO (Romania) ─────────────────────────────────────────
  { name: 'Alexandru Popescu',  region: 'RO',          procedure: 'Churn Prevention', id: 'MGR-RO-001' },
  { name: 'Elena Ionescu',      region: 'RO',          procedure: 'Active Retention',  id: 'MGR-RO-002' },
  { name: 'Mihai Constantin',   region: 'RO',          procedure: 'Killer Base',       id: 'MGR-RO-003' },
];

// ─────────────────────────────────────────────────────────────
//  PUBLIC HOLIDAYS
//  Add 'YYYY-MM-DD' date strings for your team's public holidays.
//  Matching day columns get the orange holiday conditional format.
// ─────────────────────────────────────────────────────────────
const PUBLIC_HOLIDAYS = [
  // '2026-01-01',   // New Year's Day
  // '2026-05-01',   // Labour Day
  // '2026-12-25',   // Christmas
];
