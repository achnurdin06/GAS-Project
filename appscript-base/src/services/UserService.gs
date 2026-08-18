class UserService {
  constructor() {
    this.userRepo = new UserRepository();
    this.auditService = new AuditService();
  }

  getAllUsers(actorId = 'SYSTEM') {
    const users = this.userRepo.find(row => String(row.status).trim().toUpperCase() === 'ACTIVE');
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      username: u.username || '',
      force_password_change: u.force_password_change === true || u.force_password_change === 'TRUE' || u.force_password_change === 1 || u.force_password_change === '1' ? 1 : 0,
      role_id: u.role_id,
      status: u.status,
      created_at: u.created_at
    }));

    return Response.success('List user berhasil diambil', safeUsers, 'USER_LIST_SUCCESS');
  }

  createUser(userData, actorId = 'SYSTEM') {
    if (!userData.name || !userData.email || !userData.password || !userData.username) {
      return Response.error('Nama, Email, Username, dan Password wajib diisi', 'VALIDATION_ERROR');
    }

    const existingEmail = this.userRepo.findByEmail(userData.email);
    if (existingEmail) {
      return Response.error('Email sudah terdaftar', 'USER_ALREADY_EXISTS');
    }

    const existingUsername = this.userRepo.find(row => String(row.username).trim().toLowerCase() === String(userData.username).trim().toLowerCase());
    if (existingUsername.length > 0) {
      return Response.error('Username sudah digunakan', 'USERNAME_ALREADY_EXISTS');
    }

    const newUser = {
      id: Utils.generateUuid(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      username: String(userData.username).trim().toLowerCase(),
      force_password_change: userData.force_password_change ? 'TRUE' : 'FALSE',
      password_hash: Utils.hashSha256(userData.password),
      role_id: userData.role_id || 'ROLE_USER',
      status: 'ACTIVE'
    };

    const inserted = this.userRepo.insert(newUser, actorId);
    this.auditService.log('USER', 'CREATE', 'SUCCESS', actorId, `User created: ${inserted.email}`, inserted.id);

    return Response.success('User berhasil dibuat', { id: inserted.id, name: inserted.name, email: inserted.email }, 'USER_CREATE_SUCCESS');
  }

  updateUser(updatePayload, actorId = 'SYSTEM') {
    const userId = updatePayload.user_id || updatePayload.id;
    if (!userId) return Response.error('User ID wajib diisi', 'VALIDATION_ERROR');

    const existing = this.userRepo.findById(userId);
    if (!existing) return Response.error('User tidak ditemukan', 'USER_NOT_FOUND');

    const updateFields = {};
    if (updatePayload.name !== undefined) updateFields.name = updatePayload.name;
    if (updatePayload.email !== undefined) updateFields.email = updatePayload.email;
    if (updatePayload.phone !== undefined) updateFields.phone = updatePayload.phone;
    if (updatePayload.force_password_change !== undefined) {
      updateFields.force_password_change = updatePayload.force_password_change ? 'TRUE' : 'FALSE';
    }
    if (updatePayload.role_id !== undefined) updateFields.role_id = updatePayload.role_id;
    if (updatePayload.password) updateFields.password_hash = Utils.hashSha256(updatePayload.password);

    const success = this.userRepo.updateById(userId, updateFields, actorId);
    if (!success) return Response.error('Gagal memperbarui user', 'SYSTEM_ERROR');

    this.auditService.log('USER', 'UPDATE', 'SUCCESS', actorId, `User updated: ${userId}`, userId);
    return Response.success('Data user berhasil diperbarui', null, 'USER_UPDATE_SUCCESS');
  }

  deleteUser(userId, actorId = 'SYSTEM') {
    if (!userId) return Response.error('User ID wajib diisi', 'VALIDATION_ERROR');
    const existing = this.userRepo.findById(userId);
    if (!existing) return Response.error('User tidak ditemukan', 'USER_NOT_FOUND');

    const success = this.userRepo.deleteById(userId, actorId);
    if (!success) return Response.error('Gagal menghapus user', 'SYSTEM_ERROR');

    this.auditService.log('USER', 'DELETE', 'SUCCESS', actorId, `User soft deleted: ${userId}`, userId);
    return Response.success('User berhasil dihapus', null, 'USER_DELETE_SUCCESS');
  }
}
