import { fail } from '@sveltejs/kit';
import { requirePermission } from '#lib/server/rbac/index.ts';
import { masterValueSchema, zodErrors } from '#lib/schemas/master.schema.ts';
import {
	createValue,
	deleteValue,
	listCategories,
	listValues,
	MasterServiceError,
	updateValue
} from '#lib/server/services/master.service.ts';
import type { Actions, PageServerLoad } from './$types';

const actorOf = (locals: App.Locals, ip: string) => ({
	userId: locals.user!.id,
	roleCodes: locals.authz?.roleCodes ?? [],
	ip
});

export const load: PageServerLoad = async ({ locals, url }) => {
	requirePermission(locals, 'master.view');
	const categories = await listCategories();
	const selected = url.searchParams.get('cat') || categories[0]?.code || '';
	const values = selected ? await listValues(selected) : [];
	return {
		categories,
		selected,
		values,
		can: {
			create: locals.authz?.perms.has('master.create') ?? false,
			update: locals.authz?.perms.has('master.update') ?? false,
			delete: locals.authz?.perms.has('master.delete') ?? false
		}
	};
};

export const actions: Actions = {
	create: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'master.create');
		const form = await request.formData();
		const parsed = masterValueSchema.safeParse({
			categoryCode: form.get('categoryCode'),
			value: form.get('value'),
			sortOrder: form.get('sortOrder') ?? 0,
			isSystem: form.get('isSystem') === 'on',
			isActive: form.get('isActive') === 'on'
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		try {
			await createValue(parsed.data, actorOf(locals, getClientAddress()));
			return { message: 'Nilai master dibuat' };
		} catch (e) {
			if (e instanceof MasterServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	},

	update: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'master.update');
		const form = await request.formData();
		const id = String(form.get('id'));
		const parsed = masterValueSchema.safeParse({
			categoryCode: form.get('categoryCode'),
			value: form.get('value'),
			sortOrder: form.get('sortOrder') ?? 0,
			isSystem: form.get('isSystem') === 'on',
			isActive: form.get('isActive') === 'on'
		});
		if (!parsed.success) return fail(400, { errors: zodErrors(parsed.error) });
		try {
			await updateValue(id, parsed.data, actorOf(locals, getClientAddress()));
			return { message: 'Nilai master disimpan' };
		} catch (e) {
			if (e instanceof MasterServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	},

	delete: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'master.delete');
		const form = await request.formData();
		const id = String(form.get('id'));
		try {
			await deleteValue(id, actorOf(locals, getClientAddress()));
			return { message: 'Nilai master dihapus' };
		} catch (e) {
			if (e instanceof MasterServiceError)
				return fail(400, { errors: { [e.field ?? '_']: e.message } });
			throw e;
		}
	}
};
