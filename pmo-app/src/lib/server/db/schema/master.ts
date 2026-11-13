// Master data & pengaturan sistem (PRD §7.5, §9.2)
import { text, uuid, boolean, integer, jsonb, unique } from 'drizzle-orm/pg-core';
import { pmo } from '../pmo';

export const masterCategories = pmo.table('master_categories', {
	code: text('code').primaryKey(), // WORK_ITEM_STATUS, RAID_TYPE, ...
	name: text('name').notNull()
});

export const masterValues = pmo.table(
	'master_values',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		categoryCode: text('category_code')
			.notNull()
			.references(() => masterCategories.code),
		value: text('value').notNull(),
		sortOrder: integer('sort_order').notNull().default(0),
		isSystem: boolean('is_system').notNull().default(false), // dipakai logika → tidak boleh di-rename
		isActive: boolean('is_active').notNull().default(true)
	},
	(t) => [unique().on(t.categoryCode, t.value)]
);

/** key-value config: rag_thresholds, status_progress_map, snapshot_cron, timezone. */
export const settings = pmo.table('settings', {
	key: text('key').primaryKey(),
	value: jsonb('value').notNull()
});
