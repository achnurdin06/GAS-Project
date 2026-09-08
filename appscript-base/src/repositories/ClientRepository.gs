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

    const sampleClients = [
      {
        id: 'CLI-001',
        client_code: 'CLI-2025-001',
        client_name: 'PT Nusantara Jaya Mandiri',
        contact_person: 'Ahmad Suyanto',
        phone: '021-5551234',
        email: 'contact@nusantarajaya.co.id',
        address: 'Jl. Sudirman Kav 21, Jakarta Selatan',
        status: 'ACTIVE',
        description: 'Perusahaan manufaktur komponen otomotif',
        created_at: Utils.formatIsoDate(),
        created_by: 'SYSTEM',
        updated_at: Utils.formatIsoDate(),
        updated_by: 'SYSTEM'
      },
      {
        id: 'CLI-002',
        client_code: 'CLI-2025-002',
        client_name: 'Bank Utama Indonesia',
        contact_person: 'Hendra Setiawan',
        phone: '021-3334455',
        email: 'procurement@bankutama.co.id',
        address: 'Gedung Menara Banking Lt. 12, Jakarta Pusat',
        status: 'ACTIVE',
        description: 'Lembaga keuangan perbankan nasional',
        created_at: Utils.formatIsoDate(),
        created_by: 'SYSTEM',
        updated_at: Utils.formatIsoDate(),
        updated_by: 'SYSTEM'
      },
      {
        id: 'CLI-003',
        client_code: 'CLI-2025-003',
        client_name: 'Cyber Shield Media',
        contact_person: 'Diana Putri',
        phone: '0812-99887766',
        email: 'info@cybershield.id',
        address: 'Kawasan Cyber 2 Tower, Kuningan, Jakarta',
        status: 'ACTIVE',
        description: 'Penyedia infrastruktur jaringan & keamanan data',
        created_at: Utils.formatIsoDate(),
        created_by: 'SYSTEM',
        updated_at: Utils.formatIsoDate(),
        updated_by: 'SYSTEM'
      },
      {
        id: 'CLI-004',
        client_code: 'CLI-2025-004',
        client_name: 'Logistik Nusantara Express',
        contact_person: 'Bambang Supriyanto',
        phone: '031-7766554',
        email: 'ops@logistiknusantara.com',
        address: 'Jl. Raya Rungkut Industri No. 45, Surabaya',
        status: 'ACTIVE',
        description: 'Layanan rantai pasok dan rantai pergudangan',
        created_at: Utils.formatIsoDate(),
        created_by: 'SYSTEM',
        updated_at: Utils.formatIsoDate(),
        updated_by: 'SYSTEM'
      }
    ];

    const rows = sampleClients.map(item => headers.map(h => item[h] !== undefined ? item[h] : ''));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

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
