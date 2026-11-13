import { db } from '#lib/server/db/index.ts';
import { auditLogs } from '#lib/server/db/schema.ts';

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
