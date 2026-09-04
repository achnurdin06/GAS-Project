/**
 * Client Repository Class for AppScript Enterprise Framework (AEF)
 * Manages operations on mst_client sheet
 */
class ClientRepository extends BaseRepository {
  constructor() {
    super('mst_client');
  }

  /**
   * Override getSheet with self-healing creation if sheet does not exist yet
   */
  getSheet() {
    const ss = this.getSpreadsheet();
    let sheet = ss.getSheetByName(this.tableName);
    if (!sheet || sheet.getLastRow() === 0) {
      sheet = this.initClientSheet(ss);
    }
    return sheet;
  }

  /**
   * Initializes the mst_client sheet with default headers
   */
  initClientSheet(ss) {
    let sheet = ss.getSheetByName(this.tableName);
    if (!sheet) {
      sheet = ss.insertSheet(this.tableName);
    }

    if (sheet.getLastRow() > 0) {
      return sheet;
    }

    const headers = [
      'id', 'client_code', 'client_name', 'contact_person', 'phone', 
      'email', 'address', 'status', 'description', 
      'created_at', 'created_by', 'updated_at', 'updated_by'
    ];

    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f4f6');

    return sheet;
  }

  /**
   * Finds client by client code
   */
  findByCode(code) {
    if (!code) return null;
    const cleanCode = String(code).trim().toUpperCase();
    const results = this.find(row => String(row.client_code).trim().toUpperCase() === cleanCode && String(row.status).trim().toUpperCase() !== 'DELETED');
    return results.length > 0 ? results[0] : null;
  }
}
