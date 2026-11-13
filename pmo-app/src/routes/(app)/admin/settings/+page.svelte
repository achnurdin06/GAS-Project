<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import { toast } from '#lib/components/ui/toast.svelte.ts';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const submit = () => {
		return async ({
			result,
			update
		}: {
			result: { type: string; data?: Record<string, unknown> };
			update: (opts?: { reset?: boolean }) => Promise<void>;
		}) => {
			if (result.type === 'success') toast.success(String(result.data?.message ?? 'OK'));
			else if (result.type === 'failure') toast.error('Periksa isian');
			await update({ reset: false });
		};
	};

	let editingKey = $state<string | null>(null);
	let draft = $state('');
</script>

<svelte:head><title>Pengaturan Sistem · PMO System</title></svelte:head>

<PageHeader title="Pengaturan Sistem" subtitle="Threshold RAG, mapping status→%, jadwal snapshot" />

{#if form?.message}<p class="mb-3 text-sm text-green-700">{form.message}</p>{/if}

<div class="overflow-hidden rounded-xl bg-white shadow">
	<table class="min-w-full text-sm">
		<thead class="bg-[#17365D] text-white">
			<tr>
				<th class="px-3 py-2 text-left">Key</th>
				<th class="px-3 py-2 text-left">Value (JSON)</th>
				<th class="px-3 py-2"></th>
			</tr>
		</thead>
		<tbody class="divide-y">
			{#each data.settings as s (s.key)}
				<tr>
					<td class="px-3 py-2 font-mono text-xs">{s.key}</td>
					<td class="px-3 py-2">
						{#if editingKey === s.key}
							<form method="POST" action="?/update" use:enhance={submit} class="flex gap-2">
								<input type="hidden" name="key" value={s.key} />
								<textarea
									name="value"
									bind:value={draft}
									rows="3"
									class="w-full rounded-md border-slate-300 font-mono text-xs"></textarea>
								<button type="submit" class="rounded-md bg-[#17365D] px-3 py-2 text-white"
									>Simpan</button
								>
							</form>
						{:else}
							<pre class="text-xs whitespace-pre-wrap">{JSON.stringify(s.value, null, 2)}</pre>
						{/if}
					</td>
					<td class="px-3 py-2 text-right">
						{#if data.canUpdate}
							<button
								type="button"
								class="text-[#17365D] hover:underline"
								onclick={() => {
									editingKey = s.key;
									draft = JSON.stringify(s.value, null, 2);
								}}>Edit</button
							>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
