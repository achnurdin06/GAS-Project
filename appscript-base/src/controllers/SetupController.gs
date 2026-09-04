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
    // Extract ID if full Google Sheet URL is provided
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    const ss = SpreadsheetApp.openById(cleanId);
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', cleanId);

    // Auto-heal/sync mst_project if the spreadsheet is already initialized
    try {
      if (ss.getSheetByName('mst_user') || ss.getSheetByName('mst_menu')) {
        syncMasterProject(ss);
      }
    } catch (e) {
      if (typeof LoggerUtil !== 'undefined') {
        LoggerUtil.error('SetupController', 'syncMasterProject during verify failed', e);
      }
    }

    return {
      success: true,
      message: 'Spreadsheet berhasil diverifikasi dan terhubung',
      code: 'SPREADSHEET_VERIFIED',
      data: {
        spreadsheet_id: cleanId,
        spreadsheetId: cleanId,
        name: ss.getName(),
        url: ss.getUrl()
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
    if (!payload || !payload.spreadsheet_id || !payload.admin) {
      return Response.error('Parameter spreadsheet_id dan data admin wajib diisi', 'VALIDATION_ERROR');
    }
    const result = initializeDatabaseSchema(payload.spreadsheet_id, payload.admin);
    return Response.success('Sistem berhasil dikonfigurasi dan diinisialisasi', result, 'SETUP_EXECUTE_SUCCESS');
  } catch (err) {
    LoggerUtil.error('SetupController', 'apiExecuteSetup failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}
