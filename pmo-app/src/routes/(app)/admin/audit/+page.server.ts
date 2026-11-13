import { requirePermission } from '#lib/server/rbac/index.ts';
import { parseListQuery } from '#lib/schemas/list-query.ts';
import { listAudit, listAuditFacets } from '#lib/server/services/audit.service.ts';
import type { PageServerLoad } from './$types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Audit Trail — FR-AUD-01..04 (docs/PRD.md). Read-only: audit bersifat append-only.
export const load: PageServerLoad = async ({ locals, url }) => {
	requirePermission(locals, 'audit.view');
	const query = parseListQuery(url.searchParams);
	const dateOrUndef = (k: string) => {
		const v = url.searchParams.get(k);
		return v && DATE_RE.test(v) ? v : undefined;
	};
	const filters = {
		userId: url.searchParams.get('userId') || undefined,
		action: url.searchParams.get('action') || undefined,
		entityType: url.searchParams.get('entityType') || undefined,
		entityId: url.searchParams.get('entityId')?.trim() || undefined,
		from: dateOrUndef('from'),
		to: dateOrUndef('to')
	};

	const [list, facets] = await Promise.all([
		listAudit(query, filters, query.dir, query.sort),
		listAuditFacets()
	]);
	return { list, facets, filters, query };
};
