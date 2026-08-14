class RoleRepository extends BaseRepository {
  constructor() {
    super('mst_role');
  }

  findByCode(roleCode) {
    if (!roleCode) return null;
    const cleanCode = String(roleCode).trim().toUpperCase();
    const results = this.find(row => String(row.role_code).trim().toUpperCase() === cleanCode);
    return results.length > 0 ? results[0] : null;
  }
}
