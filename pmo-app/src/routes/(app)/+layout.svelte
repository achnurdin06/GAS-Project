<script lang="ts">
	import Sidebar from '#lib/components/layout/Sidebar.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen bg-slate-50 text-slate-800">
	<Sidebar menu={data.menu} user={data.user} roles={data.roles} />
	<main class="min-w-0 flex-1 p-6">
		{@render children()}
	</main>
</div>
