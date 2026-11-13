// Inti project: Project → Milestone → Task → Work Item (PRD §7.6–7.10, §9.2)
// Kolom berawalan `calc` diisi oleh engine (src/lib/server/engine) — jangan diisi dari form.
import {
	text,
	uuid,
	date,
	numeric,
	integer,
	boolean,
	timestamp,
	index,
	check
} from 'drizzle-orm/pg-core';
import { pmo } from '../pmo';
import { sql } from 'drizzle-orm';
import { user } from '../auth.schema';

/** Fraksi 0–1 untuk bobot & progress (100% = 1). */
const frac = (name: string) => numeric(name, { precision: 9, scale: 6, mode: 'number' });
const money = (name: string) => numeric(name, { precision: 18, scale: 2, mode: 'number' });

export const progressStatus = pmo.enum('progress_status', [
	'Not Started',
	'In Progress',
	'Completed'
]);
export const ragStatus = pmo.enum('rag_status', ['Green', 'Amber', 'Red']);
export const lifecycleStatus = pmo.enum('lifecycle_status', [
	'Draft',
	'Active',
	'On Hold',
	'Closed',
	'Cancelled'
]);

const audit = {
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
};

export const projects = pmo.table(
	'projects',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		code: text('code').notNull().unique(), // PRJ-001
		name: text('name').notNull(),
		pmUserId: text('pm_user_id').references(() => user.id),
		sponsor: text('sponsor'),
		portfolio: text('portfolio'),
		customer: text('customer'),
		contractValue: money('contract_value'),
		baselineStart: date('baseline_start').notNull(),
		baselineFinish: date('baseline_finish').notNull(),
		forecastFinish: date('forecast_finish'),
		actualStart: date('actual_start'),
		actualFinish: date('actual_finish'),
		lifecycleStatus: lifecycleStatus('lifecycle_status').notNull().default('Draft'),
		baselineLocked: boolean('baseline_locked').notNull().default(false),
		notes: text('notes'),
		// --- calc (engine) ---
		calcOverallProgress: frac('calc_overall_progress').notNull().default(0),
		calcPlannedProgress: frac('calc_planned_progress').notNull().default(0),
		calcVariance: frac('calc_variance').notNull().default(0),
		calcRag: ragStatus('calc_rag'),
		calcStatus: progressStatus('calc_status').notNull().default('Not Started'),
		calcMilestoneCount: integer('calc_milestone_count').notNull().default(0),
		calcOverdueMilestones: integer('calc_overdue_milestones').notNull().default(0),
		calcOpenHighRaid: integer('calc_open_high_raid').notNull().default(0),
		lastCalculatedAt: timestamp('last_calculated_at', { withTimezone: true }),
		...audit
	},
	(t) => [
		check('prj_dates', sql`${t.baselineFinish} >= ${t.baselineStart}`),
		index('prj_portfolio_idx').on(t.portfolio),
		index('prj_pm_idx').on(t.pmUserId)
	]
);

export const baselines = pmo.table('baselines', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	version: integer('version').notNull(),
	baselineStart: date('baseline_start').notNull(),
	baselineFinish: date('baseline_finish').notNull(),
	reason: text('reason'),
	changeRequestId: uuid('change_request_id'),
	createdBy: text('created_by').references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const milestones = pmo.table(
	'milestones',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		code: text('code').notNull().unique(), // PRJ-001-M1
		name: text('name').notNull(),
		weight: frac('weight').notNull(),
		plannedStart: date('planned_start').notNull(),
		plannedFinish: date('planned_finish').notNull(),
		actualFinish: date('actual_finish'),
		owner: text('owner'),
		acceptanceCriteria: text('acceptance_criteria'),
		evidenceUrl: text('evidence_url'),
		notes: text('notes'),
		seq: integer('seq').notNull().default(0),
		calcProgress: frac('calc_progress').notNull().default(0),
		calcStatus: progressStatus('calc_status').notNull().default('Not Started'),
		calcWeightedContribution: frac('calc_weighted_contribution').notNull().default(0),
		calcHealth: text('calc_health'),
		...audit
	},
	(t) => [
		check('ms_dates', sql`${t.plannedFinish} >= ${t.plannedStart}`),
		check('ms_weight', sql`${t.weight} between 0 and 1`),
		index('ms_project_idx').on(t.projectId),
		index('ms_finish_idx').on(t.plannedFinish)
	]
);

export const tasks = pmo.table(
	'tasks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		milestoneId: uuid('milestone_id')
			.notNull()
			.references(() => milestones.id, { onDelete: 'cascade' }),
		code: text('code').notNull().unique(), // PRJ-001-M1-T1
		name: text('name').notNull(),
		weight: frac('weight').notNull(),
		owner: text('owner'),
		plannedStart: date('planned_start').notNull(),
		plannedFinish: date('planned_finish').notNull(),
		actualStart: date('actual_start'),
		actualFinish: date('actual_finish'),
		acceptanceCriteria: text('acceptance_criteria'),
		notes: text('notes'),
		seq: integer('seq').notNull().default(0),
		calcProgress: frac('calc_progress').notNull().default(0),
		calcStatus: progressStatus('calc_status').notNull().default('Not Started'),
		calcWeightedContribution: frac('calc_weighted_contribution').notNull().default(0),
		calcEffWeight: frac('calc_eff_weight').notNull().default(0), // bobot efektif thd project
		...audit
	},
	(t) => [
		check('task_dates', sql`${t.plannedFinish} >= ${t.plannedStart}`),
		check('task_weight', sql`${t.weight} between 0 and 1`),
		index('task_ms_idx').on(t.milestoneId),
		index('task_project_idx').on(t.projectId)
	]
);

export const workItems = pmo.table(
	'work_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		milestoneId: uuid('milestone_id')
			.notNull()
			.references(() => milestones.id, { onDelete: 'cascade' }),
		taskId: uuid('task_id')
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		code: text('code').notNull().unique(), // PRJ-001-M1-T1-W1
		detail: text('detail').notNull(),
		weight: frac('weight').notNull(),
		status: progressStatus('status').notNull().default('Not Started'), // ← satu-satunya input progress
		picUserId: text('pic_user_id').references(() => user.id),
		picName: text('pic_name'), // untuk data impor yang belum punya akun
		dueDate: date('due_date'),
		evidenceUrl: text('evidence_url'),
		startedAt: timestamp('started_at', { withTimezone: true }),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		notes: text('notes'),
		updatedBy: text('updated_by').references(() => user.id),
		calcProgress: frac('calc_progress').notNull().default(0),
		calcWeightedContribution: frac('calc_weighted_contribution').notNull().default(0),
		...audit
	},
	(t) => [
		check('wi_weight', sql`${t.weight} between 0 and 1`),
		index('wi_task_idx').on(t.taskId),
		index('wi_pic_status_idx').on(t.picUserId, t.status)
	]
);

/** Log perubahan status work item → dasar histori S-Curve Actual (FR-WI-06). */
export const progressEvents = pmo.table(
	'progress_events',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workItemId: uuid('work_item_id')
			.notNull()
			.references(() => workItems.id, { onDelete: 'cascade' }),
		projectId: uuid('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		fromStatus: progressStatus('from_status'),
		toStatus: progressStatus('to_status').notNull(),
		progressAfter: frac('progress_after').notNull(),
		projectProgressAfter: frac('project_progress_after'),
		changedBy: text('changed_by').references(() => user.id),
		changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('pe_project_time_idx').on(t.projectId, t.changedAt)]
);
