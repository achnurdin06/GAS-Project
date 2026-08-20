function runDashboardMigration() {
  const menuRepo = new MenuRepository();
  const permRepo = new PermissionRepository();
  
  // Create Permission
  const newPermId = Utils.generateUuid();
  permRepo.create({
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
    permRepo.create({
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
  menuRepo.create({
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
