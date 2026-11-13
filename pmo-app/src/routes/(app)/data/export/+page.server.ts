import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Export — FR-IMP-05..06 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'export.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
