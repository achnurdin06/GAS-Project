function runDashboardMigration() {
  const menuRepo = new MenuRepository();
  const permRepo = new PermissionRepository();
  
  // Create Permission
  const newPermId = Utils.generateUuid();
  permRepo.insert({
    id: newPermId,
    role_id: 'ROLE_USER',
    permission_code: 'DASHBOARD2_VIEW',
    permission_name: 'View Dashboard 2',
    created_at: Utils.formatIsoDate(),
    created_by: 'SYSTEM',
    status: 'ACTIVE'
  });
  
  // Ensure Super Admin and Admin also get the permission
  ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].forEach(rId => {
    permRepo.insert({
      id: Utils.generateUuid(),
      role_id: rId,
      permission_code: 'DASHBOARD2_VIEW',
      permission_name: 'View Dashboard 2',
      created_at: Utils.formatIsoDate(),
      created_by: 'SYSTEM',
      status: 'ACTIVE'
    });
  });

  // Create Menu
  menuRepo.insert({
    menu_id: Utils.generateUuid(),
    parent_id: '',
    menu_code: 'MENU_DASHBOARD_2',
    menu_name: 'Dashboard 2',
    slug: 'dashboard-2',
    type: 'Internal Link',
    route: '/dashboard-2',
    icon: 'bi-grid-fill',
    sort_order: 2,
    permission_code: 'DASHBOARD2_VIEW',
    description: 'Blank Dashboard for testing',
    status: 'ACTIVE',
    created_at: Utils.formatIsoDate(),
    created_by: 'SYSTEM'
  });

  return "Migration successful";
}

function runConfigMigration() {
  const configRepo = new ConfigRepository();
  
  // Check if it already exists to avoid duplicates
  const existing = configRepo.find(c => c.config_key === 'DEFAULT_DASHBOARD_ROUTE');
  if (existing && existing.length > 0) {
    return "Config already exists";
  }
  
  configRepo.insert({
    id: Utils.generateUuid(),
    config_key: 'DEFAULT_DASHBOARD_ROUTE',
    config_value: '/dashboard',
    description: 'Rute default setelah login (misal: /dashboard atau /dashboard-2)',
    created_at: Utils.formatIsoDate(),
    created_by: 'SYSTEM',
    status: 'ACTIVE'
  });
  
  return "Config Migration successful";
}
