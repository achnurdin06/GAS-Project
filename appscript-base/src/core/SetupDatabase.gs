/**
 * AppScript Enterprise Framework (AEF)
 * Initial Database & Seed Data Setup Script
 * 
 * Run this function 'setupDatabase' from Apps Script Editor to initialize sheets & seed data!
 */

function setupDatabase() {
  let ss = null;
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (spreadsheetId) {
    try {
      ss = SpreadsheetApp.openById(spreadsheetId);
    } catch (e) {}
  }
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) {
    ss = SpreadsheetApp.create('AEF Enterprise Database');
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
    console.log('Created new Standalone Spreadsheet DB:', ss.getUrl());
  }

  // Helper to ensure sheet exists and write headers & initial rows
  function initSheet(sheetName, headers, seedRows = [], forceOverwrite = false) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (forceOverwrite || !values || values.length === 0 || (values.length === 1 && values[0][0] === '')) {
      sheet.clear();
      sheet.appendRow(headers);
      seedRows.forEach(row => {
        const rowValues = headers.map(h => row[h] !== undefined ? row[h] : '');
        sheet.appendRow(rowValues);
      });
      Logger.info('SETUP', 'initSheet', `Sheet initialized: ${sheetName}`);
    }
  }

  // 1. mst_user
  const userHeaders = ['id', 'name', 'email', 'password_hash', 'role_id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const userSeed = [
    {
      id: Utils.generateUuid(),
      name: 'Administrator AEF',
      email: 'admin@aef.com',
      password_hash: Utils.hashSha256('admin123'),
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

  // 2. mst_role
  const roleHeaders = ['id', 'role_code', 'role_name', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const roleSeed = [
    { id: Utils.generateUuid(), role_code: 'ROLE_ADMIN', role_name: 'System Administrator', description: 'Full access administrator role', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', updated_at: Utils.formatIsoDate(), updated_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_code: 'ROLE_USER', role_name: 'Standard User', description: 'Standard end-user role', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', updated_at: Utils.formatIsoDate(), updated_by: 'SYSTEM', status: 'ACTIVE' }
  ];
  initSheet('mst_role', roleHeaders, roleSeed, true);

  // 3. mst_permission
  const permHeaders = ['id', 'role_id', 'permission_code', 'permission_name', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const permSeed = [
    { id: Utils.generateUuid(), role_id: 'ROLE_ADMIN', permission_code: 'DASHBOARD_VIEW', permission_name: 'View Dashboard', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_id: 'ROLE_ADMIN', permission_code: 'USER_VIEW', permission_name: 'View Users', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_id: 'ROLE_ADMIN', permission_code: 'USER_CREATE', permission_name: 'Create User', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_id: 'ROLE_ADMIN', permission_code: 'USER_DELETE', permission_name: 'Delete User', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_id: 'ROLE_ADMIN', permission_code: 'ROLE_VIEW', permission_name: 'View Roles', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_id: 'ROLE_ADMIN', permission_code: 'PERMISSION_VIEW', permission_name: 'View Permissions', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_id: 'ROLE_ADMIN', permission_code: 'CONFIG_VIEW', permission_name: 'View System Config', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_id: 'ROLE_ADMIN', permission_code: 'AUDIT_VIEW', permission_name: 'View Audit Logs', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), role_id: 'ROLE_USER', permission_code: 'DASHBOARD_VIEW', permission_name: 'View Dashboard', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' }
  ];
  initSheet('mst_permission', permHeaders, permSeed, true);

  // 4. mst_menu (All 6 AEF Framework Core Menus)
  const menuHeaders = ['menu_id', 'parent_id', 'menu_code', 'menu_name', 'route', 'icon', 'sort_order', 'permission_code', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by'];
  const menuSeed = [
    { menu_id: Utils.generateUuid(), parent_id: '', menu_code: 'MENU_DASHBOARD', menu_name: 'Dashboard', route: '/dashboard', icon: 'bi-speedometer2', sort_order: 1, permission_code: 'DASHBOARD_VIEW', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: '', menu_code: 'MENU_USER_MGMT', menu_name: 'User Management', route: '/users', icon: 'bi-people-fill', sort_order: 2, permission_code: 'USER_VIEW', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: '', menu_code: 'MENU_ROLE_MGMT', menu_name: 'Role Management', route: '/roles', icon: 'bi-shield-lock-fill', sort_order: 3, permission_code: 'ROLE_VIEW', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: '', menu_code: 'MENU_PERM_MGMT', menu_name: 'Permission Control', route: '/permissions', icon: 'bi-key-fill', sort_order: 4, permission_code: 'PERMISSION_VIEW', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: '', menu_code: 'MENU_CONFIG', menu_name: 'System Config', route: '/config', icon: 'bi-gear-fill', sort_order: 5, permission_code: 'CONFIG_VIEW', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' },
    { menu_id: Utils.generateUuid(), parent_id: '', menu_code: 'MENU_AUDIT', menu_name: 'Audit Trail Logs', route: '/audit', icon: 'bi-journal-text', sort_order: 6, permission_code: 'AUDIT_VIEW', status: 'ACTIVE', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM' }
  ];
  initSheet('mst_menu', menuHeaders, menuSeed, true);

  // 5. sys_configuration
  const configHeaders = ['id', 'config_key', 'config_value', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status'];
  const configSeed = [
    { id: Utils.generateUuid(), config_key: 'APP_NAME', config_value: 'AppScript Enterprise Framework', description: 'Application Name', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'APP_VERSION', config_value: '1.0.0', description: 'Application Version', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' },
    { id: Utils.generateUuid(), config_key: 'SESSION_TIMEOUT', config_value: '28800', description: 'Session Timeout in Seconds', created_at: Utils.formatIsoDate(), created_by: 'SYSTEM', status: 'ACTIVE' }
  ];
  initSheet('sys_configuration', configHeaders, configSeed, true);

  // 6. log_audit
  const auditHeaders = ['event_id', 'timestamp', 'user_id', 'module', 'action', 'reference_id', 'status', 'description', 'old_value', 'new_value', 'id', 'created_at', 'created_by', 'updated_at', 'updated_by'];
  initSheet('log_audit', auditHeaders, []);

  return "AEF Database & Seed Data Setup Complete! Spreadsheet URL: " + ss.getUrl();
}
