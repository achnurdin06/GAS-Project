import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import {
	checkLoginAllowed,
	recordLoginFailure,
	recordLoginSuccess
} from '#lib/server/services/account-security.service.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/dashboard');
};

const GENERIC_FAIL = 'Email atau password salah';

export const actions: Actions = {
	default: async ({ request, url, getClientAddress }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		if (!email || !password) return fail(400, { email, message: 'Email dan password wajib diisi' });

		const ip = getClientAddress();
		const gate = await checkLoginAllowed(email);
		if (!gate.ok) {
			return fail(403, {
				email,
				message:
					gate.reason === 'locked'
						? 'Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi nanti atau hubungi admin.'
						: 'Akun tidak aktif. Hubungi admin.'
			});
		}

		try {
			await auth.api.signInEmail({ body: { email, password }, headers: request.headers });
		} catch (e) {
			if (!(e instanceof APIError)) throw e;
			const locked = await recordLoginFailure(email, gate.userId, ip);
			return fail(400, {
				email,
				message: locked ? 'Terlalu banyak percobaan gagal. Akun dikunci sementara.' : GENERIC_FAIL
			});
		}
		if (gate.userId) await recordLoginSuccess(gate.userId, ip);

		const to = url.searchParams.get('redirectTo');
		redirect(303, to?.startsWith('/') && !to.startsWith('//') ? to : '/dashboard');
	}
};
