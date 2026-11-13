import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { auditLogs, user, userProfiles } from '#lib/server/db/schema.ts';
import { writeAudit } from './audit.service';

export const MAX_FAILED_ATTEMPTS = 5;
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export type LoginGate =
	| { ok: true; userId: string | null }
	| { ok: false; reason: 'locked' | 'inactive'; userId: string; until?: Date };

/** Cek status akun sebelum mencoba password. Email tak dikenal → lolos (jawaban gagal tetap generik). */
export async function checkLoginAllowed(email: string): Promise<LoginGate> {
	const [row] = await db
		.select({ id: user.id, status: userProfiles.status, lockedUntil: userProfiles.lockedUntil })
		.from(user)
		.leftJoin(userProfiles, eq(userProfiles.userId, user.id))
		.where(eq(sql`lower(${user.email})`, email.toLowerCase()));
	if (!row) return { ok: true, userId: null };
	if (row.status === 'Inactive') return { ok: false, reason: 'inactive', userId: row.id };
	if (row.status === 'Locked') {
		if (row.lockedUntil && row.lockedUntil.getTime() <= Date.now()) {
			await db
				.update(userProfiles)
				.set({ status: 'Active', lockedUntil: null })
				.where(eq(userProfiles.userId, row.id));
			await writeAudit(db, {
				userId: row.id,
				action: 'account_unlocked',
				entityType: 'user',
				entityId: row.id
			});
			return { ok: true, userId: row.id };
		}
		return { ok: false, reason: 'locked', userId: row.id, until: row.lockedUntil ?? undefined };
	}
	return { ok: true, userId: row.id };
}

/** Catat login gagal; kunci akun bila ≥5 kegagalan dalam 15 menit (FR-AUTH-07). Mengembalikan true jika terkunci. */
export async function recordLoginFailure(
	email: string,
	userId: string | null,
	ip: string | null
): Promise<boolean> {
	return db.transaction(async (tx) => {
		await writeAudit(tx, {
			userId,
			action: 'login_failed',
			entityType: 'user',
			entityId: userId ?? undefined,
			after: userId ? undefined : { email },
			ip
		});
		if (!userId) return false;

		// Hitungan dimulai dari login sukses / buka-kunci terakhir, maksimal 15 menit ke belakang.
		const windowStart = new Date(Date.now() - ATTEMPT_WINDOW_MS);
		const [reset] = await tx
			.select({ at: auditLogs.occurredAt })
			.from(auditLogs)
			.where(
				and(
					eq(auditLogs.entityType, 'user'),
					eq(auditLogs.entityId, userId),
					inArray(auditLogs.action, ['login', 'account_unlocked'])
				)
			)
			.orderBy(desc(auditLogs.occurredAt))
			.limit(1);
		const since = reset && reset.at > windowStart ? reset.at : windowStart;
		const [{ n }] = await tx
			.select({ n: sql<number>`count(*)::int` })
			.from(auditLogs)
			.where(
				and(
					eq(auditLogs.entityType, 'user'),
					eq(auditLogs.entityId, userId),
					eq(auditLogs.action, 'login_failed'),
					gte(auditLogs.occurredAt, since)
				)
			);
		if (n < MAX_FAILED_ATTEMPTS) return false;

		const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
		await tx
			.update(userProfiles)
			.set({ status: 'Locked', lockedUntil })
			.where(eq(userProfiles.userId, userId));
		await writeAudit(tx, {
			userId,
			action: 'account_locked',
			entityType: 'user',
			entityId: userId,
			after: { lockedUntil },
			ip
		});
		return true;
	});
}

/** Catat login sukses & reset hitungan gagal (dengan membuka kunci yang sudah kedaluwarsa). */
export async function recordLoginSuccess(userId: string, ip: string | null) {
	await db.transaction(async (tx) => {
		await tx
			.update(userProfiles)
			.set({ lastLoginAt: new Date(), lockedUntil: null })
			.where(eq(userProfiles.userId, userId));
		await writeAudit(tx, { userId, action: 'login', entityType: 'user', entityId: userId, ip });
	});
}

export async function mustChangePassword(userId: string): Promise<boolean> {
	const [p] = await db
		.select({ v: userProfiles.mustChangePassword })
		.from(userProfiles)
		.where(eq(userProfiles.userId, userId));
	return p?.v ?? false;
}

export async function completePasswordChange(userId: string, ip: string | null) {
	await db.transaction(async (tx) => {
		await tx
			.update(userProfiles)
			.set({ mustChangePassword: false })
			.where(eq(userProfiles.userId, userId));
		await writeAudit(tx, {
			userId,
			action: 'password_changed',
			entityType: 'user',
			entityId: userId,
			ip
		});
	});
}
