<script lang="ts">
	import { enhance } from '$app/forms';
	import { SvelteMap } from 'svelte/reactivity';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import Badge from '#lib/components/ui/Badge.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedRole = $state<string | null>(null);
	const errors = $derived(form && 'errors' in form ? (form.errors as Record<string, string>) : {});

	const grouped = $derived.by(() => {
		const map = new SvelteMap<string, typeof data.permissions>();
		for (const p of data.permissions) {
			if (!map.has(p.resource)) map.set(p.resource, []);
			map.get(p.resource)!.push(p);
		}
		return [...map.entries()];
	});
</script>

<svelte:head><title>Role & Permission · PMO System</title></svelte:head>

<PageHeader title="Role & Permission" subtitle="Matriks permission per role" />

{#if form?.message}<p class="mb-3 text-sm text-green-700">{form.message}</p>{/if}
{#if errors._}<p class="mb-3 text-sm text-red-600">{errors._}</p>{/if}

<div class="grid gap-6 lg:grid-cols-[320px_1fr]">
	<section class="rounded-xl bg-white p-4 shadow">
		<h2 class="mb-3 font-semibold text-[#17365D]">Daftar role</h2>
		{#if data.can.create}
			<form method="POST" action="?/create" use:enhance class="mb-4 space-y-2 text-sm">
				<input
					name="code"
					placeholder="KODE_ROLE"
					required
					class="w-full rounded-md border-slate-300"
				/>
				<input
					name="name"
					placeholder="Nama role"
					required
					class="w-full rounded-md border-slate-300"
				/>
				<input
					name="description"
					placeholder="Deskripsi"
					class="w-full rounded-md border-slate-300"
				/>
				<label class="flex items-center gap-2"
					><input type="checkbox" name="isActive" checked /> Aktif</label
				>
				<button type="submit" class="w-full rounded-md bg-[#17365D] px-3 py-2 text-white"
					>+ Tambah</button
				>
			</form>
		{/if}
		<ul class="divide-y text-sm">
			{#each data.roles as r (r.id)}
				<li class="py-2">
					<button
						type="button"
						class="w-full text-left {selectedRole === r.id ? 'font-semibold text-[#17365D]' : ''}"
						onclick={() => (selectedRole = r.id)}
					>
						{r.name} <span class="text-xs text-slate-500">({r.code})</span>
						{#if !r.isActive}<Badge variant="gray">Nonaktif</Badge>{/if}
						{#if r.isSystem}<Badge variant="blue">Sistem</Badge>{/if}
					</button>
					<div class="text-xs text-slate-500">{r.permissionCount} permission</div>
					{#if data.can.delete && !r.isSystem}
						<form method="POST" action="?/delete" use:enhance class="mt-1">
							<input type="hidden" name="id" value={r.id} />
							<button type="submit" class="text-xs text-red-700 hover:underline">Hapus</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section class="rounded-xl bg-white p-4 shadow">
		{#if !selectedRole}
			<p class="text-sm text-slate-500">Pilih role untuk mengatur permission.</p>
		{:else}
			{@const r = data.roles.find((x) => x.id === selectedRole)!}
			<h2 class="mb-3 font-semibold text-[#17365D]">Permission: {r.name}</h2>
			{#if r.isSystem && r.code === 'SUPER_ADMIN'}
				<p class="text-sm text-amber-700">Permission Super Admin tidak dapat diubah.</p>
			{:else if data.can.update}
				<form method="POST" action="?/permissions" use:enhance class="space-y-4 text-sm">
					<input type="hidden" name="roleId" value={r.id} />
					{#each grouped as [resource, perms] (resource)}
						<div>
							<h3 class="mb-1 font-medium text-slate-700">{resource}</h3>
							<div class="overflow-x-auto">
								<table class="min-w-full text-xs">
									<thead>
										<tr class="text-slate-500">
											<th class="px-2 py-1 text-left">Action</th>
											<th class="px-2 py-1 text-left">Scope</th>
										</tr>
									</thead>
									<tbody>
										{#each perms as p (p.id)}
											{@const g = data.roleDetails[selectedRole]?.grants.find(
												(x: { permissionId: string }) => x.permissionId === p.id
											)}
											<tr>
												<td class="px-2 py-1">
													<label class="flex items-center gap-2">
														<input type="checkbox" name="perm" value={p.id} checked={!!g} />
														{p.action}
													</label>
												</td>
												<td class="px-2 py-1">
													<select name="scope:{p.id}" class="rounded border-slate-300 text-xs">
														<option value="all" selected={g?.scope === 'all' || !g}>all</option>
														<option value="assigned" selected={g?.scope === 'assigned'}
															>assigned</option
														>
													</select>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/each}
					<button type="submit" class="rounded-md bg-[#17365D] px-3 py-2 text-white"
						>Simpan permission</button
					>
				</form>
			{:else}
				<p class="text-sm text-slate-500">Anda tidak memiliki akses ubah.</p>
			{/if}
		{/if}
	</section>
</div>
