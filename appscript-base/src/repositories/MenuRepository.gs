/**
 * AppScript Enterprise Framework (AEF)
 * Menu Repository (mst_menu)
 */

class MenuRepository extends BaseRepository {
  constructor() {
    super('mst_menu');
  }

  /**
   * Get all active menus sorted by sort_order.
   * @returns {Object[]}
   */
  getSortedMenus() {
    const menus = this.find({ status: 'ACTIVE' });
    return menus.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  }
}
