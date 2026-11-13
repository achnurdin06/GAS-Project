import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Role & Permission — FR-ROLE-01..07 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'role.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
