import { and, asc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { masterValues } from '#lib/server/db/schema/master.ts';

export interface MasterOption {
	value: string;
	label: string;
}

/** Nilai aktif suatu kategori master data, urut sort_order (AGENTS.md aturan 9). */
export async function listMasterOptions(categoryCode: string): Promise<MasterOption[]> {
	const rows = await db
		.select({ value: masterValues.value })
		.from(masterValues)
		.where(and(eq(masterValues.categoryCode, categoryCode), eq(masterValues.isActive, true)))
		.orderBy(asc(masterValues.sortOrder), asc(masterValues.value));
	return rows.map((r) => ({ value: r.value, label: r.value }));
}
