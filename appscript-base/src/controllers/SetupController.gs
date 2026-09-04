/**
 * Setup Controller for google.script.run Client Handlers during installation
 */
function apiCheckSetupStatus() {
  try {
    return Response.success('Status konfigurasi berhasil diperiksa', checkSetupState(), 'SETUP_STATUS_SUCCESS');
  } catch (err) {
    LoggerUtil.error('SetupController', 'apiCheckSetupStatus failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiAutoCreateDb() {
  try {
    const result = autoCreateDatabaseFolderAndSheet();
    const cleanResult = {
      spreadsheet_id: result.spreadsheet_id,
      spreadsheetId: result.spreadsheet_id,
      spreadsheet_url: result.spreadsheet_url,
      url: result.spreadsheet_url,
      folder_name: result.folder_name,
      name: 'AEF Enterprise Database File'
    };
    return {
      success: true,
      message: 'Database Google Drive berhasil dibuat secara otomatis',
      code: 'SETUP_DB_CREATE_SUCCESS',
      data: cleanResult
    };
  } catch (err) {
    if (typeof LoggerUtil !== 'undefined') {
      LoggerUtil.error('SetupController', 'apiAutoCreateDb failed', err);
    }
    return {
      success: false,
      message: err.message || String(err),
      code: 'SYSTEM_ERROR'
    };
  }
}

function apiInspectDatabase(spreadsheetId) {
  try {
    if (!spreadsheetId) {
      return Response.error('Spreadsheet ID wajib diisi', 'VALIDATION_ERROR');
    }
    let cleanId = String(spreadsheetId).trim().replace(/^["']|["']$/g, '');
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    const inspection = inspectSpreadsheetDatabase(cleanId);
    if (!inspection.success) {
      return Response.error(inspection.message || 'Spreadsheet tidak dapat diakses', 'ACCESS_ERROR', inspection);
    }
    return Response.success('Inspeksi spreadsheet berhasil', inspection, 'INSPECT_SUCCESS');
  } catch (err) {
    if (typeof LoggerUtil !== 'undefined') {
      LoggerUtil.error('SetupController', 'apiInspectDatabase failed', err);
    }
    return Response.error(err.message || String(err), 'SYSTEM_ERROR');
  }
}

function apiVerifySpreadsheetId(spreadsheetId) {
  try {
    if (!spreadsheetId) {
      return {
        success: false,
        message: 'Spreadsheet ID wajib diisi',
        code: 'VALIDATION_ERROR'
      };
    }
    let cleanId = String(spreadsheetId).trim().replace(/^["']|["']$/g, '');
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    const ss = SpreadsheetApp.openById(cleanId);
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', cleanId);

    // Auto-heal/sync configurations, projects, and menus if partial database detected
    try {
      if (ss.getSheetByName('mst_user') || ss.getSheetByName('mst_menu')) {
        syncConfigurations(ss);
        syncMasterProject(ss);
        if (typeof MenuService !== 'undefined') {
          new MenuService().syncMenuCatalog(ss);
        }
      }
    } catch (e) {
      if (typeof LoggerUtil !== 'undefined') {
        LoggerUtil.error('SetupController', 'self-healing sync during verify failed', e);
      }
    }

    const inspection = inspectSpreadsheetDatabase(ss);

    return {
      success: true,
      message: 'Spreadsheet berhasil diverifikasi dan terhubung',
      code: 'SPREADSHEET_VERIFIED',
      data: {
        spreadsheet_id: cleanId,
        spreadsheetId: cleanId,
        name: ss.getName(),
        url: ss.getUrl(),
        inspection: inspection
      }
    };
  } catch (err) {
    if (typeof LoggerUtil !== 'undefined') {
      LoggerUtil.error('SetupController', 'apiVerifySpreadsheetId failed', err);
    }
    return {
      success: false,
      message: 'Gagal mengakses spreadsheet: ' + (err.message || String(err)),
      code: 'ACCESS_ERROR'
    };
  }
}

function apiExecuteSetup(payload) {
  try {
    if (!payload || !payload.spreadsheet_id) {
      return Response.error('Parameter spreadsheet_id wajib diisi', 'VALIDATION_ERROR');
    }
    const mode = payload.mode || 'FRESH_INSTALL';
    const adminData = payload.admin || {};

    if (mode === 'FRESH_INSTALL' && (!adminData.name || !adminData.username || !adminData.password)) {
      return Response.error('Data akun administrator wajib diisi untuk instalasi baru', 'VALIDATION_ERROR');
    }

    const result = initializeDatabaseSchema(payload.spreadsheet_id, adminData, mode);
    return Response.success('Sistem berhasil dikonfigurasi dan diinisialisasi', result, 'SETUP_EXECUTE_SUCCESS');
  } catch (err) {
    if (typeof LoggerUtil !== 'undefined') {
      LoggerUtil.error('SetupController', 'apiExecuteSetup failed', err);
    }
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiSyncMenuCatalog() {
  try {
    const service = new MenuService();
    const result = service.syncMenuCatalog();
    return Response.success('Katalog menu berhasil disinkronkan ke database', result, 'MENU_CATALOG_SYNC_SUCCESS');
  } catch (err) {
    if (typeof LoggerUtil !== 'undefined') {
      LoggerUtil.error('SetupController', 'apiSyncMenuCatalog failed', err);
    }
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}
