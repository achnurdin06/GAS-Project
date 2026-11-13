import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Billing Termin — FR-BILL-01..08 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'billing.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
