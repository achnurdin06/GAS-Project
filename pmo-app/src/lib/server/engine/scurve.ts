// S-Curve mingguan Planned vs Actual (PRD §8.7)
import { addDays, clamp, diffDays, mondayOf, type ISODate } from './dates';

export interface ScurveTask {
	plannedStart: ISODate;
	plannedFinish: ISODate;
	effWeight: number; // bobot efektif thd project (jumlah = 1)
}

export interface Snapshot {
	weekEnding: ISODate;
	overallProgress: number;
}

export interface ScurvePoint {
	week: number;
	weekStart: ISODate;
	weekEnd: ISODate;
	planned: number;
	actual: number | null; // null = tidak ada data (garis disambung di chart)
}

/** Planned kumulatif pada tanggal d. */
export function plannedAt(tasks: ScurveTask[], d: ISODate): number {
	let s = 0;
	for (const t of tasks) {
		const dur = diffDays(t.plannedStart, t.plannedFinish) + 1;
		s += t.effWeight * clamp((diffDays(t.plannedStart, d) + 1) / dur);
	}
	return s;
}

export function buildScurve(args: {
	baselineStart: ISODate;
	baselineFinish: ISODate;
	tasks: ScurveTask[];
	snapshots: Snapshot[];
	liveProgress: number;
	today: ISODate;
}): ScurvePoint[] {
	const { baselineStart, baselineFinish, tasks, snapshots, liveProgress, today } = args;
	const lastTask = tasks.reduce(
		(m, t) => (diffDays(m, t.plannedFinish) > 0 ? t.plannedFinish : m),
		baselineFinish
	);
	const out: ScurvePoint[] = [];
	let ws = mondayOf(baselineStart);
	for (let w = 1; diffDays(ws, lastTask) >= 0; w++, ws = addDays(ws, 7)) {
		const we = addDays(ws, 6);
		let actual: number | null = null;
		if (diffDays(ws, today) >= 0) {
			if (diffDays(today, we) >= 0)
				actual = liveProgress; // minggu berjalan
			else {
				const inWeek = snapshots
					.filter((s) => diffDays(ws, s.weekEnding) >= 0 && diffDays(s.weekEnding, we) >= 0)
					.sort((a, b) => diffDays(b.weekEnding, a.weekEnding));
				actual = inWeek.length ? inWeek[0].overallProgress : w === 1 ? 0 : null;
			}
		}
		out.push({ week: w, weekStart: ws, weekEnd: we, planned: plannedAt(tasks, we), actual });
	}
	return out;
}

/** SPI = Actual / Planned (null jika planned 0). */
export const spi = (actual: number, planned: number) => (planned > 0 ? actual / planned : null);
