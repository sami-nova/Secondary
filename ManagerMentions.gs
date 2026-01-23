/**
 * PROCESS MANAGER MENTIONS
 * Replaces @ManagerName with Slack mention tags based on Manager Tags sheet
 */
function processManagerMentions(text) {
  if (!text || typeof text !== 'string') return text;

  // Check if text contains @ mentions
  if (!text.includes('@')) return text;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Manager Tags");

    if (!sheet) {
      Logger.log("⚠️ Manager Tags sheet not found - mentions will not be processed");
      return text;
    }

    // Get all manager mappings (skip header rows)
    const data = sheet.getRange("A3:B100").getValues();
    const managerMap = {};

    data.forEach(row => {
      const managerName = row[0] ? String(row[0]).trim() : '';
      const slackId = row[1] ? String(row[1]).trim() : '';

      // Only add valid mappings (both name and ID exist, ID starts with U)
      if (managerName && slackId && slackId.startsWith('U') && slackId.length >= 9) {
        managerMap[managerName.toLowerCase()] = slackId;
      }
    });

    Logger.log(`📋 Loaded ${Object.keys(managerMap).length} manager mappings`);

    // Find all @mentions in the text
    const mentionRegex = /@([a-zA-Z0-9\s]+)/g;
    let processedText = text;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const fullMatch = match[0];  // @ManagerName
      const managerName = match[1].trim();  // ManagerName
      const managerKey = managerName.toLowerCase();

      if (managerMap[managerKey]) {
        const slackId = managerMap[managerKey];
        // Replace @ManagerName with <@USERID>
        processedText = processedText.replace(fullMatch, `<@${slackId}>`);
        Logger.log(`✓ Replaced "${fullMatch}" with <@${slackId}>`);
      } else {
        Logger.log(`⚠️ No Slack ID found for "${managerName}"`);
      }
    }

    return processedText;
  } catch (error) {
    Logger.log(`❌ Error processing manager mentions: ${error.message}`);
    return text;  // Return original text if error
  }
}

/**
 * HELPER: Apply manager mentions to manager name field
 * IMPORTANT: Process mentions BEFORE cleaning to preserve @ symbols
 */
function applyManagerMentions(managerName) {
  if (!managerName) return managerName;

  const text = String(managerName);

  // First, process @mentions (before cleaning removes the @ symbol!)
  const mentioned = processManagerMentions(text);

  // Then clean everything else (but preserve the <@USERID> tags we just added)
  let cleaned = mentioned;

  // Remove lock emojis
  cleaned = cleaned.replace(/[\u{1F512}\u{1F513}\u{1F510}\u{1F511}]/gu, '');
  cleaned = cleaned.replace(/🔒|🔓|🔐|🔑/g, '');

  // Remove "private channel" text
  cleaned = cleaned.replace(/private\s+channel/gi, '');
  cleaned = cleaned.replace(/private\s*channel/gi, '');
  cleaned = cleaned.replace(/privatechannel/gi, '');
  cleaned = cleaned.replace(/\bprivate\b/gi, '');
  cleaned = cleaned.replace(/\bchannel\b/gi, '');

  // Remove # symbol (but NOT @ symbol - we need it for mentions that weren't mapped)
  cleaned = cleaned.replace(/#/g, '');

  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Remove multiple spaces
  cleaned = cleaned.replace(/\s\s+/g, ' ');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}
