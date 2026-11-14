import { fail } from '@sveltejs/kit';
import { requirePermission } from '#lib/server/rbac/index.ts';
import { roleSchema, zodErrors } from '#lib/schemas/role.schema.ts';
import {
	createRole,
	getRole,
	updateRole,
	deleteRole,
	listPermissions,
	listRoles,
	RoleServiceError,
	setRolePermissions
} from '#lib/server/services/role.service.ts';
import type { Actions, PageServerLoad } from './$types';

const actorOf = (locals: App.Locals, ip: string) => ({
	userId: locals.user!.id,
	roleCodes: locals.authz?.roleCodes ?? [],
	ip
});

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'role.view');
	const [roles, permissions] = await Promise.all([listRoles(), listPermissions()]);
	const details: Record<string, Awaited<ReturnType<typeof getRole>>> = {};
	for (const r of roles) details[r.id] = await getRole(r.id);
	return {
		roles,
		roleDetails: details,
		permissions,
		can: {
			create: locals.authz?.perms.has('role.create') ?? false,
			update: locals.authz?.perms.has('role.update') ?? false,
			delete: locals.authz?.perms.has('role.delete') ?? false
		}
	};
};

export const actions: Actions = {
	create: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'role.create');
		const form = await request.formData();
		const parsed = roleSchema.safeParse({
			code: form.get('code'),
			name: form.get('name'),
			description: form.get('description') ?? '',
			isActive: form.get('isActive') === 'on'
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		try {
			await createRole(parsed.data, actorOf(locals, getClientAddress()));
			return { message: 'Role dibuat' };
		} catch (e) {
			if (e instanceof RoleServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	},

	update: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'role.update');
		const form = await request.formData();
		const id = String(form.get('id'));
		const parsed = roleSchema.safeParse({
			code: form.get('code'),
			name: form.get('name'),
			description: form.get('description') ?? '',
			isActive: form.get('isActive') === 'on'
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		try {
			await updateRole(id, parsed.data, actorOf(locals, getClientAddress()));
			return { message: 'Role disimpan' };
		} catch (e) {
			if (e instanceof RoleServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	},

	delete: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'role.delete');
		const form = await request.formData();
		const id = String(form.get('id'));
		try {
			await deleteRole(id, actorOf(locals, getClientAddress()));
			return { message: 'Role dihapus' };
		} catch (e) {
			if (e instanceof RoleServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	},

	permissions: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'role.update');
		const form = await request.formData();
		const roleId = String(form.get('roleId'));
		const grants: { permissionId: string; scope: 'all' | 'assigned' }[] = [];
		for (const [k, v] of form.entries()) {
			if (k.startsWith('scope:')) {
				const pid = k.slice(6);
				grants.push({ permissionId: pid, scope: String(v) as 'all' | 'assigned' });
			}
		}
		// only include checked ones
		const checked = new Set(form.getAll('perm').map(String));
		const filtered = grants.filter((g) => checked.has(g.permissionId));
		try {
			await setRolePermissions(roleId, filtered, actorOf(locals, getClientAddress()));
			return { message: 'Permission disimpan' };
		} catch (e) {
			if (e instanceof RoleServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	}
};
