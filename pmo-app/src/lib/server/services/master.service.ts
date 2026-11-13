import { and, asc, eq, sql, type AnyColumn, type Table } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { masterCategories, masterValues, settings } from '#lib/server/db/schema/master.ts';
import { projects, workItems } from '#lib/server/db/schema/project.ts';
import {
	raidItems,
	changeRequests,
	budgetLines,
	deliveryGates,
	weeklySnapshots
} from '#lib/server/db/schema/control.ts';
import { billingTerms, billingTermMilestones } from '#lib/server/db/schema/billing.ts';
import { writeAudit } from './audit.service.ts';
import type { MasterValueInput } from '#lib/schemas/master.schema.ts';

export interface Actor {
	userId: string;
	roleCodes: string[];
	ip: string;
}

export class MasterServiceError extends Error {
	constructor(
		message: string,
		public field?: string
	) {
		super(message);
	}
}

export interface MasterCategoryRow {
	code: string;
	name: string;
	valueCount: number;
}

export interface MasterValueRow {
	id: string;
	categoryCode: string;
	value: string;
	sortOrder: number;
	isSystem: boolean;
	isActive: boolean;
}

export interface SettingRow {
	key: string;
	value: unknown;
}

/** Daftar kategori master data. */
export async function listCategories(): Promise<MasterCategoryRow[]> {
	const cats = await db.select().from(masterCategories).orderBy(asc(masterCategories.code));
	const counts = await db
		.select({ categoryCode: masterValues.categoryCode, n: sql<number>`count(*)::int` })
		.from(masterValues)
		.groupBy(masterValues.categoryCode);
	const map = new Map(counts.map((c) => [c.categoryCode, Number(c.n)]));
	return cats.map((c) => ({ code: c.code, name: c.name, valueCount: map.get(c.code) ?? 0 }));
}

export async function listValues(categoryCode: string): Promise<MasterValueRow[]> {
	return db
		.select()
		.from(masterValues)
		.where(eq(masterValues.categoryCode, categoryCode))
		.orderBy(asc(masterValues.sortOrder), asc(masterValues.value));
}

export async function getValue(id: string): Promise<MasterValueRow | null> {
	const [r] = await db.select().from(masterValues).where(eq(masterValues.id, id));
	return r ?? null;
}

/** Pengecekan pemakaian nilai master di tabel-tabel yang relevan. */
export async function isValueInUse(categoryCode: string, value: string): Promise<boolean> {
	const checks: { table: Table; column: AnyColumn }[] = [];
	switch (categoryCode) {
		case 'WORK_ITEM_STATUS':
			checks.push({ table: workItems, column: workItems.status });
			break;
		case 'RAID_TYPE':
			checks.push({ table: raidItems, column: raidItems.type });
			break;
		case 'RAID_LEVEL':
			checks.push(
				{ table: raidItems, column: raidItems.severity },
				{ table: raidItems, column: raidItems.impact },
				{ table: raidItems, column: raidItems.probability }
			);
			break;
		case 'RAID_STATUS':
			checks.push({ table: raidItems, column: raidItems.status });
			break;
		case 'RAG_STATUS':
			checks.push(
				{ table: projects, column: projects.calcRag },
				{ table: weeklySnapshots, column: weeklySnapshots.rag }
			);
			break;
		case 'PORTFOLIO':
			checks.push({ table: projects, column: projects.portfolio });
			break;
		case 'CR_PRIORITY':
			checks.push({ table: changeRequests, column: changeRequests.priority });
			break;
		case 'CR_STATUS':
			checks.push({ table: changeRequests, column: changeRequests.status });
			break;
		case 'CR_DECISION':
			checks.push({ table: changeRequests, column: changeRequests.decision });
			break;
		case 'GATE_NAME':
			checks.push({ table: deliveryGates, column: deliveryGates.gateName });
			break;
		case 'GATE_STATUS':
			checks.push({ table: deliveryGates, column: deliveryGates.status });
			break;
		case 'INVOICE_STATUS':
			checks.push({ table: billingTerms, column: billingTerms.invoiceStatus });
			break;
		case 'PAYMENT_STATUS':
			checks.push({ table: billingTerms, column: billingTerms.paymentStatus });
			break;
		case 'EVIDENCE_STATUS':
			checks.push({
				table: billingTermMilestones,
				column: billingTermMilestones.verificationStatus
			});
			break;
		case 'COST_CATEGORY':
			checks.push({ table: budgetLines, column: budgetLines.costCategory });
			break;
		case 'CURRENCY':
			checks.push({ table: budgetLines, column: budgetLines.currency });
			break;
		default:
			return false;
	}
	for (const c of checks) {
		const [row] = await db
			.select({ n: sql<number>`count(*)::int` })
			.from(c.table)
			.where(eq(c.column, value));
		if (Number(row?.n ?? 0) > 0) return true;
	}
	return false;
}

export async function createValue(input: MasterValueInput, actor: Actor) {
	const [dupe] = await db
		.select()
		.from(masterValues)
		.where(
			and(eq(masterValues.categoryCode, input.categoryCode), eq(masterValues.value, input.value))
		);
	if (dupe) throw new MasterServiceError('Nilai sudah ada di kategori ini', 'value');
	return db.transaction(async (tx) => {
		const [created] = await tx
			.insert(masterValues)
			.values({
				categoryCode: input.categoryCode,
				value: input.value,
				sortOrder: input.sortOrder,
				isSystem: input.isSystem,
				isActive: input.isActive
			})
			.returning();
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'create',
			entityType: 'master_value',
			entityId: created.id,
			after: created,
			ip: actor.ip
		});
		return created;
	});
}

export async function updateValue(id: string, input: MasterValueInput, actor: Actor) {
	const [existing] = await db.select().from(masterValues).where(eq(masterValues.id, id));
	if (!existing) throw new MasterServiceError('Nilai tidak ditemukan');
	if (existing.isSystem && input.value !== existing.value) {
		throw new MasterServiceError('Nilai sistem tidak dapat di-rename', 'value');
	}
	const [other] = await db
		.select()
		.from(masterValues)
		.where(
			and(eq(masterValues.categoryCode, input.categoryCode), eq(masterValues.value, input.value))
		);
	if (other && other.id !== id)
		throw new MasterServiceError('Nilai sudah ada di kategori ini', 'value');

	return db.transaction(async (tx) => {
		const [updated] = await tx
			.update(masterValues)
			.set({
				categoryCode: input.categoryCode,
				value: input.value,
				sortOrder: input.sortOrder,
				isSystem: input.isSystem,
				isActive: input.isActive
			})
			.where(eq(masterValues.id, id))
			.returning();
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'update',
			entityType: 'master_value',
			entityId: id,
			before: existing,
			after: updated,
			ip: actor.ip
		});
		return updated;
	});
}

export async function deleteValue(id: string, actor: Actor) {
	const [existing] = await db.select().from(masterValues).where(eq(masterValues.id, id));
	if (!existing) throw new MasterServiceError('Nilai tidak ditemukan');
	if (existing.isSystem) throw new MasterServiceError('Nilai sistem tidak dapat dihapus');
	if (await isValueInUse(existing.categoryCode, existing.value)) {
		throw new MasterServiceError('Nilai sudah dipakai, hanya dapat dinonaktifkan');
	}
	return db.transaction(async (tx) => {
		await tx.delete(masterValues).where(eq(masterValues.id, id));
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'delete',
			entityType: 'master_value',
			entityId: id,
			before: existing,
			ip: actor.ip
		});
	});
}

export async function listSettings(): Promise<SettingRow[]> {
	const rows = await db.select().from(settings).orderBy(asc(settings.key));
	return rows.map((r) => ({ key: r.key, value: r.value }));
}

export async function getSetting(key: string): Promise<unknown> {
	const [r] = await db.select().from(settings).where(eq(settings.key, key));
	return r?.value ?? null;
}

export async function updateSetting(key: string, value: unknown, actor: Actor) {
	const [existing] = await db.select().from(settings).where(eq(settings.key, key));
	return db.transaction(async (tx) => {
		if (existing) {
			const [updated] = await tx
				.update(settings)
				.set({ value: value as unknown as never })
				.where(eq(settings.key, key))
				.returning();
			await writeAudit(tx, {
				userId: actor.userId,
				action: 'update',
				entityType: 'setting',
				entityId: key,
				before: existing.value,
				after: updated.value,
				ip: actor.ip
			});
			return updated;
		}
		const [created] = await tx
			.insert(settings)
			.values({ key, value: value as unknown as never })
			.returning();
		await writeAudit(tx, {
			userId: actor.userId,
			action: 'create',
			entityType: 'setting',
			entityId: key,
			after: created.value,
			ip: actor.ip
		});
		return created;
	});
}

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
