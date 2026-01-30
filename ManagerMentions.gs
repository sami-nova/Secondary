/**
 * PROCESS MANAGER MENTIONS
 * Replaces @ManagerName with Slack mention tags based on Manager Tags sheet
 * Also processes channel mentions like #channel-name
 */
function processManagerMentions(text) {
  if (!text || typeof text !== 'string') return text;

  // Check if text contains @ or # mentions
  if (!text.includes('@') && !text.includes('#')) return text;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let processedText = text;

    // ============================================
    // PROCESS MANAGER MENTIONS (@mentions)
    // ============================================
    const managerSheet = ss.getSheetByName("Manager Tags");

    if (managerSheet) {
      // Get all manager mappings (skip header rows)
      const data = managerSheet.getRange("A3:B100").getValues();
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
      const mentionRegex = /@([a-zA-Z0-9\s]+?)(?=\s|$|,|\||\.)/g;
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
    } else {
      Logger.log("⚠️ Manager Tags sheet not found - manager mentions will not be processed");
    }

    // ============================================
    // PROCESS CHANNEL MENTIONS (#mentions)
    // ============================================
    const channelSheet = ss.getSheetByName("Channel Tags");

    if (channelSheet) {
      // Get all channel mappings
      const channelData = channelSheet.getRange("A3:B100").getValues();
      const channelMap = {};

      channelData.forEach(row => {
        const channelName = row[0] ? String(row[0]).trim() : '';
        const channelId = row[1] ? String(row[1]).trim() : '';

        // Only add valid mappings (both name and ID exist, ID starts with C)
        if (channelName && channelId && channelId.startsWith('C') && channelId.length >= 9) {
          channelMap[channelName.toLowerCase()] = channelId;
        }
      });

      Logger.log(`📺 Loaded ${Object.keys(channelMap).length} channel mappings`);

      // Find all #channel mentions in the text
      const channelRegex = /#([a-zA-Z0-9\-_]+?)(?=\s|$|,|\||\.)/g;
      let channelMatch;

      while ((channelMatch = channelRegex.exec(text)) !== null) {
        const fullMatch = channelMatch[0];  // #channel-name
        const channelName = channelMatch[1].trim();  // channel-name
        const channelKey = channelName.toLowerCase();

        if (channelMap[channelKey]) {
          const channelId = channelMap[channelKey];
          // Replace #channel-name with <#CHANNELID>
          processedText = processedText.replace(fullMatch, `<#${channelId}>`);
          Logger.log(`✓ Replaced "${fullMatch}" with <#${channelId}>`);
        } else {
          Logger.log(`⚠️ No Channel ID found for "${channelName}"`);
        }
      }
    } else {
      Logger.log("⚠️ Channel Tags sheet not found - channel mentions will not be processed");
    }

    return processedText;
  } catch (error) {
    Logger.log(`❌ Error processing mentions: ${error.message}`);
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

  // Remove # symbol ONLY if it's followed by a digit (like #1, #2, #3 rank indicators)
  // Keep # for channel mentions like #general (these will be processed by processManagerMentions)
  cleaned = cleaned.replace(/#(\d+)/g, '$1');  // #1 becomes 1, #2 becomes 2, etc.

  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Remove multiple spaces
  cleaned = cleaned.replace(/\s\s+/g, ' ');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}
