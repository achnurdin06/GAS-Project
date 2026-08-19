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
