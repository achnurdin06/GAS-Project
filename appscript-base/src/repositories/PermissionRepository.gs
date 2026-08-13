/**
 * AppScript Enterprise Framework (AEF)
 * Permission Repository (mst_permission)
 */

class PermissionRepository extends BaseRepository {
  constructor() {
    super('mst_permission');
  }

  /**
   * Get permissions associated with a given role_id or list of permission codes.
   * @param {string} roleId 
   * @returns {Object[]} Permission entries
   */
  findByRoleId(roleId) {
    if (!roleId) return [];
    return this.find(row => row.role_id === roleId && row.status === 'ACTIVE');
  }
}
