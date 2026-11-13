import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// My Work Items — FR-WI-04 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'work_item.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
