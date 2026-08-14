class UserRepository extends BaseRepository {
  constructor() {
    super('mst_user');
  }

  findByEmail(email) {
    if (!email) return null;
    const cleanEmail = String(email).trim().toLowerCase();
    const results = this.find(row => String(row.email).trim().toLowerCase() === cleanEmail && String(row.status).trim().toUpperCase() === 'ACTIVE');
    return results.length > 0 ? results[0] : null;
  }
}
