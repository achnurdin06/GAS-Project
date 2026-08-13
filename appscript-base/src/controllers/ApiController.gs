/**
 * AppScript Enterprise Framework (AEF)
 * API Controllers for Client Communication (google.script.run bindings)
 */

/**
 * Handle Auth Login Request
 * @param {Object} payload { email, password }
 * @returns {Object} Standard Response
 */
function apiLogin(payload) {
  try {
    if (!payload) return Response.error('Payload request tidak boleh kosong', 'INVALID_PAYLOAD');
    const authService = new AuthService();
    return authService.login(payload.email, payload.password);
  } catch (err) {
    Logger.error('AUTH_CONTROLLER', 'apiLogin', err.message);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

/**
 * Handle Logout Request
 * @param {Object} payload { session_id, user_id }
 * @returns {Object} Standard Response
 */
function apiLogout(payload) {
  try {
    const authService = new AuthService();
    return authService.logout(payload ? payload.session_id : '', payload ? payload.user_id : '');
  } catch (err) {
    Logger.error('AUTH_CONTROLLER', 'apiLogout', err.message);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

/**
 * Handle Get Dynamic Menu Request
 * @param {Object} payload { role_id }
 * @returns {Object} Standard Response
 */
function apiGetMenu(payload) {
  try {
    const roleId = payload ? payload.role_id : 'ROLE_USER';
    const menuService = new MenuService();
    return menuService.getMenuForUser(roleId);
  } catch (err) {
    Logger.error('MENU_CONTROLLER', 'apiGetMenu', err.message);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

/**
 * Handle Get All Users Request
 * @param {Object} payload { actor_id }
 * @returns {Object} Standard Response
 */
function apiGetUsers(payload) {
  try {
    const userService = new UserService();
    return userService.getAllUsers(payload ? payload.actor_id : 'GUEST');
  } catch (err) {
    Logger.error('USER_CONTROLLER', 'apiGetUsers', err.message);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

/**
 * Handle Create User Request
 * @param {Object} payload { name, email, password, role_id, actor_id }
 * @returns {Object} Standard Response
 */
function apiCreateUser(payload) {
  try {
    if (!payload) return Response.error('Payload request tidak boleh kosong', 'INVALID_PAYLOAD');
    const userService = new UserService();
    return userService.createUser(payload, payload.actor_id || 'SYSTEM');
  } catch (err) {
    Logger.error('USER_CONTROLLER', 'apiCreateUser', err.message);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

/**
 * Handle Update User Request
 * @param {Object} payload { user_id, userId, name, email, password, role_id, actor_id }
 * @returns {Object} Standard Response
 */
function apiUpdateUser(payload) {
  try {
    const targetId = payload ? (payload.user_id || payload.userId) : null;
    if (!targetId) return Response.error('User ID wajib diisi', 'INVALID_PAYLOAD');
    const userService = new UserService();
    return userService.updateUser(targetId, payload, payload.actor_id || 'SYSTEM');
  } catch (err) {
    Logger.error('USER_CONTROLLER', 'apiUpdateUser', err.message);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

/**
 * Handle Delete User Request
 * @param {Object} payload { user_id, userId, actor_id }
 * @returns {Object} Standard Response
 */
function apiDeleteUser(payload) {
  try {
    const targetId = payload ? (payload.user_id || payload.userId) : null;
    if (!targetId) return Response.error('User ID wajib diisi', 'INVALID_PAYLOAD');
    const userService = new UserService();
    return userService.deleteUser(targetId, payload.actor_id || 'SYSTEM');
  } catch (err) {
    Logger.error('USER_CONTROLLER', 'apiDeleteUser', err.message);
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// ROLES API
function apiGetRoles(payload) {
  try {
    const service = new RoleService();
    return service.getAllRoles(payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiCreateRole(payload) {
  try {
    const service = new RoleService();
    return service.createRole(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeleteRole(payload) {
  try {
    const targetId = payload ? (payload.role_id || payload.roleId) : null;
    const service = new RoleService();
    return service.deleteRole(targetId, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// PERMISSIONS API
function apiGetPermissions(payload) {
  try {
    const service = new PermissionService();
    return service.getAllPermissions(payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiCreatePermission(payload) {
  try {
    const service = new PermissionService();
    return service.createPermission(payload, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiDeletePermission(payload) {
  try {
    const targetId = payload ? (payload.perm_id || payload.permId) : null;
    const service = new PermissionService();
    return service.deletePermission(targetId, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// CONFIG API
function apiGetConfigs(payload) {
  try {
    const service = new ConfigService();
    return service.getAllConfigs(payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

function apiUpdateConfig(payload) {
  try {
    const service = new ConfigService();
    return service.updateConfig(payload.config_id, payload.config_value, payload ? payload.actor_id : 'SYSTEM');
  } catch (err) {
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}

// AUDIT API
function apiGetAuditLogs(payload) {
  try {
    const service = new AuditService();
    return service.getAuditLogs();
  } catch (err) {
    return Response.error(err.message, 'SYSTEM_ERROR');
  }
}
