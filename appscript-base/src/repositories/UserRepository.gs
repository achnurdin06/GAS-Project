/**
 * AppScript Enterprise Framework (AEF)
 * User Repository (mst_user)
 */

class UserRepository extends BaseRepository {
  constructor() {
    super('mst_user');
  }

  /**
   * Find active user by email address.
   * @param {string} email 
   * @returns {Object|null}
   */
  findByEmail(email) {
    if (!email) return null;
    const matches = this.find(row => 
      String(row.email).toLowerCase() === String(email).toLowerCase() && 
      row.status === 'ACTIVE'
    );
    return matches.length > 0 ? matches[0] : null;
  }
}
