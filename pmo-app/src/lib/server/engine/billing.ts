// Billing Readiness per termin (PRD §8.6)

export type BillingReadiness =
	'No Milestone Linked' | 'Waiting Milestone' | 'Evidence Incomplete' | 'Ready to Bill';

export interface BillingLinkIn {
	milestoneStatus: string; // dari milestone.calc_status
	verificationStatus: string; // Not Checked | Verified | Rejected
}

export function billingReadiness(links: BillingLinkIn[]) {
	const linked = links.length;
	const completed = links.filter((l) => l.milestoneStatus === 'Completed').length;
	const verified = links.filter((l) => l.verificationStatus === 'Verified').length;
	let readiness: BillingReadiness;
	if (linked === 0) readiness = 'No Milestone Linked';
	else if (completed < linked) readiness = 'Waiting Milestone';
	else if (verified < linked) readiness = 'Evidence Incomplete';
	else readiness = 'Ready to Bill';
	return { linked, completed, verified, readiness };
}
