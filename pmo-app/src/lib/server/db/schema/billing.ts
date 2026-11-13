// Billing Termin & relasi termin ↔ milestone (PRD §7.16)
import { text, uuid, date, numeric, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { pmo } from '../pmo';
import { user } from '../auth.schema';
import { projects, milestones } from './project';

export const billingTerms = pmo.table('billing_terms', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	code: text('code').notNull().unique(), // TRM-001
	customer: text('customer'),
	stage: text('stage').notNull(), // Termin / Billing Stage
	description: text('description'),
	amount: numeric('amount', { precision: 18, scale: 2, mode: 'number' }).notNull(),
	plannedBillingDate: date('planned_billing_date'),
	actualInvoiceDate: date('actual_invoice_date'),
	invoiceNumber: text('invoice_number'), // hanya Finance
	invoiceEvidenceUrl: text('invoice_evidence_url'), // hanya Finance
	invoiceStatus: text('invoice_status').notNull().default('Draft'), // Draft | Issued | Cancelled
	paymentStatus: text('payment_status').notNull().default('Unpaid'), // Unpaid | Partially Paid | Paid | Overdue
	calcLinkedCount: integer('calc_linked_count').notNull().default(0),
	calcCompletedCount: integer('calc_completed_count').notNull().default(0),
	calcEvidenceVerifiedCount: integer('calc_evidence_verified_count').notNull().default(0),
	calcReadiness: text('calc_readiness').notNull().default('No Milestone Linked')
});

export const billingTermMilestones = pmo.table(
	'billing_term_milestones',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		billingTermId: uuid('billing_term_id')
			.notNull()
			.references(() => billingTerms.id, { onDelete: 'cascade' }),
		milestoneId: uuid('milestone_id')
			.notNull()
			.references(() => milestones.id, { onDelete: 'restrict' }),
		evidenceUrl: text('evidence_url'),
		evidenceType: text('evidence_type'), // BAST, Berita Acara, UAT sign-off, ...
		evidenceDate: date('evidence_date'),
		verifiedBy: text('verified_by').references(() => user.id),
		verifiedAt: timestamp('verified_at', { withTimezone: true }),
		verificationStatus: text('verification_status').notNull().default('Not Checked'), // Not Checked | Verified | Rejected
		notes: text('notes')
	},
	(t) => [unique('btm_term_ms').on(t.billingTermId, t.milestoneId)]
);
