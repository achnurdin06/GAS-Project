// Lampiran, Import Log, Audit Trail (PRD §7.21, §7.23)
import { text, uuid, integer, bigserial, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { pmo } from '../pmo';
import { user } from '../auth.schema';

export const attachments = pmo.table(
	'attachments',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		entityType: text('entity_type').notNull(), // work_item | milestone | billing_link | ...
		entityId: uuid('entity_id').notNull(),
		fileName: text('file_name').notNull(),
		mime: text('mime'),
		size: integer('size'),
		storageKey: text('storage_key').notNull(), // key di S3/MinIO
		uploadedBy: text('uploaded_by').references(() => user.id),
		uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('att_entity_idx').on(t.entityType, t.entityId)]
);

export const importLogs = pmo.table('import_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	fileName: text('file_name').notNull(),
	projectCode: text('project_code'),
	pmName: text('pm_name'),
	importDate: timestamp('import_date', { withTimezone: true }).notNull().defaultNow(),
	validationStatus: text('validation_status').notNull(), // Valid | Invalid | Committed | Failed
	issueNotes: text('issue_notes'),
	rowsTotal: integer('rows_total').default(0),
	rowsOk: integer('rows_ok').default(0),
	rowsFailed: integer('rows_failed').default(0),
	importedBy: text('imported_by').references(() => user.id)
});

/** Append-only. Jangan pernah UPDATE/DELETE dari aplikasi. */
export const auditLogs = pmo.table(
	'audit_logs',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
		userId: text('user_id'),
		action: text('action').notNull(), // create | update | delete | login | login_failed | ...
		entityType: text('entity_type'),
		entityId: text('entity_id'),
		before: jsonb('before'),
		after: jsonb('after'),
		ip: text('ip')
	},
	(t) => [
		index('audit_entity_idx').on(t.entityType, t.entityId),
		index('audit_time_idx').on(t.occurredAt)
	]
);
