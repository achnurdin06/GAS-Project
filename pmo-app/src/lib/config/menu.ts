// Menu default (PRD §6). Fase 0: dipakai langsung oleh sidebar.
// Fase 1: di-seed ke tabel `menus` lalu dibaca dari DB (Menu Management, FR-MENU-*).
import type { PermissionCode } from './permissions';

export interface MenuItem {
	label: string;
	route?: string;
	icon?: string;
	permission?: PermissionCode;
	children?: MenuItem[];
}

export const DEFAULT_MENU: MenuItem[] = [
	{
		label: 'Dashboard',
		icon: 'layout-dashboard',
		children: [{ label: 'Executive Dashboard', route: '/dashboard', permission: 'dashboard.view' }]
	},
	{
		label: 'Portofolio',
		icon: 'briefcase',
		children: [
			{ label: 'Project Register', route: '/projects', permission: 'project.view' },
			{ label: 'Project Timeline', route: '/timeline', permission: 'timeline.view' },
			{ label: 'Milestone Timeline', route: '/milestones', permission: 'timeline.view' },
			{ label: 'S-Curve', route: '/s-curve', permission: 'scurve.view' }
		]
	},
	{
		label: 'Kontrol',
		icon: 'shield-check',
		children: [
			{ label: 'RAID Register', route: '/raid', permission: 'raid.view' },
			{ label: 'Change Request', route: '/change-requests', permission: 'cr.view' },
			{ label: 'Budget Control', route: '/budget', permission: 'budget.view' },
			{ label: 'Delivery Gate', route: '/gates', permission: 'gate.view' },
			{ label: 'Weekly Snapshot', route: '/snapshots', permission: 'snapshot.view' }
		]
	},
	{
		label: 'Billing',
		icon: 'receipt',
		children: [{ label: 'Billing Termin', route: '/billing', permission: 'billing.view' }]
	},
	{
		label: 'Tugas Saya',
		icon: 'list-checks',
		children: [{ label: 'My Work Items', route: '/my-work', permission: 'work_item.view' }]
	},
	{
		label: 'Data',
		icon: 'database',
		children: [
			{ label: 'Import Excel', route: '/data/import', permission: 'import.create' },
			{ label: 'Import Log', route: '/data/import-log', permission: 'import.view' },
			{ label: 'Export', route: '/data/export', permission: 'export.view' }
		]
	},
	{
		label: 'Administrasi',
		icon: 'settings',
		children: [
			{ label: 'User Management', route: '/admin/users', permission: 'user.view' },
			{ label: 'Role & Permission', route: '/admin/roles', permission: 'role.view' },
			{ label: 'Menu Management', route: '/admin/menus', permission: 'menu.view' },
			{ label: 'Master Data', route: '/admin/master-data', permission: 'master.view' },
			{ label: 'Audit Trail', route: '/admin/audit', permission: 'audit.view' },
			{ label: 'Pengaturan Sistem', route: '/admin/settings', permission: 'settings.view' }
		]
	}
];

/** Filter menu sesuai permission user; grup tanpa anak yang lolos disembunyikan. */
export function filterMenu(menu: MenuItem[], has: (p: PermissionCode) => boolean): MenuItem[] {
	return menu
		.map((m) => ({ ...m, children: m.children?.filter((c) => !c.permission || has(c.permission)) }))
		.filter((m) => (m.children ? m.children.length > 0 : !m.permission || has(m.permission)));
}
