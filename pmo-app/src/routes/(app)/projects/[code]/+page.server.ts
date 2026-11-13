import { requirePermission } from '#lib/server/rbac/index.ts';
import type { PageServerLoad } from './$types';

// Project Detail — FR-PRJ-03: tab Overview · Milestone · Task · Work Item · RAID · CR · Budget · Gate · Billing · Snapshot
export const load: PageServerLoad = async ({ locals, params }) => {
	requirePermission(locals, 'project.view');
	// TODO: cari project by code, lalu requirePermission(locals, 'project.view', project.id) untuk cek scope
	return { code: params.code };
};
