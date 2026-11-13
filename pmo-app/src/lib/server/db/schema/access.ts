// Akses: role, permission, menu, keanggotaan project (PRD §7.2–7.4, §9.2)
// Tabel user & session dikelola Better Auth → lihat auth.schema.ts (jangan diedit manual).
import { text, uuid, boolean, integer, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { pmo } from '../pmo';
import { user } from '../auth.schema';
import { projects } from './project';

export const permissionScope = pmo.enum('permission_scope', ['all', 'assigned']);
export const projectRole = pmo.enum('project_role', ['PM', 'PIC', 'Sponsor', 'Viewer']);
export const userStatus = pmo.enum('user_status', ['Active', 'Inactive', 'Locked']);

/** Profil tambahan user (melengkapi tabel `user` milik Better Auth). */
export const userProfiles = pmo.table('user_profiles', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	username: text('username').unique(),
	title: text('title'),
	unit: text('unit'),
	phone: text('phone'),
	status: userStatus('status').notNull().default('Active'),
	mustChangePassword: boolean('must_change_password').notNull().default(true),
	lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
	lockedUntil: timestamp('locked_until', { withTimezone: true })
});

export const roles = pmo.table('roles', {
	id: uuid('id').primaryKey().defaultRandom(),
	code: text('code').notNull().unique(), // SUPER_ADMIN, PMO_ADMIN, ...
	name: text('name').notNull(),
	description: text('description'),
	isSystem: boolean('is_system').notNull().default(false),
	isActive: boolean('is_active').notNull().default(true)
});

/** Kode permission: `<resource>.<action>`, mis. `project.update`, `billing.approve`. */
export const permissions = pmo.table('permissions', {
	id: uuid('id').primaryKey().defaultRandom(),
	code: text('code').notNull().unique(),
	resource: text('resource').notNull(),
	action: text('action').notNull(), // view|create|update|delete|approve|export|import
	description: text('description')
});

export const rolePermissions = pmo.table(
	'role_permissions',
	{
		roleId: uuid('role_id')
			.notNull()
			.references(() => roles.id, { onDelete: 'cascade' }),
		permissionId: uuid('permission_id')
			.notNull()
			.references(() => permissions.id, { onDelete: 'cascade' }),
		scope: permissionScope('scope').notNull().default('all')
	},
	(t) => [primaryKey({ columns: [t.roleId, t.permissionId] })]
);

export const userRoles = pmo.table(
	'user_roles',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		roleId: uuid('role_id')
			.notNull()
			.references(() => roles.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

export const menus = pmo.table('menus', {
	id: uuid('id').primaryKey().defaultRandom(),
	parentId: uuid('parent_id'),
	label: text('label').notNull(),
	icon: text('icon'),
	route: text('route'),
	sortOrder: integer('sort_order').notNull().default(0),
	permissionCode: text('permission_code'), // menu tampil jika user punya permission ini
	isActive: boolean('is_active').notNull().default(true)
});

export const projectMembers = pmo.table(
	'project_members',
	{
		projectId: uuid('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		projectRole: projectRole('project_role').notNull()
	},
	(t) => [primaryKey({ columns: [t.projectId, t.userId, t.projectRole] })]
);
