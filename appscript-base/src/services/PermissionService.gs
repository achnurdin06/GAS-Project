class PermissionService {
  constructor() {
    this.permRepo = new PermissionRepository();
    this.auditService = new AuditService();
  }

  getAllPermissions() {
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
}
