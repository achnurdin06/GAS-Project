/**
 * AppScript Enterprise Framework (AEF)
 * Role Repository (mst_role)
 */

class RoleRepository extends BaseRepository {
  constructor() {
    super('mst_role');
  }

  /**
   * Find role by code.
   * @param {string} roleCode 
   * @returns {Object|null}
   */
  findByCode(roleCode) {
    if (!roleCode) return null;
    const matches = this.find({ role_code: roleCode, status: 'ACTIVE' });
    return matches.length > 0 ? matches[0] : null;
  }
}
