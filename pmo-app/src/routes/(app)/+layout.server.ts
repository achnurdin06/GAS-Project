import { redirect } from '@sveltejs/kit';
import { DEFAULT_MENU, filterMenu } from '#lib/config/menu.ts';
import { can } from '#lib/server/rbac/index.ts';
import { getMenuTreeForAuthz } from '#lib/server/services/menu-cache.ts';
import type { LayoutServerLoad } from './$types';

// Semua halaman di grup (app) wajib login.
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);

	let menu: import('#lib/config/menu.ts').MenuItem[];
	try {
		menu = (await getMenuTreeForAuthz({
			roleCodes: locals.authz?.roleCodes ?? [],
			perms: locals.authz?.perms ?? new Map()
		})) as import('#lib/config/menu.ts').MenuItem[];
	} catch {
		menu = filterMenu(DEFAULT_MENU, (p) => can(locals.authz, p));
	}
	if (!menu || (Array.isArray(menu) && menu.length === 0)) {
		menu = filterMenu(DEFAULT_MENU, (p) => can(locals.authz, p));
	}

	return {
		user: { name: locals.user.name, email: locals.user.email },
		roles: locals.authz?.roleCodes ?? [],
		menu
	};
};
