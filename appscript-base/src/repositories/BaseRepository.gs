/**
 * Base Repository Class for AppScript Enterprise Framework (AEF)
 * Implements Memory-First Batch I/O for Google Spreadsheets
 */
let _globalSpreadsheetCache = null;

class BaseRepository {
  /**
   * @param {string} tableName - Sheet name (e.g. mst_user, sys_configuration)
   * @param {boolean} useCache - Whether to use CacheService for this table (default true)
   */
  constructor(tableName, useCache = true) {
    this.tableName = tableName;
    this.useCache = useCache;
  }

  /**
   * Clears the CacheService cache for this table
   */
  clearCache() {
    if (this.useCache) {
      CacheService.getScriptCache().remove('CACHE_TABLE_' + this.tableName);
    }
  }

  /**
   * Gets Spreadsheet reference with standalone fallback
   */
  getSpreadsheet() {
    if (_globalSpreadsheetCache) {
      return _globalSpreadsheetCache;
    }

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
    
    _globalSpreadsheetCache = ss;
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
   * Uses CacheService to optimize retrieval
   * @returns {Array<Object>}
   */
  readAll() {
    const cacheKey = 'CACHE_TABLE_' + this.tableName;
    const cache = CacheService.getScriptCache();

    if (this.useCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch (e) {
          // If parse fails, proceed to read from sheet
        }
      }
    }

    const ss = this.getSpreadsheet();
    let values = null;

    // Fast-path: Use Advanced Sheets API if enabled
    try {
      if (typeof Sheets !== 'undefined') {
        const response = Sheets.Spreadsheets.Values.get(ss.getId(), this.tableName, {
          valueRenderOption: 'UNFORMATTED_VALUE'
        });
        if (response && response.values) {
          values = response.values;
        }
      }
    } catch (e) {
      // Fallback if Sheets API is disabled or fails
      values = null;
    }

    // Slow-path fallback: Use SpreadsheetApp
    if (!values || values.length === 0) {
      const sheet = this.getSheet();
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < 2 || lastCol < 1) return [];
      values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    }

    if (!values || values.length < 2) return [];

    const headers = values[0].map(h => String(h).trim());
    const dataRows = values.slice(1);

    const result = dataRows.map((row, rowIdx) => {
      const item = { _rowIndex: rowIdx + 2 };
      headers.forEach((h, colIdx) => {
        item[h] = row[colIdx] !== undefined ? row[colIdx] : '';
      });
      return item;
    });

    if (this.useCache) {
      try {
        const jsonResult = JSON.stringify(result);
        // Cache limit is 100KB per key. Only cache if length is under ~90000 chars.
        if (jsonResult.length < 90000) {
          cache.put(cacheKey, jsonResult, 300); // cache for 5 minutes
        }
      } catch (e) {
        // Silently ignore cache write errors (e.g. size exceeded)
      }
    }

    return result;
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
    this.clearCache();
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
    this.clearCache();
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
