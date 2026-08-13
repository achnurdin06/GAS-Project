/**
 * AppScript Enterprise Framework (AEF)
 * Technical Logger Component (PRD Section 18)
 */

const Logger = {
  LEVELS: {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
  },

  /**
   * Log an entry to Apps Script console / Logger.
   * @param {string} level 
   * @param {string} module 
   * @param {string} funcName 
   * @param {string} message 
   * @param {string} [refId] 
   * @param {string} [userId] 
   */
  log: function (level, module, funcName, message, refId = '', userId = '') {
    const payload = {
      timestamp: Utils.formatIsoDate(),
      level: level,
      module: module,
      function: funcName,
      message: message,
      reference_id: refId,
      user_id: userId
    };
    
    console.log(JSON.stringify(payload));
  },

  info: function (module, funcName, message, refId = '', userId = '') {
    this.log(this.LEVELS.INFO, module, funcName, message, refId, userId);
  },

  warn: function (module, funcName, message, refId = '', userId = '') {
    this.log(this.LEVELS.WARN, module, funcName, message, refId, userId);
  },

  error: function (module, funcName, message, refId = '', userId = '') {
    this.log(this.LEVELS.ERROR, module, funcName, message, refId, userId);
  }
};
