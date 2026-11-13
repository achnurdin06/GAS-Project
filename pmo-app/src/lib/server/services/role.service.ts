import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { roles, permissions, rolePermissions, userRoles } from '#lib/server/db/schema.ts';
import { writeAudit } from './audit.service.ts';
import type { RoleInput, RolePermissionGrant } from '#lib/schemas/role.schema.ts';

export interface Actor {
	userId: string;
	roleCodes: string[];
	ip: string;
}

export class RoleServiceError extends Error {
	constructor(
		message: string,
		public field?: string
	) {
		super(message);
	}
}

export interface RoleRow {
	id: string;
	code: string;
	name: string;
	description: string | null;
	isSystem: boolean;
	isActive: boolean;
	permissionCount: number;
}

export interface PermissionRow {
	id: string;
	code: string;
	resource: string;
	action: string;
	description: string | null;
}

export interface RoleDetail {
	id: string;
	code: string;
	name: string;
	description: string | null;
	isSystem: boolean;
	isActive: boolean;
	grants: { permissionId: string; code: string; scope: 'all' | 'assigned' }[];
}

export async function listRoles(): Promise<RoleRow[]> {
	const rows = await db.select().from(roles).orderBy(asc(roles.name));
	const counts = await db.select({ roleId: rolePermissions.roleId }).from(rolePermissions);
	const map = new Map<string, number>();
	for (const c of counts) map.set(c.roleId, (map.get(c.roleId) ?? 0) + 1);
	return rows.map((r) => ({
		id: r.id,
		code: r.code,
		name: r.name,
		description: r.description,
		isSystem: r.isSystem,
		isActive: r.isActive,
		permissionCount: map.get(r.id) ?? 0
	}));
}

export async function listPermissions(): Promise<PermissionRow[]> {
	return db
		.select({
			id: permissions.id,
			code: permissions.code,
			resource: permissions.resource,
			action: permissions.action,
			description: permissions.description
		})
		.from(permissions)
		.orderBy(asc(permissions.resource), asc(permissions.action));
}

export async function getRole(id: string): Promise<RoleDetail | null> {
	const [r] = await db.select().from(roles).where(eq(roles.id, id));
	if (!r) return null;
	const grants = await db
		.select({
			permissionId: rolePermissions.permissionId,
			code: permissions.code,
			scope: rolePermissions.scope
		})
		.from(rolePermissions)
		.innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
		.where(eq(rolePermissions.roleId, id));
	return {
		id: r.id,
		code: r.code,
		name: r.name,
		description: r.description,
		isSystem: r.isSystem,
		isActive: r.isActive,
		grants: grants.map((g) => ({
			permissionId: g.permissionId,
			code: g.code,
			scope: g.scope as 'all' | 'assigned'
		}))
	};
}

export async function createRole(input: RoleInput, actor: Actor) {
	const [dupe] = await db.select().from(roles).where(eq(roles.code, input.code));
	if (dupe) throw new RoleServiceError('Kode role sudah digunakan', 'code');
	return db.transaction(async (tx) => {
		const [created] = await tx
			.insert(roles)
			.values({
				code: input.code,
				name: input.name,
				description: input.description,
				isActive: input.isActive
			})
			.returning();
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'create',
			entityType: 'role',
			entityId: created.id,
			after: created,
			ip: actor.ip
		});
		return created;
	});
}

export async function updateRole(id: string, input: RoleInput, actor: Actor) {
	const [existing] = await db.select().from(roles).where(eq(roles.id, id));
	if (!existing) throw new RoleServiceError('Role tidak ditemukan');
	if (existing.isSystem && input.code !== existing.code) {
		throw new RoleServiceError('Kode role sistem tidak dapat diubah', 'code');
	}
	const [other] = await db.select().from(roles).where(eq(roles.code, input.code));
	if (other && other.id !== id) throw new RoleServiceError('Kode role sudah digunakan', 'code');

	return db.transaction(async (tx) => {
		const [updated] = await tx
			.update(roles)
			.set({
				code: input.code,
				name: input.name,
				description: input.description,
				isActive: input.isActive
			})
			.where(eq(roles.id, id))
			.returning();
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'update',
			entityType: 'role',
			entityId: id,
			before: existing,
			after: updated,
			ip: actor.ip
		});
		return updated;
	});
}

export async function deleteRole(id: string, actor: Actor) {
	const [existing] = await db.select().from(roles).where(eq(roles.id, id));
	if (!existing) throw new RoleServiceError('Role tidak ditemukan');
	if (existing.isSystem) throw new RoleServiceError('Role sistem tidak dapat dihapus');
	// still allow delete even if has perms (cascade). But check user_roles usage
	const [assigned] = await db.select().from(userRoles).where(eq(userRoles.roleId, id)).limit(1);
	if (assigned) throw new RoleServiceError('Role masih digunakan user; nonaktifkan saja');
	return db.transaction(async (tx) => {
		await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
		await tx.delete(roles).where(eq(roles.id, id));
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'delete',
			entityType: 'role',
			entityId: id,
			before: existing,
			ip: actor.ip
		});
	});
}

export async function setRolePermissions(
	roleId: string,
	grants: RolePermissionGrant[],
	actor: Actor
) {
	const [role] = await db.select().from(roles).where(eq(roles.id, roleId));
	if (!role) throw new RoleServiceError('Role tidak ditemukan');
	if (role.isSystem && role.code === 'SUPER_ADMIN') {
		// cannot reduce super admin? PRD: cannot reduce permission. We'll block removing all? Simpler: block changes entirely for SUPER_ADMIN.
		throw new RoleServiceError('Permission Super Admin tidak dapat diubah');
	}
	// validate permission ids
	const ids = grants.map((g) => g.permissionId);
	if (ids.length) {
		const found = await db
			.select({ id: permissions.id })
			.from(permissions)
			.where(inArray(permissions.id, ids));
		if (found.length !== new Set(ids).size) throw new RoleServiceError('Permission tidak valid');
	}
	const before = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
	return db.transaction(async (tx) => {
		await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
		if (grants.length) {
			await tx
				.insert(rolePermissions)
				.values(grants.map((g) => ({ roleId, permissionId: g.permissionId, scope: g.scope })));
		}
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'update',
			entityType: 'role_permissions',
			entityId: roleId,
			before,
			after: grants,
			ip: actor.ip
		});
	});
}
