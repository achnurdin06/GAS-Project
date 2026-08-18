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
    return new UserService().createUser(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiCreateUser failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiUpdateUser(payload) {
  try {
    return new UserService().updateUser(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiUpdateUser failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeleteUser(payload) {
  try {
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
    return new RoleService().createRole(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiCreateRole failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeleteRole(payload) {
  try {
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
    return new RoleService().updateRole(payload.role_id || payload.id, payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiUpdateRole failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDuplicateRole(payload) {
  try {
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

function apiCreatePermission(payload) {
  try {
    return new PermissionService().createPermission(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiCreatePermission failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeletePermission(payload) {
  try {
    return new PermissionService().deletePermission(payload.perm_id || payload.id, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiDeletePermission failed', err);
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
    return new ConfigService().updateConfig(payload.config_id, payload.config_value, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiUpdateConfig failed', err);
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
    return new MenuService().createMenu(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiCreateMenu failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiUpdateMenu(payload) {
  try {
    return new MenuService().updateMenu(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiUpdateMenu failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeleteMenu(payload) {
  try {
    return new MenuService().deleteMenu(payload.menu_id || payload.id, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiDeleteMenu failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// DASHBOARD ANALYTICS
function apiGetDashboardData(payload) {
  try {
    return new DashboardService().getDashboardData(payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    LoggerUtil.error('ApiController', 'apiGetDashboardData failed', err);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}
