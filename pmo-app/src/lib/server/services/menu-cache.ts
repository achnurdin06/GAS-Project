import { db } from '#lib/server/db/index.ts';
import { menus } from '#lib/server/db/schema.ts';
import { eq, asc } from 'drizzle-orm';

// Simple in-memory cache per role-code set. Invalidated on menu/role changes (manual).
const cache = new Map<string, unknown>();

export function invalidateMenuCache() {
	cache.clear();
}

export async function getMenuTreeForAuthz(authz: {
	roleCodes: string[];
	perms: Map<string, unknown>;
}) {
	const key =
		authz.roleCodes.slice().sort().join(',') + '|' + [...authz.perms.keys()].sort().join(',');
	if (cache.has(key)) return cache.get(key);
	const rows = await db
		.select()
		.from(menus)
		.where(eq(menus.isActive, true))
		.orderBy(asc(menus.sortOrder));
	const byParent = new Map<string | null, typeof rows>();
	for (const r of rows) {
		const k = r.parentId;
		if (!byParent.has(k)) byParent.set(k, []);
		byParent.get(k)!.push(r);
	}
	const hasPerm = (code: string | null) => (!code ? true : authz.perms.has(code));
	function build(parentId: string | null): {
		label: string;
		route?: string;
		icon?: string;
		children?: { label: string; route?: string; icon?: string; children?: unknown[] }[];
	}[] {
		const children = byParent.get(parentId) ?? [];
		const out: {
			label: string;
			route?: string;
			icon?: string;
			children?: { label: string; route?: string; icon?: string; children?: unknown[] }[];
		}[] = [];
		for (const c of children) {
			if (!hasPerm(c.permissionCode)) continue;
			const kids = build(c.id) as {
				label: string;
				route?: string;
				icon?: string;
				children?: unknown[];
			}[];
			if (kids.length === 0 && c.route == null && (byParent.get(c.id)?.length ?? 0) > 0) continue;
			out.push({
				label: c.label,
				route: c.route ?? undefined,
				icon: c.icon ?? undefined,
				children: kids.length ? kids : undefined
			});
		}
		return out;
	}
	const tree = build(null);
	cache.set(key, tree);
	return tree;
}
