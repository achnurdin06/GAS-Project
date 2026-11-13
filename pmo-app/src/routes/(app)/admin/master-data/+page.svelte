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

	let editingId = $state<string | null>(null);
</script>

<svelte:head><title>Master Data · PMO System</title></svelte:head>

<PageHeader title="Master Data" subtitle="Nilai master per kategori" />

{#if form?.message}<p class="mb-3 text-sm text-green-700">{form.message}</p>{/if}

<form method="GET" class="mb-4 flex flex-wrap items-end gap-3 text-sm">
	<label>
		<span class="block text-slate-700">Kategori</span>
		<select
			name="cat"
			class="mt-1 rounded-md border-slate-300"
			onchange={(e) => e.currentTarget.form?.requestSubmit()}
		>
			{#each data.categories as c (c.code)}
				<option value={c.code} selected={data.selected === c.code}>
					{c.code} — {c.name} ({c.valueCount})
				</option>
			{/each}
		</select>
	</label>
	<button type="submit" class="rounded-md border border-slate-300 bg-white px-3 py-2"
		>Tampilkan</button
	>
</form>

{#if data.can.create}
	<form
		method="POST"
		action="?/create"
		use:enhance={submit}
		class="mb-6 space-y-2 rounded-xl bg-white p-4 text-sm shadow"
	>
		<h3 class="font-semibold text-[#17365D]">Tambah nilai</h3>
		<input type="hidden" name="categoryCode" value={data.selected} />
		<div class="grid gap-2 md:grid-cols-4">
			<input name="value" placeholder="Nilai" required class="rounded-md border-slate-300" />
			<input name="sortOrder" type="number" value="0" class="rounded-md border-slate-300" />
			<label class="flex items-center gap-2"><input type="checkbox" name="isSystem" /> System</label
			>
			<label class="flex items-center gap-2"
				><input type="checkbox" name="isActive" checked /> Aktif</label
			>
		</div>
		<button type="submit" class="rounded-md bg-[#17365D] px-3 py-2 text-white">Simpan</button>
	</form>
{/if}

<div class="overflow-hidden rounded-xl bg-white shadow">
	<table class="min-w-full text-sm">
		<thead class="bg-[#17365D] text-white">
			<tr>
				<th class="px-3 py-2 text-left">Nilai</th>
				<th class="px-3 py-2 text-left">Urutan</th>
				<th class="px-3 py-2 text-left">System</th>
				<th class="px-3 py-2 text-left">Status</th>
				<th class="px-3 py-2"></th>
			</tr>
		</thead>
		<tbody class="divide-y">
			{#each data.values as v (v.id)}
				<tr>
					<td class="px-3 py-2">{v.value}</td>
					<td class="px-3 py-2">{v.sortOrder}</td>
					<td class="px-3 py-2">{v.isSystem ? 'Ya' : '-'}</td>
					<td class="px-3 py-2">{v.isActive ? 'Aktif' : 'Nonaktif'}</td>
					<td class="px-3 py-2 text-right">
						{#if data.can.update}
							<button
								type="button"
								class="text-[#17365D] hover:underline"
								onclick={() => (editingId = editingId === v.id ? null : v.id)}>Edit</button
							>
						{/if}
						{#if data.can.delete && !v.isSystem}
							<form method="POST" action="?/delete" use:enhance={submit} class="inline">
								<input type="hidden" name="id" value={v.id} />
								<button type="submit" class="ml-2 text-red-600 hover:underline">Hapus</button>
							</form>
						{/if}
					</td>
				</tr>
				{#if editingId === v.id}
					<tr>
						<td colspan="5" class="bg-slate-50 px-3 py-3">
							<form
								method="POST"
								action="?/update"
								use:enhance={submit}
								class="grid gap-2 md:grid-cols-5"
							>
								<input type="hidden" name="id" value={v.id} />
								<input type="hidden" name="categoryCode" value={v.categoryCode} />
								<input
									name="value"
									value={v.value}
									required
									class="rounded-md border-slate-300"
									disabled={v.isSystem}
								/>
								<input
									name="sortOrder"
									type="number"
									value={v.sortOrder}
									class="rounded-md border-slate-300"
								/>
								<label class="flex items-center gap-2"
									><input type="checkbox" name="isSystem" checked={v.isSystem} disabled /> System</label
								>
								<label class="flex items-center gap-2"
									><input type="checkbox" name="isActive" checked={v.isActive} /> Aktif</label
								>
								<button type="submit" class="rounded-md bg-[#17365D] px-3 py-2 text-white"
									>Simpan</button
								>
							</form>
						</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
