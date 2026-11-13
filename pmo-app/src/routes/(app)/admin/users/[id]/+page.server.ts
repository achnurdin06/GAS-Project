import { error, fail } from '@sveltejs/kit';
import { requirePermission } from '#lib/server/rbac/index.ts';
import { projectMemberSchema, updateUserSchema, zodErrors } from '#lib/schemas/user.schema.ts';
import {
	addProjectMember,
	getUser,
	listProjectOptions,
	listRoleOptions,
	removeProjectMember,
	resetPassword,
	setUserActive,
	setUserRoles,
	updateUser,
	UserServiceError,
	type Actor
} from '#lib/server/services/user.service.ts';
import type { Actions, PageServerLoad } from './$types';

const actorOf = (locals: App.Locals, ip: string): Actor => ({
	userId: locals.user!.id,
	roleCodes: locals.authz?.roleCodes ?? [],
	ip
});

export const load: PageServerLoad = async ({ locals, params }) => {
	requirePermission(locals, 'user.view');
	const found = await getUser(params.id);
	if (!found) error(404, 'User tidak ditemukan');
	const [roles, projects] = await Promise.all([listRoleOptions(), listProjectOptions()]);
	return {
		detail: found,
		roles,
		projects,
		isSelf: found.id === locals.user!.id,
		can: {
			update: locals.authz?.perms.has('user.update') ?? false,
			delete: locals.authz?.perms.has('user.delete') ?? false
		}
	};
};

async function guarded<T>(fn: () => Promise<T>) {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof UserServiceError)
			return fail(400, { errors: { [e.field ?? '_']: e.message } });
		throw e;
	}
}

export const actions: Actions = {
	update: async ({ request, locals, params, getClientAddress }) => {
		requirePermission(locals, 'user.update');
		const form = await request.formData();
		const parsed = updateUserSchema.safeParse({
			name: form.get('name'),
			username: form.get('username') ?? '',
			title: form.get('title') ?? '',
			unit: form.get('unit') ?? '',
			phone: form.get('phone') ?? ''
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		return guarded(async () => {
			await updateUser(params.id, parsed.data, actorOf(locals, getClientAddress()));
			return { message: 'Profil disimpan' };
		});
	},

	roles: async ({ request, locals, params, getClientAddress }) => {
		requirePermission(locals, 'user.update');
		const form = await request.formData();
		const roleIds = form.getAll('roleIds').map(String);
		return guarded(async () => {
			await setUserRoles(params.id, roleIds, actorOf(locals, getClientAddress()));
			return { message: 'Role disimpan' };
		});
	},

	toggleActive: async ({ request, locals, params, getClientAddress }) => {
		requirePermission(locals, 'user.update');
		const form = await request.formData();
		const active = form.get('active') === 'true';
		return guarded(async () => {
			await setUserActive(params.id, active, actorOf(locals, getClientAddress()));
			return { message: active ? 'User diaktifkan' : 'User dinonaktifkan' };
		});
	},

	resetPassword: async ({ locals, params, getClientAddress }) => {
		requirePermission(locals, 'user.update');
		return guarded(async () => {
			const r = await resetPassword(params.id, actorOf(locals, getClientAddress()));
			return { tempPassword: r.tempPassword };
		});
	},

	addProject: async ({ request, locals, params, getClientAddress }) => {
		requirePermission(locals, 'user.update');
		const form = await request.formData();
		const parsed = projectMemberSchema.safeParse({
			projectId: form.get('projectId'),
			projectRole: form.get('projectRole')
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		return guarded(async () => {
			await addProjectMember(params.id, parsed.data, actorOf(locals, getClientAddress()));
			return { message: 'Assignment project disimpan' };
		});
	},

	removeProject: async ({ request, locals, params, getClientAddress }) => {
		requirePermission(locals, 'user.update');
		const form = await request.formData();
		const parsed = projectMemberSchema.safeParse({
			projectId: form.get('projectId'),
			projectRole: form.get('projectRole')
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		return guarded(async () => {
			await removeProjectMember(params.id, parsed.data, actorOf(locals, getClientAddress()));
			return { message: 'Assignment project dihapus' };
		});
	}
};
