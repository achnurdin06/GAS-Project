class MenuService {
  constructor() {
    this.menuRepo = new MenuRepository();
    this.permRepo = new PermissionRepository();
    this.userRepo = new UserRepository();
    this.auditService = new AuditService();
  }

  getUserMenu(actorId = 'SYSTEM') {
    const activeMenus = this.menuRepo.findActiveMenus();
    let allowedPermCodes = null;

    if (actorId && actorId !== 'SYSTEM' && actorId !== 'ANONYMOUS') {
      const user = this.userRepo.findById(actorId);
      if (user && user.role_id) {
        const rId = String(user.role_id).trim().toUpperCase();
        if (rId !== 'ROLE_SUPER_ADMIN' && rId !== 'ROLE_ADMIN') {
          const userPerms = this.permRepo.findByRoleId(rId);
          allowedPermCodes = userPerms.map(p => String(p.permission_code).trim().toUpperCase());
        }
      }
    }

    const filteredMenus = activeMenus.filter(m => {
      if (!allowedPermCodes) return true; // ROLE_SUPER_ADMIN & ROLE_ADMIN see ALL menus
      if (!m.permission_code) return true;
      return allowedPermCodes.includes(String(m.permission_code).trim().toUpperCase());
    });

    const parents = filteredMenus.filter(m => !m.parent_id);
    const result = parents.map(parent => {
      const children = filteredMenus.filter(child => child.parent_id === parent.menu_id);
      return {
        id: parent.menu_id,
        menu_id: parent.menu_id,
        code: parent.menu_code,
        menu_code: parent.menu_code,
        name: parent.menu_name,
        menu_name: parent.menu_name,
        slug: parent.slug || '',
        type: parent.type || 'Module',
        route: parent.route,
        icon: parent.icon,
        sort_order: parent.sort_order,
        permission_code: parent.permission_code,
        description: parent.description || '',
        children: children.map(c => ({
          id: c.menu_id,
          menu_id: c.menu_id,
          code: c.menu_code,
          menu_code: c.menu_code,
          name: c.menu_name,
          menu_name: c.menu_name,
          slug: c.slug || '',
          type: c.type || 'Module',
          route: c.route,
          icon: c.icon,
          sort_order: c.sort_order,
          permission_code: c.permission_code,
          description: c.description || ''
        }))
      };
    });

    return Response.success('Menu metadata berhasil diambil', result, 'MENU_FETCH_SUCCESS');
  }

  getAllMenus() {
    const menus = this.menuRepo.readAll()
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    return Response.success('List menu berhasil diambil', menus, 'MENU_LIST_SUCCESS');
  }

  createMenu(menuData, actorId = 'SYSTEM') {
    if (!menuData.menu_name || !menuData.route) {
      return Response.error('Nama Menu dan Route wajib diisi', 'VALIDATION_ERROR');
    }

    const menuCode = menuData.menu_code ? String(menuData.menu_code).trim().toUpperCase() : ('MENU_' + String(menuData.menu_name).toUpperCase().replace(/\s+/g, '_'));
    const slug = menuData.slug ? menuData.slug : String(menuData.menu_name).toLowerCase().replace(/\s+/g, '-');

    const newMenu = {
      menu_id: Utils.generateUuid(),
      parent_id: menuData.parent_id || '',
      menu_code: menuCode,
      menu_name: menuData.menu_name,
      slug: slug,
      type: menuData.type || 'Module',
      route: menuData.route,
      icon: menuData.icon || 'bi-circle',
      sort_order: Number(menuData.sort_order || 99),
      permission_code: menuData.permission_code || 'DASHBOARD_VIEW',
      description: menuData.description || '',
      status: menuData.status || 'ACTIVE'
    };

    const inserted = this.menuRepo.insert(newMenu, actorId);
    this.auditService.log('MENU', 'CREATE', 'SUCCESS', actorId, `Menu created: ${newMenu.menu_code}`, inserted.menu_id);

    return Response.success('Menu berhasil dibuat', inserted, 'MENU_CREATE_SUCCESS');
  }

  updateMenu(updatePayload, actorId = 'SYSTEM') {
    const menuId = updatePayload.menu_id || updatePayload.id;
    if (!menuId) return Response.error('Menu ID wajib diisi', 'VALIDATION_ERROR');

    const updateFields = {};
    if (updatePayload.menu_code) updateFields.menu_code = String(updatePayload.menu_code).trim().toUpperCase();
    if (updatePayload.menu_name) updateFields.menu_name = updatePayload.menu_name;
    if (updatePayload.slug !== undefined) updateFields.slug = updatePayload.slug;
    if (updatePayload.type) updateFields.type = updatePayload.type;
    if (updatePayload.parent_id !== undefined) updateFields.parent_id = updatePayload.parent_id;
    if (updatePayload.route) updateFields.route = updatePayload.route;
    if (updatePayload.icon) updateFields.icon = updatePayload.icon;
    if (updatePayload.sort_order !== undefined) updateFields.sort_order = Number(updatePayload.sort_order);
    if (updatePayload.permission_code) updateFields.permission_code = updatePayload.permission_code;
    if (updatePayload.description !== undefined) updateFields.description = updatePayload.description;
    if (updatePayload.status) updateFields.status = updatePayload.status;

    const success = this.menuRepo.updateById(menuId, updateFields, actorId);
    if (!success) return Response.error('Gagal memperbarui menu', 'SYSTEM_ERROR');

    this.auditService.log('MENU', 'UPDATE', 'SUCCESS', actorId, `Menu updated: ${menuId}`, menuId);
    return Response.success('Menu berhasil diperbarui', null, 'MENU_UPDATE_SUCCESS');
  }

  deleteMenu(menuId, actorId = 'SYSTEM') {
    if (!menuId) return Response.error('Menu ID wajib diisi', 'VALIDATION_ERROR');
    const success = this.menuRepo.deleteById(menuId, actorId);
    if (!success) return Response.error('Gagal menghapus menu', 'MENU_NOT_FOUND');

    this.auditService.log('MENU', 'DELETE', 'SUCCESS', actorId, `Menu deleted: ${menuId}`, menuId);
    return Response.success('Menu berhasil dihapus', null, 'MENU_DELETE_SUCCESS');
  }
}
