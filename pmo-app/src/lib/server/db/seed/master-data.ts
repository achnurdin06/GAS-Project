// Nilai master default — diambil dari sheet "Master Data" & data validation workbook Excel (PRD §7.5).
export const MASTER_DATA: Record<string, { name: string; values: string[] }> = {
	WORK_ITEM_STATUS: {
		name: 'Work Item Status',
		values: ['Not Started', 'In Progress', 'Completed']
	},
	RAID_TYPE: { name: 'RAID Type', values: ['Risk', 'Assumption', 'Issue', 'Dependency'] },
	RAID_LEVEL: {
		name: 'RAID Severity / Impact / Probability',
		values: ['Low', 'Medium', 'High', 'Critical']
	},
	RAID_STATUS: { name: 'RAID Status', values: ['Open', 'In Progress', 'Closed'] },
	RAG_STATUS: { name: 'RAG Status', values: ['Green', 'Amber', 'Red'] },
	PORTFOLIO: {
		name: 'Portfolio',
		values: [
			'Digital Transformation',
			'Infrastructure',
			'Application',
			'Cybersecurity',
			'Data & Analytics'
		]
	},
	CR_PRIORITY: { name: 'CR Priority / Impact Scope', values: ['Low', 'Medium', 'High'] },
	CR_STATUS: { name: 'CR Status', values: ['Draft', 'Under Review', 'Approved', 'Rejected'] },
	CR_DECISION: { name: 'CR Decision', values: ['Pending', 'Approved', 'Rejected'] },
	GATE_NAME: {
		name: 'Delivery Gate Name',
		values: [
			'Project Initiation',
			'Design Approval',
			'Build Complete',
			'UAT Sign-off',
			'Go-Live Approval'
		]
	},
	GATE_STATUS: { name: 'Delivery Gate Status', values: ['Planned', 'In Progress', 'Approved'] },
	INVOICE_STATUS: { name: 'Invoice Status', values: ['Draft', 'Issued', 'Cancelled'] },
	PAYMENT_STATUS: {
		name: 'Payment Status',
		values: ['Unpaid', 'Partially Paid', 'Paid', 'Overdue']
	},
	EVIDENCE_STATUS: {
		name: 'Evidence Verification Status',
		values: ['Not Checked', 'Verified', 'Rejected']
	},
	COST_CATEGORY: { name: 'Cost Category', values: ['Project Cost'] },
	CURRENCY: { name: 'Currency', values: ['IDR'] }
};

export const DEFAULT_SETTINGS: Record<string, unknown> = {
	rag_thresholds: { green: -0.1, amber: -0.2 },
	status_progress_map: { 'Not Started': 0, 'In Progress': 0.5, Completed: 1 },
	snapshot_cron: '59 23 * * 5', // Jumat 23:59
	timezone: 'Asia/Jakarta',
	weight_tolerance: 0.0001
};
