<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'green' | 'amber' | 'red' | 'blue' | 'gray';

	interface Props {
		/** Nilai RAG ('Green' | 'Amber' | 'Red') atau status bebas. */
		rag?: string | null;
		variant?: Variant;
		children?: Snippet;
	}
	let { rag, variant, children }: Props = $props();

	const ragMap: Record<string, Variant> = { green: 'green', amber: 'amber', red: 'red' };
	const classes: Record<Variant, string> = {
		green: 'bg-[#C6EFCE] text-[#006100]',
		amber: 'bg-[#FFEB9C] text-[#9C5700]',
		red: 'bg-[#FFC7CE] text-[#9C0006]',
		blue: 'bg-blue-100 text-blue-800',
		gray: 'bg-slate-100 text-slate-700'
	};
	const resolved = $derived(variant ?? ragMap[(rag ?? '').toLowerCase()] ?? 'gray');
</script>

<span class="inline-block rounded px-2 py-0.5 text-xs font-semibold {classes[resolved]}">
	{#if children}{@render children()}{:else}{rag ?? '-'}{/if}
</span>
