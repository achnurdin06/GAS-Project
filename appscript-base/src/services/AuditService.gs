class AuditService {
  constructor() {
    this.auditRepo = new AuditRepository();
  }

  log(module, action, status, userId = 'SYSTEM', description = '', referenceId = '', oldValue = null, newValue = null) {
    try {
      const record = {
        event_id: Utils.generateUuid(),
        timestamp: Utils.formatIsoDate(),
        user_id: userId,
        module: module,
        action: action,
        status: status,
        description: description,
        reference_id: referenceId || Utils.generateUuid(),
        old_value: oldValue ? JSON.stringify(oldValue) : '',
        new_value: newValue ? JSON.stringify(newValue) : ''
      };
      this.auditRepo.insert(record, userId);
    } catch (err) {
      LoggerUtil.error('AuditService', 'Failed to write audit log', err);
    }
  }

  getAuditLogs(limit = 100) {
    const logs = this.auditRepo.getRecentLogs(limit);
    return Response.success('Audit logs fetched successfully', logs, 'AUDIT_LIST_SUCCESS');
  }
}
