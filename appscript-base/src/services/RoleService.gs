class RoleService {
  constructor() {
    this.roleRepo = new RoleRepository();
    this.auditService = new AuditService();
  }

  getAllRoles() {
    const roles = this.roleRepo.find(row => String(row.status).trim().toUpperCase() === 'ACTIVE');
    return Response.success('List role berhasil diambil', roles, 'ROLE_LIST_SUCCESS');
  }

  createRole(roleData, actorId = 'SYSTEM') {
    if (!roleData.role_code || !roleData.role_name) {
      return Response.error('Role Code dan Role Name wajib diisi', 'VALIDATION_ERROR');
    }

    const code = String(roleData.role_code).trim().toUpperCase();
    const existing = this.roleRepo.findByCode(code);
    if (existing) {
      return Response.error('Role Code sudah ada', 'ROLE_ALREADY_EXISTS');
    }

    const newRole = {
      id: Utils.generateUuid(),
      role_code: code,
      role_name: roleData.role_name,
      description: roleData.description || '',
      status: 'ACTIVE'
    };

    const inserted = this.roleRepo.insert(newRole, actorId);
    this.auditService.log('ROLE', 'CREATE', 'SUCCESS', actorId, `Role created: ${code}`, inserted.id);

    return Response.success('Role berhasil dibuat', inserted, 'ROLE_CREATE_SUCCESS');
  }

  deleteRole(roleId, actorId = 'SYSTEM') {
    if (!roleId) return Response.error('Role ID wajib diisi', 'VALIDATION_ERROR');
    const success = this.roleRepo.deleteById(roleId, actorId);
    if (!success) return Response.error('Gagal menghapus role', 'ROLE_NOT_FOUND');

    this.auditService.log('ROLE', 'DELETE', 'SUCCESS', actorId, `Role deleted: ${roleId}`, roleId);
    return Response.success('Role berhasil dihapus', null, 'ROLE_DELETE_SUCCESS');
  }
}
