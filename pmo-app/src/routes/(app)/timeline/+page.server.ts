import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Project Timeline — FR-GANTT-01..07 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'timeline.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
