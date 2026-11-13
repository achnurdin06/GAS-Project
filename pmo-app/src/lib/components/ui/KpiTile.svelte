<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
		hint?: string;
	}
	let { label, value, hint }: Props = $props();
</script>

<div class="rounded-xl bg-white p-4 shadow">
	<p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
	<p class="mt-1 text-2xl font-bold text-[#17365D]">{value}</p>
	{#if hint}<p class="mt-1 text-xs text-slate-500">{hint}</p>{/if}
</div>
