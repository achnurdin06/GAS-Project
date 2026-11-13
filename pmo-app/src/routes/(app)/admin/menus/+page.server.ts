import { fail } from '@sveltejs/kit';
import { requirePermission } from '#lib/server/rbac/index.ts';
import { menuSchema, zodErrors } from '#lib/schemas/menu.schema.ts';
import {
	createMenu,
	deleteMenu,
	listMenus,
	MenuServiceError,
	updateMenu
} from '#lib/server/services/menu.service.ts';
import type { Actions, PageServerLoad } from './$types';

const actorOf = (locals: App.Locals, ip: string) => ({
	userId: locals.user!.id,
	roleCodes: locals.authz?.roleCodes ?? [],
	ip
});

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'menu.view');
	const menus = await listMenus();
	return {
		menus,
		can: {
			create: locals.authz?.perms.has('menu.create') ?? false,
			update: locals.authz?.perms.has('menu.update') ?? false,
			delete: locals.authz?.perms.has('menu.delete') ?? false
		}
	};
};

export const actions: Actions = {
	create: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'menu.create');
		const form = await request.formData();
		const parsed = menuSchema.safeParse({
			parentId: form.get('parentId') || null,
			label: form.get('label'),
			icon: form.get('icon') ?? '',
			route: form.get('route') ?? '',
			sortOrder: form.get('sortOrder') ?? 0,
			permissionCode: form.get('permissionCode') ?? '',
			isActive: form.get('isActive') === 'on'
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		try {
			await createMenu(parsed.data, actorOf(locals, getClientAddress()));
			return { message: 'Menu dibuat' };
		} catch (e) {
			if (e instanceof MenuServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	},

	update: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'menu.update');
		const form = await request.formData();
		const id = String(form.get('id'));
		const parsed = menuSchema.safeParse({
			parentId: form.get('parentId') || null,
			label: form.get('label'),
			icon: form.get('icon') ?? '',
			route: form.get('route') ?? '',
			sortOrder: form.get('sortOrder') ?? 0,
			permissionCode: form.get('permissionCode') ?? '',
			isActive: form.get('isActive') === 'on'
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		try {
			await updateMenu(id, parsed.data, actorOf(locals, getClientAddress()));
			return { message: 'Menu disimpan' };
		} catch (e) {
			if (e instanceof MenuServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	},

	delete: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'menu.delete');
		const form = await request.formData();
		const id = String(form.get('id'));
		try {
			await deleteMenu(id, actorOf(locals, getClientAddress()));
			return { message: 'Menu dihapus' };
		} catch (e) {
			if (e instanceof MenuServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	}
};
