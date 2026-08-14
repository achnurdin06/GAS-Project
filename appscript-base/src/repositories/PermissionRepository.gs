class PermissionRepository extends BaseRepository {
  constructor() {
    super('mst_permission');
  }

  findByRoleId(roleId) {
    if (!roleId) return [];
    const cleanRole = String(roleId).trim().toUpperCase();
    return this.find(row => String(row.role_id).trim().toUpperCase() === cleanRole && String(row.status).trim().toUpperCase() === 'ACTIVE');
  }
}
