import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { auditLogs, user } from '#lib/server/db/schema.ts';
import type { Paged } from '#lib/schemas/list-query.ts';

/** `db` atau transaksi dari `db.transaction()`. */
type Executor = Pick<typeof db, 'insert'>;

export interface AuditEntry {
	userId?: string | null;
	action: string; // create | update | delete | login | login_failed | logout | ...
	entityType?: string;
	entityId?: string;
	before?: unknown;
	after?: unknown;
	ip?: string | null;
}

/** Tulis audit append-only (FR-AUD-01/02/04). Panggil di dalam transaksi yang sama dengan perubahan data. */
export async function writeAudit(tx: Executor, e: AuditEntry) {
	await tx.insert(auditLogs).values({
		userId: e.userId ?? null,
		action: e.action,
		entityType: e.entityType ?? null,
		entityId: e.entityId ?? null,
		before: e.before ?? null,
		after: e.after ?? null,
		ip: e.ip ?? null
	});
}

export interface AuditRow {
	id: number;
	occurredAt: Date;
	userId: string | null;
	userName: string | null;
	userEmail: string | null;
	action: string;
	entityType: string | null;
	entityId: string | null;
	before: unknown;
	after: unknown;
	ip: string | null;
}

export interface AuditFilters {
	userId?: string;
	action?: string;
	entityType?: string;
	entityId?: string;
	/** Tanggal bisnis YYYY-MM-DD (Asia/Jakarta), inklusif. */
	from?: string;
	to?: string;
}

export interface AuditQuery {
	page: number;
	pageSize: number;
	q?: string;
}

const SORTABLE = { occurredAt: auditLogs.occurredAt, action: auditLogs.action } as const;

export async function listAudit(
	q: AuditQuery,
	f: AuditFilters,
	dir: 'asc' | 'desc' = 'desc',
	sort?: string
): Promise<Paged<AuditRow>> {
	const conds: SQL[] = [];
	if (f.userId) conds.push(eq(auditLogs.userId, f.userId));
	if (f.action) conds.push(eq(auditLogs.action, f.action));
	if (f.entityType) conds.push(eq(auditLogs.entityType, f.entityType));
	if (f.entityId) conds.push(eq(auditLogs.entityId, f.entityId));
	// Batas hari dihitung pada zona waktu Asia/Jakarta.
	if (f.from)
		conds.push(gte(auditLogs.occurredAt, sql`(${f.from}::date AT TIME ZONE 'Asia/Jakarta')`));
	if (f.to)
		conds.push(lte(auditLogs.occurredAt, sql`((${f.to}::date + 1) AT TIME ZONE 'Asia/Jakarta')`));
	if (q.q) {
		const like = `%${q.q.replace(/[%_\\]/g, '\\$&')}%`;
		conds.push(
			or(ilike(auditLogs.entityId, like), ilike(auditLogs.action, like), ilike(auditLogs.ip, like))!
		);
	}
	const where = conds.length ? and(...conds) : undefined;

	const sortCol = SORTABLE[sort as keyof typeof SORTABLE] ?? auditLogs.occurredAt;
	const order = dir === 'asc' ? asc(sortCol) : desc(sortCol);

	const rows = await db
		.select({
			id: auditLogs.id,
			occurredAt: auditLogs.occurredAt,
			userId: auditLogs.userId,
			userName: user.name,
			userEmail: user.email,
			action: auditLogs.action,
			entityType: auditLogs.entityType,
			entityId: auditLogs.entityId,
			before: auditLogs.before,
			after: auditLogs.after,
			ip: auditLogs.ip
		})
		.from(auditLogs)
		.leftJoin(user, eq(user.id, auditLogs.userId))
		.where(where)
		.orderBy(order, desc(auditLogs.id))
		.limit(q.pageSize)
		.offset((q.page - 1) * q.pageSize);

	const [{ total }] = await db
		.select({ total: sql<number>`count(*)::int` })
		.from(auditLogs)
		.where(where);

	return { rows, total, page: q.page, pageSize: q.pageSize };
}

export async function listAuditFacets() {
	const [actions, entityTypes, users] = await Promise.all([
		db.selectDistinct({ v: auditLogs.action }).from(auditLogs).orderBy(asc(auditLogs.action)),
		db
			.selectDistinct({ v: auditLogs.entityType })
			.from(auditLogs)
			.orderBy(asc(auditLogs.entityType)),
		db
			.select({ id: user.id, name: user.name, email: user.email })
			.from(user)
			.orderBy(asc(user.name))
	]);
	return {
		actions: actions.map((a) => a.v).filter((v): v is string => !!v),
		entityTypes: entityTypes.map((a) => a.v).filter((v): v is string => !!v),
		users
	};
}

export async function getAuditEntry(id: number): Promise<AuditRow | null> {
	const [row] = await db
		.select({
			id: auditLogs.id,
			occurredAt: auditLogs.occurredAt,
			userId: auditLogs.userId,
			userName: user.name,
			userEmail: user.email,
			action: auditLogs.action,
			entityType: auditLogs.entityType,
			entityId: auditLogs.entityId,
			before: auditLogs.before,
			after: auditLogs.after,
			ip: auditLogs.ip
		})
		.from(auditLogs)
		.leftJoin(user, eq(user.id, auditLogs.userId))
		.where(eq(auditLogs.id, id));
	return row ?? null;
}
