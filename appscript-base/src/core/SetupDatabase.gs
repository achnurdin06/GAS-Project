/**
 * Database Setup & Seed Data Script for AEF Framework
 */
function setupDatabase() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    const props = PropertiesService.getScriptProperties();
    let existingId = props.getProperty('SPREADSHEET_ID');

    if (existingId) {
      try {
        ss = SpreadsheetApp.openById(existingId);
      } catch (e) {
        ss = null;
      }
    }

    if (!ss) {
      ss = SpreadsheetApp.create('AEF Enterprise Database');
      props.setProperty('SPREADSHEET_ID', ss.getId());
    }
  }

  const defaultAdmin = {
    name: 'Super Administrator',
    email: 'superadmin@aef.com',
    username: 'superadmin',
    password: 'admin123',
    appName: 'AppScript Enterprise Framework'
  };

  return initializeDatabaseSchema(ss.getId(), defaultAdmin);
}

/**
 * Verifies the installation state of the application
 */
function checkSetupState() {
  const result = {
    google_logged_in: false,
    google_email: '',
    spreadsheet_linked: false,
    spreadsheet_id: '',
    spreadsheet_url: '',
    database_initialized: false,
    missing_sheets: []
  };

  // 1. Google account check
  try {
    const email = Session.getActiveUser().getEmail();
    if (email) {
      result.google_logged_in = true;
      result.google_email = email;
    }
  } catch (e) {
    // If permission not granted
  }

  // 2. Spreadsheet connection check
  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}

  if (!ss) {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (spreadsheetId) {
      result.spreadsheet_id = spreadsheetId;
      try {
        ss = SpreadsheetApp.openById(spreadsheetId);
        result.spreadsheet_linked = true;
        result.spreadsheet_url = ss.getUrl();
      } catch (e) {
        result.spreadsheet_linked = false;
      }
    }
  } else {
    result.spreadsheet_linked = true;
    result.spreadsheet_id = ss.getId();
    result.spreadsheet_url = ss.getUrl();
  }

  // 3. Table/Sheet existence check
  if (ss) {
    const requiredSheets = ['mst_user', 'mst_role', 'mst_permission', 'mst_menu', 'sys_configuration', 'log_audit'];
    requiredSheets.forEach(name => {
      try {
        if (!ss.getSheetByName(name)) {
          result.missing_sheets.push(name);
        }
      } catch (err) {
        result.missing_sheets.push(name);
      }
    });
    if (result.missing_sheets.length === 0) {
      result.database_initialized = true;
      try {
        syncConfigurations(ss);
      } catch (e) {
        LoggerUtil.error('SetupDatabase', 'syncConfigurations failed', e);
      }
    }
  }

  return result;
}

/**
 * Syncs the sys_configuration sheet with ScriptProperties and default values
 */
function syncConfigurations(ss) {
  if (!ss) return;
  const sheet = ss.getSheetByName('sys_configuration');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf('config_key');
  const valIndex = headers.indexOf('config_value');

  if (keyIndex === -1 || valIndex === -1) return;

  const props = PropertiesService.getScriptProperties();
  const propMap = props.getProperties();

  const currentKeys = {};
  for (let i = 1; i < data.length; i++) {
    const key = data[i][keyIndex];
    const val = data[i][valIndex];
    if (key) {
      currentKeys[key] = { row: i + 1, value: val };
    }
  }

  const requiredKeys = {
    'APP_NAME': { default: 'AppScript Enterprise Framework', desc: 'Application Name' },
    'APP_CODE': { default: 'AEF', desc: 'Application Prefix Code' },
    'APP_LOGO': { default: '', desc: 'Application Brand Logo URL or Base64' },
    'APP_VERSION': { default: '1.0.0', desc: 'Application Version' },
    'SESSION_TIMEOUT': { default: '10', desc: 'Session Timeout in Minutes (inactivity auto-logout)' },
    'SPREADSHEET_ID': { default: ss.getId(), desc: 'Google Spreadsheet ID Connection' }
  };

  Object.keys(requiredKeys).forEach(key => {
    const propVal = propMap[key] || requiredKeys[key].default;
    if (!currentKeys[key]) {
      const newRow = headers.map(h => {
        if (h === 'id') return Utils.generateUuid();
        if (h === 'config_key') return key;
        if (h === 'config_value') return propVal;
        if (h === 'description') return requiredKeys[key].desc;
        if (h === 'created_at') return Utils.formatIsoDate();
        if (h === 'created_by') return 'SYSTEM';
        if (h === 'status') return 'ACTIVE';
        return '';
      });
      sheet.appendRow(newRow);
      currentKeys[key] = { row: sheet.getLastRow(), value: propVal };
    } else {
      if (!props.getProperty(key)) {
        props.setProperty(key, String(currentKeys[key].value));
      }
    }
  });
}

/**
 * Automates GDrive folder and Spreadsheet creation
 */
function autoCreateDatabaseFolderAndSheet() {
  const email = Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error("Anda harus login dengan Akun Google terlebih dahulu.");
  }

  const folderName = "AEF App Database";
  let folder;
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }

  const ssName = "AEF Enterprise Database File";
  let ssFile = null;
  const files = folder.getFilesByName(ssName);
  if (files.hasNext()) {
    const file = files.next();
    ssFile = SpreadsheetApp.openById(file.getId());
  } else {
    const newSS = SpreadsheetApp.create(ssName);
    const driveFile = DriveApp.getFileById(newSS.getId());
    folder.addFile(driveFile);
    DriveApp.getRootFolder().removeFile(driveFile);
    ssFile = newSS;
  }

  const ssId = ssFile.getId();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ssId);

  return {
    spreadsheet_id: ssId,
    spreadsheet_url: ssFile.getUrl(),
    folder_name: folderName
  };
}

/**
 * Initializes schema and seeds customized configuration values
 */
function initializeDatabaseSchema(spreadsheetId, adminPayload) {
  let ss = null;
  if (spreadsheetId) {
    ss = SpreadsheetApp.openById(spreadsheetId);
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheetId);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!ss) {
    throw new Error('Spreadsheet not found or access denied.');
  }

  function initSheet(sheetName, headers, seedData = [], forceRecreate = false) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    } else if (forceRecreate) {
      sheet.clearContents();
    } else if (sheet.getLastRow() > 0) {
      return sheet;
    }

    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f4f6');

    if (seedData && seedData.length > 0) {
      const rows = seedData.map(item => headers.map(h => item[h] !== undefined ? item[h] : ''));
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }

    return sheet;
  }

  // 1. mst_user Sheet
  const userHeaders = ['id', 'name', 'email', 'phone', 'username', 'force_password_change', 'password_hash', 'role_id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status', 'expired_at', 'profile_pic_url', 'two_fa_enabled', 'two_fa_secret'];
  const userSeed = [
    {
      id: Utils.generateUuid(),
      name: adminPayload.name || 'Super Administrator',
      email: adminPayload.email || 'superadmin@aef.com',
      phone: adminPayload.phone || '+62 812-3456-7890',
      username: adminPayload.username || 'superadmin',
      force_password_change: 'FALSE',
      password_hash: Utils.hashSha256(adminPayload.password || 'admin123'),
      role_id: 'ROLE_SUPER_ADMIN',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      updated_at: Utils.formatIsoDate(),
      updated_by: 'SYSTEM',
      status: 'ACTIVE',
      expired_at: '2029-12-31',
      profile_pic_url: '',
      two_fa_enabled: 'FALSE',
      two_fa_secret: ''
    },
    {
      id: Utils.generateUuid(),
      name: 'System Administrator',
      email: 'admin@aef.com',
      phone: '+62 812-3456-7891',
      username: 'sysadmin',
      force_password_change: 'FALSE',
      password_hash: Utils.hashSha256('admin123'),
      role_id: 'ROLE_ADMIN',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      updated_at: Utils.formatIsoDate(),
      updated_by: 'SYSTEM',
      status: 'ACTIVE',
      expired_at: '2029-12-31',
      profile_pic_url: '',
      two_fa_enabled: 'FALSE',
      two_fa_secret: ''
    },
    {
      id: Utils.generateUuid(),
      name: 'Standard User',
      email: 'user@aef.com',
      phone: '+62 812-3456-7892',
      username: 'stduser',
      force_password_change: 'FALSE',
      password_hash: Utils.hashSha256('user123'),
      role_id: 'ROLE_USER',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      updated_at: Utils.formatIsoDate(),
      updated_by: 'SYSTEM',
      status: 'ACTIVE',
      expired_at: '2029-12-31',
      profile_pic_url: '',
      two_fa_enabled: 'FALSE',
      two_fa_secret: ''
    }
  ];
  initSheet('mst_user', userHeaders, userSeed, false);

  // 2. mst_role Sheet
  const roleHeaders = ['id', 'role_code', 'role_name', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const roleSeed = [
    { id: Utils.generateUuid(), role_code: 'ROLE_SUPER_ADMIN', role_name: 'Super Administrator', description: 'Master role with full menu & system permissions', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', updated_at: Utils.formatIsoDate(), updated_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_code: 'ROLE_ADMIN', role_name: 'System Administrator', description: 'Full access administrator role', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', updated_at: Utils.formatIsoDate(), updated_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_code: 'ROLE_USER', role_name: 'Standard User', description: 'Standard end-user role', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', updated_at: Utils.formatIsoDate(), updated_by: 'SYSTEM', status: 'ACTIVE' }
  ];
  initSheet('mst_role', roleHeaders, roleSeed, false);

  // 3. mst_permission Sheet
  const permHeaders = ['id', 'role_id', 'permission_code', 'permission_name', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const permCodes = [
    { code: 'DASHBOARD_VIEW', name: 'View Dashboard' },
    { code: 'USER_VIEW', name: 'View Users' },
    { code: 'USER_CREATE', name: 'Create User' },
    { code: 'USER_UPDATE', name: 'Update User' },
    { code: 'USER_DELETE', name: 'Delete User' },
    { code: 'ROLE_VIEW', name: 'View Roles' },
    { code: 'ROLE_CREATE', name: 'Create Role' },
    { code: 'ROLE_DELETE', name: 'Delete Role' },
    { code: 'PERMISSION_VIEW', name: 'View Permissions' },
    { code: 'PERMISSION_CREATE', name: 'Create Permission' },
    { code: 'PERMISSION_DELETE', name: 'Delete Permission' },
    { code: 'CONFIG_VIEW', name: 'View System Config' },
    { code: 'CONFIG_UPDATE', name: 'Update System Config' },
    { code: 'AUDIT_VIEW', name: 'View Audit Logs' },
    { code: 'MENU_VIEW', name: 'View Menu Management' },
    { code: 'MENU_CREATE', name: 'Create Menu' },
    { code: 'MENU_UPDATE', name: 'Update Menu' },
    { code: 'MENU_DELETE', name: 'Delete Menu' }
  ];

  const permSeed = [];
  ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].forEach(rId => {
    permCodes.forEach(p => {
      permSeed.push({
        id: Utils.generateUuid(),
        role_id: rId,
        permission_code: p.code,
        permission_name: p.name,
        created_at: Utils.formatIsoDate(),
        created_by: 'SYSTEM',
        status: 'ACTIVE'
      });
    });
  });
  permSeed.push({
    id: Utils.generateUuid(),
    role_id: 'ROLE_USER',
    permission_code: 'DASHBOARD_VIEW',
    permission_name: 'View Dashboard',
    created_at: Utils.formatIsoDate(),
    created_by: 'SYSTEM',
    status: 'ACTIVE'
  });
  initSheet('mst_permission', permHeaders, permSeed, false);

  // 4. mst_menu Sheet
  const menuHeaders = ['menu_id', 'parent_id', 'menu_code', 'menu_name', 'slug', 'type', 'route', 'icon', 'sort_order', 'permission_code', 'description', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by'];
  const menuSeed = [
    { menu_id: 'MENU_DASHBOARD_ID', parent_id: '', menu_code: 'MENU_DASHBOARD', menu_name: 'Dashboard', slug: 'dashboard', type: 'Internal Link', route: '/dashboard', icon: 'bi-grid-1x2-fill', sort_order: 1, permission_code: 'DASHBOARD_VIEW', description: 'Ringkasan Statistik & Analitik Utama', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: 'MENU_DASHBOARD_2_ID', parent_id: '', menu_code: 'MENU_DASHBOARD_2', menu_name: 'Dashboard 2', slug: 'dashboard-2', type: 'Internal Link', route: '/dashboard-2', icon: 'bi-grid-fill', sort_order: 2, permission_code: 'DASHBOARD2_VIEW', description: 'Blank Dashboard for testing', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: 'PARENT_ADMIN', parent_id: '', menu_code: 'MODULE_ADMINISTRATION', menu_name: 'Administrasi Sistem', slug: 'administration', type: 'Module', route: '#', icon: 'bi-shield-lock-fill', sort_order: 3, permission_code: 'USER_VIEW', description: 'Modul Kelola Administrasi & Keamanan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_USER_MGMT', menu_name: 'User Management', slug: 'user-management', type: 'Internal Link', route: '/users', icon: 'bi-people-fill', sort_order: 1, permission_code: 'USER_VIEW', description: 'Kelola data dan status akun pengakses sistem', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_ROLE_MGMT', menu_name: 'Role Management', slug: 'role-management', type: 'Internal Link', route: '/roles', icon: 'bi-shield-check', sort_order: 2, permission_code: 'ROLE_VIEW', description: 'Kelola peran dan hirarki grup akses pengguna', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_PERM_MGMT', menu_name: 'Permission Control', slug: 'permission-management', type: 'Internal Link', route: '/permissions', icon: 'bi-key-fill', sort_order: 3, permission_code: 'PERMISSION_VIEW', description: 'Matriks pemetaan hak akses fitur aplikasi', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_MENU_MGMT', menu_name: 'Menu Management', slug: 'menu-management', type: 'Internal Link', route: '/menus', icon: 'bi-menu-button-wide-fill', sort_order: 4, permission_code: 'MENU_VIEW', description: 'Kelola struktur dan navigasi menu aplikasi', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_AUDIT', menu_name: 'Audit Trail', slug: 'audit-trail', type: 'Internal Link', route: '/audit', icon: 'bi-journal-text', sort_order: 5, permission_code: 'AUDIT_VIEW', description: 'Rekam riwayat dan catatan aktivitas pengguna', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: 'PARENT_MASTER', parent_id: '', menu_code: 'MODULE_MASTER_DATA', menu_name: 'Master Data', slug: 'master-data', type: 'Module', route: '#', icon: 'bi-database-fill-gear', sort_order: 4, permission_code: 'USER_VIEW', description: 'Modul Pengelolaan Referensi Master Data', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_CUSTOMERS', menu_name: 'Data Pelanggan', slug: 'customers', type: 'Internal Link', route: '/customers', icon: 'bi-person-vcard-fill', sort_order: 1, permission_code: 'USER_VIEW', description: 'Kelola direktori profil pelanggan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_PRODUCTS', menu_name: 'Data Produk & Layanan', slug: 'products', type: 'Internal Link', route: '/products', icon: 'bi-box-seam-fill', sort_order: 2, permission_code: 'USER_VIEW', description: 'Katalog barang dan tarif layanan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_CATEGORIES', menu_name: 'Kategori Produk', slug: 'categories', type: 'Internal Link', route: '/categories', icon: 'bi-tags-fill', sort_order: 3, permission_code: 'USER_VIEW', description: 'Pengelompokan jenis dan taksonomi produk', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: 'PARENT_REPORTS', parent_id: '', menu_code: 'MODULE_REPORTS', menu_name: 'Laporan & Laporan', slug: 'reports', type: 'Module', route: '#', icon: 'bi-graph-up-arrow', sort_order: 4, permission_code: 'AUDIT_VIEW', description: 'Modul Rekapitulasi Laporan & Kinerja', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_REPORTS', menu_code: 'MENU_SALES_REPORT', menu_name: 'Laporan Penjualan', slug: 'sales-report', type: 'Internal Link', route: '/sales-report', icon: 'bi-bar-chart-line-fill', sort_order: 1, permission_code: 'AUDIT_VIEW', description: 'Rekap omset dan tren transaksi bulanan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_REPORTS', menu_code: 'MENU_LOG_REPORT', menu_name: 'Laporan Aktivitas', slug: 'activity-log', type: 'Internal Link', route: '/activity-log', icon: 'bi-file-earmark-bar-graph-fill', sort_order: 2, permission_code: 'AUDIT_VIEW', description: 'Analisis pemakaian dan lalu lintas sistem', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: 'PARENT_SETTINGS', parent_id: '', menu_code: 'MODULE_SETTINGS', menu_name: 'Pengaturan Sistem', slug: 'settings', type: 'Module', route: '#', icon: 'bi-gear-fill', sort_order: 5, permission_code: 'CONFIG_VIEW', description: 'Modul Pengaturan Konfigurasi Global', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_SETTINGS', menu_code: 'MENU_CONFIG', menu_name: 'General Settings', slug: 'general-settings', type: 'Internal Link', route: '/config', icon: 'bi-sliders', sort_order: 1, permission_code: 'CONFIG_VIEW', description: 'Konfigurasi variabel umum dan sistem', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_SETTINGS', menu_code: 'MENU_SYSTEM_LOGS', menu_name: 'Technical Logs', slug: 'system-logs', type: 'Internal Link', route: '/system-logs', icon: 'bi-file-earmark-code-fill', sort_order: 2, permission_code: 'AUDIT_VIEW', description: 'Catatan error dan log eksekusi backend', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' }
  ];
  initSheet('mst_menu', menuHeaders, menuSeed, false);

  // 5. sys_configuration Sheet
  const configHeaders = ['id', 'config_key', 'config_value', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const configSeed = [
    { id: Utils.generateUuid(), config_key: 'APP_NAME', config_value: adminPayload.appName || 'AppScript Enterprise Framework', description: 'Application Name', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'APP_CODE', config_value: adminPayload.appCode || 'AEF', description: 'Application Prefix Code', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'APP_LOGO', config_value: adminPayload.appLogo || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABlCAMAAADAgy5XAAAC/VBMVEX///8YeKAwkLAgkLAYcJAYcJgQkMAgqNAgoMggkLgYaJAQeKAQgLAIgLgAiMAAkMgIoNgAoNgIoNAQoNAYoMgYkLggcIgQYIgQaJAQeLAAgLgAgMAIqNAYoMAgmLgYYIgIYJAIaJgIcKgAeLgAqNgIqNgYqNAgqMgQUIAAaKAAcKgAcLAAeLAAoNAAqOAAsOAIsNgQqMgQoMAQWIAQYJAAaKgQsNgYoLgYqLggWJAIaKgAuOAIuNgQuNgYsMgYqMAIOGAISHgIWIgAYKAAYKgAiLgAmMgAqNAAuOgAwOgAyOgIyOgYyOAoyNgYSHAIQGgIUIgIWJgAWKAAsNgA0PAQ2PAgyNgowMg4yNAIOGgIQHgASIAAUJgAgLAAkMAAmNAI2PAY2Ogg0OAo0NAwyNAAOGgISIAASIgASJAAWIAIcJgQiLAYmMgImNAIwOgA2PAA4PAA2OgI2OgQ2OAg0NAw0Mgw0NAIQHAISIgAWJgIaKAIWIAQmMAImMAIyPAA0OgA4OgI4OAY0NgoWIgAUJAIYJgIUIAIeKgQgKgImMgI0PgI0PAA6OgQ8PAo4NgIMFgIQIAASJgAQIAAQIgIWJAIkMAY0PAI0OgA0OAA8PAA+PgI+PAo6OA44NhI2NgIMGAIOHAAOHgAQJAAQHgIUJAQgKAQkLAAoMgY0OgQ2OgA2OAA6PAA8PgA+PAY8PAo6Og40NAQMGAAOIAQSIAYgKAQmMgAmNgAmMAg4PgY4PAI4OgI+PgQ8Pgo0NggsLAQKGAAQHAAMFgQiKgQwOAo6PgY6PAQ6PAI8PAI6PAYyNgYqLAQKFgAMHAIQIgAMHgAOHAAIFAQeJgo0Ogw8Pgg8PAQwNgAKHAAMGAIeKAIgLAIiLgAkNAYwNgw6PAg6PggsLgAKGgAMGgIKGAIKFgIkMgAwOAYwNAIIFAQkMgAiMgQ2PgYuNgYoLAAKGAAKFgAIEgQiLgQ0PAYmKgACDAQyPAQmKgQSGgYYIAgeJgomLAomLgIKEgIcJAIuOAYsNitugFyAAAAAXRSTlMAQObYZgAAFPxJREFUeNrtnH18W9V5xw0tLyON7ZAycBy2ENkjRFEMo2ZrDF2MNcd2IDhKUuoXYugI9pbahdEtMazANhOSQXtjC5ZBNxTbo3Qd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', description: 'Application Brand Logo URL or Base64', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'APP_VERSION', config_value: '1.0.0', description: 'Application Version', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'SESSION_TIMEOUT', config_value: '10', description: 'Session Timeout in Minutes (inactivity auto-logout)', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'SPREADSHEET_ID', config_value: spreadsheetId, description: 'Google Spreadsheet ID Connection', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'DEFAULT_DASHBOARD_ROUTE', config_value: '/dashboard', description: 'Rute default setelah login (misal: /dashboard atau /dashboard-2)', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' }
  ];
  initSheet('sys_configuration', configHeaders, configSeed, false);

  // 6. log_audit Sheet
  const auditHeaders = ['event_id', 'timestamp', 'user_id', 'module', 'action', 'reference_id', 'status', 'description', 'old_value', 'new_value', 'id', 'created_at', 'created_by', 'updated_at', 'updated_by'];
  initSheet('log_audit', auditHeaders, []);

  // Update Properties
  PropertiesService.getScriptProperties().setProperties({
    'SPREADSHEET_ID': spreadsheetId,
    'APP_NAME': adminPayload.appName || 'AppScript Enterprise Framework',
    'APP_CODE': adminPayload.appCode || 'AEF',
    'APP_LOGO': adminPayload.appLogo || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABlCAMAAADAgy5XAAAC/VBMVEX///8YeKAwkLAgkLAYcJAYcJgQkMAgqNAgoMggkLgYaJAQeKAQgLAIgLgAiMAAkMgIoNgAoNgIoNAQoNAYoMgYkLggcIgQYIgQaJAQeLAAgLgAgMAIqNAYoMAgmLgYYIgIYJAIaJgIcKgAeLgAqNgIqNgYqNAgqMgQUIAAaKAAcKgAcLAAeLAAoNAAqOAAsOAIsNgQqMgQoMAQWIAQYJAAaKgQsNgYoLgYqLggWJAIaKgAuOAIuNgQuNgYsMgYqMAIOGAISHgIWIgAYKAAYKgAiLgAmMgAqNAAuOgAwOgAyOgIyOgYyOAoyNgYSHAIQGgIUIgIWJgAWKAAsNgA0PAQ2PAgyNgowMg4yNAIOGgIQHgASIAAUJgAgLAAkMAAmNAI2PAY2Ogg0OAo0NAwyNAAOGgISIAASIgASJAAWIAIcJgQiLAYmMgImNAIwOgA2PAA4PAA2OgI2OgQ2OAg0NAw0Mgw0NAIQHAISIgAWJgIaKAIWIAQmMAImMAIyPAA0OgA4OgI4OAY0NgoWIgAUJAIYJgIUIAIeKgQgKgImMgI0PgI0PAA6OgQ8PAo4NgIMFgIQIAASJgAQIAAQIgIWJAIkMAY0PAI0OgA0OAA8PAA+PgI+PAo6OA44NhI2NgIMGAIOHAAOHgAQJAAQHgIUJAQgKAQkLAAoMgY0OgQ2OgA2OAA6PAA8PgA+PAY8PAo6Og40NAQMGAAOIAQSIAYgKAQmMgAmNgAmMAg4PgY4PAI4OgI+PgQ8Pgo0NggsLAQKGAAQHAAMFgQiKgQwOAo6PgY6PAQ6PAI8PAI6PAYyNgYqLAQKFgAMHAIQIgAMHgAOHAAIFAQeJgo0Ogw8Pgg8PAQwNgAKHAAMGAIeKAIgLAIiLgAkNAYwNgw6PAg6PggsLgAKGgAMGgIKGAIKFgIkMgAwOAYwNAIIFAQkMgAiMgQ2PgYuNgYoLAAKGAAKFgAIEgQiLgQ0PAYmKgACDAQyPAQmKgQSGgYYIAgeJgomLAomLgIKEgIcJAIuOAYsNitugFyAAAAAXRSTlMAQObYZgAAFPxJREFUeNrtnH18W9V5xw0tLyON7ZAycBy2ENkjRFEMo2ZrDF2MNcd2IDhKUuoXYugI9pbahdEtMazANhOSQXtjC5ZBNxTbo3Qd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'
  });

  return { success: true };
}
