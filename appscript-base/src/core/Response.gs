/**
 * AppScript Enterprise Framework (AEF)
 * Core Response Helper
 * 
 * Provides standard JSON responses matching PRD Section 19.
 */

const Response = {
  /**
   * Create a success response JSON object.
   * @param {string} message 
   * @param {*} data 
   * @param {string} code 
   * @param {string} referenceId 
   * @returns {Object} Standard Response Object
   */
  success: function (message = 'Success', data = null, code = 'SUCCESS', referenceId = null) {
    return {
      success: true,
      code: code,
      message: message,
      data: data,
      errors: [],
      reference_id: referenceId || ('REF-' + Utils.generateUuid())
    };
  },

  /**
   * Create an error response JSON object.
   * @param {string} message 
   * @param {string} code 
   * @param {Array<string>} errors 
   * @param {*} data 
   * @param {string} referenceId 
   * @returns {Object} Standard Response Object
   */
  error: function (message = 'An error occurred', code = 'SYSTEM_ERROR', errors = [], data = null, referenceId = null) {
    return {
      success: false,
      code: code,
      message: message,
      data: data,
      errors: Array.isArray(errors) ? errors : [String(errors)],
      reference_id: referenceId || ('REF-' + Utils.generateUuid())
    };
  }
};
