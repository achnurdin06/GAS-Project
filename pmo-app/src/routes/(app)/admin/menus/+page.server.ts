import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Menu Management — FR-MENU-01..05 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'menu.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
