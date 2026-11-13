import { redirect } from '@sveltejs/kit';
import { DEFAULT_MENU, filterMenu } from '#lib/config/menu.ts';
import { can } from '#lib/server/rbac/index.ts';
import type { LayoutServerLoad } from './$types';

// Semua halaman di grup (app) wajib login.
export const load: LayoutServerLoad = ({ locals, url }) => {
	if (!locals.user) redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);

	// TODO(FR-MENU-01..04): baca menu dari tabel `menus` (cache per role) menggantikan DEFAULT_MENU
	const menu = filterMenu(DEFAULT_MENU, (p) => can(locals.authz, p));

	return {
		user: { name: locals.user.name, email: locals.user.email },
		roles: locals.authz?.roleCodes ?? [],
		menu
	};
};
