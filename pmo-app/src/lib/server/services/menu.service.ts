import { asc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { menus } from '#lib/server/db/schema.ts';
import { writeAudit } from './audit.service.ts';

export interface MenuRow {
	id: string;
	parentId: string | null;
	label: string;
	icon: string | null;
	route: string | null;
	sortOrder: number;
	permissionCode: string | null;
	isActive: boolean;
}

export interface MenuInput {
	parentId: string | null;
	label: string;
	icon: string | null;
	route: string | null;
	sortOrder: number;
	permissionCode: string | null;
	isActive: boolean;
}

export interface Actor {
	userId: string;
	roleCodes: string[];
	ip: string;
}

export class MenuServiceError extends Error {
	constructor(
		message: string,
		public field?: string
	) {
		super(message);
	}
}

export async function listMenus(): Promise<MenuRow[]> {
	return db.select().from(menus).orderBy(asc(menus.sortOrder));
}

export async function getMenu(id: string): Promise<MenuRow | null> {
	const [r] = await db.select().from(menus).where(eq(menus.id, id));
	return r ?? null;
}

export async function createMenu(input: MenuInput, actor: Actor) {
	return db.transaction(async (tx) => {
		const [created] = await tx.insert(menus).values(input).returning();
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'create',
			entityType: 'menu',
			entityId: created.id,
			after: created,
			ip: actor.ip
		});
		return created;
	});
}

export async function updateMenu(id: string, input: MenuInput, actor: Actor) {
	const [existing] = await db.select().from(menus).where(eq(menus.id, id));
	if (!existing) throw new MenuServiceError('Menu tidak ditemukan');
	return db.transaction(async (tx) => {
		const [updated] = await tx.update(menus).set(input).where(eq(menus.id, id)).returning();
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'update',
			entityType: 'menu',
			entityId: id,
			before: existing,
			after: updated,
			ip: actor.ip
		});
		return updated;
	});
}

export async function deleteMenu(id: string, actor: Actor) {
	const [existing] = await db.select().from(menus).where(eq(menus.id, id));
	if (!existing) throw new MenuServiceError('Menu tidak ditemukan');
	// delete children first
	return db.transaction(async (tx) => {
		await tx.delete(menus).where(eq(menus.parentId, id));
		await tx.delete(menus).where(eq(menus.id, id));
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'delete',
			entityType: 'menu',
			entityId: id,
			before: existing,
			ip: actor.ip
		});
	});
}

/** Build nested menu tree filtered by permission. */
export async function buildMenuForRoles(roleCodes: string[], authzPerms: Set<string>) {
	const rows = await db
		.select()
		.from(menus)
		.where(eq(menus.isActive, true))
		.orderBy(asc(menus.sortOrder));
	const byParent = new Map<string | null, MenuRow[]>();
	for (const r of rows) {
		const key = r.parentId;
		if (!byParent.has(key)) byParent.set(key, []);
		byParent.get(key)!.push(r);
	}
	function hasPerm(code: string | null) {
		if (!code) return true;
		return authzPerms.has(code);
	}
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
			const kids = build(c.id);
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
	return build(null);
}
