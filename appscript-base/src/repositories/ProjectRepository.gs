/**
 * Project Repository Class for AppScript Enterprise Framework (AEF)
 * Manages operations on mst_project sheet
 */
class ProjectRepository extends BaseRepository {
  constructor() {
    super('mst_project');
  }

  /**
   * Override getSheet with self-healing creation if sheet does not exist yet
   */
  getSheet() {
    const ss = this.getSpreadsheet();
    let sheet = ss.getSheetByName(this.tableName);
    if (!sheet || sheet.getLastRow() === 0) {
      sheet = this.initProjectSheet(ss);
    }
    return sheet;
  }

  /**
   * Initializes the mst_project sheet with default headers and seed data
   */
  initProjectSheet(ss) {
    let sheet = ss.getSheetByName(this.tableName);
    if (!sheet) {
      sheet = ss.insertSheet(this.tableName);
    }

    if (sheet.getLastRow() > 0) {
      return sheet;
    }

    const headers = [
      'id', 'project_code', 'project_name', 'client_name', 'project_manager',
      'start_date', 'end_date', 'budget', 'priority', 'status',
      'progress', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by'
    ];

    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f4f6');

    const sampleProjects = [
      {
        id: Utils.generateUuid(),
        project_code: 'PRJ-2025-001',
        project_name: 'Implementasi Core ERP Enterprise',
        client_name: 'PT Nusantara Jaya Mandiri',
        project_manager: 'Budi Santoso, PMP',
        start_date: '2025-01-15',
        end_date: '2025-08-30',
        budget: 450000000,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        progress: 65,
        description: 'Modernisasi sistem ERP berbasis cloud terintegrasi untuk seluruh divisi operasional dan finansial.',
        created_at: Utils.formatIsoDate(),
        created_by: 'SYSTEM',
        updated_at: Utils.formatIsoDate(),
        updated_by: 'SYSTEM'
      },
      {
        id: Utils.generateUuid(),
        project_code: 'PRJ-2025-002',
        project_name: 'Pengembangan Portal Mobile Client',
        client_name: 'Bank Sinar Harapan',
        project_manager: 'Siti Aminah, CSM',
        start_date: '2025-02-01',
        end_date: '2025-06-15',
        budget: 275000000,
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        progress: 80,
        description: 'Pembuatan aplikasi mobile hybrid untuk layanan nasabah perbankan dengan otentikasi biometrik.',
        created_at: Utils.formatIsoDate(),
        created_by: 'SYSTEM',
        updated_at: Utils.formatIsoDate(),
        updated_by: 'SYSTEM'
      },
      {
        id: Utils.generateUuid(),
        project_code: 'PRJ-2025-003',
        project_name: 'Infrastruktur Data Center & Cyber Security',
        client_name: 'Dinas Komunikasi & Informatika',
        project_manager: 'Rian Prasetyo, CISSP',
        start_date: '2024-10-10',
        end_date: '2025-02-28',
        budget: 620000000,
        priority: 'HIGH',
        status: 'COMPLETED',
        progress: 100,
        description: 'Audit keamanan siber ISO 27001 dan penguatan perimeter pertahanan firewall data center terpadu.',
        created_at: Utils.formatIsoDate(),
        created_by: 'SYSTEM',
        updated_at: Utils.formatIsoDate(),
        updated_by: 'SYSTEM'
      },
      {
        id: Utils.generateUuid(),
        project_code: 'PRJ-2025-004',
        project_name: 'Sistem Manajemen Pergudangan Otomatis',
        client_name: 'Logistik Prima Sejahtera',
        project_manager: 'Dewi Lestari, ST',
        start_date: '2025-04-01',
        end_date: '2025-11-30',
        budget: 350000000,
        priority: 'MEDIUM',
        status: 'PLANNING',
        progress: 15,
        description: 'Implementasi barcode scanner RFID dan IoT conveyor monitoring pada 3 gudang logistik utama.',
        created_at: Utils.formatIsoDate(),
        created_by: 'SYSTEM',
        updated_at: Utils.formatIsoDate(),
        updated_by: 'SYSTEM'
      }
    ];

    const rows = sampleProjects.map(item => headers.map(h => item[h] !== undefined ? item[h] : ''));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

    return sheet;
  }

  /**
   * Finds project by project code
   */
  findByCode(code) {
    if (!code) return null;
    const cleanCode = String(code).trim().toUpperCase();
    const results = this.find(row => String(row.project_code).trim().toUpperCase() === cleanCode && String(row.status).trim().toUpperCase() !== 'DELETED');
    return results.length > 0 ? results[0] : null;
  }
}
