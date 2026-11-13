<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		actions?: Snippet;
	}
	let { title, subtitle, actions }: Props = $props();
</script>

<header class="mb-6 flex items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-bold text-[#17365D]">{title}</h1>
		{#if subtitle}<p class="text-sm text-slate-500">{subtitle}</p>{/if}
	</div>
	{#if actions}<div class="flex gap-2">{@render actions()}</div>{/if}
</header>
