// Daftar resource & action permission (PRD §7.3, §10). Dipakai seed & UI matriks role.
export const RESOURCES = [
	'dashboard',
	'project',
	'baseline',
	'milestone',
	'task',
	'work_item',
	'raid',
	'cr',
	'budget',
	'gate',
	'snapshot',
	'billing',
	'billing_invoice', // field invoice/payment — khusus Finance
	'timeline',
	'scurve',
	'import',
	'export',
	'user',
	'role',
	'menu',
	'master',
	'settings',
	'audit'
] as const;

export const ACTIONS = ['view', 'create', 'update', 'delete', 'approve'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type PermissionCode = `${Resource}.${Action}`;

export const allPermissionCodes = (): PermissionCode[] =>
	RESOURCES.flatMap((r) => ACTIONS.map((a) => `${r}.${a}` as PermissionCode));

/** `code` = PermissionCode atau `<resource>.*` (semua action). Divalidasi saat seed. */
type Grant = { code: string; scope?: 'all' | 'assigned' };

/** Role default (PRD §5 & §10). `resource.*` = semua action. */
export const DEFAULT_ROLES: { code: string; name: string; isSystem?: boolean; grants: Grant[] }[] =
	[
		{
			code: 'SUPER_ADMIN',
			name: 'Super Admin',
			isSystem: true,
			grants: RESOURCES.map((r) => ({ code: `${r}.*` }))
		},
		{
			code: 'PMO_ADMIN',
			name: 'PMO Admin',
			grants: RESOURCES.filter((r) => !['role', 'menu'].includes(r)).map((r) => ({
				code: `${r}.*`
			}))
		},
		{
			code: 'PMO_OFFICER',
			name: 'PMO Officer',
			grants: [
				...[
					'dashboard',
					'project',
					'milestone',
					'task',
					'work_item',
					'timeline',
					'scurve',
					'budget',
					'snapshot',
					'billing',
					'audit',
					'master'
				].map((r) => ({ code: `${r}.view` as PermissionCode })),
				...['project', 'milestone', 'task', 'work_item', 'snapshot'].map((r) => ({
					code: `${r}.update` as PermissionCode
				})),
				{ code: 'raid.*' },
				...['cr', 'gate', 'billing'].flatMap((r) =>
					(['view', 'create', 'update'] as const).map((a) => ({
						code: `${r}.${a}` as PermissionCode
					}))
				),
				{ code: 'export.view' }
			]
		},
		{
			code: 'PM',
			name: 'Project Manager',
			grants: [
				{ code: 'dashboard.view', scope: 'assigned' },
				...['project', 'timeline', 'scurve', 'budget', 'audit'].map((r) => ({
					code: `${r}.view` as PermissionCode,
					scope: 'assigned' as const
				})),
				{ code: 'project.update', scope: 'assigned' },
				{ code: 'budget.update', scope: 'assigned' },
				...['milestone', 'task', 'work_item', 'raid'].map((r) => ({
					code: `${r}.*` as const,
					scope: 'assigned' as const
				})),
				...['cr', 'gate', 'billing', 'snapshot'].flatMap((r) =>
					(['view', 'create', 'update'] as const).map((a) => ({
						code: `${r}.${a}` as PermissionCode,
						scope: 'assigned' as const
					}))
				),
				{ code: 'export.view', scope: 'assigned' }
			]
		},
		{
			code: 'PIC',
			name: 'PIC / Team Member',
			grants: [
				{ code: 'project.view', scope: 'assigned' },
				{ code: 'work_item.view', scope: 'assigned' },
				{ code: 'work_item.update', scope: 'assigned' } // dibatasi lagi: hanya work item milik sendiri
			]
		},
		{
			code: 'FINANCE',
			name: 'Finance',
			grants: [
				...['dashboard', 'project', 'milestone', 'budget', 'timeline', 'scurve'].map((r) => ({
					code: `${r}.view` as PermissionCode
				})),
				{ code: 'budget.*' },
				{ code: 'billing.view' },
				{ code: 'billing.approve' }, // verifikasi evidence
				{ code: 'billing_invoice.*' },
				{ code: 'export.view' }
			]
		},
		{
			code: 'EXECUTIVE',
			name: 'Executive / Sponsor',
			grants: [
				...[
					'dashboard',
					'project',
					'milestone',
					'task',
					'timeline',
					'scurve',
					'raid',
					'cr',
					'budget',
					'gate',
					'snapshot',
					'billing'
				].map((r) => ({ code: `${r}.view` as PermissionCode })),
				{ code: 'export.view' }
			]
		}
	];
