/**
 * AppScript Enterprise Framework (AEF)
 * Permission Service
 */

class PermissionService {
  constructor() {
    this.permRepo = new PermissionRepository();
    this.auditService = new AuditService();
  }

  /**
   * List all permissions
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  getAllPermissions(actorId) {
    const perms = this.permRepo.find({ status: 'ACTIVE' });
    return Response.success('List permission berhasil diambil', perms, 'PERM_LIST_SUCCESS');
  }

  /**
   * Create new permission
   * @param {Object} permData 
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  createPermission(permData, actorId = 'SYSTEM') {
    if (!permData.role_id || !permData.permission_code) {
      return Response.error('Role ID dan Permission Code wajib diisi', 'VALIDATION_ERROR');
    }

    const newPerm = {
      role_id: permData.role_id,
      permission_code: permData.permission_code.toUpperCase(),
      permission_name: permData.permission_name || permData.permission_code,
      status: 'ACTIVE'
    };

    const inserted = this.permRepo.insert(newPerm, actorId);
    this.auditService.log('PERMISSION', 'CREATE', 'SUCCESS', actorId, `Permission assigned: ${permData.permission_code} -> ${permData.role_id}`, inserted.id);

    return Response.success('Permission berhasil ditambahkan', inserted, 'PERMISSION_CREATED');
  }

  /**
   * Delete permission by ID
   * @param {string} permId 
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  deletePermission(permId, actorId = 'SYSTEM') {
    const success = this.permRepo.deleteById(permId, actorId);
    if (!success) return Response.error('Permission tidak ditemukan', 'PERMISSION_NOT_FOUND');
    this.auditService.log('PERMISSION', 'DELETE', 'SUCCESS', actorId, `Permission deleted: ${permId}`, permId);
    return Response.success('Permission berhasil dihapus', null, 'PERMISSION_DELETED');
  }
}
