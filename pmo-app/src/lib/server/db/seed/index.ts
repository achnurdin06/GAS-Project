// Seed awal: master data, permission, role default, menu, settings, Super Admin.
// Jalankan: npm run db:seed  (idempoten — aman dijalankan ulang)
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import * as schema from '../schema';
import { allPermissionCodes, DEFAULT_ROLES, RESOURCES, ACTIONS } from '../../../config/permissions';
import { DEFAULT_MENU } from '../../../config/menu';
import { MASTER_DATA, DEFAULT_SETTINGS } from './master-data';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
	// 1. Master data
	for (const [code, { name, values }] of Object.entries(MASTER_DATA)) {
		await db.insert(schema.masterCategories).values({ code, name }).onConflictDoNothing();
		for (const [i, v] of values.entries()) {
			await db
				.insert(schema.masterValues)
				.values({ categoryCode: code, value: v, sortOrder: i, isSystem: true })
				.onConflictDoNothing();
		}
	}
	for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
		await db.insert(schema.settings).values({ key, value }).onConflictDoNothing();
	}

	// 2. Permissions
	for (const code of allPermissionCodes()) {
		const [resource, action] = code.split('.');
		await db.insert(schema.permissions).values({ code, resource, action }).onConflictDoNothing();
	}
	const permRows = await db.select().from(schema.permissions);
	const permId = new Map(permRows.map((p) => [p.code, p.id]));

	// 3. Roles + grants
	for (const r of DEFAULT_ROLES) {
		await db
			.insert(schema.roles)
			.values({ code: r.code, name: r.name, isSystem: !!r.isSystem })
			.onConflictDoNothing();
		const [role] = await db.select().from(schema.roles).where(eq(schema.roles.code, r.code));
		for (const g of r.grants) {
			const [res, act] = g.code.split('.');
			const codes = act === '*' ? ACTIONS.map((a) => `${res}.${a}`) : [g.code];
			for (const c of codes) {
				if (!RESOURCES.includes(res as never)) continue;
				await db
					.insert(schema.rolePermissions)
					.values({ roleId: role.id, permissionId: permId.get(c)!, scope: g.scope ?? 'all' })
					.onConflictDoNothing();
			}
		}
	}

	// 4. Menu
	const existingMenu = await db.select().from(schema.menus).limit(1);
	if (existingMenu.length === 0) {
		for (const [i, group] of DEFAULT_MENU.entries()) {
			const [parent] = await db
				.insert(schema.menus)
				.values({
					label: group.label,
					icon: group.icon,
					sortOrder: i,
					route: group.route,
					permissionCode: group.permission
				})
				.returning();
			for (const [j, c] of (group.children ?? []).entries()) {
				await db.insert(schema.menus).values({
					parentId: parent.id,
					label: c.label,
					route: c.route,
					sortOrder: j,
					permissionCode: c.permission
				});
			}
		}
	}

	// 5. Super Admin
	const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@pmo.local';
	const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin#12345';
	const [found] = await db.select().from(schema.user).where(eq(schema.user.email, email));
	if (!found) {
		const id = crypto.randomUUID();
		await db.insert(schema.user).values({ id, name: 'Super Admin', email, emailVerified: true });
		await db.insert(schema.account).values({
			id: crypto.randomUUID(),
			accountId: id,
			providerId: 'credential',
			userId: id,
			password: await hashPassword(password)
		});
		await db
			.insert(schema.userProfiles)
			.values({ userId: id, username: 'admin', mustChangePassword: true });
		const [sa] = await db.select().from(schema.roles).where(eq(schema.roles.code, 'SUPER_ADMIN'));
		await db.insert(schema.userRoles).values({ userId: id, roleId: sa.id });
		console.log(`✔ Super Admin dibuat: ${email} / ${password} (wajib ganti setelah login)`);
	}
	console.log('✔ Seed selesai');
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(() => client.end());
