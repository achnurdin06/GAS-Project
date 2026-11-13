import { and, asc, desc, eq, exists, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { db } from '#lib/server/db/index.ts';
import {
	account,
	projectMembers,
	projects,
	roles,
	session,
	user,
	userProfiles,
	userRoles
} from '#lib/server/db/schema.ts';
import type { ListQuery, Paged } from '#lib/schemas/list-query.ts';
import type { CreateUserInput, UpdateUserInput } from '#lib/schemas/user.schema.ts';
import { writeAudit } from './audit.service';

export class UserServiceError extends Error {
	constructor(
		message: string,
		public field?: string
	) {
		super(message);
	}
}

export interface UserFilters {
	roleId?: string;
	status?: 'Active' | 'Inactive' | 'Locked';
	unit?: string;
}

export interface UserRow {
	id: string;
	name: string;
	email: string;
	username: string | null;
	title: string | null;
	unit: string | null;
	status: 'Active' | 'Inactive' | 'Locked';
	lastLoginAt: Date | null;
	roles: string[];
}

const SORTABLE = {
	name: user.name,
	email: user.email,
	unit: userProfiles.unit,
	status: userProfiles.status,
	lastLoginAt: userProfiles.lastLoginAt
} as const;

/** Password sementara memenuhi kebijakan (huruf + angka), tanpa karakter yang mudah tertukar. */
export function generateTempPassword(length = 12): string {
	const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
	const digits = '23456789';
	const all = letters + digits;
	const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
	const chars = [pick(letters), pick(digits)];
	while (chars.length < length) chars.push(pick(all));
	for (let i = chars.length - 1; i > 0; i--) {
		const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
		[chars[i], chars[j]] = [chars[j], chars[i]];
	}
	return chars.join('');
}

export async function listUsers(q: ListQuery, f: UserFilters = {}): Promise<Paged<UserRow>> {
	const conds: SQL[] = [];
	if (q.q) {
		const like = `%${q.q.replace(/[%_\\]/g, '\\$&')}%`;
		conds.push(
			or(
				ilike(user.name, like),
				ilike(user.email, like),
				ilike(userProfiles.username, like),
				ilike(userProfiles.title, like)
			)!
		);
	}
	if (f.status) conds.push(eq(userProfiles.status, f.status));
	if (f.unit) conds.push(eq(userProfiles.unit, f.unit));
	if (f.roleId) {
		conds.push(
			exists(
				db
					.select({ one: sql`1` })
					.from(userRoles)
					.where(and(eq(userRoles.userId, user.id), eq(userRoles.roleId, f.roleId)))
			)
		);
	}
	const where = conds.length ? and(...conds) : undefined;

	const sortCol = SORTABLE[q.sort as keyof typeof SORTABLE] ?? user.name;
	const order = q.dir === 'desc' ? desc(sortCol) : asc(sortCol);

	const base = db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			username: userProfiles.username,
			title: userProfiles.title,
			unit: userProfiles.unit,
			status: userProfiles.status,
			lastLoginAt: userProfiles.lastLoginAt
		})
		.from(user)
		.innerJoin(userProfiles, eq(userProfiles.userId, user.id))
		.where(where);

	const [rows, [{ total }]] = await Promise.all([
		base
			.orderBy(order, asc(user.id))
			.limit(q.pageSize)
			.offset((q.page - 1) * q.pageSize),
		db
			.select({ total: sql<number>`count(*)::int` })
			.from(user)
			.innerJoin(userProfiles, eq(userProfiles.userId, user.id))
			.where(where)
	]);

	const ids = rows.map((r) => r.id);
	const roleRows = ids.length
		? await db
				.select({ userId: userRoles.userId, name: roles.name })
				.from(userRoles)
				.innerJoin(roles, eq(roles.id, userRoles.roleId))
				.where(inArray(userRoles.userId, ids))
				.orderBy(asc(roles.name))
		: [];
	const byUser = new Map<string, string[]>();
	for (const r of roleRows) byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r.name]);

	return {
		rows: rows.map((r) => ({ ...r, roles: byUser.get(r.id) ?? [] })),
		total,
		page: q.page,
		pageSize: q.pageSize
	};
}

export async function listUnits(): Promise<string[]> {
	const rows = await db
		.selectDistinct({ unit: userProfiles.unit })
		.from(userProfiles)
		.where(sql`${userProfiles.unit} is not null and ${userProfiles.unit} <> ''`)
		.orderBy(asc(userProfiles.unit));
	return rows.map((r) => r.unit!);
}

export async function listRoleOptions() {
	return db
		.select({ id: roles.id, code: roles.code, name: roles.name })
		.from(roles)
		.where(eq(roles.isActive, true))
		.orderBy(asc(roles.name));
}

export async function listProjectOptions() {
	return db
		.select({ id: projects.id, code: projects.code, name: projects.name })
		.from(projects)
		.orderBy(asc(projects.code));
}

export async function getUser(id: string) {
	const [row] = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			username: userProfiles.username,
			title: userProfiles.title,
			unit: userProfiles.unit,
			phone: userProfiles.phone,
			status: userProfiles.status,
			lockedUntil: userProfiles.lockedUntil,
			mustChangePassword: userProfiles.mustChangePassword,
			lastLoginAt: userProfiles.lastLoginAt
		})
		.from(user)
		.innerJoin(userProfiles, eq(userProfiles.userId, user.id))
		.where(eq(user.id, id));
	if (!row) return null;
	const [roleRows, memberRows] = await Promise.all([
		db.select({ roleId: userRoles.roleId }).from(userRoles).where(eq(userRoles.userId, id)),
		db
			.select({
				projectId: projects.id,
				code: projects.code,
				name: projects.name,
				projectRole: projectMembers.projectRole
			})
			.from(projectMembers)
			.innerJoin(projects, eq(projects.id, projectMembers.projectId))
			.where(eq(projectMembers.userId, id))
			.orderBy(asc(projects.code))
	]);
	return { ...row, roleIds: roleRows.map((r) => r.roleId), projects: memberRows };
}

async function assertRolesAssignable(roleIds: string[], actorRoleCodes: string[]) {
	const found = await db
		.select({ id: roles.id, code: roles.code, isActive: roles.isActive })
		.from(roles)
		.where(inArray(roles.id, roleIds));
	if (found.length !== new Set(roleIds).size || found.some((r) => !r.isActive)) {
		throw new UserServiceError('Role tidak valid', 'roleIds');
	}
	if (found.some((r) => r.code === 'SUPER_ADMIN') && !actorRoleCodes.includes('SUPER_ADMIN')) {
		throw new UserServiceError(
			'Hanya Super Admin yang dapat memberikan role Super Admin',
			'roleIds'
		);
	}
}

export interface Actor {
	userId: string;
	roleCodes: string[];
	ip: string | null;
}

/** Buat user + akun login + role. Mengembalikan password sementara (hanya ditampilkan sekali). */
export async function createUser(input: CreateUserInput, actor: Actor) {
	await assertRolesAssignable(input.roleIds, actor.roleCodes);
	const tempPassword = generateTempPassword();
	const passwordHash = await hashPassword(tempPassword);
	const id = crypto.randomUUID();

	await db.transaction(async (tx) => {
		const [dupe] = await tx.select({ id: user.id }).from(user).where(eq(user.email, input.email));
		if (dupe) throw new UserServiceError('Email sudah terdaftar', 'email');
		if (input.username) {
			const [d] = await tx
				.select({ id: userProfiles.userId })
				.from(userProfiles)
				.where(eq(userProfiles.username, input.username));
			if (d) throw new UserServiceError('Username sudah dipakai', 'username');
		}
		await tx.insert(user).values({ id, name: input.name, email: input.email, emailVerified: true });
		await tx.insert(account).values({
			id: crypto.randomUUID(),
			accountId: id,
			providerId: 'credential',
			userId: id,
			password: passwordHash
		});
		await tx.insert(userProfiles).values({
			userId: id,
			username: input.username,
			title: input.title,
			unit: input.unit,
			phone: input.phone,
			mustChangePassword: true
		});
		await tx.insert(userRoles).values(input.roleIds.map((roleId) => ({ userId: id, roleId })));
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'create',
			entityType: 'user',
			entityId: id,
			after: { ...input },
			ip: actor.ip
		});
	});
	return { id, tempPassword };
}

export async function updateUser(id: string, input: UpdateUserInput, actor: Actor) {
	await db.transaction(async (tx) => {
		const before = await getUser(id);
		if (!before) throw new UserServiceError('User tidak ditemukan');
		if (input.username && input.username !== before.username) {
			const [d] = await tx
				.select({ id: userProfiles.userId })
				.from(userProfiles)
				.where(eq(userProfiles.username, input.username));
			if (d) throw new UserServiceError('Username sudah dipakai', 'username');
		}
		await tx.update(user).set({ name: input.name }).where(eq(user.id, id));
		await tx
			.update(userProfiles)
			.set({ username: input.username, title: input.title, unit: input.unit, phone: input.phone })
			.where(eq(userProfiles.userId, id));
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'update',
			entityType: 'user',
			entityId: id,
			before: {
				name: before.name,
				username: before.username,
				title: before.title,
				unit: before.unit,
				phone: before.phone
			},
			after: { ...input },
			ip: actor.ip
		});
	});
}

/** FR-USER-05: nonaktif = tidak bisa login; histori tetap. Sesi aktif dicabut. */
export async function setUserActive(id: string, active: boolean, actor: Actor) {
	if (!active && id === actor.userId) {
		throw new UserServiceError('Anda tidak dapat menonaktifkan akun sendiri');
	}
	await db.transaction(async (tx) => {
		const [before] = await tx
			.select({ status: userProfiles.status })
			.from(userProfiles)
			.where(eq(userProfiles.userId, id));
		if (!before) throw new UserServiceError('User tidak ditemukan');
		const status = active ? 'Active' : 'Inactive';
		await tx
			.update(userProfiles)
			.set({ status, lockedUntil: null })
			.where(eq(userProfiles.userId, id));
		if (!active) await tx.delete(session).where(eq(session.userId, id));
		await writeAudit(tx, {
			userId: actor.userId,
			action: active ? 'activate' : 'deactivate',
			entityType: 'user',
			entityId: id,
			before: { status: before.status },
			after: { status },
			ip: actor.ip
		});
	});
}

/** FR-USER-04: password sementara + paksa ganti; semua sesi dicabut; kunci dibuka. */
export async function resetPassword(id: string, actor: Actor) {
	const tempPassword = generateTempPassword();
	const passwordHash = await hashPassword(tempPassword);
	await db.transaction(async (tx) => {
		const updated = await tx
			.update(account)
			.set({ password: passwordHash, updatedAt: new Date() })
			.where(and(eq(account.userId, id), eq(account.providerId, 'credential')))
			.returning({ id: account.id });
		if (!updated.length) throw new UserServiceError('Akun login tidak ditemukan');
		await tx
			.update(userProfiles)
			.set({
				mustChangePassword: true,
				lockedUntil: null,
				status: sql`case when ${userProfiles.status} = 'Locked' then 'Active'::pmo.user_status else ${userProfiles.status} end`
			})
			.where(eq(userProfiles.userId, id));
		await tx.delete(session).where(eq(session.userId, id));
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'reset_password',
			entityType: 'user',
			entityId: id,
			ip: actor.ip
		});
	});
	return { tempPassword };
}

export async function setUserRoles(id: string, roleIds: string[], actor: Actor) {
	if (!roleIds.length) throw new UserServiceError('Pilih minimal satu role', 'roleIds');
	await assertRolesAssignable(roleIds, actor.roleCodes);
	await db.transaction(async (tx) => {
		const before = await tx
			.select({ roleId: userRoles.roleId, code: roles.code })
			.from(userRoles)
			.innerJoin(roles, eq(roles.id, userRoles.roleId))
			.where(eq(userRoles.userId, id));
		if (before.some((r) => r.code === 'SUPER_ADMIN') && !actor.roleCodes.includes('SUPER_ADMIN')) {
			throw new UserServiceError('Hanya Super Admin yang dapat mengubah role Super Admin');
		}
		await tx.delete(userRoles).where(eq(userRoles.userId, id));
		await tx
			.insert(userRoles)
			.values([...new Set(roleIds)].map((roleId) => ({ userId: id, roleId })));
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'update_roles',
			entityType: 'user',
			entityId: id,
			before: { roleIds: before.map((r) => r.roleId) },
			after: { roleIds },
			ip: actor.ip
		});
	});
}

export async function addProjectMember(
	id: string,
	input: { projectId: string; projectRole: 'PM' | 'PIC' | 'Sponsor' | 'Viewer' },
	actor: Actor
) {
	await db.transaction(async (tx) => {
		const [p] = await tx
			.select({ id: projects.id })
			.from(projects)
			.where(eq(projects.id, input.projectId));
		if (!p) throw new UserServiceError('Project tidak ditemukan', 'projectId');
		await tx
			.insert(projectMembers)
			.values({ userId: id, ...input })
			.onConflictDoNothing();
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'assign_project',
			entityType: 'user',
			entityId: id,
			after: input,
			ip: actor.ip
		});
	});
}

export async function removeProjectMember(
	id: string,
	input: { projectId: string; projectRole: 'PM' | 'PIC' | 'Sponsor' | 'Viewer' },
	actor: Actor
) {
	await db.transaction(async (tx) => {
		await tx
			.delete(projectMembers)
			.where(
				and(
					eq(projectMembers.userId, id),
					eq(projectMembers.projectId, input.projectId),
					eq(projectMembers.projectRole, input.projectRole)
				)
			);
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'unassign_project',
			entityType: 'user',
			entityId: id,
			before: input,
			ip: actor.ip
		});
	});
}
