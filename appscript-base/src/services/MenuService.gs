/**
 * AppScript Enterprise Framework (AEF)
 * Menu Service (PRD Section 11, 12 & 14)
 * Configuration & Metadata Driven Dynamic Menu Service
 */

class MenuService {
  constructor() {
    this.menuRepo = new MenuRepository();
    this.permissionRepo = new PermissionRepository();
  }

  /**
   * Returns metadata-driven menus filtered by user role permissions.
   * @param {string} roleId 
   * @returns {Object} Standard Response JSON
   */
  getMenuForUser(roleId) {
    const allMenus = this.menuRepo.getSortedMenus();

    // Fetch permitted codes for role
    let permittedCodes = [];
    if (roleId === 'ROLE_ADMIN' || roleId === 'SUPERADMIN') {
      permittedCodes = null; // Superadmin has access to all active menus
    } else {
      const perms = this.permissionRepo.findByRoleId(roleId);
      permittedCodes = perms.map(p => p.permission_code);
    }

    const filteredMenus = allMenus.filter(menu => {
      if (!menu.permission_code || permittedCodes === null) return true;
      return permittedCodes.includes(menu.permission_code);
    });

    // Build hierarchical tree (Parent -> Children)
    const tree = this.buildMenuTree(filteredMenus);

    return Response.success('Menu berhasil dimuat', tree, 'MENU_LOAD_SUCCESS');
  }

  /**
   * Helper to structure list into parent-child tree.
   * @param {Object[]} menuList 
   * @returns {Object[]}
   */
  buildMenuTree(menuList) {
    const map = {};
    const tree = [];

    menuList.forEach(item => {
      map[item.id || item.menu_id] = { ...item, children: [] };
    });

    menuList.forEach(item => {
      const currentId = item.id || item.menu_id;
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[currentId]);
      } else {
        tree.push(map[currentId]);
      }
    });

    return tree;
  }
}
