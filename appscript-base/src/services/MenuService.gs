class MenuService {
  constructor() {
    this.menuRepo = new MenuRepository();
    this.permRepo = new PermissionRepository();
    this.userRepo = new UserRepository();
  }

  getUserMenu(actorId = 'SYSTEM') {
    const activeMenus = this.menuRepo.findActiveMenus();
    let allowedPermCodes = null;

    if (actorId && actorId !== 'SYSTEM' && actorId !== 'ANONYMOUS') {
      const user = this.userRepo.findById(actorId);
      if (user && user.role_id) {
        if (user.role_id !== 'ROLE_ADMIN') {
          const userPerms = this.permRepo.findByRoleId(user.role_id);
          allowedPermCodes = userPerms.map(p => String(p.permission_code).trim().toUpperCase());
        }
      }
    }

    const filteredMenus = activeMenus.filter(m => {
      if (!allowedPermCodes) return true; // ROLE_ADMIN or SYSTEM sees all
      if (!m.permission_code) return true;
      return allowedPermCodes.includes(String(m.permission_code).trim().toUpperCase());
    });

    const parents = filteredMenus.filter(m => !m.parent_id);
    const result = parents.map(parent => {
      const children = filteredMenus.filter(child => child.parent_id === parent.menu_id);
      return {
        id: parent.menu_id,
        code: parent.menu_code,
        name: parent.menu_name,
        route: parent.route,
        icon: parent.icon,
        sort_order: parent.sort_order,
        children: children.map(c => ({
          id: c.menu_id,
          code: c.menu_code,
          name: c.menu_name,
          route: c.route,
          icon: c.icon,
          sort_order: c.sort_order
        }))
      };
    });

    return Response.success('Menu metadata berhasil diambil', result, 'MENU_FETCH_SUCCESS');
  }
}
