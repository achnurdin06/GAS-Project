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
    return Response.success('Database Google Drive berhasil dibuat secara otomatis', result, 'SETUP_DB_CREATE_SUCCESS');
  } catch (err) {
    LoggerUtil.error('SetupController', 'apiAutoCreateDb failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiVerifySpreadsheetId(spreadsheetId) {
  try {
    if (!spreadsheetId) {
      return Response.error('Spreadsheet ID wajib diisi', 'VALIDATION_ERROR');
    }
    let cleanId = String(spreadsheetId).trim();
    // Extract ID if full Google Sheet URL is provided
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      cleanId = match[1];
    }

    const ss = SpreadsheetApp.openById(cleanId);
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', cleanId);
    return Response.success('Spreadsheet berhasil diverifikasi dan terhubung', {
      spreadsheet_id: cleanId,
      name: ss.getName(),
      url: ss.getUrl()
    }, 'SPREADSHEET_VERIFIED');
  } catch (err) {
    LoggerUtil.error('SetupController', 'apiVerifySpreadsheetId failed', err);
    return Response.error('Gagal mengakses spreadsheet: ' + err.message, 'ACCESS_ERROR');
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
