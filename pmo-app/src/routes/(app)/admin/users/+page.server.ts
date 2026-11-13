import { fail } from '@sveltejs/kit';
import { requirePermission } from '#lib/server/rbac/index.ts';
import { parseListQuery } from '#lib/schemas/list-query.ts';
import { createUserSchema, zodErrors } from '#lib/schemas/user.schema.ts';
import {
	createUser,
	listRoleOptions,
	listUnits,
	listUsers,
	UserServiceError
} from '#lib/server/services/user.service.ts';
import type { Actions, PageServerLoad } from './$types';

const STATUSES = ['Active', 'Inactive', 'Locked'] as const;

export const load: PageServerLoad = async ({ locals, url }) => {
	requirePermission(locals, 'user.view');
	const query = parseListQuery(url.searchParams);
	const status = STATUSES.find((s) => s === url.searchParams.get('status'));
	const roleId = url.searchParams.get('role') || undefined;
	const unit = url.searchParams.get('unit') || undefined;

	const [list, roles, units] = await Promise.all([
		listUsers(query, { status, roleId, unit }),
		listRoleOptions(),
		listUnits()
	]);
	return {
		list,
		roles,
		units,
		query: { ...query, status, role: roleId, unit },
		canCreate: locals.authz ? locals.authz.perms.has('user.create') : false
	};
};

export const actions: Actions = {
	create: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'user.create');
		const form = await request.formData();
		const parsed = createUserSchema.safeParse({
			name: form.get('name'),
			email: form.get('email'),
			username: form.get('username') ?? '',
			title: form.get('title') ?? '',
			unit: form.get('unit') ?? '',
			phone: form.get('phone') ?? '',
			roleIds: form.getAll('roleIds')
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		try {
			const result = await createUser(parsed.data, {
				userId: locals.user!.id,
				roleCodes: locals.authz?.roleCodes ?? [],
				ip: getClientAddress()
			});
			return {
				created: { id: result.id, email: parsed.data.email, tempPassword: result.tempPassword }
			};
		} catch (e) {
			if (e instanceof UserServiceError) {
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			}
			throw e;
		}
	}
};
