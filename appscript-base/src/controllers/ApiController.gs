/**
 * Central API Controller for google.script.run Client Handlers
 */
function apiLogin(payload) {
  try {
    return new AuthService().login(payload.email, payload.password);
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiLogin failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiVerify2FA(payload) {
  try {
    return new AuthService().verify2FA(payload.email, payload.otp_code);
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiVerify2FA failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiLogout(payload) {
  try {
    return new AuthService().logout(payload ? payload.token : null, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiLogout failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiGetMenu(payload) {
  try {
    const actorId = payload && payload.actor_id ? payload.actor_id : 'SYSTEM';
    return new MenuService().getUserMenu(actorId);
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetMenu failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// USERS CRUD
function apiGetUsers(payload) {
  try {
    return new UserService().getAllUsers(payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetUsers failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiCreateUser(payload) {
  try {
    checkApiPermission(payload, 'USER_CREATE');
    return new UserService().createUser(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiCreateUser failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiUpdateUser(payload) {
  try {
    checkApiPermission(payload, 'USER_UPDATE');
    return new UserService().updateUser(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiUpdateUser failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeleteUser(payload) {
  try {
    checkApiPermission(payload, 'USER_DELETE');
    return new UserService().deleteUser(payload.userId || payload.user_id, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiDeleteUser failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// ROLES CRUD
function apiGetRoles(payload) {
  try {
    return new RoleService().getAllRoles();
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetRoles failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiCreateRole(payload) {
  try {
    checkApiPermission(payload, 'ROLE_CREATE');
    return new RoleService().createRole(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiCreateRole failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeleteRole(payload) {
  try {
    checkApiPermission(payload, 'ROLE_DELETE');
    return new RoleService().deleteRole(payload.role_id || payload.id, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiDeleteRole failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiGetRoleDetails(payload) {
  try {
    return new RoleService().getRoleDetails(payload.role_id || payload.id);
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetRoleDetails failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiUpdateRole(payload) {
  try {
    checkApiPermission(payload, 'ROLE_UPDATE');
    return new RoleService().updateRole(payload.role_id || payload.id, payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiUpdateRole failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDuplicateRole(payload) {
  try {
    checkApiPermission(payload, 'ROLE_CREATE');
    return new RoleService().duplicateRole(payload.role_id || payload.id, payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiDuplicateRole failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// PERMISSIONS CRUD
function apiGetPermissions(payload) {
  try {
    return new PermissionService().getAllPermissions();
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetPermissions failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiBatchUpdateRolePermissions(payload) {
  try {
    checkApiPermission(payload, 'PERMISSION_CREATE');
    const roleService = new RoleService();
    const actorId = payload ? payload.actor_id : 'SYSTEM';
    const prefixes = payload.prefixes || [];
    for (const rCode in payload.matrix) {
      const allCodesForRole = payload.matrix[rCode] || [];
      prefixes.forEach(prefix => {
        const filteredCodes = allCodesForRole.filter(code => 
          code.toUpperCase().startsWith(prefix.toUpperCase() + '_')
        );
        roleService.saveRolePermissionsForPrefixes(rCode, prefix, filteredCodes, actorId);
      });
    }
    return Response.success('Matrix hak akses berhasil diperbarui', null, 'PERMISSION_MATRIX_BATCH_UPDATE_SUCCESS');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiBatchUpdateRolePermissions failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiCreatePermission(payload) {
  try {
    checkApiPermission(payload, 'PERMISSION_CREATE');
    return new PermissionService().createPermission(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiCreatePermission failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeletePermission(payload) {
  try {
    checkApiPermission(payload, 'PERMISSION_DELETE');
    return new PermissionService().deletePermission(payload.perm_id || payload.id, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiDeletePermission failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiCreatePermissionsForPrefix(payload) {
  try {
    checkApiPermission(payload, 'PERMISSION_CREATE');
    return new PermissionService().createPermissionsForPrefix(
      payload.prefix,
      payload.role_id || 'ROLE_SUPER_ADMIN',
      payload.permission_name || null,
      payload.status || 'ACTIVE',
      payload ? payload.actor_id : 'SYSTEM'
    );
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiCreatePermissionsForPrefix failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeletePermissionsByPrefix(payload) {
  try {
    checkApiPermission(payload, 'PERMISSION_DELETE');
    return new PermissionService().deletePermissionsByPrefix(payload.prefix, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiDeletePermissionsByPrefix failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// SYSTEM CONFIG CRUD
function apiGetConfigs(payload) {
  try {
    return new ConfigService().getAllConfigs();
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetConfigs failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiUpdateConfig(payload) {
  try {
    checkApiPermission(payload, 'CONFIG_UPDATE');
    return new ConfigService().updateConfig(payload.config_id, payload.config_value, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiUpdateConfig failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiUpdateConfigsBatch(payload) {
  try {
    checkApiPermission(payload, 'CONFIG_UPDATE');
    return new ConfigService().updateConfigsBatch(payload.updates, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiUpdateConfigsBatch failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// AUDIT LOGS
function apiGetAuditLogs(payload) {
  try {
    return new AuditService().getAuditLogs(100);
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetAuditLogs failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// MENU MANAGEMENT CRUD
function apiGetAllMenus(payload) {
  try {
    return new MenuService().getAllMenus();
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetAllMenus failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiCreateMenu(payload) {
  try {
    checkApiPermission(payload, 'MENU_CREATE');
    return new MenuService().createMenu(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiCreateMenu failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiUpdateMenu(payload) {
  try {
    checkApiPermission(payload, 'MENU_UPDATE');
    return new MenuService().updateMenu(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiUpdateMenu failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeleteMenu(payload) {
  try {
    checkApiPermission(payload, 'MENU_DELETE');
    return new MenuService().deleteMenu(payload.menu_id || payload.id, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiDeleteMenu failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// DASHBOARD ANALYTICS
function apiGetDashboardData(payload) {
  try {
    const actorId = payload ? payload.actor_id : 'SYSTEM';
    const forceRefresh = payload ? !!payload.force_refresh : false;
    return new DashboardService().getDashboardData(actorId, forceRefresh);
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetDashboardData failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// PUBLIC AUTH EXTENSIONS
function apiRegisterUser(payload) {
  try {
    return new AuthService().registerUser(payload);
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiRegisterUser failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiForgotPassword(payload) {
  try {
    return new AuthService().forgotPassword(payload.email);
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiForgotPassword failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function checkApiPermission(payload, requiredPermission) {
  const actorId = payload && payload.actor_id ? payload.actor_id : 'SYSTEM';
  if (!new AuthService().verifyPermission(actorId, requiredPermission)) {
    throw new Error('Akses Ditolak: Anda tidak memiliki permission ' + requiredPermission);
  }
}
