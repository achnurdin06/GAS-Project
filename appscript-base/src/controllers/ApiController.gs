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
