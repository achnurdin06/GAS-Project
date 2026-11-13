<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- route menu dinamis (dibaca dari DB) */
	import { page } from '$app/state';
	import type { MenuItem } from '#lib/config/menu.ts';

	interface Props {
		menu: MenuItem[];
		user: { name: string; email: string };
		roles: string[];
	}
	let { menu, user, roles }: Props = $props();
</script>

<aside class="flex w-64 shrink-0 flex-col bg-[#17365D] text-slate-100">
	<div class="border-b border-white/10 px-5 py-4">
		<p class="text-lg font-bold">PMO System</p>
		<p class="text-xs text-slate-300">Project Control</p>
	</div>
	<nav class="flex-1 space-y-4 overflow-y-auto px-3 py-4 text-sm">
		{#each menu as group (group.label)}
			<div>
				<p class="px-2 pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
					{group.label}
				</p>
				{#each group.children ?? [] as item (item.label)}
					<a
						href={item.route}
						class={[
							'block rounded px-2 py-1.5 hover:bg-white/10',
							item.route &&
								(page.url.pathname === item.route ||
									page.url.pathname.startsWith(item.route + '/')) &&
								'bg-white/15 font-semibold'
						]}>{item.label}</a
					>
				{/each}
			</div>
		{/each}
	</nav>
	<div class="border-t border-white/10 px-5 py-3 text-xs">
		<p class="font-semibold" title={user.email}>{user.name}</p>
		<p class="text-slate-300">{roles.join(', ') || 'Tanpa role'}</p>
		<form method="POST" action="/logout" class="mt-2">
			<button class="text-slate-300 underline hover:text-white">Keluar</button>
		</form>
	</div>
</aside>
