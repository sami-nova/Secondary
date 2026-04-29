// ============================================================
//  DAILY MANAGER SCHEDULE TRACKER — Google Apps Script v1.0
//  File 3 of 4: Slack Integration (Block Kit)
// ============================================================

// ═════════════════════════════════════════════════════════════
//  POST TODAY'S SCHEDULE TO SLACK
//
//  Reads the current state of the sheet (respects manual edits),
//  builds a Block Kit message split by Region, and sends it via
//  the configured Incoming Webhook URL.
// ═════════════════════════════════════════════════════════════
function postScheduleToSlack() {
  // Guard: webhook not configured
  if (CFG.SLACK_WEBHOOK === 'YOUR_SLACK_WEBHOOK_URL_HERE') {
    SpreadsheetApp.getUi().alert(
      '⚠️  Setup Required',
      'Please replace CFG.SLACK_WEBHOOK in 01_Config.gs with your actual Slack Incoming Webhook URL, then try again.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sheet) {
    Logger.log('ERROR: Sheet "' + CFG.SHEET_NAME + '" not found.');
    ss.toast('Sheet "' + CFG.SHEET_NAME + '" not found. Run "Build Sheet" first.', '⚠️ Error', 6);
    return;
  }

  const tz          = Session.getScriptTimeZone();
  const today       = new Date();
  const displayDate = Utilities.formatDate(today, tz, 'EEEE, MMMM dd yyyy');
  const todayCol    = CFG.FROZEN_COLS + today.getDate(); // 1-based column index

  // Verify today falls within the sheet's month
  if (todayCol > sheet.getLastColumn()) {
    ss.toast('Today is outside the current schedule month. Update the month first.', '⚠️ Warning', 6);
    return;
  }

  // ── Read all sheet data in one batch call ─────────────────
  const lastRow  = sheet.getLastRow();
  const lastCol  = sheet.getLastColumn();
  const allData  = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  // ── Build per-region status maps ──────────────────────────
  const regionStatus = {};
  REGION_ORDER.forEach(function(r) {
    regionStatus[r] = { working: [], off: [] };
  });

  for (let r = CFG.DATA_START_ROW - 1; r < lastRow; r++) {
    const row       = allData[r];
    const mgrName   = String(row[0] || '').trim();
    const region    = String(row[1] || '').trim();
    const procedure = String(row[2] || '').trim();
    const mgrId     = String(row[3] || '').trim();

    // Skip blank rows and region-separator rows (no Manager ID)
    if (!mgrName || !mgrId || !REGION_ORDER.includes(region)) continue;

    const cellVal = String(row[todayCol - 1] || '').trim(); // convert to 0-based index
    const nameTag = '*' + mgrName + '*  _(' + procedure + ')_';

    if (cellVal === CFG.DAY_OFF) {
      regionStatus[region].off.push('• ' + nameTag);
    } else if (cellVal !== '') {
      regionStatus[region].working.push('• ' + nameTag + '  `' + cellVal + '`');
    }
  }

  // ── Aggregate totals ──────────────────────────────────────
  const totalWorking = REGION_ORDER.reduce(function(n, r) {
    return n + (regionStatus[r] ? regionStatus[r].working.length : 0);
  }, 0);
  const totalOff = REGION_ORDER.reduce(function(n, r) {
    return n + (regionStatus[r] ? regionStatus[r].off.length : 0);
  }, 0);

  // ── Assemble Block Kit payload ────────────────────────────
  const blocks = buildSlackBlocks_(displayDate, totalWorking, totalOff, regionStatus);

  // Slack limits a single message to 50 blocks; split if needed
  const MAX_BLOCKS = 50;
  const payloads   = [];
  for (let i = 0; i < blocks.length; i += MAX_BLOCKS) {
    payloads.push({ blocks: blocks.slice(i, i + MAX_BLOCKS) });
  }

  // ── Send each payload ─────────────────────────────────────
  let allOk = true;
  payloads.forEach(function(payload) {
    const resp = UrlFetchApp.fetch(CFG.SLACK_WEBHOOK, {
      method            : 'post',
      contentType       : 'application/json',
      payload           : JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    const code = resp.getResponseCode();
    Logger.log('Slack response ' + code + ': ' + resp.getContentText());
    if (code !== 200) allOk = false;
  });

  if (allOk) {
    ss.toast('✅  Schedule posted to Slack successfully!', 'Slack', 5);
  } else {
    ss.toast('❌  One or more Slack requests failed. Check Apps Script logs.', 'Error', 8);
  }
}


// ─────────────────────────────────────────────────────────────
//  BUILD SLACK BLOCK KIT BLOCKS (private)
// ─────────────────────────────────────────────────────────────
function buildSlackBlocks_(displayDate, totalWorking, totalOff, regionStatus) {
  const blocks = [];

  // ── Header ────────────────────────────────────────────────
  blocks.push({
    type: 'header',
    text: {
      type : 'plain_text',
      text : '📋  Manager Daily Schedule — ' + displayDate,
      emoji: true,
    },
  });
  blocks.push({ type: 'divider' });

  // ── Summary fields ────────────────────────────────────────
  blocks.push({
    type  : 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: '✅  *Working today*\n' + totalWorking + ' manager' + (totalWorking !== 1 ? 's' : ''),
      },
      {
        type: 'mrkdwn',
        text: '🔴  *On day off*\n' + totalOff + ' manager' + (totalOff !== 1 ? 's' : ''),
      },
    ],
  });
  blocks.push({ type: 'divider' });

  // ── Per-region sections ───────────────────────────────────
  REGION_ORDER.forEach(function(region) {
    const s = regionStatus[region];
    if (!s || (s.working.length === 0 && s.off.length === 0)) return;

    // Region heading
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '*🌍  Region: ' + region + '*' },
    });

    // Working list
    if (s.working.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✅  *Working:*\n' + s.working.join('\n'),
        },
      });
    }

    // Day-off list
    if (s.off.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🔴  *Day Off:*\n' + s.off.join('\n'),
        },
      });
    }

    blocks.push({ type: 'divider' });
  });

  // ── Footer context block ──────────────────────────────────
  blocks.push({
    type    : 'context',
    elements: [{
      type: 'mrkdwn',
      text: '_Auto-posted from Google Sheets · ' + displayDate + '_',
    }],
  });

  return blocks;
}
