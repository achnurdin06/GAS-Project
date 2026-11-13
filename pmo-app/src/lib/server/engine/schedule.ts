// Planned progress, RAG, Schedule Health, indikator project (PRD §8.3–8.5)
import { clamp, diffDays, type ISODate } from './dates';

export type Rag = 'Green' | 'Amber' | 'Red';

export const DEFAULT_RAG = { green: -0.1, amber: -0.2 };

/** Planned progress linear terhadap baseline. */
export function plannedProgressLinear(start: ISODate, finish: ISODate, today: ISODate): number {
	const span = diffDays(start, finish);
	if (span <= 0) return 1;
	return clamp(diffDays(start, today) / span);
}

export function ragFromVariance(variance: number, t = DEFAULT_RAG): Rag {
	if (variance >= t.green) return 'Green';
	if (variance >= t.amber) return 'Amber';
	return 'Red';
}

export type MilestoneHealth =
	'Completed' | 'Overdue' | 'At Risk' | 'Due ≤14 hari' | 'Not Started' | 'On Track';

/** Dievaluasi berurutan, kondisi pertama yang cocok dipakai. */
export function milestoneHealth(
	m: { plannedStart: ISODate; plannedFinish: ISODate; progress: number },
	today: ISODate
): MilestoneHealth {
	if (m.progress >= 1) return 'Completed';
	if (diffDays(m.plannedFinish, today) > 0) return 'Overdue';
	const elapsed = Math.min(
		1,
		(diffDays(m.plannedStart, today) + 1) / (diffDays(m.plannedStart, m.plannedFinish) + 1)
	);
	if (diffDays(m.plannedStart, today) >= 0 && m.progress < elapsed - 0.2) return 'At Risk';
	if (diffDays(today, m.plannedFinish) <= 14) return 'Due ≤14 hari';
	if (diffDays(today, m.plannedStart) > 0) return 'Not Started';
	return 'On Track';
}

export const isMilestoneOverdue = (
	m: { plannedFinish: ISODate; progress: number },
	today: ISODate
) => diffDays(m.plannedFinish, today) > 0 && m.progress < 1;

export const isOpenHighRaid = (r: { severity: string; status: string }) =>
	(r.severity === 'High' || r.severity === 'Critical') && r.status !== 'Closed';

export type GateHealth = 'Approved' | 'Overdue' | 'Due ≤14 hari' | 'On Track';
export function gateHealth(
	g: { status: string; plannedDate: ISODate },
	today: ISODate
): GateHealth {
	if (g.status === 'Approved') return 'Approved';
	if (diffDays(g.plannedDate, today) > 0) return 'Overdue';
	if (diffDays(today, g.plannedDate) <= 14) return 'Due ≤14 hari';
	return 'On Track';
}
