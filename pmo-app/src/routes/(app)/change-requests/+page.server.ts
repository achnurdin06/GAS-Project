import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Change Request — FR-CR-01..04 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'cr.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
