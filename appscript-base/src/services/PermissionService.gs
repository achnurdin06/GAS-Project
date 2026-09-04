class PermissionService {
  constructor() {
    this.permRepo = new PermissionRepository();
    this.auditService = new AuditService();
  }

  getAllPermissions() {
    try {
      const ss = this.permRepo.getSpreadsheet();
      if (ss && typeof syncMenuPermissions === 'function') {
        syncMenuPermissions(ss);
      }
    } catch (e) {
      LoggerUtil.warn('PermissionService', 'Sync permissions fallback warning', e);
    }
    const perms = this.permRepo.find(row => String(row.status).trim().toUpperCase() === 'ACTIVE');
    return Response.success('List permission berhasil diambil', perms, 'PERMISSION_LIST_SUCCESS');
  }

  createPermission(permData, actorId = 'SYSTEM') {
    if (!permData.role_id || !permData.permission_code) {
      return Response.error('Role ID dan Permission Code wajib diisi', 'VALIDATION_ERROR');
    }

    const newPerm = {
      id: Utils.generateUuid(),
      role_id: String(permData.role_id).trim().toUpperCase(),
      permission_code: String(permData.permission_code).trim().toUpperCase(),
      permission_name: permData.permission_name || permData.permission_code,
      status: 'ACTIVE'
    };

    const inserted = this.permRepo.insert(newPerm, actorId);
    this.auditService.log('PERMISSION', 'CREATE', 'SUCCESS', actorId, `Permission created: ${newPerm.permission_code} for ${newPerm.role_id}`, inserted.id);

    return Response.success('Permission berhasil dibuat', inserted, 'PERMISSION_CREATE_SUCCESS');
  }

  deletePermission(permId, actorId = 'SYSTEM') {
    if (!permId) return Response.error('Permission ID wajib diisi', 'VALIDATION_ERROR');
    const success = this.permRepo.deleteById(permId, actorId);
    if (!success) return Response.error('Gagal menghapus permission', 'PERMISSION_NOT_FOUND');

    this.auditService.log('PERMISSION', 'DELETE', 'SUCCESS', actorId, `Permission deleted: ${permId}`, permId);
    return Response.success('Permission berhasil dihapus', null, 'PERMISSION_DELETE_SUCCESS');
  }

  createPermissionsForPrefix(prefix, roleId = 'ROLE_SUPER_ADMIN', permissionName = null, status = 'ACTIVE', actorId = 'SYSTEM') {
    if (!prefix) return Response.error('Prefix wajib diisi', 'VALIDATION_ERROR');
    const cleanPrefix = String(prefix).trim().toUpperCase();
    const cleanRole = String(roleId || 'ROLE_SUPER_ADMIN').trim().toUpperCase();
    const suffixes = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT'];
    const created = [];

    suffixes.forEach(suffix => {
      const permCode = `${cleanPrefix}_${suffix}`;
      const exists = this.permRepo.find(row => 
        String(row.role_id).trim().toUpperCase() === cleanRole && 
        String(row.permission_code).trim().toUpperCase() === permCode &&
        String(row.status).trim().toUpperCase() === 'ACTIVE'
      );
      if (exists.length === 0) {
        const newPerm = {
          id: Utils.generateUuid(),
          role_id: cleanRole,
          permission_code: permCode,
          permission_name: permissionName ? `${permissionName} - ${suffix}` : `${permCode} Permission`,
          status: status
        };
        const inserted = this.permRepo.insert(newPerm, actorId);
        created.push(inserted);
      }
    });

    this.auditService.log('PERMISSION', 'CREATE_PREFIX', 'SUCCESS', actorId, `Permissions created for prefix: ${cleanPrefix} and role: ${cleanRole}`, cleanPrefix);
    return Response.success('Prefix permission berhasil dibuat', created, 'PERMISSION_PREFIX_CREATE_SUCCESS');
  }

  deletePermissionsByPrefix(prefix, actorId = 'SYSTEM') {
    if (!prefix) return Response.error('Prefix wajib diisi', 'VALIDATION_ERROR');
    const cleanPrefix = String(prefix).trim().toUpperCase();

    const toDelete = this.permRepo.find(row => {
      const code = String(row.permission_code).trim().toUpperCase();
      return code.startsWith(`${cleanPrefix}_`) || code === cleanPrefix;
    });

    let deletedCount = 0;
    toDelete.forEach(row => {
      const success = this.permRepo.deleteById(row.id, actorId);
      if (success) deletedCount++;
    });

    this.auditService.log('PERMISSION', 'DELETE_PREFIX', 'SUCCESS', actorId, `Deleted ${deletedCount} permissions for prefix: ${cleanPrefix}`, cleanPrefix);
    return Response.success(`Berhasil menghapus ${deletedCount} records permission`, null, 'PERMISSION_PREFIX_DELETE_SUCCESS');
  }
}
