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
 * Inspects a spreadsheet database and returns diagnostic metadata
 */
function inspectSpreadsheetDatabase(ssOrId) {
  let ss = null;
  let cleanId = '';

  if (typeof ssOrId === 'string') {
    cleanId = String(ssOrId).trim().replace(/^["']|["']$/g, '');
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }
    try {
      ss = SpreadsheetApp.openById(cleanId);
    } catch (err) {
      return {
        success: false,
        state: 'INVALID',
        message: 'Spreadsheet tidak dapat diakses atau ID tidak valid: ' + (err.message || String(err)),
        spreadsheet_id: cleanId
      };
    }
  } else if (ssOrId && typeof ssOrId.getId === 'function') {
    ss = ssOrId;
    cleanId = ss.getId();
  }

  if (!ss) {
    return {
      success: false,
      state: 'INVALID',
      message: 'Objek spreadsheet tidak ditemukan',
      spreadsheet_id: ''
    };
  }

  const requiredSheets = ['mst_user', 'mst_role', 'mst_permission', 'mst_menu', 'sys_configuration', 'log_audit', 'mst_project'];
  const allSheets = ss.getSheets();
  const existingSheetNames = allSheets.map(s => s.getName());
  
  const existingSheets = [];
  const missingSheets = [];
  requiredSheets.forEach(name => {
    if (existingSheetNames.includes(name)) {
      existingSheets.push(name);
    } else {
      missingSheets.push(name);
    }
  });

  // Calculate existing users count
  let existingUsersCount = 0;
  const userSheet = ss.getSheetByName('mst_user');
  if (userSheet && userSheet.getLastRow() > 1) {
    try {
      const uData = userSheet.getDataRange().getValues();
      const headers = uData[0];
      const statusIdx = headers.indexOf('status');
      for (let i = 1; i < uData.length; i++) {
        const statusVal = statusIdx !== -1 ? String(uData[i][statusIdx] || '').trim().toUpperCase() : 'ACTIVE';
        if (statusVal === 'ACTIVE' || statusVal === '') {
          existingUsersCount++;
        }
      }
    } catch (e) {
      existingUsersCount = userSheet.getLastRow() - 1;
    }
  }

  // Extract application info from sys_configuration if available
  const appInfo = {
    appName: 'AppScript Enterprise Framework',
    appCode: 'AEF',
    appLogo: ''
  };
  const configSheet = ss.getSheetByName('sys_configuration');
  if (configSheet && configSheet.getLastRow() > 1) {
    try {
      const cData = configSheet.getDataRange().getValues();
      const headers = cData[0];
      const kIdx = headers.indexOf('config_key');
      const vIdx = headers.indexOf('config_value');
      if (kIdx !== -1 && vIdx !== -1) {
        for (let i = 1; i < cData.length; i++) {
          const k = String(cData[i][kIdx] || '').trim();
          const v = String(cData[i][vIdx] || '').trim();
          if (k === 'APP_NAME' && v) appInfo.appName = v;
          if (k === 'APP_CODE' && v) appInfo.appCode = v;
          if (k === 'APP_LOGO' && v) appInfo.appLogo = v;
        }
      }
    } catch (e) {}
  }

  // Determine state
  let state = 'EMPTY_SHEET';
  const hasCore = existingSheets.includes('mst_user') && existingSheets.includes('mst_menu');
  const hasAnyAef = existingSheets.length > 0;

  if (missingSheets.length === 0) {
    state = 'FULL_AEF_DB';
  } else if (hasCore || (hasAnyAef && existingSheets.length >= 2)) {
    state = 'PARTIAL_AEF_DB';
  } else if (allSheets.length === 1 && allSheets[0].getLastRow() <= 1) {
    state = 'EMPTY_SHEET';
  } else if (hasAnyAef) {
    state = 'PARTIAL_AEF_DB';
  } else {
    state = 'NON_AEF_DB';
  }

  return {
    success: true,
    spreadsheet_id: cleanId,
    spreadsheetId: cleanId,
    name: ss.getName(),
    url: ss.getUrl(),
    state: state,
    existing_sheets: existingSheets,
    missing_sheets: missingSheets,
    existing_users_count: existingUsersCount,
    requires_admin_creation: existingUsersCount === 0,
    can_auto_migrate: (state === 'PARTIAL_AEF_DB'),
    app_info: appInfo
  };
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
    missing_sheets: [],
    inspection: null
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
    // Proactively self-heal & sync menus, configurations, and project module if existing database
    if (ss.getSheetByName('mst_user') || ss.getSheetByName('mst_menu')) {
      try {
        syncConfigurations(ss);
        syncMasterClient(ss);
        syncMasterProject(ss);
        syncMenuPermissions(ss);
        if (typeof MenuService !== 'undefined') {
          new MenuService().syncMenuCatalog(ss);
        }
      } catch (e) {
        LoggerUtil.error('SetupDatabase', 'Auto-healing sync failed', e);
      }
    }

    const inspection = inspectSpreadsheetDatabase(ss);
    result.inspection = inspection;
    result.missing_sheets = inspection.missing_sheets || [];
    if (result.missing_sheets.length === 0 && inspection.state === 'FULL_AEF_DB') {
      result.database_initialized = true;
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
function initializeDatabaseSchema(spreadsheetId, adminPayload = {}, mode = 'FRESH_INSTALL') {
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

  // 1. Skenario Migrasi Database yang Sudah Ada (Non-Destructive Delta Sync)
  if (mode === 'MIGRATE') {
    syncConfigurations(ss);
    if (adminPayload) {
      if (adminPayload.appName) PropertiesService.getScriptProperties().setProperty('APP_NAME', adminPayload.appName);
      if (adminPayload.appCode) PropertiesService.getScriptProperties().setProperty('APP_CODE', adminPayload.appCode);
      if (adminPayload.appLogo) PropertiesService.getScriptProperties().setProperty('APP_LOGO', adminPayload.appLogo);
    }

    // Ensure mst_project exists with sample data
    syncMasterProject(ss);

    // Ensure menu catalog and permissions exist
    if (typeof MenuService !== 'undefined') {
      new MenuService().syncMenuCatalog(ss);
    }

    // If update admin password explicitly requested
    if (adminPayload && adminPayload.update_admin && adminPayload.password) {
      const uSheet = ss.getSheetByName('mst_user');
      if (uSheet && uSheet.getLastRow() > 1) {
        const uData = uSheet.getDataRange().getValues();
        const headers = uData[0];
        const roleIdx = headers.indexOf('role_id');
        const passIdx = headers.indexOf('password_hash');
        const updatedIdx = headers.indexOf('updated_at');
        if (roleIdx !== -1 && passIdx !== -1) {
          for (let i = 1; i < uData.length; i++) {
            if (String(uData[i][roleIdx]).trim().toUpperCase() === 'ROLE_SUPER_ADMIN') {
              uSheet.getRange(i + 1, passIdx + 1).setValue(Utils.hashSha256(adminPayload.password));
              if (updatedIdx !== -1) {
                uSheet.getRange(i + 1, updatedIdx + 1).setValue(Utils.formatIsoDate());
              }
              break;
            }
          }
        }
      }
    }

    return { success: true, mode: 'MIGRATE' };
  }

  // 2. Skenario Fresh Install: Inisialisasi Seluruh 7 Tabel dan Data Awal Standar
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
    { code: 'MENU_DELETE', name: 'Delete Menu' },
    { code: 'PROJECT_VIEW', name: 'View Project Management' },
    { code: 'PROJECT_CREATE', name: 'Create Project' },
    { code: 'PROJECT_UPDATE', name: 'Update Project' },
    { code: 'PROJECT_DELETE', name: 'Delete Project' },
    { code: 'CLIENT_VIEW', name: 'View Client Data' },
    { code: 'CLIENT_CREATE', name: 'Create Client' },
    { code: 'CLIENT_UPDATE', name: 'Update Client' },
    { code: 'CLIENT_DELETE', name: 'Delete Client' }
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
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_PROJECT_MGMT', menu_name: 'Master Proyek', slug: 'projects', type: 'Internal Link', route: '/projects', icon: 'bi-kanban-fill', sort_order: 1, permission_code: 'PROJECT_VIEW', description: 'Kelola master data proyek, timeline, budget, dan status pengerjaan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_CUSTOMERS', menu_name: 'Data Pelanggan', slug: 'customers', type: 'Internal Link', route: '/customers', icon: 'bi-person-vcard-fill', sort_order: 2, permission_code: 'CLIENT_VIEW', description: 'Kelola direktori profil pelanggan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_PRODUCTS', menu_name: 'Data Produk & Layanan', slug: 'products', type: 'Internal Link', route: '/products', icon: 'bi-box-seam-fill', sort_order: 3, permission_code: 'USER_VIEW', description: 'Katalog barang dan tarif layanan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_CATEGORIES', menu_name: 'Kategori Produk', slug: 'categories', type: 'Internal Link', route: '/categories', icon: 'bi-tags-fill', sort_order: 4, permission_code: 'USER_VIEW', description: 'Pengelompokan jenis dan taksonomi produk', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
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

  // 7. mst_client Sheet
  const clientHeaders = ['id', 'client_code', 'client_name', 'contact_person', 'phone', 'email', 'address', 'status', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by'];
  const clientSeed = [
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
      client_name: 'Bank Sinar Harapan',
      contact_person: 'Diana Puspita',
      phone: '021-8889999',
      email: 'it.procurement@sinarharapan.co.id',
      address: 'Menara Sinar Lt 15, Jakarta Pusat',
      status: 'ACTIVE',
      description: 'Lembaga perbankan swasta nasional',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      updated_at: Utils.formatIsoDate(),
      updated_by: 'SYSTEM'
    },
    {
      id: 'CLI-003',
      client_code: 'CLI-2025-003',
      client_name: 'Dinas Komunikasi & Informatika',
      contact_person: 'Budi Santoso',
      phone: '022-1234567',
      email: 'info@diskominfo.go.id',
      address: 'Pusat Pemerintahan, Bandung',
      status: 'ACTIVE',
      description: 'Instansi pemerintahan daerah',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      updated_at: Utils.formatIsoDate(),
      updated_by: 'SYSTEM'
    },
    {
      id: 'CLI-004',
      client_code: 'CLI-2025-004',
      client_name: 'Logistik Prima Sejahtera',
      contact_person: 'Siti Aminah',
      phone: '031-7654321',
      email: 'vendor@logistikprima.com',
      address: 'Kawasan Industri Rungkut, Surabaya',
      status: 'ACTIVE',
      description: 'Penyedia layanan logistik 3PL',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      updated_at: Utils.formatIsoDate(),
      updated_by: 'SYSTEM'
    }
  ];
  initSheet('mst_client', clientHeaders, clientSeed, false);

  // 8. mst_project Sheet
  const projectHeaders = ['id', 'project_code', 'project_name', 'client_id', 'project_manager', 'start_date', 'end_date', 'budget', 'priority', 'status', 'progress', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by'];
  const projectSeed = [
    {
      id: Utils.generateUuid(),
      project_code: 'PRJ-2025-001',
      project_name: 'Implementasi Core ERP Enterprise',
      client_id: 'CLI-001',
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
      client_id: 'CLI-002',
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
      client_id: 'CLI-003',
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
      client_id: 'CLI-004',
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
  initSheet('mst_project', projectHeaders, projectSeed, false);

  // Update Properties
  PropertiesService.getScriptProperties().setProperties({
    'SPREADSHEET_ID': spreadsheetId,
    'APP_NAME': adminPayload.appName || 'AppScript Enterprise Framework',
    'APP_CODE': adminPayload.appCode || 'AEF',
    'APP_LOGO': adminPayload.appLogo || ''
  });

  // Hapus sheet kosong bawaan Google Sheets ("Sheet1" / "Sheet 1") jika tabel AEF sudah terbuat
  try {
    const allSheets = ss.getSheets();
    if (allSheets.length > 1) {
      const defaultBlank = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
      if (defaultBlank && defaultBlank.getLastRow() <= 1) {
        ss.deleteSheet(defaultBlank);
      }
    }
  } catch (e) {}

  return { success: true, mode: 'FRESH_INSTALL' };
}

/**
 * Automatically ensures mst_client table, permissions, and menu exist in the active spreadsheet
 */
function syncMasterClient(ss) {
  if (!ss) return;

  // 1. Ensure mst_client exists
  let clientSheet = ss.getSheetByName('mst_client');
  if (!clientSheet || clientSheet.getLastRow() === 0) {
    const repo = new ClientRepository();
    repo.initClientSheet(ss);
  }

  // 2. Ensure mst_permission has CLIENT permissions
  const permSheet = ss.getSheetByName('mst_permission');
  if (permSheet && permSheet.getLastRow() > 0) {
    const permData = permSheet.getDataRange().getValues();
    const headers = permData[0];
    const roleIdx = headers.indexOf('role_id');
    const codeIdx = headers.indexOf('permission_code');
    
    if (roleIdx !== -1 && codeIdx !== -1) {
      const existingPerms = new Set();
      for (let i = 1; i < permData.length; i++) {
        const rId = String(permData[i][roleIdx]).trim().toUpperCase();
        const pCode = String(permData[i][codeIdx]).trim().toUpperCase();
        existingPerms.add(`${rId}:${pCode}`);
      }

      const clientPerms = [
        { code: 'CLIENT_VIEW', name: 'View Client Data' },
        { code: 'CLIENT_CREATE', name: 'Create Client' },
        { code: 'CLIENT_UPDATE', name: 'Update Client' },
        { code: 'CLIENT_DELETE', name: 'Delete Client' }
      ];

      ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].forEach(roleId => {
        clientPerms.forEach(p => {
          if (!existingPerms.has(`${roleId}:${p.code}`)) {
            const row = headers.map(h => {
              if (h === 'id') return Utils.generateUuid();
              if (h === 'role_id') return roleId;
              if (h === 'permission_code') return p.code;
              if (h === 'permission_name') return p.name;
              if (h === 'created_at') return Utils.formatIsoDate();
              if (h === 'created_by') return 'SYSTEM';
              if (h === 'status') return 'ACTIVE';
              return '';
            });
            permSheet.appendRow(row);
          }
        });
      });
    }
  }
}

/**
 * Automatically ensures mst_project table, permissions, and menu exist in the active spreadsheet
 */
function syncMasterProject(ss) {
  if (!ss) return;

  // 1. Ensure mst_project exists
  let projectSheet = ss.getSheetByName('mst_project');
  if (!projectSheet || projectSheet.getLastRow() === 0) {
    const repo = new ProjectRepository();
    repo.initProjectSheet(ss);
  } else {
    // If it exists, ensure it has client_id instead of client_name
    const pData = projectSheet.getRange(1, 1, 1, projectSheet.getLastColumn()).getValues();
    if (pData[0].indexOf('client_name') !== -1) {
      // It still uses client_name, rename header to client_id
      const colIdx = pData[0].indexOf('client_name') + 1;
      projectSheet.getRange(1, colIdx).setValue('client_id');
    }
  }

  // 2. Ensure mst_permission has PROJECT permissions
  const permSheet = ss.getSheetByName('mst_permission');
  if (permSheet && permSheet.getLastRow() > 0) {
    const permData = permSheet.getDataRange().getValues();
    const headers = permData[0];
    const roleIdx = headers.indexOf('role_id');
    const codeIdx = headers.indexOf('permission_code');
    
    if (roleIdx !== -1 && codeIdx !== -1) {
      const existingPerms = new Set();
      for (let i = 1; i < permData.length; i++) {
        const rId = String(permData[i][roleIdx]).trim().toUpperCase();
        const pCode = String(permData[i][codeIdx]).trim().toUpperCase();
        existingPerms.add(`${rId}:${pCode}`);
      }

      const projectPerms = [
        { code: 'PROJECT_VIEW', name: 'View Project Management' },
        { code: 'PROJECT_CREATE', name: 'Create Project' },
        { code: 'PROJECT_UPDATE', name: 'Update Project' },
        { code: 'PROJECT_DELETE', name: 'Delete Project' }
      ];

      ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].forEach(roleId => {
        projectPerms.forEach(p => {
          if (!existingPerms.has(`${roleId}:${p.code}`)) {
            const row = headers.map(h => {
              if (h === 'id') return Utils.generateUuid();
              if (h === 'role_id') return roleId;
              if (h === 'permission_code') return p.code;
              if (h === 'permission_name') return p.name;
              if (h === 'created_at') return Utils.formatIsoDate();
              if (h === 'created_by') return 'SYSTEM';
              if (h === 'status') return 'ACTIVE';
              return '';
            });
            permSheet.appendRow(row);
          }
        });
      });
    }
  }

  // 3. Ensure mst_menu has MENU_PROJECT_MGMT under PARENT_MASTER
  const menuSheet = ss.getSheetByName('mst_menu');
  if (menuSheet && menuSheet.getLastRow() > 0) {
    const menuData = menuSheet.getDataRange().getValues();
    const headers = menuData[0];
    const codeIdx = headers.indexOf('menu_code');
    const idIdx = headers.indexOf('menu_id');

    if (codeIdx !== -1) {
      let hasProjectMenu = false;
      let parentMasterId = 'PARENT_MASTER';

      for (let i = 1; i < menuData.length; i++) {
        const code = String(menuData[i][codeIdx]).trim().toUpperCase();
        if (code === 'MENU_PROJECT_MGMT') {
          hasProjectMenu = true;
        }
        if (code === 'MODULE_MASTER_DATA' && idIdx !== -1) {
          parentMasterId = menuData[i][idIdx] || 'PARENT_MASTER';
        }
      }

      if (!hasProjectMenu) {
        const newMenuRow = headers.map(h => {
          if (h === 'menu_id') return Utils.generateUuid();
          if (h === 'parent_id') return parentMasterId;
          if (h === 'menu_code') return 'MENU_PROJECT_MGMT';
          if (h === 'menu_name') return 'Master Proyek';
          if (h === 'slug') return 'projects';
          if (h === 'type') return 'Internal Link';
          if (h === 'route') return '/projects';
          if (h === 'icon') return 'bi-kanban-fill';
          if (h === 'sort_order') return 1;
          if (h === 'permission_code') return 'PROJECT_VIEW';
          if (h === 'description') return 'Kelola master data proyek, timeline, budget, dan status pengerjaan';
          if (h === 'status') return 'ACTIVE';
          if (h === 'created_at') return Utils.formatIsoDate();
          if (h === 'created_by') return 'SYSTEM';
          return '';
        });
        menuSheet.appendRow(newMenuRow);
      }
    }
  }
}

/**
 * Endpoint for client-side Spreadsheet verification during setup
 */
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

    // Auto-heal/sync mst_project if the spreadsheet is already initialized
    try {
      if (ss.getSheetByName('mst_user') || ss.getSheetByName('mst_menu')) {
        syncMasterProject(ss);
      }
    } catch (e) {
      LoggerUtil.error('Setup', 'syncMasterProject during verify failed', e);
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
    return {
      success: false,
      message: 'Gagal mengakses spreadsheet: ' + (err.message || String(err)),
      code: 'ACCESS_ERROR'
    };
  }
}

/**
 * Endpoint for client-side auto creation of Google Drive folder and Spreadsheet
 */
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
    return {
      success: false,
      message: err.message || String(err),
      code: 'SYSTEM_ERROR'
    };
  }
}

/**
 * Ensures all standard permissions for current menus exist in mst_permission
 */
function syncMenuPermissions(ss) {
  if (!ss) return;
  const permSheet = ss.getSheetByName('mst_permission');
  if (!permSheet || permSheet.getLastRow() === 0) return;

  const permData = permSheet.getDataRange().getValues();
  const headers = permData[0];
  const roleIdx = headers.indexOf('role_id');
  const codeIdx = headers.indexOf('permission_code');
  if (roleIdx === -1 || codeIdx === -1) return;

  const existingPerms = new Set();
  for (let i = 1; i < permData.length; i++) {
    const rId = String(permData[i][roleIdx]).trim().toUpperCase();
    const pCode = String(permData[i][codeIdx]).trim().toUpperCase();
    existingPerms.add(`${rId}:${pCode}`);
  }

  const standardMenuPerms = [
    // Dashboard
    { code: 'DASHBOARD_VIEW', name: 'Dashboard - VIEW' },
    // Users
    { code: 'USER_VIEW', name: 'User Management - VIEW' },
    { code: 'USER_CREATE', name: 'User Management - CREATE' },
    { code: 'USER_UPDATE', name: 'User Management - UPDATE' },
    { code: 'USER_DELETE', name: 'User Management - DELETE' },
    { code: 'USER_EXPORT', name: 'User Management - EXPORT' },
    { code: 'USER_IMPORT', name: 'User Management - IMPORT' },
    // Roles
    { code: 'ROLE_VIEW', name: 'Role Management - VIEW' },
    { code: 'ROLE_CREATE', name: 'Role Management - CREATE' },
    { code: 'ROLE_UPDATE', name: 'Role Management - UPDATE' },
    { code: 'ROLE_DELETE', name: 'Role Management - DELETE' },
    { code: 'ROLE_EXPORT', name: 'Role Management - EXPORT' },
    { code: 'ROLE_IMPORT', name: 'Role Management - IMPORT' },
    // Permissions
    { code: 'PERMISSION_VIEW', name: 'Permission Control - VIEW' },
    { code: 'PERMISSION_CREATE', name: 'Permission Control - CREATE' },
    { code: 'PERMISSION_UPDATE', name: 'Permission Control - UPDATE' },
    { code: 'PERMISSION_DELETE', name: 'Permission Control - DELETE' },
    { code: 'PERMISSION_EXPORT', name: 'Permission Control - EXPORT' },
    { code: 'PERMISSION_IMPORT', name: 'Permission Control - IMPORT' },
    // Master Proyek
    { code: 'PROJECT_VIEW', name: 'Master Proyek - VIEW' },
    { code: 'PROJECT_CREATE', name: 'Master Proyek - CREATE' },
    { code: 'PROJECT_UPDATE', name: 'Master Proyek - UPDATE' },
    { code: 'PROJECT_DELETE', name: 'Master Proyek - DELETE' },
    { code: 'PROJECT_EXPORT', name: 'Master Proyek - EXPORT' },
    { code: 'PROJECT_IMPORT', name: 'Master Proyek - IMPORT' },
    // Menus
    { code: 'MENU_VIEW', name: 'Menu Management - VIEW' },
    { code: 'MENU_CREATE', name: 'Menu Management - CREATE' },
    { code: 'MENU_UPDATE', name: 'Menu Management - UPDATE' },
    { code: 'MENU_DELETE', name: 'Menu Management - DELETE' },
    { code: 'MENU_EXPORT', name: 'Menu Management - EXPORT' },
    { code: 'MENU_IMPORT', name: 'Menu Management - IMPORT' },
    // Config
    { code: 'CONFIG_VIEW', name: 'Konfigurasi Aplikasi - VIEW' },
    { code: 'CONFIG_UPDATE', name: 'Konfigurasi Aplikasi - UPDATE' },
    { code: 'CONFIG_EXPORT', name: 'Konfigurasi Aplikasi - EXPORT' },
    { code: 'CONFIG_IMPORT', name: 'Konfigurasi Aplikasi - IMPORT' },
    // Audit
    { code: 'AUDIT_VIEW', name: 'Audit Trail - VIEW' },
    { code: 'AUDIT_EXPORT', name: 'Audit Trail - EXPORT' },
    { code: 'AUDIT_IMPORT', name: 'Audit Trail - IMPORT' }
  ];

  let added = false;
  ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].forEach(roleId => {
    standardMenuPerms.forEach(p => {
      if (!existingPerms.has(`${roleId}:${p.code}`)) {
        const row = headers.map(h => {
          if (h === 'id') return Utils.generateUuid();
          if (h === 'role_id') return roleId;
          if (h === 'permission_code') return p.code;
          if (h === 'permission_name') return p.name;
          if (h === 'created_at') return Utils.formatIsoDate();
          if (h === 'created_by') return 'SYSTEM';
          if (h === 'status') return 'ACTIVE';
          return '';
        });
        permSheet.appendRow(row);
        added = true;
      }
    });
  });

  // Ensure ROLE_USER has DASHBOARD_VIEW
  if (!existingPerms.has('ROLE_USER:DASHBOARD_VIEW')) {
    const row = headers.map(h => {
      if (h === 'id') return Utils.generateUuid();
      if (h === 'role_id') return 'ROLE_USER';
      if (h === 'permission_code') return 'DASHBOARD_VIEW';
      if (h === 'permission_name') return 'Dashboard - VIEW';
      if (h === 'created_at') return Utils.formatIsoDate();
      if (h === 'created_by') return 'SYSTEM';
      if (h === 'status') return 'ACTIVE';
      return '';
    });
    permSheet.appendRow(row);
    added = true;
  }

  if (added) {
    try {
      CacheService.getScriptCache().remove('CACHE_TABLE_mst_permission');
    } catch (e) {}
  }
}

