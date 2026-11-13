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
</script>

<svelte:head><title>Menu Management · PMO System</title></svelte:head>

<PageHeader title="Menu Management" subtitle="CRUD menu & urutan" />

{#if form?.message}<p class="mb-3 text-sm text-green-700">{form.message}</p>{/if}

{#if data.can.create}
	<form
		method="POST"
		action="?/create"
		use:enhance={submit}
		class="mb-6 space-y-2 rounded-xl bg-white p-4 text-sm shadow"
	>
		<h3 class="font-semibold text-[#17365D]">Tambah menu</h3>
		<div class="grid gap-2 md:grid-cols-3">
			<input name="label" placeholder="Label" required class="rounded-md border-slate-300" />
			<input name="route" placeholder="Route (opsional)" class="rounded-md border-slate-300" />
			<input name="icon" placeholder="Icon" class="rounded-md border-slate-300" />
			<select name="parentId" class="rounded-md border-slate-300">
				<option value="">-- Root --</option>
				{#each data.menus.filter((m) => !m.parentId) as m (m.id)}
					<option value={m.id}>{m.label}</option>
				{/each}
			</select>
			<input name="sortOrder" type="number" value="0" class="rounded-md border-slate-300" />
			<input
				name="permissionCode"
				placeholder="Permission code (opsional)"
				class="rounded-md border-slate-300"
			/>
		</div>
		<label class="flex items-center gap-2"
			><input type="checkbox" name="isActive" checked /> Aktif</label
		>
		<button type="submit" class="rounded-md bg-[#17365D] px-3 py-2 text-white">Simpan</button>
	</form>
{/if}

<div class="overflow-hidden rounded-xl bg-white shadow">
	<table class="min-w-full text-sm">
		<thead class="bg-[#17365D] text-white">
			<tr>
				<th class="px-3 py-2 text-left">Label</th>
				<th class="px-3 py-2 text-left">Route</th>
				<th class="px-3 py-2 text-left">Parent</th>
				<th class="px-3 py-2 text-left">Permission</th>
				<th class="px-3 py-2 text-left">Urutan</th>
				<th class="px-3 py-2 text-left">Status</th>
				<th class="px-3 py-2"></th>
			</tr>
		</thead>
		<tbody class="divide-y">
			{#each data.menus as m (m.id)}
				<tr>
					<td class="px-3 py-2">{m.label}</td>
					<td class="px-3 py-2">{m.route ?? '-'}</td>
					<td class="px-3 py-2">{data.menus.find((x) => x.id === m.parentId)?.label ?? '-'}</td>
					<td class="px-3 py-2">{m.permissionCode ?? '-'}</td>
					<td class="px-3 py-2">{m.sortOrder}</td>
					<td class="px-3 py-2">{m.isActive ? 'Aktif' : 'Nonaktif'}</td>
					<td class="px-3 py-2 text-right">
						{#if data.can.delete}
							<form method="POST" action="?/delete" use:enhance={submit}>
								<input type="hidden" name="id" value={m.id} />
								<button type="submit" class="text-red-700 hover:underline">Hapus</button>
							</form>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
