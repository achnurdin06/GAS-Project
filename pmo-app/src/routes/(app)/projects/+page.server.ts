import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Project Register — FR-PRJ-01..06 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'project.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
