import { describe, it, expect } from 'vitest';
import {
	rollupProject,
	weightedProgress,
	statusFromProgress,
	weightsComplete,
	plannedProgressLinear,
	ragFromVariance,
	milestoneHealth,
	billingReadiness,
	buildScurve,
	plannedAt,
	mondayOf,
	type WorkItemIn
} from './index';

const third = 1 / 3;

describe('rollup (PRD §8.1–8.2)', () => {
	it('weighted average & penyebut nol', () => {
		expect(weightedProgress([])).toBe(0);
		expect(
			weightedProgress([
				{ weight: 0.5, progress: 1 },
				{ weight: 0.5, progress: 0 }
			])
		).toBe(0.5);
	});

	it('status turunan', () => {
		expect(statusFromProgress(0)).toBe('Not Started');
		expect(statusFromProgress(0.4)).toBe('In Progress');
		expect(statusFromProgress(1)).toBe('Completed');
	});

	it('validasi bobot 100%', () => {
		expect(weightsComplete([third, third, third])).toBe(true);
		expect(weightsComplete([0.5, 0.4])).toBe(false);
	});

	it('kasus PRJ-001-M1-T1 dari workbook: Completed, Not Started, In Progress → 50%', () => {
		const wis: WorkItemIn[] = [
			{ id: 'w1', taskId: 't1', weight: third, status: 'Completed' },
			{ id: 'w2', taskId: 't1', weight: third, status: 'Not Started' },
			{ id: 'w3', taskId: 't1', weight: third, status: 'In Progress' }
		];
		const r = rollupProject(
			[{ id: 'm1', weight: 1 }],
			[{ id: 't1', milestoneId: 'm1', weight: 1 }],
			wis
		);
		expect(r.tasks.get('t1')!.progress).toBeCloseTo(0.5, 9);
		expect(r.project.progress).toBeCloseTo(0.5, 9);
		expect(r.tasks.get('t1')!.effWeight).toBeCloseTo(1, 9);
	});

	it('bobot efektif task = (wT/ΣwT) × (wM/ΣwM)', () => {
		const ms = [
			{ id: 'm1', weight: 0.4 },
			{ id: 'm2', weight: 0.6 }
		];
		const ts = [
			{ id: 'a', milestoneId: 'm1', weight: 0.5 },
			{ id: 'b', milestoneId: 'm1', weight: 0.5 },
			{ id: 'c', milestoneId: 'm2', weight: 1 }
		];
		const r = rollupProject(ms, ts, []);
		expect(r.tasks.get('a')!.effWeight).toBeCloseTo(0.2, 9);
		expect(r.tasks.get('c')!.effWeight).toBeCloseTo(0.6, 9);
	});
});

describe('jadwal & RAG (PRD §8.3–8.5)', () => {
	it('planned linear & clamp', () => {
		expect(plannedProgressLinear('2026-01-01', '2026-01-11', '2026-01-06')).toBeCloseTo(0.5, 9);
		expect(plannedProgressLinear('2026-01-01', '2026-01-11', '2025-12-01')).toBe(0);
		expect(plannedProgressLinear('2026-01-01', '2026-01-11', '2027-01-01')).toBe(1);
		expect(plannedProgressLinear('2026-01-01', '2026-01-01', '2026-01-01')).toBe(1);
	});

	it('RAG threshold −10% / −20%', () => {
		expect(ragFromVariance(-0.1)).toBe('Green');
		expect(ragFromVariance(-0.15)).toBe('Amber');
		expect(ragFromVariance(-0.2)).toBe('Amber');
		expect(ragFromVariance(-0.21)).toBe('Red');
	});

	it('schedule health milestone', () => {
		const today = '2026-11-13';
		expect(
			milestoneHealth(
				{ plannedStart: '2026-07-23', plannedFinish: '2026-08-30', progress: 1 },
				today
			)
		).toBe('Completed');
		expect(
			milestoneHealth(
				{ plannedStart: '2026-07-23', plannedFinish: '2026-08-30', progress: 0.72 },
				today
			)
		).toBe('Overdue');
		expect(
			milestoneHealth(
				{ plannedStart: '2026-10-15', plannedFinish: '2026-11-22', progress: 0.55 },
				today
			)
		).toBe('At Risk');
		expect(
			milestoneHealth(
				{ plannedStart: '2026-11-01', plannedFinish: '2026-11-20', progress: 0.5 },
				today
			)
		).toBe('Due ≤14 hari');
		expect(
			milestoneHealth(
				{ plannedStart: '2026-12-01', plannedFinish: '2027-01-30', progress: 0 },
				today
			)
		).toBe('Not Started');
	});
});

describe('billing readiness (PRD §8.6)', () => {
	it('urutan status', () => {
		expect(billingReadiness([]).readiness).toBe('No Milestone Linked');
		expect(
			billingReadiness([{ milestoneStatus: 'In Progress', verificationStatus: 'Verified' }])
				.readiness
		).toBe('Waiting Milestone');
		expect(
			billingReadiness([{ milestoneStatus: 'Completed', verificationStatus: 'Not Checked' }])
				.readiness
		).toBe('Evidence Incomplete');
		expect(
			billingReadiness([{ milestoneStatus: 'Completed', verificationStatus: 'Verified' }]).readiness
		).toBe('Ready to Bill');
	});
});

describe('S-Curve (PRD §8.7)', () => {
	it('minggu dimulai Senin', () => {
		expect(mondayOf('2026-07-23')).toBe('2026-07-20');
	});

	it('planned kumulatif 0 → 1 dan actual mengikuti snapshot/live', () => {
		const tasks = [{ plannedStart: '2026-07-20', plannedFinish: '2026-08-02', effWeight: 1 }];
		expect(plannedAt(tasks, '2026-07-26')).toBeCloseTo(0.5, 9);
		const pts = buildScurve({
			baselineStart: '2026-07-20',
			baselineFinish: '2026-08-16',
			tasks,
			snapshots: [{ weekEnding: '2026-07-31', overallProgress: 0.4 }],
			liveProgress: 0.7,
			today: '2026-08-05'
		});
		expect(pts).toHaveLength(4);
		expect(pts[0].actual).toBe(0); // minggu 1 tanpa snapshot
		expect(pts[1].actual).toBe(0.4); // snapshot beku
		expect(pts[2].actual).toBe(0.7); // minggu berjalan = live
		expect(pts[3].actual).toBeNull(); // masa depan
		expect(pts[3].planned).toBe(1);
	});
});
