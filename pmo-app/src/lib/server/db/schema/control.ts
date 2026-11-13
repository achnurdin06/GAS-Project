// Kontrol: RAID, Change Request, Budget, Delivery Gate, Weekly Snapshot (PRD §7.11–7.15)
import {
	text,
	uuid,
	date,
	numeric,
	integer,
	boolean,
	timestamp,
	unique,
	index
} from 'drizzle-orm/pg-core';
import { pmo } from '../pmo';
import { sql } from 'drizzle-orm';
import { user } from '../auth.schema';
import { projects, ragStatus } from './project';

const frac = (name: string) => numeric(name, { precision: 9, scale: 6, mode: 'number' });
const money = (name: string) => numeric(name, { precision: 18, scale: 2, mode: 'number' });
const projectRef = () =>
	uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' });

// Nilai enum-like (Type, Severity, Status, ...) disimpan sebagai text & divalidasi ke master_values.

export const raidItems = pmo.table(
	'raid_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		projectId: projectRef(),
		code: text('code').notNull().unique(), // RAID-001
		type: text('type').notNull(), // Risk | Assumption | Issue | Dependency
		description: text('description').notNull(),
		impact: text('impact'),
		probability: text('probability'),
		severity: text('severity').notNull(), // Low | Medium | High | Critical
		owner: text('owner'),
		targetDate: date('target_date'),
		status: text('status').notNull().default('Open'), // Open | In Progress | Closed
		mitigation: text('mitigation'),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('raid_project_status_idx').on(t.projectId, t.status)]
);

export const changeRequests = pmo.table('change_requests', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: projectRef(),
	code: text('code').notNull().unique(), // CR-001
	requestDate: date('request_date').notNull(),
	requestedBy: text('requested_by'),
	description: text('description').notNull(),
	impactScope: text('impact_scope'),
	impactScheduleDays: integer('impact_schedule_days').default(0),
	impactCost: money('impact_cost').default(0),
	priority: text('priority'),
	status: text('status').notNull().default('Draft'), // Draft | Under Review | Approved | Rejected
	decision: text('decision').notNull().default('Pending'),
	approverUserId: text('approver_user_id').references(() => user.id),
	approverName: text('approver_name'),
	decisionDate: date('decision_date')
});

export const budgetLines = pmo.table('budget_lines', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: projectRef(),
	code: text('code').notNull().unique(), // BUD-001
	costCategory: text('cost_category').notNull().default('Project Cost'),
	approvedBudget: money('approved_budget').notNull().default(0),
	actualCost: money('actual_cost').notNull().default(0),
	forecastCost: money('forecast_cost').notNull().default(0),
	variance: numeric('variance', { precision: 18, scale: 2, mode: 'number' }).generatedAlwaysAs(
		sql`approved_budget - forecast_cost`
	),
	currency: text('currency').notNull().default('IDR'),
	notes: text('notes'),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const deliveryGates = pmo.table('delivery_gates', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: projectRef(),
	code: text('code').notNull().unique(), // GATE-001-1
	gateName: text('gate_name').notNull(),
	plannedDate: date('planned_date').notNull(),
	actualDate: date('actual_date'),
	status: text('status').notNull().default('Planned'), // Planned | In Progress | Approved
	approvalBy: text('approval_by'),
	evidenceUrl: text('evidence_url'),
	notes: text('notes')
});

export const weeklySnapshots = pmo.table(
	'weekly_snapshots',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		projectId: projectRef(),
		code: text('code').unique(), // SNAP-001 (data impor)
		weekEnding: date('week_ending').notNull(),
		overallProgress: frac('overall_progress').notNull(), // nilai BEKU
		plannedProgress: frac('planned_progress'),
		variance: frac('variance'),
		rag: ragStatus('rag'),
		completedThisWeek: text('completed_this_week'),
		nextWeekPlan: text('next_week_plan'),
		keyIssue: text('key_issue'),
		isClosed: boolean('is_closed').notNull().default(false),
		updatedBy: text('updated_by'),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [unique('snap_project_week').on(t.projectId, t.weekEnding)]
);
