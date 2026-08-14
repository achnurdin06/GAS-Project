/**
 * Technical Logging Utility for AEF Framework
 */
const LoggerUtil = {
  info(module, message, data = null) {
    Logger.log(`[INFO] [${new Date().toISOString()}] [${module}] ${message} ${data ? JSON.stringify(data) : ''}`);
  },

  warn(module, message, data = null) {
    Logger.log(`[WARN] [${new Date().toISOString()}] [${module}] ${message} ${data ? JSON.stringify(data) : ''}`);
  },

  error(module, message, error = null) {
    Logger.log(`[ERROR] [${new Date().toISOString()}] [${module}] ${message} ${error ? (error.stack || error.message || JSON.stringify(error)) : ''}`);
  }
};
