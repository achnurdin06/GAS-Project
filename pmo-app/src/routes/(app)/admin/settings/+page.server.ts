import { fail } from '@sveltejs/kit';
import { requirePermission } from '#lib/server/rbac/index.ts';
import { listSettings, updateSetting } from '#lib/server/services/master.service.ts';
import type { Actions, PageServerLoad } from './$types';

const actorOf = (locals: App.Locals, ip: string) => ({
	userId: locals.user!.id,
	roleCodes: locals.authz?.roleCodes ?? [],
	ip
});

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'settings.view');
	const settings = await listSettings();
	return {
		settings,
		canUpdate: locals.authz?.perms.has('settings.update') ?? false
	};
};

export const actions: Actions = {
	update: async ({ request, locals, getClientAddress }) => {
		requirePermission(locals, 'settings.update');
		const form = await request.formData();
		const key = String(form.get('key'));
		const raw = String(form.get('value') ?? '');
		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return fail(400, { errors: { value: 'JSON tidak valid' } });
		}
		try {
			await updateSetting(key, parsed, actorOf(locals, getClientAddress()));
			return { message: 'Pengaturan disimpan' };
		} catch (e) {
			return fail(400, { errors: { _: (e as Error).message } });
		}
	}
};
