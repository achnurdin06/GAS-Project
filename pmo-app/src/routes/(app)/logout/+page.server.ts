import { redirect } from '@sveltejs/kit';
import { auth } from '#lib/server/auth.ts';
import { writeAudit } from '#lib/server/services/audit.service.ts';
import { db } from '#lib/server/db/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => redirect(303, '/dashboard');

export const actions: Actions = {
	default: async ({ request, locals, getClientAddress }) => {
		const userId = locals.user?.id;
		await auth.api.signOut({ headers: request.headers });
		if (userId) {
			await writeAudit(db, {
				userId,
				action: 'logout',
				entityType: 'user',
				entityId: userId,
				ip: getClientAddress()
			});
		}
		redirect(303, '/login');
	}
};
