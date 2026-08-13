/**
 * AppScript Enterprise Framework (AEF)
 * Auth Service (PRD Section 8 & 9)
 */

class AuthService {
  constructor() {
    this.userRepo = new UserRepository();
    this.roleRepo = new RoleRepository();
    this.permissionRepo = new PermissionRepository();
    this.auditService = new AuditService();
  }

  /**
   * Authenticates user using email and password.
   * @param {string} email 
   * @param {string} password 
   * @returns {Object} Standard Response Object
   */
  login(email, password) {
    if (!email || !password) {
      this.auditService.log('AUTH', 'LOGIN', 'FAILED', 'GUEST', 'Missing email or password');
      return Response.error('Email dan password wajib diisi', 'AUTH_LOGIN_FAILED');
    }

    const user = this.userRepo.findByEmail(email);
    if (!user) {
      this.auditService.log('AUTH', 'LOGIN', 'FAILED', 'GUEST', `User not found: ${email}`);
      return Response.error('Email atau password tidak valid', 'AUTH_LOGIN_FAILED');
    }

    const inputHash = Utils.hashSha256(password);
    if (user.password_hash !== inputHash) {
      this.auditService.log('AUTH', 'LOGIN', 'FAILED', user.id, `Invalid password for ${email}`);
      return Response.error('Email atau password tidak valid', 'AUTH_LOGIN_FAILED');
    }

    // Generate Session
    const session = this.createSession(user);

    // Fetch User Permissions
    const permissions = this.getUserPermissions(user.role_id);

    this.auditService.log('AUTH', 'LOGIN', 'SUCCESS', user.id, `User logged in: ${email}`);

    return Response.success('Login berhasil', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id
      },
      session: session,
      permissions: permissions
    }, 'AUTH_LOGIN_SUCCESS');
  }

  /**
   * Create user session in Cache / UserProperties
   * @param {Object} user 
   * @returns {Object} Session info
   */
  createSession(user) {
    const sessionId = Utils.generateUuid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 Hours

    const sessionData = {
      session_id: sessionId,
      user_id: user.id,
      email: user.email,
      created_at: Utils.formatIsoDate(now),
      expired_at: Utils.formatIsoDate(expiresAt),
      status: 'ACTIVE'
    };

    // Store in UserProperties or Cache
    const cache = CacheService.getUserCache();
    if (cache) {
      cache.put(`AEF_SESSION_${sessionId}`, JSON.stringify(sessionData), 21600); // 6 hours
    }
    
    return sessionData;
  }

  /**
   * Validate session token
   * @param {string} sessionId 
   * @returns {Object|null}
   */
  validateSession(sessionId) {
    if (!sessionId) return null;
    const cache = CacheService.getUserCache();
    if (!cache) return null;

    const cachedStr = cache.get(`AEF_SESSION_${sessionId}`);
    if (!cachedStr) return null;

    const session = Utils.safeJsonParse(cachedStr);
    if (session && session.status === 'ACTIVE') {
      const exp = new Date(session.expired_at);
      if (exp > new Date()) {
        return session;
      }
    }
    return null;
  }

  /**
   * Destroys active session
   * @param {string} sessionId 
   * @param {string} userId 
   */
  logout(sessionId, userId) {
    if (sessionId) {
      const cache = CacheService.getUserCache();
      if (cache) {
        cache.remove(`AEF_SESSION_${sessionId}`);
      }
    }
    this.auditService.log('AUTH', 'LOGOUT', 'SUCCESS', userId || 'GUEST', 'User logged out');
    return Response.success('Logout berhasil', null, 'AUTH_LOGOUT_SUCCESS');
  }

  /**
   * Gets list of permission codes for a role
   * @param {string} roleId 
   * @returns {string[]}
   */
  getUserPermissions(roleId) {
    if (!roleId) return [];
    const perms = this.permissionRepo.findByRoleId(roleId);
    return perms.map(p => p.permission_code);
  }
}
