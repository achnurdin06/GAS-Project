import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { auth } from '#lib/server/auth.ts';
import { loadAuthz } from '#lib/server/rbac/index.ts';
import { mustChangePassword } from '#lib/server/services/account-security.service.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';

// 1) Better Auth: baca session → locals.user / locals.session
// 2) RBAC: muat role, permission, & project yang di-assign → locals.authz
const handleAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
		event.locals.authz = await loadAuthz(session.user.id);

		// FR-AUTH-06: selama wajib ganti password, hanya halaman ganti password & logout yang boleh diakses.
		const path = event.url.pathname;
		const exempt =
			path === '/account/password' || path === '/logout' || path.startsWith('/api/auth');
		if (!exempt && (await mustChangePassword(session.user.id))) redirect(303, '/account/password');
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleAuth;
