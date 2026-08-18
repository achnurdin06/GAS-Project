/**
 * Database Setup & Seed Data Script for AEF Framework (Super Admin Edition)
 * Automatically initializes sheets and seeds demo data for table relations:
 * mst_user -> mst_role -> mst_permission -> mst_menu -> sys_configuration -> log_audit
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

  // 1. mst_user Sheet (Super Admin & Admin & Standard User)
  const userHeaders = ['id', 'name', 'email', 'password_hash', 'role_id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const adminPasswordHash = Utils.hashSha256('admin123');
  const userSeed = [
    {
      id: Utils.generateUuid(),
      name: 'Super Administrator',
      email: 'superadmin@aef.com',
      password_hash: adminPasswordHash,
      role_id: 'ROLE_SUPER_ADMIN',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      updated_at: Utils.formatIsoDate(),
      updated_by: 'SYSTEM',
      status: 'ACTIVE'
    },
    {
      id: Utils.generateUuid(),
      name: 'System Administrator',
      email: 'admin@aef.com',
      password_hash: adminPasswordHash,
      role_id: 'ROLE_ADMIN',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      updated_at: Utils.formatIsoDate(),
      updated_by: 'SYSTEM',
      status: 'ACTIVE'
    },
    {
      id: Utils.generateUuid(),
      name: 'Standard User',
      email: 'user@aef.com',
      password_hash: Utils.hashSha256('user123'),
      role_id: 'ROLE_USER',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      updated_at: Utils.formatIsoDate(),
      updated_by: 'SYSTEM',
      status: 'ACTIVE'
    }
  ];
  initSheet('mst_user', userHeaders, userSeed, true);

  // 2. mst_role Sheet
  const roleHeaders = ['id', 'role_code', 'role_name', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const roleSeed = [
    { id: Utils.generateUuid(), role_code: 'ROLE_SUPER_ADMIN', role_name: 'Super Administrator', description: 'Master role with full menu & system permissions', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', updated_at: Utils.formatIsoDate(), updated_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_code: 'ROLE_ADMIN', role_name: 'System Administrator', description: 'Full access administrator role', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', updated_at: Utils.formatIsoDate(), updated_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_code: 'ROLE_USER', role_name: 'Standard User', description: 'Standard end-user role', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', updated_at: Utils.formatIsoDate(), updated_by: 'SYSTEM', status: 'ACTIVE' }
  ];
  initSheet('mst_role', roleHeaders, roleSeed, true);

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
  // Super Admin & Admin get ALL permissions
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
  // Standard User gets Dashboard View
  permSeed.push({
    id: Utils.generateUuid(),
    role_id: 'ROLE_USER',
    permission_code: 'DASHBOARD_VIEW',
    permission_name: 'View Dashboard',
    created_at: Utils.formatIsoDate(),
    created_by: 'SYSTEM',
    status: 'ACTIVE'
  });

  initSheet('mst_permission', permHeaders, permSeed, true);

  // 4. mst_menu Sheet (Complete Super Admin Menu Structure with Hierarchy & Modules)
  const menuHeaders = ['menu_id', 'parent_id', 'menu_code', 'menu_name', 'slug', 'type', 'route', 'icon', 'sort_order', 'permission_code', 'description', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by'];
  const menuSeed = [
    // 1. Dashboard
    { menu_id: 'MENU_DASHBOARD_ID', parent_id: '', menu_code: 'MENU_DASHBOARD', menu_name: 'Dashboard', slug: 'dashboard', type: 'Internal Link', route: '/dashboard', icon: 'bi-grid-1x2-fill', sort_order: 1, permission_code: 'DASHBOARD_VIEW', description: 'Ringkasan Statistik & Analitik Utama', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    
    // 2. Modul Administrasi & Keamanan (Administration)
    { menu_id: 'PARENT_ADMIN', parent_id: '', menu_code: 'MODULE_ADMINISTRATION', menu_name: 'Administrasi Sistem', slug: 'administration', type: 'Module', route: '#', icon: 'bi-shield-lock-fill', sort_order: 2, permission_code: 'USER_VIEW', description: 'Modul Kelola Administrasi & Keamanan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_USER_MGMT', menu_name: 'User Management', slug: 'user-management', type: 'Internal Link', route: '/users', icon: 'bi-people-fill', sort_order: 1, permission_code: 'USER_VIEW', description: 'Kelola data dan status akun pengakses sistem', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_ROLE_MGMT', menu_name: 'Role Management', slug: 'role-management', type: 'Internal Link', route: '/roles', icon: 'bi-shield-check', sort_order: 2, permission_code: 'ROLE_VIEW', description: 'Kelola peran dan hirarki grup akses pengguna', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_PERM_MGMT', menu_name: 'Permission Control', slug: 'permission-management', type: 'Internal Link', route: '/permissions', icon: 'bi-key-fill', sort_order: 3, permission_code: 'PERMISSION_VIEW', description: 'Matriks pemetaan hak akses fitur aplikasi', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_MENU_MGMT', menu_name: 'Menu Management', slug: 'menu-management', type: 'Internal Link', route: '/menus', icon: 'bi-menu-button-wide-fill', sort_order: 4, permission_code: 'MENU_VIEW', description: 'Kelola struktur dan navigasi menu aplikasi', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_ADMIN', menu_code: 'MENU_AUDIT', menu_name: 'Audit Trail', slug: 'audit-trail', type: 'Internal Link', route: '/audit', icon: 'bi-journal-text', sort_order: 5, permission_code: 'AUDIT_VIEW', description: 'Rekam riwayat dan catatan aktivitas pengguna', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    
    // 3. Modul Master Data
    { menu_id: 'PARENT_MASTER', parent_id: '', menu_code: 'MODULE_MASTER_DATA', menu_name: 'Master Data', slug: 'master-data', type: 'Module', route: '#', icon: 'bi-database-fill-gear', sort_order: 3, permission_code: 'USER_VIEW', description: 'Modul Pengelolaan Referensi Master Data', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_CUSTOMERS', menu_name: 'Data Pelanggan', slug: 'customers', type: 'Internal Link', route: '/customers', icon: 'bi-person-vcard-fill', sort_order: 1, permission_code: 'USER_VIEW', description: 'Kelola direktori profil pelanggan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_PRODUCTS', menu_name: 'Data Produk & Layanan', slug: 'products', type: 'Internal Link', route: '/products', icon: 'bi-box-seam-fill', sort_order: 2, permission_code: 'USER_VIEW', description: 'Katalog barang dan tarif layanan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_MASTER', menu_code: 'MENU_CATEGORIES', menu_name: 'Kategori Produk', slug: 'categories', type: 'Internal Link', route: '/categories', icon: 'bi-tags-fill', sort_order: 3, permission_code: 'USER_VIEW', description: 'Pengelompokan jenis dan taksonomi produk', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },

    // 4. Modul Laporan & Analitik (Reports & Analytics)
    { menu_id: 'PARENT_REPORTS', parent_id: '', menu_code: 'MODULE_REPORTS', menu_name: 'Laporan & Laporan', slug: 'reports', type: 'Module', route: '#', icon: 'bi-graph-up-arrow', sort_order: 4, permission_code: 'AUDIT_VIEW', description: 'Modul Rekapitulasi Laporan & Kinerja', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_REPORTS', menu_code: 'MENU_SALES_REPORT', menu_name: 'Laporan Penjualan', slug: 'sales-report', type: 'Internal Link', route: '/sales-report', icon: 'bi-bar-chart-line-fill', sort_order: 1, permission_code: 'AUDIT_VIEW', description: 'Rekap omset dan tren transaksi bulanan', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_REPORTS', menu_code: 'MENU_LOG_REPORT', menu_name: 'Laporan Aktivitas', slug: 'activity-log', type: 'Internal Link', route: '/activity-log', icon: 'bi-file-earmark-bar-graph-fill', sort_order: 2, permission_code: 'AUDIT_VIEW', description: 'Analisis pemakaian dan lalu lintas sistem', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },

    // 5. Modul Pengaturan Sistem (Settings)
    { menu_id: 'PARENT_SETTINGS', parent_id: '', menu_code: 'MODULE_SETTINGS', menu_name: 'Pengaturan Sistem', slug: 'settings', type: 'Module', route: '#', icon: 'bi-gear-fill', sort_order: 5, permission_code: 'CONFIG_VIEW', description: 'Modul Pengaturan Konfigurasi Global', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_SETTINGS', menu_code: 'MENU_CONFIG', menu_name: 'General Settings', slug: 'general-settings', type: 'Internal Link', route: '/config', icon: 'bi-sliders', sort_order: 1, permission_code: 'CONFIG_VIEW', description: 'Konfigurasi variabel umum dan sistem', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: 'PARENT_SETTINGS', menu_code: 'MENU_SYSTEM_LOGS', menu_name: 'Technical Logs', slug: 'system-logs', type: 'Internal Link', route: '/system-logs', icon: 'bi-file-earmark-code-fill', sort_order: 2, permission_code: 'AUDIT_VIEW', description: 'Catatan error dan log eksekusi backend', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' }
  ];
  initSheet('mst_menu', menuHeaders, menuSeed, true);

  // 5. sys_configuration Sheet
  const configHeaders = ['id', 'config_key', 'config_value', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const configSeed = [
    { id: Utils.generateUuid(), config_key: 'APP_NAME', config_value: 'AppScript Enterprise Framework', description: 'Application Name', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'APP_VERSION', config_value: '1.0.0', description: 'Application Version', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'SESSION_TIMEOUT', config_value: '28800', description: 'Session Timeout in Seconds', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' }
  ];
  initSheet('sys_configuration', configHeaders, configSeed, true);

  // 6. log_audit Sheet
  const auditHeaders = ['event_id', 'timestamp', 'user_id', 'module', 'action', 'reference_id', 'status', 'description', 'old_value', 'new_value', 'id', 'created_at', 'created_by', 'updated_at', 'updated_by'];
  initSheet('log_audit', auditHeaders, []);

  return "AEF Database & Seed Data Setup Complete! Spreadsheet URL: " + ss.getUrl();
}
