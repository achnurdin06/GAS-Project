/**
 * AppScript Enterprise Framework (AEF)
 * Audit Repository (log_audit) - PRD Section 16 & 17
 */

class AuditRepository extends BaseRepository {
  constructor() {
    super('log_audit');
  }

  /**
   * Log an audit event entry.
   * @param {Object} auditData 
   * @returns {Object}
   */
  logEvent(auditData) {
    const entry = {
      event_id: auditData.event_id || Utils.generateUuid(),
      timestamp: auditData.timestamp || Utils.formatIsoDate(),
      user_id: auditData.user_id || 'GUEST',
      module: auditData.module || 'SYSTEM',
      action: auditData.action || 'UNKNOWN',
      reference_id: auditData.reference_id || '',
      status: auditData.status || 'SUCCESS',
      description: auditData.description || '',
      old_value: typeof auditData.old_value === 'object' ? JSON.stringify(auditData.old_value) : (auditData.old_value || ''),
      new_value: typeof auditData.new_value === 'object' ? JSON.stringify(auditData.new_value) : (auditData.new_value || '')
    };

    return this.insert(entry, auditData.user_id || 'SYSTEM');
  }
}
