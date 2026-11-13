<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		onclose?: () => void;
		children: Snippet;
		footer?: Snippet;
	}
	let { open = $bindable(), title, onclose, children, footer }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	function handleClose() {
		open = false;
		onclose?.();
	}
</script>

<dialog
	bind:this={dialog}
	onclose={handleClose}
	onclick={(e) => e.target === dialog && dialog?.close()}
	class="m-auto w-full max-w-lg rounded-xl p-0 shadow-xl backdrop:bg-black/40"
>
	<div class="p-6">
		<h2 class="mb-4 text-lg font-bold text-[#17365D]">{title}</h2>
		{@render children()}
		<div class="mt-6 flex justify-end gap-2">
			{#if footer}
				{@render footer()}
			{:else}
				<button
					type="button"
					class="rounded-md border border-slate-300 px-4 py-2 text-sm"
					onclick={() => dialog?.close()}>Tutup</button
				>
			{/if}
		</div>
	</div>
</dialog>
