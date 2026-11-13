import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Budget Control — FR-BUD-01..03 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'budget.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
