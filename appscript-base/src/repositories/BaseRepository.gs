/**
 * AppScript Enterprise Framework (AEF)
 * Base Repository Layer (PRD Section 4.4 & 24)
 * 
 * Exclusive for Spreadsheet I/O with memory-first batching optimization.
 */

class BaseRepository {
  /**
   * @param {string} sheetName - Name of the target sheet (e.g. mst_user, sys_configuration)
   */
  constructor(sheetName) {
    this.sheetName = sheetName;
  }

  /**
   * Gets Spreadsheet reference. Defaults to ActiveSpreadsheet or Script Property SPREADSHEET_ID.
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
   */
  getSpreadsheet() {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (spreadsheetId) {
      return SpreadsheetApp.openById(spreadsheetId);
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  /**
   * Gets sheet object by name.
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  getSheet() {
    const ss = this.getSpreadsheet();
    let sheet = ss.getSheetByName(this.sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(this.sheetName);
    }
    return sheet;
  }

  /**
   * Reads all data from sheet into array of objects (Batch Read ONCE into memory).
   * @returns {{ headers: string[], rows: Object[], rawValues: Array[] }}
   */
  readAll() {
    const sheet = this.getSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (!values || values.length === 0 || (values.length === 1 && values[0][0] === '')) {
      return { headers: [], rows: [], rawValues: [] };
    }

    const headers = values[0].map(h => String(h).trim().toLowerCase());
    const rows = [];

    for (let r = 1; r < values.length; r++) {
      const rowVal = values[r];
      const rowObj = {};
      let isEmpty = true;

      for (let c = 0; c < headers.length; c++) {
        const val = rowVal[c] !== undefined ? rowVal[c] : '';
        rowObj[headers[c]] = val;
        if (val !== '') isEmpty = false;
      }

      if (!isEmpty) {
        rowObj._rowIndex = r + 1; // 1-indexed sheet row
        rows.push(rowObj);
      }
    }

    return { headers, rows, rawValues: values };
  }

  /**
   * Finds rows matching a predicate or filter object.
   * @param {Object|Function} filter
   * @returns {Object[]} Matching row objects
   */
  find(filter) {
    const { rows } = this.readAll();
    if (typeof filter === 'function') {
      return rows.filter(filter);
    }
    if (typeof filter === 'object' && filter !== null) {
      const keys = Object.keys(filter);
      return rows.filter(row => {
        return keys.every(key => String(row[key]) === String(filter[key]));
      });
    }
    return rows;
  }

  /**
   * Finds a single row by ID.
   * @param {string} id 
   * @returns {Object|null}
   */
  findById(id) {
    const matches = this.find({ id: id });
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Inserts a record. Appends to sheet in batch.
   * @param {Object} data 
   * @param {string} [actorId='SYSTEM']
   * @returns {Object} Inserted record with generated metadata
   */
  insert(data, actorId = 'SYSTEM') {
    const sheet = this.getSheet();
    const { headers } = this.readAll();

    // Standard column injection if not present
    const record = Object.assign({}, data);
    if (!record.id) record.id = Utils.generateUuid();
    if (!record.created_at) record.created_at = Utils.formatIsoDate();
    if (!record.created_by) record.created_by = actorId;
    if (!record.updated_at) record.updated_at = record.created_at;
    if (!record.updated_by) record.updated_by = actorId;
    if (record.status === undefined) record.status = 'ACTIVE';

    if (headers.length === 0) {
      // Initialize headers if sheet is brand new
      const defaultHeaders = Object.keys(record).filter(k => !k.startsWith('_'));
      sheet.appendRow(defaultHeaders);
      const rowValues = defaultHeaders.map(h => record[h] !== undefined ? record[h] : '');
      sheet.appendRow(rowValues);
    } else {
      const rowValues = headers.map(h => record[h] !== undefined ? record[h] : '');
      sheet.appendRow(rowValues);
    }

    return record;
  }

  /**
   * Updates a record by ID using memory batch write.
   * @param {string} id 
   * @param {Object} updateData 
   * @param {string} [actorId='SYSTEM']
   * @returns {Object|null} Updated record
   */
  updateById(id, updateData, actorId = 'SYSTEM') {
    const sheet = this.getSheet();
    const { headers, rawValues } = this.readAll();

    if (headers.length === 0 || rawValues.length <= 1) return null;

    const idColIndex = headers.indexOf('id');
    if (idColIndex === -1) return null;

    let targetRowIndex = -1;
    for (let r = 1; r < rawValues.length; r++) {
      if (String(rawValues[r][idColIndex]) === String(id)) {
        targetRowIndex = r;
        break;
      }
    }

    if (targetRowIndex === -1) return null;

    // Apply updates in rawValues memory array
    const updatedRecord = {};
    headers.forEach((h, colIdx) => {
      updatedRecord[h] = rawValues[targetRowIndex][colIdx];
    });

    Object.assign(updatedRecord, updateData);
    updatedRecord.updated_at = Utils.formatIsoDate();
    updatedRecord.updated_by = actorId;

    const newRowValues = headers.map(h => updatedRecord[h] !== undefined ? updatedRecord[h] : '');
    
    // Batch write updated row
    sheet.getRange(targetRowIndex + 1, 1, 1, headers.length).setValues([newRowValues]);

    return updatedRecord;
  }

  /**
   * Soft deletes a record by updating status to 'INACTIVE' or 'DELETED'.
   * @param {string} id 
   * @param {string} [actorId='SYSTEM']
   * @returns {boolean}
   */
  deleteById(id, actorId = 'SYSTEM') {
    const updated = this.updateById(id, { status: 'INACTIVE' }, actorId);
    return updated !== null;
  }
}
