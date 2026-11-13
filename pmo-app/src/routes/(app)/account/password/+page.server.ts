import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import { changePasswordSchema } from '#lib/schemas/auth.schema.ts';
import {
	completePasswordChange,
	mustChangePassword
} from '#lib/server/services/account-security.service.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	return { forced: await mustChangePassword(locals.user.id) };
};

export const actions: Actions = {
	default: async ({ request, locals, getClientAddress }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		const parsed = changePasswordSchema.safeParse({
			currentPassword: form.get('currentPassword'),
			newPassword: form.get('newPassword'),
			confirmPassword: form.get('confirmPassword')
		});
		if (!parsed.success) {
			const errors: Record<string, string> = {};
			for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
			return fail(400, { errors });
		}

		try {
			await auth.api.changePassword({
				body: {
					currentPassword: parsed.data.currentPassword,
					newPassword: parsed.data.newPassword,
					revokeOtherSessions: true
				},
				headers: request.headers
			});
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, {
					errors: { currentPassword: 'Password saat ini salah' } as Record<string, string>
				});
			}
			throw e;
		}
		await completePasswordChange(locals.user.id, getClientAddress());
		redirect(303, '/dashboard');
	}
};
