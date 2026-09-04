const DEFAULT_MENU_CATALOG = [
  {
    menu_code: 'MENU_DASHBOARD',
    parent_code: '',
    menu_name: 'Dashboard',
    slug: 'dashboard',
    type: 'Internal Link',
    route: '/dashboard',
    icon: 'bi-grid-1x2-fill',
    sort_order: 1,
    permission_code: 'DASHBOARD_VIEW',
    description: 'Ringkasan Statistik & Analitik Utama'
  },
  {
    menu_code: 'MENU_DASHBOARD_2',
    parent_code: '',
    menu_name: 'Dashboard 2',
    slug: 'dashboard-2',
    type: 'Internal Link',
    route: '/dashboard-2',
    icon: 'bi-grid-fill',
    sort_order: 2,
    permission_code: 'DASHBOARD2_VIEW',
    description: 'Blank Dashboard for testing'
  },
  {
    menu_code: 'MODULE_ADMINISTRATION',
    parent_code: '',
    menu_name: 'Administrasi Sistem',
    slug: 'administration',
    type: 'Module',
    route: '#',
    icon: 'bi-shield-lock-fill',
    sort_order: 3,
    permission_code: 'USER_VIEW',
    description: 'Modul Kelola Administrasi & Keamanan'
  },
  {
    menu_code: 'MENU_USER_MGMT',
    parent_code: 'MODULE_ADMINISTRATION',
    menu_name: 'User Management',
    slug: 'user-management',
    type: 'Internal Link',
    route: '/users',
    icon: 'bi-people-fill',
    sort_order: 1,
    permission_code: 'USER_VIEW',
    description: 'Kelola data dan status akun pengakses sistem'
  },
  {
    menu_code: 'MENU_ROLE_MGMT',
    parent_code: 'MODULE_ADMINISTRATION',
    menu_name: 'Role Management',
    slug: 'role-management',
    type: 'Internal Link',
    route: '/roles',
    icon: 'bi-shield-check',
    sort_order: 2,
    permission_code: 'ROLE_VIEW',
    description: 'Kelola peran dan hirarki grup akses pengguna'
  },
  {
    menu_code: 'MENU_PERM_MGMT',
    parent_code: 'MODULE_ADMINISTRATION',
    menu_name: 'Permission Control',
    slug: 'permission-management',
    type: 'Internal Link',
    route: '/permissions',
    icon: 'bi-key-fill',
    sort_order: 3,
    permission_code: 'PERMISSION_VIEW',
    description: 'Matriks pemetaan hak akses fitur aplikasi'
  },
  {
    menu_code: 'MENU_MENU_MGMT',
    parent_code: 'MODULE_ADMINISTRATION',
    menu_name: 'Menu Management',
    slug: 'menu-management',
    type: 'Internal Link',
    route: '/menus',
    icon: 'bi-menu-button-wide-fill',
    sort_order: 4,
    permission_code: 'MENU_VIEW',
    description: 'Kelola struktur dan navigasi menu aplikasi'
  },
  {
    menu_code: 'MENU_AUDIT',
    parent_code: 'MODULE_ADMINISTRATION',
    menu_name: 'Audit Trail',
    slug: 'audit-trail',
    type: 'Internal Link',
    route: '/audit',
    icon: 'bi-journal-text',
    sort_order: 5,
    permission_code: 'AUDIT_VIEW',
    description: 'Rekam riwayat dan catatan aktivitas pengguna'
  },
  {
    menu_code: 'MODULE_MASTER_DATA',
    parent_code: '',
    menu_name: 'Master Data',
    slug: 'master-data',
    type: 'Module',
    route: '#',
    icon: 'bi-database-fill-gear',
    sort_order: 4,
    permission_code: 'USER_VIEW',
    description: 'Modul Pengelolaan Referensi Master Data'
  },
  {
    menu_code: 'MENU_PROJECT_MGMT',
    parent_code: 'MODULE_MASTER_DATA',
    menu_name: 'Master Proyek',
    slug: 'projects',
    type: 'Internal Link',
    route: '/projects',
    icon: 'bi-kanban-fill',
    sort_order: 1,
    permission_code: 'PROJECT_VIEW',
    description: 'Kelola master data proyek, timeline, budget, dan status pengerjaan'
  },
  {
    menu_code: 'MENU_CUSTOMERS',
    parent_code: 'MODULE_MASTER_DATA',
    menu_name: 'Data Pelanggan',
    slug: 'customers',
    type: 'Internal Link',
    route: '/customers',
    icon: 'bi-person-vcard-fill',
    sort_order: 2,
    permission_code: 'USER_VIEW',
    description: 'Kelola direktori profil pelanggan'
  },
  {
    menu_code: 'MENU_PRODUCTS',
    parent_code: 'MODULE_MASTER_DATA',
    menu_name: 'Data Produk & Layanan',
    slug: 'products',
    type: 'Internal Link',
    route: '/products',
    icon: 'bi-box-seam-fill',
    sort_order: 3,
    permission_code: 'USER_VIEW',
    description: 'Katalog barang dan tarif layanan'
  },
  {
    menu_code: 'MENU_CATEGORIES',
    parent_code: 'MODULE_MASTER_DATA',
    menu_name: 'Kategori Produk',
    slug: 'categories',
    type: 'Internal Link',
    route: '/categories',
    icon: 'bi-tags-fill',
    sort_order: 4,
    permission_code: 'USER_VIEW',
    description: 'Pengelompokan jenis dan taksonomi produk'
  },
  {
    menu_code: 'MODULE_REPORTS',
    parent_code: '',
    menu_name: 'Laporan & Laporan',
    slug: 'reports',
    type: 'Module',
    route: '#',
    icon: 'bi-graph-up-arrow',
    sort_order: 5,
    permission_code: 'AUDIT_VIEW',
    description: 'Modul Rekapitulasi Laporan & Kinerja'
  },
  {
    menu_code: 'MENU_SALES_REPORT',
    parent_code: 'MODULE_REPORTS',
    menu_name: 'Laporan Penjualan',
    slug: 'sales-report',
    type: 'Internal Link',
    route: '/sales-report',
    icon: 'bi-bar-chart-line-fill',
    sort_order: 1,
    permission_code: 'AUDIT_VIEW',
    description: 'Rekap omset dan tren transaksi bulanan'
  },
  {
    menu_code: 'MENU_LOG_REPORT',
    parent_code: 'MODULE_REPORTS',
    menu_name: 'Laporan Aktivitas',
    slug: 'activity-log',
    type: 'Internal Link',
    route: '/activity-log',
    icon: 'bi-file-earmark-bar-graph-fill',
    sort_order: 2,
    permission_code: 'AUDIT_VIEW',
    description: 'Analisis pemakaian dan lalu lintas sistem'
  },
  {
    menu_code: 'MODULE_SETTINGS',
    parent_code: '',
    menu_name: 'Pengaturan Sistem',
    slug: 'settings',
    type: 'Module',
    route: '#',
    icon: 'bi-gear-fill',
    sort_order: 6,
    permission_code: 'CONFIG_VIEW',
    description: 'Modul Pengaturan Konfigurasi Global'
  },
  {
    menu_code: 'MENU_CONFIG',
    parent_code: 'MODULE_SETTINGS',
    menu_name: 'General Settings',
    slug: 'general-settings',
    type: 'Internal Link',
    route: '/config',
    icon: 'bi-sliders',
    sort_order: 1,
    permission_code: 'CONFIG_VIEW',
    description: 'Konfigurasi variabel umum dan sistem'
  },
  {
    menu_code: 'MENU_SYSTEM_LOGS',
    parent_code: 'MODULE_SETTINGS',
    menu_name: 'Technical Logs',
    slug: 'system-logs',
    type: 'Internal Link',
    route: '/system-logs',
    icon: 'bi-file-earmark-code-fill',
    sort_order: 2,
    permission_code: 'AUDIT_VIEW',
    description: 'Catatan error dan log eksekusi backend'
  }
];

class MenuService {
  constructor() {
    this.menuRepo = new MenuRepository();
    this.permRepo = new PermissionRepository();
    this.userRepo = new UserRepository();
    this.auditService = new AuditService();
  }

  getUserMenu(actorId = 'SYSTEM') {
    let activeMenus = this.menuRepo.findActiveMenus();

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

  syncMenuCatalog(ss) {
    if (!ss) {
      try {
        ss = this.menuRepo.getSpreadsheet();
      } catch (e) {}
    }
    if (!ss) return { added_menus: 0, updated_permissions: 0 };

    const menuSheet = ss.getSheetByName('mst_menu');
    if (!menuSheet) return { added_menus: 0, updated_permissions: 0 };

    const menuData = menuSheet.getDataRange().getValues();
    const menuHeaders = menuData[0];
    const codeIdx = menuHeaders.indexOf('menu_code');
    const idIdx = menuHeaders.indexOf('menu_id');
    const parentIdx = menuHeaders.indexOf('parent_id');

    const existingMenuMap = {};
    for (let i = 1; i < menuData.length; i++) {
      const code = String(menuData[i][codeIdx] || '').trim().toUpperCase();
      if (code) {
        existingMenuMap[code] = {
          row: i + 1,
          id: String(menuData[i][idIdx] || ''),
          parent_id: String(menuData[i][parentIdx] || '')
        };
      }
    }

    let addedMenus = 0;
    // Process top-level modules first, then child links
    const modules = DEFAULT_MENU_CATALOG.filter(item => !item.parent_code);
    const children = DEFAULT_MENU_CATALOG.filter(item => !!item.parent_code);

    const processItem = (item) => {
      const code = String(item.menu_code).trim().toUpperCase();
      if (!existingMenuMap[code]) {
        let parentId = '';
        if (item.parent_code) {
          const parentEntry = existingMenuMap[String(item.parent_code).trim().toUpperCase()];
          if (parentEntry && parentEntry.id) {
            parentId = parentEntry.id;
          } else {
            // Orphan protection fallback
            const fallbackParent = existingMenuMap['MODULE_MASTER_DATA'];
            parentId = fallbackParent ? fallbackParent.id : '';
          }
        }

        const menuId = Utils.generateUuid();
        const newRow = menuHeaders.map(h => {
          if (h === 'menu_id' || h === 'id') return menuId;
          if (h === 'parent_id') return parentId;
          if (h === 'menu_code') return code;
          if (h === 'menu_name') return item.menu_name;
          if (h === 'slug') return item.slug;
          if (h === 'type') return item.type;
          if (h === 'route') return item.route;
          if (h === 'icon') return item.icon;
          if (h === 'sort_order') return item.sort_order;
          if (h === 'permission_code') return item.permission_code;
          if (h === 'description') return item.description;
          if (h === 'status') return 'ACTIVE';
          if (h === 'created_at') return Utils.formatIsoDate();
          if (h === 'created_by') return 'SYSTEM';
          if (h === 'updated_at') return Utils.formatIsoDate();
          if (h === 'updated_by') return 'SYSTEM';
          return '';
        });
        menuSheet.appendRow(newRow);
        existingMenuMap[code] = { row: menuSheet.getLastRow(), id: menuId, parent_id: parentId };
        addedMenus++;
      }
    };

    modules.forEach(processItem);
    children.forEach(processItem);

    // Step 2: Ensure permissions exist for ROLE_SUPER_ADMIN and ROLE_ADMIN
    const permSheet = ss.getSheetByName('mst_permission');
    let addedPerms = 0;
    if (permSheet && permSheet.getLastRow() > 0) {
      const permData = permSheet.getDataRange().getValues();
      const permHeaders = permData[0];
      const pRoleIdx = permHeaders.indexOf('role_id');
      const pCodeIdx = permHeaders.indexOf('permission_code');

      const existingPermKeys = new Set();
      for (let i = 1; i < permData.length; i++) {
        const rId = String(permData[i][pRoleIdx] || '').trim().toUpperCase();
        const pCode = String(permData[i][pCodeIdx] || '').trim().toUpperCase();
        if (rId && pCode) {
          existingPermKeys.add(`${rId}:${pCode}`);
        }
      }

      const adminRoles = ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'];
      DEFAULT_MENU_CATALOG.forEach(item => {
        if (!item.permission_code) return;
        const pCode = String(item.permission_code).trim().toUpperCase();
        adminRoles.forEach(rId => {
          const key = `${rId}:${pCode}`;
          if (!existingPermKeys.has(key)) {
            const pRow = permHeaders.map(h => {
              if (h === 'id') return Utils.generateUuid();
              if (h === 'role_id') return rId;
              if (h === 'permission_code') return pCode;
              if (h === 'permission_name') return item.menu_name;
              if (h === 'created_at') return Utils.formatIsoDate();
              if (h === 'created_by') return 'SYSTEM';
              if (h === 'status') return 'ACTIVE';
              return '';
            });
            permSheet.appendRow(pRow);
            existingPermKeys.add(key);
            addedPerms++;
          }
        });
      });
    }

    // Step 3: Clear menu cache
    try {
      CacheService.getScriptCache().remove('CACHE_TABLE_mst_menu');
    } catch (e) {}

    return { added_menus: addedMenus, updated_permissions: addedPerms };
  }

  ensureProjectMenuExists(activeMenus) {
    try {
      const ss = this.menuRepo.getSpreadsheet();
      return this.syncMenuCatalog(ss);
    } catch (e) {
      LoggerUtil.error('MenuService', 'ensureProjectMenuExists wrapper failed', e);
    }
  }
}
