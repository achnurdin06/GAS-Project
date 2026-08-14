/**
 * Standard Response Formatter for AppScript Enterprise Framework (AEF)
 * Follows PRD Section 19 & 20 Standard Response JSON Format:
 * { success: boolean, code: string, message: string, data: any, errors: array, reference_id: string }
 */
const Response = {
  /**
   * Success Response Factory
   * @param {string} message - Human readable message
   * @param {any} data - Result payload
   * @param {string} code - Success status code
   * @returns {Object} Standardized Response Object
   */
  success(message = 'Success', data = null, code = 'SUCCESS') {
    return {
      success: true,
      code: code,
      message: message,
      data: data,
      errors: [],
      reference_id: Utils.generateUuid()
    };
  },

  /**
   * Error Response Factory
   * @param {string} message - Error description
   * @param {string} code - Error status code (e.g. VALIDATION_ERROR, USER_NOT_FOUND)
   * @param {Array} errors - Detailed error items
   * @returns {Object} Standardized Response Object
   */
  error(message = 'An error occurred', code = 'SYSTEM_ERROR', errors = []) {
    return {
      success: false,
      code: code,
      message: message,
      data: null,
      errors: Array.isArray(errors) ? errors : [errors],
      reference_id: Utils.generateUuid()
    };
  }
};
