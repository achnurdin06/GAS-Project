import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Import Excel — FR-IMP-01..04 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'import.create');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
