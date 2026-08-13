/**
 * AppScript Enterprise Framework (AEF)
 * Core Utility Helper
 */

const Utils = {
  /**
   * Generates a standard v4 UUID.
   * @returns {string} UUID string
   */
  generateUuid: function () {
    return Utilities.getUuid();
  },

  /**
   * Hashes a string (e.g. password) using SHA-256 as specified in PRD Section 8.
   * @param {string} text 
   * @returns {string} Hex string representation of SHA-256 hash
   */
  hashSha256: function (text) {
    if (!text) return '';
    const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
    let txtHash = '';
    for (let i = 0; i < rawHash.length; i++) {
      let byteValue = rawHash[i];
      if (byteValue < 0) byteValue += 256;
      let byteString = byteValue.toString(16);
      if (byteString.length == 1) byteString = '0' + byteString;
      txtHash += byteString;
    }
    return txtHash;
  },

  /**
   * Formats a date object to ISO string format (YYYY-MM-DDTHH:mm:ss.sssZ).
   * @param {Date} [date] 
   * @returns {string} ISO Date String
   */
  formatIsoDate: function (date = new Date()) {
    return date.toISOString();
  },

  /**
   * Safely parses JSON.
   * @param {string} jsonStr 
   * @param {*} fallback 
   * @returns {*}
   */
  safeJsonParse: function (jsonStr, fallback = null) {
    try {
      return jsonStr ? JSON.parse(jsonStr) : fallback;
    } catch (e) {
      return fallback;
    }
  }
};
