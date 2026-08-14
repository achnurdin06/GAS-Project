/**
 * Base Repository Class for AppScript Enterprise Framework (AEF)
 * Implements Memory-First Batch I/O for Google Spreadsheets
 */
class BaseRepository {
  /**
   * @param {string} tableName - Sheet name (e.g. mst_user, sys_configuration)
   */
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Gets Spreadsheet reference with standalone fallback
   */
  getSpreadsheet() {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      const props = PropertiesService.getScriptProperties();
      const spreadsheetId = props.getProperty('SPREADSHEET_ID');
      if (spreadsheetId) {
        try {
          ss = SpreadsheetApp.openById(spreadsheetId);
        } catch (e) {
          ss = null;
        }
      }
    }
    if (!ss) {
      throw new Error(`Spreadsheet database not initialized for table: ${this.tableName}. Please run setupDatabase() first.`);
    }
    return ss;
  }

  /**
   * Gets Sheet reference
   */
  getSheet() {
    const ss = this.getSpreadsheet();
    const sheet = ss.getSheetByName(this.tableName);
    if (!sheet) {
      throw new Error(`Sheet '${this.tableName}' does not exist in spreadsheet.`);
    }
    return sheet;
  }

  /**
   * Memory-First Batch Reading: Gets all rows as Object array
   * @returns {Array<Object>}
   */
  readAll() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return [];

    const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = values[0].map(h => String(h).trim());
    const dataRows = values.slice(1);

    return dataRows.map((row, rowIdx) => {
      const item = { _rowIndex: rowIdx + 2 };
      headers.forEach((h, colIdx) => {
        item[h] = row[colIdx] !== undefined ? row[colIdx] : '';
      });
      return item;
    });
  }

  /**
   * Finds records matching predicate object or function
   * @param {Object|Function} predicate
   * @returns {Array<Object>}
   */
  find(predicate) {
    const all = this.readAll();
    if (!predicate) return all;

    if (typeof predicate === 'function') {
      return all.filter(predicate);
    }

    return all.filter(item => {
      return Object.keys(predicate).every(key => String(item[key]).trim() === String(predicate[key]).trim());
    });
  }

  /**
   * Finds single record by ID
   * @param {string} id 
   * @returns {Object|null}
   */
  findById(id) {
    const results = this.find({ id: id });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Inserts record into sheet
   * @param {Object} record 
   * @param {string} actorId 
   * @returns {Object} Inserted record
   */
  insert(record, actorId = 'SYSTEM') {
    const sheet = this.getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());

    const nowIso = Utils.formatIsoDate();
    record.id = record.id || Utils.generateUuid();
    record.created_at = record.created_at || nowIso;
    record.created_by = record.created_by || actorId;
    record.updated_at = record.updated_at || nowIso;
    record.updated_by = record.updated_by || actorId;
    record.status = record.status || 'ACTIVE';

    const rowData = headers.map(h => record[h] !== undefined ? record[h] : '');
    sheet.appendRow(rowData);
    return record;
  }

  /**
   * Updates record by ID
   * @param {string} id 
   * @param {Object} updateData 
   * @param {string} actorId 
   * @returns {boolean}
   */
  updateById(id, updateData, actorId = 'SYSTEM') {
    const item = this.findById(id);
    if (!item) return false;

    const sheet = this.getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());

    updateData.updated_at = Utils.formatIsoDate();
    updateData.updated_by = actorId;

    const merged = Object.assign({}, item, updateData);
    const rowValues = headers.map(h => merged[h] !== undefined ? merged[h] : '');

    sheet.getRange(item._rowIndex, 1, 1, headers.length).setValues([rowValues]);
    return true;
  }

  /**
   * Soft deletes record by setting status = INACTIVE
   * @param {string} id 
   * @param {string} actorId 
   * @returns {boolean}
   */
  deleteById(id, actorId = 'SYSTEM') {
    return this.updateById(id, { status: 'INACTIVE' }, actorId);
  }
}
