class RoleService {
  constructor() {
    this.roleRepo = new RoleRepository();
    this.auditService = new AuditService();
  }

  getAllRoles() {
    // Show ACTIVE and INACTIVE, exclude DELETED
    const roles = this.roleRepo.find(row => String(row.status).trim().toUpperCase() !== 'DELETED');
    
    // Count active users using each role
    const userRepo = new UserRepository();
    const activeUsers = userRepo.find(u => String(u.status).trim().toUpperCase() !== 'DELETED');
    
    const rolesWithUserCount = roles.map(r => {
      const userCount = activeUsers.filter(u => String(u.role_id).trim().toUpperCase() === String(r.role_code).trim().toUpperCase()).length;
      return {
        id: r.id,
        role_code: r.role_code,
        role_name: r.role_name,
        description: r.description || '',
        status: r.status,
        user_count: userCount
      };
    });

    return Response.success('List role berhasil diambil', rolesWithUserCount, 'ROLE_LIST_SUCCESS');
  }

  getRoleDetails(roleId) {
    const role = this.roleRepo.findById(roleId);
    if (!role) return Response.error('Role tidak ditemukan', 'ROLE_NOT_FOUND');

    const permRepo = new PermissionRepository();
    const perms = permRepo.find(row => String(row.role_id).trim().toUpperCase() === String(role.role_code).trim().toUpperCase() && String(row.status).trim().toUpperCase() === 'ACTIVE');
    
    const userRepo = new UserRepository();
    const assignedUsers = userRepo.find(u => String(u.role_id).trim().toUpperCase() === String(role.role_code).trim().toUpperCase() && String(u.status).trim().toUpperCase() !== 'DELETED');

    const details = {
      id: role.id,
      role_code: role.role_code,
      role_name: role.role_name,
      description: role.description || '',
      status: role.status,
      permissions: perms.map(p => p.permission_code),
      assigned_users: assignedUsers.map(u => ({ id: u.id, name: u.name, email: u.email }))
    };

    return Response.success('Detail role berhasil diambil', details, 'ROLE_DETAILS_SUCCESS');
  }

  createRole(roleData, actorId = 'SYSTEM') {
    if (!roleData.role_code || !roleData.role_name) {
      return Response.error('Role Code dan Role Name wajib diisi', 'VALIDATION_ERROR');
    }

    const code = String(roleData.role_code).trim().toUpperCase();
    const existing = this.roleRepo.findByCode(code);
    if (existing && String(existing.status).trim().toUpperCase() !== 'DELETED') {
      return Response.error('Role Code sudah ada', 'ROLE_ALREADY_EXISTS');
    }

    // Reuse deleted role if exists, or insert new
    let inserted;
    const newRole = {
      role_code: code,
      role_name: roleData.role_name,
      description: roleData.description || '',
      status: roleData.status || 'ACTIVE'
    };

    if (existing) {
      this.roleRepo.updateById(existing.id, newRole, actorId);
      inserted = this.roleRepo.findById(existing.id);
    } else {
      newRole.id = Utils.generateUuid();
      inserted = this.roleRepo.insert(newRole, actorId);
    }

    // Save Permissions
    this.saveRolePermissions(code, roleData.permissions || [], actorId);

    // Save User Assignments
    this.saveRoleUserAssignments(code, roleData.assigned_users || [], actorId);

    this.auditService.log('ROLE', 'CREATE', 'SUCCESS', actorId, `Role created: ${code}`, inserted.id);
    return Response.success('Role berhasil dibuat', inserted, 'ROLE_CREATE_SUCCESS');
  }

  updateRole(roleId, roleData, actorId = 'SYSTEM') {
    const role = this.roleRepo.findById(roleId);
    if (!role) return Response.error('Role tidak ditemukan', 'ROLE_NOT_FOUND');

    const code = role.role_code;
    const updated = {
      role_name: roleData.role_name,
      description: roleData.description || '',
      status: roleData.status || 'ACTIVE'
    };

    this.roleRepo.updateById(roleId, updated, actorId);

    // Save Permissions
    this.saveRolePermissions(code, roleData.permissions || [], actorId);

    // Save User Assignments
    this.saveRoleUserAssignments(code, roleData.assigned_users || [], actorId);

    this.auditService.log('ROLE', 'UPDATE', 'SUCCESS', actorId, `Role updated: ${code}`, roleId);
    return Response.success('Role berhasil diperbarui', role, 'ROLE_UPDATE_SUCCESS');
  }

  duplicateRole(roleId, duplicateData, actorId = 'SYSTEM') {
    const role = this.roleRepo.findById(roleId);
    if (!role) return Response.error('Role sumber tidak ditemukan', 'ROLE_NOT_FOUND');

    const sourceCode = role.role_code;
    const newCode = String(duplicateData.role_code).trim().toUpperCase();

    const existing = this.roleRepo.findByCode(newCode);
    if (existing && String(existing.status).trim().toUpperCase() !== 'DELETED') {
      return Response.error('Role Code baru sudah ada', 'ROLE_ALREADY_EXISTS');
    }

    let inserted;
    const newRole = {
      role_code: newCode,
      role_name: duplicateData.role_name || ('Copy of ' + role.role_name),
      description: duplicateData.description || role.description || '',
      status: 'ACTIVE'
    };

    if (existing) {
      this.roleRepo.updateById(existing.id, newRole, actorId);
      inserted = this.roleRepo.findById(existing.id);
    } else {
      newRole.id = Utils.generateUuid();
      inserted = this.roleRepo.insert(newRole, actorId);
    }

    // Copy permissions if chosen
    if (duplicateData.copy_permissions) {
      const permRepo = new PermissionRepository();
      const perms = permRepo.find(row => String(row.role_id).trim().toUpperCase() === String(sourceCode).trim().toUpperCase() && String(row.status).trim().toUpperCase() === 'ACTIVE');
      const permCodes = perms.map(p => p.permission_code);
      this.saveRolePermissions(newCode, permCodes, actorId);
    }

    this.auditService.log('ROLE', 'DUPLICATE', 'SUCCESS', actorId, `Role duplicated from ${sourceCode} to ${newCode}`, inserted.id);
    return Response.success('Role berhasil diduplikasi', inserted, 'ROLE_DUPLICATE_SUCCESS');
  }

  deleteRole(roleId, actorId = 'SYSTEM') {
    if (!roleId) return Response.error('Role ID wajib diisi', 'VALIDATION_ERROR');
    const role = this.roleRepo.findById(roleId);
    if (!role) return Response.error('Role tidak ditemukan', 'ROLE_NOT_FOUND');

    const code = role.role_code;
    
    // Soft delete role
    this.roleRepo.updateById(roleId, { status: 'DELETED' }, actorId);

    // Deassign all users having this role
    const userRepo = new UserRepository();
    const assignedUsers = userRepo.find(u => String(u.role_id).trim().toUpperCase() === String(code).trim().toUpperCase() && String(u.status).trim().toUpperCase() !== 'DELETED');
    assignedUsers.forEach(u => {
      userRepo.updateById(u.id, { role_id: '' }, actorId);
    });

    // Soft delete permissions
    const permRepo = new PermissionRepository();
    const perms = permRepo.find(row => String(row.role_id).trim().toUpperCase() === String(code).trim().toUpperCase());
    perms.forEach(p => {
      permRepo.updateById(p.id, { status: 'DELETED' }, actorId);
    });

    this.auditService.log('ROLE', 'DELETE', 'SUCCESS', actorId, `Role soft deleted: ${code}`, roleId);
    return Response.success('Role berhasil dihapus', null, 'ROLE_DELETE_SUCCESS');
  }

  // Permission Helpers
  saveRolePermissions(roleCode, permissionCodes, actorId = 'SYSTEM') {
    const permRepo = new PermissionRepository();
    const existing = permRepo.find(row => String(row.role_id).trim().toUpperCase() === String(roleCode).trim().toUpperCase());
    
    // Deactivate/soft-delete all existing perms
    existing.forEach(p => {
      permRepo.updateById(p.id, { status: 'DELETED' }, actorId);
    });

    // Write new perms
    if (Array.isArray(permissionCodes)) {
      permissionCodes.forEach(code => {
        const newPerm = {
          id: Utils.generateUuid(),
          role_id: roleCode.toUpperCase(),
          permission_code: code.toUpperCase(),
          permission_name: code,
          status: 'ACTIVE'
        };
        permRepo.insert(newPerm, actorId);
      });
    }
  }

  // User Assignment Helpers
  saveRoleUserAssignments(roleCode, assignedUserIds, actorId = 'SYSTEM') {
    const userRepo = new UserRepository();
    const currentUsers = userRepo.find(u => String(u.role_id).trim().toUpperCase() === String(roleCode).trim().toUpperCase() && String(u.status).trim().toUpperCase() !== 'DELETED');
    
    // Deassign user if they are no longer on the list
    currentUsers.forEach(u => {
      if (!assignedUserIds.includes(u.id)) {
        userRepo.updateById(u.id, { role_id: '' }, actorId);
      }
    });

    // Assign to selected users
    if (Array.isArray(assignedUserIds)) {
      assignedUserIds.forEach(uid => {
        const u = userRepo.findById(uid);
        if (u) {
          userRepo.updateById(uid, { role_id: roleCode.toUpperCase() }, actorId);
        }
      });
    }
  }
}
