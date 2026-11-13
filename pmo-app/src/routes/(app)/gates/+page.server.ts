import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Delivery Gate — FR-GATE-01..03 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'gate.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
