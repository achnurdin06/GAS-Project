import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Weekly Snapshot — FR-SNAP-01..04 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'snapshot.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
