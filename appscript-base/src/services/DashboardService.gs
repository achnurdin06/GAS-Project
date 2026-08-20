/**
 * Dashboard Service for AEF
 * Calculates real-time database stats and chart analytics from Google Sheets
 */
class DashboardService {
  constructor() {
    this.userRepo = new UserRepository();
    this.roleRepo = new RoleRepository();
    this.permRepo = new PermissionRepository();
    this.menuRepo = new MenuRepository();
    this.auditRepo = new AuditRepository();
    this.configRepo = new ConfigRepository();
  }

  getDashboardData(actorId = 'SYSTEM', forceRefresh = false) {
    const cache = CacheService.getScriptCache();
    const cacheKey = 'CACHE_DASHBOARD_ANALYTICS';
    let globalAnalytics = null;

    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        try {
          globalAnalytics = JSON.parse(cached);
        } catch(e) {}
      }
    }

    if (!globalAnalytics) {
      // 1. Live Table Counts
      const activeUsers = this.userRepo.find(r => String(r.status).trim().toUpperCase() === 'ACTIVE');
      const activeRoles = this.roleRepo.find(r => String(r.status).trim().toUpperCase() === 'ACTIVE');
      const activePerms = this.permRepo.find(r => String(r.status).trim().toUpperCase() === 'ACTIVE');
      const activeMenus = this.menuRepo.find(r => String(r.status).trim().toUpperCase() === 'ACTIVE');
      const allAuditLogs = this.auditRepo.readAll();

      const counts = {
        users: activeUsers.length,
        roles: activeRoles.length,
        permissions: activePerms.length,
        menus: activeMenus.length,
        audit: allAuditLogs.length
      };

      // 2. Audit Activity by Action (Today & All-Time)
      const now = new Date();
      const todayIso = now.toISOString().substring(0, 10);
      const todayLogs = allAuditLogs.filter(a => a.timestamp && String(a.timestamp).substring(0, 10) === todayIso);

      const logsForAction = todayLogs.length > 0 ? todayLogs : allAuditLogs;

      const actionCounts = {
        LOGIN: 0,
        VIEW: 0,
        INSERT: 0,
        UPDATE: 0,
        DELETE: 0,
        LOGOUT: 0
      };

      logsForAction.forEach(a => {
        const act = String(a.action || '').toUpperCase();
        if (act.includes('LOGIN')) actionCounts.LOGIN++;
        else if (act.includes('LOGOUT')) actionCounts.LOGOUT++;
        else if (act.includes('CREATE') || act.includes('INSERT')) actionCounts.INSERT++;
        else if (act.includes('UPDATE') || act.includes('EDIT')) actionCounts.UPDATE++;
        else if (act.includes('DELETE') || act.includes('REMOVE')) actionCounts.DELETE++;
        else actionCounts.VIEW++;
      });

      // Hourly buckets for Today's Activity Chart
      const hourlyLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
      const hourlyData = [0, 0, 0, 0, 0, 0, 0];

      todayLogs.forEach(a => {
        if (a.timestamp) {
          try {
            const logDate = new Date(a.timestamp);
            const hour = logDate.getHours();
            if (hour >= 0 && hour < 4) hourlyData[0]++;
            else if (hour >= 4 && hour < 8) hourlyData[1]++;
            else if (hour >= 8 && hour < 12) hourlyData[2]++;
            else if (hour >= 12 && hour < 16) hourlyData[3]++;
            else if (hour >= 16 && hour < 20) hourlyData[4]++;
            else if (hour >= 20 && hour < 24) hourlyData[5]++;
            else hourlyData[6]++;
          } catch (e) {}
        }
      });

      // 3. Audit Activity by Module
      const moduleCounts = {
        USER: 0,
        ROLE: 0,
        MENU: 0,
        PERMISSION: 0,
        AUDIT: 0
      };

      allAuditLogs.forEach(a => {
        const mod = String(a.module || '').toUpperCase();
        if (mod.includes('USER')) moduleCounts.USER++;
        else if (mod.includes('ROLE')) moduleCounts.ROLE++;
        else if (mod.includes('MENU')) moduleCounts.MENU++;
        else if (mod.includes('PERM')) moduleCounts.PERMISSION++;
        else if (mod.includes('AUDIT')) moduleCounts.AUDIT++;
      });

      // 4. Login Trend (Last 7 Days)
      const dates = [];
      const loginData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().substring(0, 10);
        const dayNum = d.getDate();
        const monthStr = months[d.getMonth()];
        const label = `${dayNum} ${monthStr}`;
        dates.push(label);

        const dayLogins = allAuditLogs.filter(a => {
          if (!a.timestamp) return false;
          const logDateStr = String(a.timestamp).substring(0, 10);
          const act = String(a.action || '').toUpperCase();
          return logDateStr === dateStr && act.includes('LOGIN');
        }).length;

        loginData.push(dayLogins);
      }
      
      // 6. Activity Distribution for Donut Chart
      const activityDistribution = {
        labels: ['Login', 'Logout', 'View', 'Update', 'Insert & Delete'],
        data: [
          actionCounts.LOGIN,
          actionCounts.LOGOUT,
          actionCounts.VIEW,
          actionCounts.UPDATE,
          actionCounts.INSERT + actionCounts.DELETE
        ]
      };

      // 7. Recent Activities - Limit to 100 to prevent huge payloads
      const recentActivities = [...allAuditLogs]
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
        .slice(0, 100);

      globalAnalytics = {
        counts: counts,
        auditByAction: actionCounts,
        hourlyActionTrend: {
          labels: hourlyLabels,
          data: hourlyData
        },
        auditByModule: moduleCounts,
        loginTrend: {
          labels: dates,
          data: loginData
        },
        activityDistribution: activityDistribution,
        recentActivities: recentActivities
      };
      
      try {
        const jsonString = JSON.stringify(globalAnalytics);
        if (jsonString.length < 90000) {
          cache.put(cacheKey, jsonString, 300); // 5 minutes
        }
      } catch(e) {}
    }

    // 5. User Expiration Renewal Warning Check + Current User Info (Not cached in global, real-time from memory cache)
    let renewalWarning = null;
    let currentUserInfo = null;

    if (actorId && actorId !== 'SYSTEM') {
      const currentUser = this.userRepo.findById(actorId);
      if (currentUser) {
        // Renewal Warning
        if (currentUser.expired_at) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expiry = new Date(currentUser.expired_at);
          expiry.setHours(0, 0, 0, 0);
          const diffTime = expiry.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 30) {
            renewalWarning = {
              days_left: diffDays,
              expired_at: currentUser.expired_at,
              message: `Peringatan: Masa berlaku akun Anda akan habis dalam ${diffDays} hari (pada ${currentUser.expired_at}). Silakan lakukan perpanjangan akun.`
            };
          }
        }

        // Current User Info with real role_name
        let roleName = currentUser.role_id || 'User';
        try {
          const roleRecord = this.roleRepo.findById(currentUser.role_id);
          if (roleRecord && roleRecord.role_name) roleName = roleRecord.role_name;
        } catch (e) {
          roleName = currentUser.role_id || 'User';
        }

        currentUserInfo = {
          name: currentUser.name || '',
          email: currentUser.email || '',
          role_name: roleName,
          phone: currentUser.phone || '-',
          status: currentUser.status || 'ACTIVE'
        };
      }
    }

    // 5b. Session Timeout from config
    let sessionTimeoutMinutes = 10; // default
    try {
      const allConfigs = this.configRepo.find(r => String(r.status).toUpperCase() === 'ACTIVE');
      const timeoutConfig = allConfigs.find(c => c.config_key && c.config_key.toUpperCase() === 'SESSION_TIMEOUT');
      if (timeoutConfig && timeoutConfig.config_value) {
        const parsed = parseInt(timeoutConfig.config_value, 10);
        if (!isNaN(parsed) && parsed > 0) sessionTimeoutMinutes = parsed;
      }
    } catch (e) {}

    const payload = Object.assign({}, globalAnalytics, {
      renewalWarning: renewalWarning,
      currentUserInfo: currentUserInfo,
      sessionTimeoutMinutes: sessionTimeoutMinutes
    });

    return Response.success('Dashboard analytics fetched successfully', payload, 'DASHBOARD_DATA_SUCCESS');
  }
}
