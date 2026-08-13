/**
 * AppScript Enterprise Framework (AEF)
 * Role Service
 */

class RoleService {
  constructor() {
    this.roleRepo = new RoleRepository();
    this.auditService = new AuditService();
  }

  /**
   * List all active roles
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  getAllRoles(actorId) {
    const roles = this.roleRepo.find({ status: 'ACTIVE' });
    return Response.success('List role berhasil diambil', roles, 'ROLE_LIST_SUCCESS');
  }

  /**
   * Create a new role
   * @param {Object} roleData 
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  createRole(roleData, actorId = 'SYSTEM') {
    if (!roleData.role_code || !roleData.role_name) {
      return Response.error('Kode role dan Nama role wajib diisi', 'VALIDATION_ERROR');
    }

    const existing = this.roleRepo.findByCode(roleData.role_code);
    if (existing) {
      return Response.error('Kode role sudah ada', 'ROLE_ALREADY_EXISTS');
    }

    const newRole = {
      role_code: roleData.role_code.toUpperCase(),
      role_name: roleData.role_name,
      description: roleData.description || '',
      status: 'ACTIVE'
    };

    const inserted = this.roleRepo.insert(newRole, actorId);
    this.auditService.log('ROLE', 'CREATE', 'SUCCESS', actorId, `Role created: ${roleData.role_code}`, inserted.id);

    return Response.success('Role berhasil dibuat', inserted, 'ROLE_CREATED');
  }

  /**
   * Delete role by ID
   * @param {string} roleId 
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  deleteRole(roleId, actorId = 'SYSTEM') {
    const success = this.roleRepo.deleteById(roleId, actorId);
    if (!success) return Response.error('Role tidak ditemukan', 'ROLE_NOT_FOUND');
    this.auditService.log('ROLE', 'DELETE', 'SUCCESS', actorId, `Role deleted: ${roleId}`, roleId);
    return Response.success('Role berhasil dihapus', null, 'ROLE_DELETED');
  }
}
