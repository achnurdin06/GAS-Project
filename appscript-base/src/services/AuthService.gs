class AuthService {
  constructor() {
    this.userRepo = new UserRepository();
    this.auditService = new AuditService();
  }

  login(email, password) {
    if (!email || !password) {
      return Response.error('Email and password are required', 'VALIDATION_ERROR');
    }

    const user = this.userRepo.findByEmail(email);
    if (!user) {
      this.auditService.log('AUTH', 'LOGIN', 'FAILED', 'ANONYMOUS', `Login failed: Email ${email} not found`);
      return Response.error('Email atau password tidak valid', 'AUTH_LOGIN_FAILED');
    }

    const inputHash = Utils.hashSha256(password);
    if (user.password_hash !== inputHash) {
      this.auditService.log('AUTH', 'LOGIN', 'FAILED', user.id, `Login failed: Invalid password for ${email}`);
      return Response.error('Email atau password tidak valid', 'AUTH_LOGIN_FAILED');
    }

    const token = Utils.generateUuid();
    const sessionData = {
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id
      },
      logged_in_at: Utils.formatIsoDate()
    };

    try {
      const cache = CacheService.getScriptCache();
      cache.put(`SESSION_${token}`, JSON.stringify(sessionData), 28800);
    } catch (e) {
      LoggerUtil.warn('AuthService', 'CacheService unavailable, proceeding with memory session', e);
    }

    this.auditService.log('AUTH', 'LOGIN', 'SUCCESS', user.id, `User ${user.email} logged in successfully`, token);
    return Response.success('Login berhasil', sessionData, 'AUTH_LOGIN_SUCCESS');
  }

  logout(token, actorId = 'SYSTEM') {
    if (token) {
      try {
        const cache = CacheService.getScriptCache();
        cache.remove(`SESSION_${token}`);
      } catch (e) {}
    }
    this.auditService.log('AUTH', 'LOGOUT', 'SUCCESS', actorId, 'User logged out');
    return Response.success('Logout berhasil', null, 'AUTH_LOGOUT_SUCCESS');
  }

  verifySession(token) {
    if (!token) return null;
    try {
      const cache = CacheService.getScriptCache();
      const cached = cache.get(`SESSION_${token}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  }
}
