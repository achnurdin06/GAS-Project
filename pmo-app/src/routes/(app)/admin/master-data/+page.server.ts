import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Master Data — FR-MD-01..02 (docs/PRD.md)
export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'master.view');
	// TODO: ambil data via service di src/lib/server/services/
	return {};
};
