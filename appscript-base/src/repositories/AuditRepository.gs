class AuditRepository extends BaseRepository {
  constructor() {
    // Disable cache for audit logs as they grow rapidly
    super('log_audit', false);
  }

  getRecentLogs(limit = 100) {
    const logs = this.readAll();
    return logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).slice(0, limit);
  }
}
