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
    'SESSION_TIMEOUT': { default: '28800', desc: 'Session Timeout in Seconds' },
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
    { id: Utils.generateUuid(), config_key: 'APP_LOGO', config_value: adminPayload.appLogo || '', description: 'Application Brand Logo URL or Base64', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'APP_VERSION', config_value: '1.0.0', description: 'Application Version', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'SESSION_TIMEOUT', config_value: '28800', description: 'Session Timeout in Seconds', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
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
    'APP_LOGO': adminPayload.appLogo || ''
  });

  return { success: true };
}
