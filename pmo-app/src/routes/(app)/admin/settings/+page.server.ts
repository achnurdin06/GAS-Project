import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Pengaturan Sistem — PRD §8, settings (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'settings.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
