/**
 * AppScript Enterprise Framework (AEF)
 * User Service
 */

class UserService {
  constructor() {
    this.userRepo = new UserRepository();
    this.auditService = new AuditService();
  }

  /**
   * List all users
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  getAllUsers(actorId) {
    const users = this.userRepo.find({ status: 'ACTIVE' });
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role_id: u.role_id,
      status: u.status,
      created_at: u.created_at
    }));

    return Response.success('List user berhasil diambil', safeUsers, 'USER_LIST_SUCCESS');
  }

  /**
   * Create a new user
   * @param {Object} userData 
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  createUser(userData, actorId = 'SYSTEM') {
    if (!userData.email || !userData.password || !userData.name) {
      return Response.error('Nama, email, dan password wajib diisi', 'VALIDATION_ERROR');
    }

    const existing = this.userRepo.findByEmail(userData.email);
    if (existing) {
      return Response.error('Email sudah terdaftar', 'USER_ALREADY_EXISTS');
    }

    const newUser = {
      name: userData.name,
      email: userData.email,
      password_hash: Utils.hashSha256(userData.password),
      role_id: userData.role_id || 'ROLE_USER',
      status: 'ACTIVE'
    };

    const inserted = this.userRepo.insert(newUser, actorId);
    this.auditService.log('USER', 'CREATE', 'SUCCESS', actorId, `User created: ${userData.email}`, inserted.id);

    return Response.success('User berhasil dibuat', {
      id: inserted.id,
      name: inserted.name,
      email: inserted.email,
      role_id: inserted.role_id
    }, 'USER_CREATED');
  }

  /**
   * Delete user by ID
   * @param {string} userId 
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  deleteUser(userId, actorId = 'SYSTEM') {
    const success = this.userRepo.deleteById(userId, actorId);
    if (!success) {
      return Response.error('User tidak ditemukan', 'USER_NOT_FOUND');
    }
    this.auditService.log('USER', 'DELETE', 'SUCCESS', actorId, `User deleted: ${userId}`, userId);
    return Response.success('User berhasil dihapus', null, 'USER_DELETED');
  }
}
