// Roll-up progress Work Item → Task → Milestone → Project (PRD §8.1–8.2)
// Fungsi murni: tidak menyentuh DB. Service yang memanggil & menyimpan hasilnya.

export type ProgressStatus = 'Not Started' | 'In Progress' | 'Completed';

/** Mapping default status → progress (dapat dioverride dari tabel settings). */
export const DEFAULT_STATUS_MAP: Record<ProgressStatus, number> = {
	'Not Started': 0,
	'In Progress': 0.5,
	Completed: 1
};

export const progressFromStatus = (
	status: ProgressStatus,
	map: Record<ProgressStatus, number> = DEFAULT_STATUS_MAP
) => map[status];

export interface Weighted {
	weight: number;
	progress: number;
}

/** Weighted average: Σ(w·p) / Σw. Penyebut 0 → 0. */
export function weightedProgress(items: Weighted[]): number {
	const sw = items.reduce((s, i) => s + i.weight, 0);
	if (sw <= 0) return 0;
	return items.reduce((s, i) => s + i.weight * i.progress, 0) / sw;
}

/** Status turunan untuk Task/Milestone/Project. */
export function statusFromProgress(p: number): ProgressStatus {
	if (p >= 1 - 1e-9) return 'Completed';
	if (p <= 1e-9) return 'Not Started';
	return 'In Progress';
}

/** Validasi Σ bobot = 100% (toleransi 0,01%). */
export const weightsComplete = (weights: number[], tol = 1e-4) =>
	Math.abs(weights.reduce((s, w) => s + w, 0) - 1) <= tol;

// ---------- Roll-up penuh satu project ----------

export interface WorkItemIn {
	id: string;
	taskId: string;
	weight: number;
	status: ProgressStatus;
}
export interface TaskIn {
	id: string;
	milestoneId: string;
	weight: number;
}
export interface MilestoneIn {
	id: string;
	weight: number;
}

export interface RollupResult {
	workItems: Map<string, { progress: number; weighted: number }>;
	tasks: Map<
		string,
		{ progress: number; status: ProgressStatus; weighted: number; effWeight: number }
	>;
	milestones: Map<string, { progress: number; status: ProgressStatus; weighted: number }>;
	project: { progress: number; status: ProgressStatus };
}

export function rollupProject(
	milestones: MilestoneIn[],
	tasks: TaskIn[],
	workItems: WorkItemIn[],
	statusMap = DEFAULT_STATUS_MAP
): RollupResult {
	const wiOut: RollupResult['workItems'] = new Map();
	const wiByTask = new Map<string, Weighted[]>();
	for (const wi of workItems) {
		const p = progressFromStatus(wi.status, statusMap);
		wiOut.set(wi.id, { progress: p, weighted: wi.weight * p });
		const arr = wiByTask.get(wi.taskId) ?? [];
		arr.push({ weight: wi.weight, progress: p });
		wiByTask.set(wi.taskId, arr);
	}

	const taskProg = new Map<string, number>();
	const tasksByMs = new Map<string, Weighted[]>();
	for (const t of tasks) {
		const p = weightedProgress(wiByTask.get(t.id) ?? []);
		taskProg.set(t.id, p);
		const arr = tasksByMs.get(t.milestoneId) ?? [];
		arr.push({ weight: t.weight, progress: p });
		tasksByMs.set(t.milestoneId, arr);
	}

	const msOut: RollupResult['milestones'] = new Map();
	const sumMsW = milestones.reduce((s, m) => s + m.weight, 0);
	for (const m of milestones) {
		const p = weightedProgress(tasksByMs.get(m.id) ?? []);
		msOut.set(m.id, { progress: p, status: statusFromProgress(p), weighted: m.weight * p });
	}

	const tOut: RollupResult['tasks'] = new Map();
	for (const t of tasks) {
		const p = taskProg.get(t.id)!;
		const sumTW = (tasksByMs.get(t.milestoneId) ?? []).reduce((s, x) => s + x.weight, 0);
		const msW = milestones.find((m) => m.id === t.milestoneId)?.weight ?? 0;
		const eff = sumTW > 0 && sumMsW > 0 ? (t.weight / sumTW) * (msW / sumMsW) : 0;
		tOut.set(t.id, {
			progress: p,
			status: statusFromProgress(p),
			weighted: t.weight * p,
			effWeight: eff
		});
	}

	const projectP = weightedProgress(
		milestones.map((m) => ({ weight: m.weight, progress: msOut.get(m.id)!.progress }))
	);
	return {
		workItems: wiOut,
		tasks: tOut,
		milestones: msOut,
		project: { progress: projectP, status: statusFromProgress(projectP) }
	};
}
