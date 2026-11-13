import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Milestone Timeline — FR-MTL-01..04 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'timeline.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
