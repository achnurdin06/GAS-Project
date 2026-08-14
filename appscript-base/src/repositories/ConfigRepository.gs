class ConfigRepository extends BaseRepository {
  constructor() {
    super('sys_configuration');
  }

  findByKey(key) {
    if (!key) return null;
    const cleanKey = String(key).trim().toUpperCase();
    const results = this.find(row => String(row.config_key).trim().toUpperCase() === cleanKey);
    return results.length > 0 ? results[0] : null;
  }
}
