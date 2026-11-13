// RBAC: muat permission user & cek akses di SERVER (PRD §7.3 FR-ROLE-06).
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import {
	userRoles,
	rolePermissions,
	permissions,
	roles,
	projectMembers
} from '#lib/server/db/schema.ts';
import type { PermissionCode } from '#lib/config/permissions.ts';

export interface Authz {
	roleCodes: string[];
	/** permission code → scope; 'all' menang atas 'assigned'. */
	perms: Map<string, 'all' | 'assigned'>;
	/** project id yang di-assign ke user (untuk scope 'assigned'). */
	projectIds: Set<string>;
}

export async function loadAuthz(userId: string): Promise<Authz> {
	const rows = await db
		.select({ role: roles.code, perm: permissions.code, scope: rolePermissions.scope })
		.from(userRoles)
		.innerJoin(roles, eq(roles.id, userRoles.roleId))
		.leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
		.leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
		.where(eq(userRoles.userId, userId));

	const perms = new Map<string, 'all' | 'assigned'>();
	for (const r of rows) {
		if (!r.perm || !r.scope) continue;
		if (perms.get(r.perm) !== 'all') perms.set(r.perm, r.scope);
	}
	const members = await db
		.select({ projectId: projectMembers.projectId })
		.from(projectMembers)
		.where(eq(projectMembers.userId, userId));

	return {
		roleCodes: [...new Set(rows.map((r) => r.role))],
		perms,
		projectIds: new Set(members.map((m) => m.projectId))
	};
}

/** Cek akses. Tanpa projectId → cukup punya permission (scope apa pun). */
export function can(a: Authz | undefined, code: PermissionCode, projectId?: string): boolean {
	const scope = a?.perms.get(code);
	if (!scope) return false;
	if (scope === 'all' || !projectId) return true;
	return a!.projectIds.has(projectId);
}

/** Pakai di load/action/endpoint: `requirePermission(locals, 'project.update', project.id)`. */
export function requirePermission(locals: App.Locals, code: PermissionCode, projectId?: string) {
	if (!locals.user) error(401, 'Silakan login');
	if (!can(locals.authz, code, projectId)) error(403, 'Anda tidak memiliki akses');
}

/** Filter list project sesuai scope: undefined = semua, Set = hanya id ini. */
export function projectScope(a: Authz | undefined, code: PermissionCode): Set<string> | undefined {
	return a?.perms.get(code) === 'all' ? undefined : (a?.projectIds ?? new Set());
}
