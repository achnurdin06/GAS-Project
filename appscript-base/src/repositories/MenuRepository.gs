class MenuRepository extends BaseRepository {
  constructor() {
    super('mst_menu');
  }

  findActiveMenus() {
    return this.find(row => String(row.status).trim().toUpperCase() === 'ACTIVE').sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  }
}
