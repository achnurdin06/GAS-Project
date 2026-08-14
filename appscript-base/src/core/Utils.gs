/**
 * Core Utilities for AEF
 * Handles UUID generation, SHA-256 Hashing, ISO Formatting, and Safe JSON Handling
 */
const Utils = {
  /**
   * Generates a UUID v4 compliant string
   * @returns {string} UUID
   */
  generateUuid() {
    return Utilities.getUuid();
  },

  /**
   * Computes SHA-256 Digest of a plain text string
   * @param {string} text - Plain text input (e.g. password)
   * @returns {string} Hex encoded SHA-256 hash string
   */
  hashSha256(text) {
    if (!text) return '';
    const rawByteHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
    let hexString = '';
    for (let i = 0; i < rawByteHash.length; i++) {
      let byte = rawByteHash[i];
      if (byte < 0) byte += 256;
      let byteHex = byte.toString(16);
      if (byteHex.length === 1) byteHex = '0' + byteHex;
      hexString += byteHex;
    }
    return hexString;
  },

  /**
   * Gets current ISO Date Time string (UTC)
   * @returns {string} ISO Date string
   */
  formatIsoDate(dateObj = new Date()) {
    return dateObj.toISOString();
  },

  /**
   * Safely parses JSON input or returns fallback
   * @param {string} jsonStr 
   * @param {any} fallback 
   * @returns {any}
   */
  safeJsonParse(jsonStr, fallback = null) {
    try {
      return jsonStr ? JSON.parse(jsonStr) : fallback;
    } catch (e) {
      return fallback;
    }
  }
};
