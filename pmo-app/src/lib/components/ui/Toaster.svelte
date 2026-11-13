<script lang="ts">
	import { toast } from './toast.svelte.ts';

	const classes = {
		success: 'bg-[#C6EFCE] text-[#006100]',
		error: 'bg-[#FFC7CE] text-[#9C0006]',
		info: 'bg-blue-100 text-blue-800'
	} as const;
</script>

<div class="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2" aria-live="polite">
	{#each toast.items as t (t.id)}
		<div
			class="flex items-start justify-between gap-2 rounded-md px-3 py-2 text-sm shadow {classes[
				t.type
			]}"
		>
			<span>{t.message}</span>
			<button type="button" aria-label="Tutup" onclick={() => toast.dismiss(t.id)}>✕</button>
		</div>
	{/each}
</div>
