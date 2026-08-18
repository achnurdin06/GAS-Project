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

    // 1. Expiration check
    const todayStr = Utils.formatIsoDate().split('T')[0];
    if (user.expired_at && user.expired_at < todayStr) {
      this.auditService.log('AUTH', 'LOGIN', 'FAILED', user.id, `Login failed: Account expired for ${email} (${user.expired_at})`);
      return Response.error('Akun Anda telah melewati masa berlaku. Silakan hubungi administrator.', 'AUTH_ACCOUNT_EXPIRED');
    }

    const inputHash = Utils.hashSha256(password);
    if (user.password_hash !== inputHash) {
      this.auditService.log('AUTH', 'LOGIN', 'FAILED', user.id, `Login failed: Invalid password for ${email}`);
      return Response.error('Email atau password tidak valid', 'AUTH_LOGIN_FAILED');
    }

    // 2. 2FA Check
    const is2FaEnabled = user.two_fa_enabled === 'TRUE' || user.two_fa_enabled === true || user.two_fa_enabled === '1' || user.two_fa_enabled === 1;
    if (is2FaEnabled) {
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const pendingSession = {
        userId: user.id,
        email: user.email,
        otpCode: otpCode,
        timestamp: Utils.formatIsoDate()
      };
      
      try {
        const cache = CacheService.getScriptCache();
        cache.put(`PENDING_2FA_${user.email.toLowerCase()}`, JSON.stringify(pendingSession), 300); // 5 mins
        
        // Send email
        const appName = 'AEF Enterprise';
        const subject = `[${appName}] Kode Verifikasi 2FA Anda`;
        const body = `Halo ${user.name},\n\nKode verifikasi Two-Factor Authentication (2FA) Anda adalah: ${otpCode}\n\nKode ini berlaku selama 5 menit. Harap tidak menyebarkan kode ini kepada siapa pun.\n\nSalam,\nSistem ${appName}`;
        MailApp.sendEmail(user.email, subject, body);
        
        this.auditService.log('AUTH', '2FA_SENT', 'SUCCESS', user.id, `2FA OTP code sent to ${user.email}`);
      } catch (e) {
        LoggerUtil.error('AuthService', 'Failed to store 2FA pending session or send email', e);
        return Response.error('Gagal mengirimkan kode 2FA. Silakan hubungi administrator.', 'SYSTEM_ERROR');
      }
      
      return Response.success('Masukkan kode 2FA yang dikirim ke email Anda', { email: user.email, require_2fa: true }, 'AUTH_REQUIRE_2FA');
    }

    // Standard session initialization if 2FA is not enabled
    const token = Utils.generateUuid();
    const sessionData = {
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        profile_pic_url: user.profile_pic_url || ''
      },
      permissions: this.getUserPermissions(user.role_id),
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

  verify2FA(email, otpCode) {
    if (!email || !otpCode) {
      return Response.error('Email dan kode OTP wajib diisi', 'VALIDATION_ERROR');
    }

    let pendingData = null;
    try {
      const cache = CacheService.getScriptCache();
      const cached = cache.get(`PENDING_2FA_${email.toLowerCase()}`);
      if (cached) {
        pendingData = JSON.parse(cached);
      }
    } catch (e) {
      LoggerUtil.error('AuthService', 'Failed to read 2FA cache', e);
    }

    if (!pendingData || pendingData.otpCode !== String(otpCode).trim()) {
      return Response.error('Kode OTP tidak valid atau telah kedaluwarsa', 'AUTH_2FA_FAILED');
    }

    // Create session
    const user = this.userRepo.findById(pendingData.userId);
    if (!user) {
      return Response.error('User tidak ditemukan', 'USER_NOT_FOUND');
    }

    // Clean 2FA cache
    try {
      const cache = CacheService.getScriptCache();
      cache.remove(`PENDING_2FA_${email.toLowerCase()}`);
    } catch (e) {}

    const token = Utils.generateUuid();
    const sessionData = {
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        profile_pic_url: user.profile_pic_url || ''
      },
      permissions: this.getUserPermissions(user.role_id),
      logged_in_at: Utils.formatIsoDate()
    };

    try {
      const cache = CacheService.getScriptCache();
      cache.put(`SESSION_${token}`, JSON.stringify(sessionData), 28800);
    } catch (e) {
      LoggerUtil.warn('AuthService', 'CacheService unavailable', e);
    }

    this.auditService.log('AUTH', '2FA_VERIFY', 'SUCCESS', user.id, `2FA verified and login success for ${user.email}`, token);
    return Response.success('2FA Terverifikasi, login berhasil', sessionData, 'AUTH_LOGIN_SUCCESS');
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

  getUserPermissions(roleId) {
    if (!roleId) return [];
    const rId = String(roleId).trim().toUpperCase();
    if (rId === 'ROLE_SUPER_ADMIN' || rId === 'ROLE_ADMIN') {
      return [
        'DASHBOARD_VIEW', 'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
        'ROLE_VIEW', 'ROLE_CREATE', 'ROLE_DELETE', 'PERMISSION_VIEW', 'PERMISSION_CREATE',
        'PERMISSION_DELETE', 'CONFIG_VIEW', 'CONFIG_UPDATE', 'AUDIT_VIEW',
        'MENU_VIEW', 'MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE'
      ];
    }
    try {
      const userPerms = new PermissionRepository().findByRoleId(rId);
      return userPerms.map(p => String(p.permission_code).trim().toUpperCase());
    } catch (e) {
      LoggerUtil.error('AuthService', 'Failed to retrieve permissions for role: ' + rId, e);
      return [];
    }
  }
}
