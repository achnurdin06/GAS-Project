class UserService {
  constructor() {
    this.userRepo = new UserRepository();
    this.auditService = new AuditService();
  }

  getAllUsers(actorId = 'SYSTEM') {
    // Show ACTIVE and INACTIVE, exclude DELETED
    const users = this.userRepo.find(row => String(row.status).trim().toUpperCase() !== 'DELETED');
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      username: u.username || '',
      force_password_change: u.force_password_change === true || u.force_password_change === 'TRUE' || u.force_password_change === 1 || u.force_password_change === '1' ? 1 : 0,
      role_id: u.role_id,
      status: u.status,
      created_at: u.created_at instanceof Date ? u.created_at.toISOString() : String(u.created_at || ''),
      expired_at: u.expired_at instanceof Date ? u.expired_at.toISOString().split('T')[0] : String(u.expired_at || ''),
      profile_pic_url: u.profile_pic_url || '',
      two_fa_enabled: u.two_fa_enabled === true || u.two_fa_enabled === 'TRUE' || u.two_fa_enabled === 1 || u.two_fa_enabled === '1' ? 1 : 0
    }));

    return Response.success('List user berhasil diambil', safeUsers, 'USER_LIST_SUCCESS');
  }

  uploadProfilePicture(base64Data, fileName, userId) {
    try {
      if (!base64Data) return '';
      let cleanBase64 = base64Data;
      let contentType = 'image/jpeg';
      if (base64Data.indexOf(';base64,') !== -1) {
        const parts = base64Data.split(';base64,');
        contentType = parts[0].split(':')[1];
        cleanBase64 = parts[1];
      }
      const decoded = Utilities.base64Decode(cleanBase64);
      const blob = Utilities.newBlob(decoded, contentType, fileName || 'profile_' + userId + '.jpg');
      
      const folderName = 'AEF_Profile_Pictures';
      const folders = DriveApp.getFoldersByName(folderName);
      let folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
      
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      // Let's get the webContentLink or fallback to a direct view link
      // For AppScript, using the drive thumbnail/view url is extremely reliable for HTML img sources.
      // E.g. https://docs.google.com/uc?export=view&id={FileID}
      return 'https://docs.google.com/uc?export=view&id=' + file.getId();
    } catch (e) {
      LoggerUtil.error('UserService', 'Failed to upload profile picture to Drive', e);
      return '';
    }
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
      status: 'ACTIVE',
      expired_at: userData.expired_at || '2027-12-31',
      profile_pic_url: '',
      two_fa_enabled: userData.two_fa_enabled ? 'TRUE' : 'FALSE',
      two_fa_secret: ''
    };

    if (userData.profile_pic_base64) {
      const picUrl = this.uploadProfilePicture(userData.profile_pic_base64, userData.profile_pic_name, newUser.id);
      if (picUrl) {
        newUser.profile_pic_url = picUrl;
      }
    }

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
    
    // Handle new fields
    if (updatePayload.expired_at !== undefined) updateFields.expired_at = updatePayload.expired_at;
    if (updatePayload.two_fa_enabled !== undefined) {
      updateFields.two_fa_enabled = updatePayload.two_fa_enabled ? 'TRUE' : 'FALSE';
    }
    if (updatePayload.status !== undefined) updateFields.status = updatePayload.status;

    if (updatePayload.profile_pic_base64) {
      const picUrl = this.uploadProfilePicture(updatePayload.profile_pic_base64, updatePayload.profile_pic_name, userId);
      if (picUrl) {
        updateFields.profile_pic_url = picUrl;
      }
    }

    const success = this.userRepo.updateById(userId, updateFields, actorId);
    if (!success) return Response.error('Gagal memperbarui user', 'SYSTEM_ERROR');

    this.auditService.log('USER', 'UPDATE', 'SUCCESS', actorId, `User updated: ${userId}`, userId);
    return Response.success('Data user berhasil diperbarui', null, 'USER_UPDATE_SUCCESS');
  }

  deleteUser(userId, actorId = 'SYSTEM') {
    if (!userId) return Response.error('User ID wajib diisi', 'VALIDATION_ERROR');
    const existing = this.userRepo.findById(userId);
    if (!existing) return Response.error('User tidak ditemukan', 'USER_NOT_FOUND');

    // Soft delete: set status to DELETED
    const success = this.userRepo.updateById(userId, { status: 'DELETED' }, actorId);
    if (!success) return Response.error('Gagal menghapus user', 'SYSTEM_ERROR');

    this.auditService.log('USER', 'DELETE', 'SUCCESS', actorId, `User soft deleted: ${userId}`, userId);
    return Response.success('User berhasil dihapus', null, 'USER_DELETE_SUCCESS');
  }
}
