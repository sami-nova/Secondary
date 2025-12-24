/**
 * SLACK LIBRARY - Helper functions for Slack automation
 */

const SlackLib = (function() {

  /**
   * Message Processor - Handles template variable replacement
   */
  function createMessageProcessor() {
    return {
      processMessageTemplate: function(template, rowData, rowNumber) {
        if (!template) return '';

        let processed = template;

        // Replace row data placeholders
        Object.keys(rowData).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          processed = processed.replace(regex, rowData[key] || '');
        });

        // Replace special placeholders
        processed = processed.replace(/\{\{ROW_NUMBER\}\}/g, rowNumber);
        processed = processed.replace(/\{\{TIMESTAMP\}\}/g, new Date().toLocaleString());
        processed = processed.replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString());
        processed = processed.replace(/\{\{TIME\}\}/g, new Date().toLocaleTimeString());

        return processed;
      }
    };
  }

  /**
   * Automation Manager - Handles saving and updating automations
   */
  function createAutomationManager() {
    return {
      processAutomations: function(automations, newConfig) {
        const existingIndex = automations.findIndex(a => a.id === newConfig.id);

        if (existingIndex !== -1) {
          // Update existing
          automations[existingIndex] = newConfig;
          return {
            success: true,
            automations: automations,
            id: newConfig.id
          };
        } else {
          // Create new
          newConfig.id = newConfig.id || 'auto_' + Date.now();
          automations.push(newConfig);
          return {
            success: true,
            automations: automations,
            id: newConfig.id
          };
        }
      },

      updateTriggerIds: function(automations, automationId, triggerIds) {
        const automation = automations.find(a => a.id === automationId);
        if (automation) {
          automation.triggerIds = triggerIds;
        }
        return automations;
      }
    };
  }

  // Public API
  return {
    createMessageProcessor: createMessageProcessor,
    createAutomationManager: createAutomationManager
  };
})();
