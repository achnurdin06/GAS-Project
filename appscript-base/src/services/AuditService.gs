/**
 * AppScript Enterprise Framework (AEF)
 * Audit Service (PRD Section 16 & 17)
 */

class AuditService {
  constructor() {
    this.auditRepo = new AuditRepository();
  }

  /**
   * Records an audit log event.
   * Standard event codes: MODULE_ACTION_RESULT
   * E.g. AUTH_LOGIN_SUCCESS, USER_CREATED, PERMISSION_UPDATED
   */
  log(module, action, status, userId, description = '', refId = '', oldValue = null, newValue = null) {
    try {
      const eventCode = `${module}_${action}_${status}`;
      this.auditRepo.logEvent({
        event_id: Utils.generateUuid(),
        timestamp: Utils.formatIsoDate(),
        user_id: userId || 'GUEST',
        module: module,
        action: action,
        status: status,
        reference_id: refId,
        description: description || eventCode,
        old_value: oldValue,
        new_value: newValue
      });
      Logger.info(module, action, `${eventCode}: ${description}`, refId, userId);
    } catch (err) {
      Logger.error('AUDIT', 'log', `Failed to write audit log: ${err.message}`);
    }
  }

  /**
   * Get all audit log entries
   * @returns {Object} Standard Response
   */
  getAuditLogs() {
    const { rows } = this.auditRepo.readAll();
    const sorted = rows.reverse().slice(0, 100); // Top 100 latest events
    return Response.success('Audit logs retrieved', sorted, 'AUDIT_LIST_SUCCESS');
  }
}
