<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import DataTable from '#lib/components/tables/DataTable.svelte';
	import type { Column } from '#lib/components/tables/types.ts';
	import Badge from '#lib/components/ui/Badge.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import { toast } from '#lib/components/ui/toast.svelte.ts';
	import type { UserRow } from '#lib/server/services/user.service.ts';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let created = $state<{ email: string; tempPassword: string } | null>(null);
	let submitting = $state(false);

	const roleNames = $derived(new Map(data.roles.map((r) => [r.id, r.name])));
	const errors = $derived(form && 'errors' in form ? (form.errors as Record<string, string>) : {});

	const columns: Column<UserRow>[] = [
		{ key: 'name', label: 'Nama', sortable: true },
		{ key: 'email', label: 'Email', sortable: true },
		{ key: 'unit', label: 'Unit', sortable: true },
		{ key: 'roles', label: 'Role' },
		{ key: 'status', label: 'Status', sortable: true },
		{ key: 'lastLoginAt', label: 'Login terakhir', sortable: true }
	];

	const fields: { name: string; label: string; type: string; required: boolean }[] = [
		{ name: 'name', label: 'Nama', type: 'text', required: true },
		{ name: 'email', label: 'Email', type: 'email', required: true },
		{ name: 'username', label: 'Username', type: 'text', required: false },
		{ name: 'title', label: 'Jabatan', type: 'text', required: false },
		{ name: 'unit', label: 'Unit', type: 'text', required: false },
		{ name: 'phone', label: 'Telepon', type: 'text', required: false }
	];

	const statusVariant = { Active: 'green', Inactive: 'gray', Locked: 'red' } as const;
	const statusLabel = { Active: 'Aktif', Inactive: 'Nonaktif', Locked: 'Terkunci' } as const;

	function fmtDate(d: Date | string | null) {
		if (!d) return '-';
		return new Intl.DateTimeFormat('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			timeZone: 'Asia/Jakarta'
		})
			.format(new Date(d))
			.replace(/\s/g, '-');
	}
</script>

<svelte:head><title>User Management · PMO System</title></svelte:head>

<PageHeader title="User Management" subtitle="CRUD user, role, assignment project">
	{#snippet actions()}
		{#if data.canCreate}
			<button
				type="button"
				class="rounded-md bg-[#17365D] px-3 py-2 text-sm font-medium text-white hover:bg-[#1f4a80]"
				onclick={() => (showCreate = true)}>+ Tambah user</button
			>
		{/if}
	{/snippet}
</PageHeader>

<form method="GET" class="mb-4 flex flex-wrap items-end gap-3">
	<label class="text-sm">
		<span class="block text-slate-700">Cari</span>
		<input
			type="search"
			name="q"
			value={data.query.q ?? ''}
			placeholder="Nama / email / username"
			class="mt-1 rounded-md border-slate-300"
		/>
	</label>
	<label class="text-sm">
		<span class="block text-slate-700">Role</span>
		<select name="role" class="mt-1 rounded-md border-slate-300">
			<option value="">Semua</option>
			{#each data.roles as r (r.id)}
				<option value={r.id} selected={data.query.role === r.id}>{r.name}</option>
			{/each}
		</select>
	</label>
	<label class="text-sm">
		<span class="block text-slate-700">Status</span>
		<select name="status" class="mt-1 rounded-md border-slate-300">
			<option value="">Semua</option>
			{#each Object.entries(statusLabel) as [v, l] (v)}
				<option value={v} selected={data.query.status === v}>{l}</option>
			{/each}
		</select>
	</label>
	<label class="text-sm">
		<span class="block text-slate-700">Unit</span>
		<select name="unit" class="mt-1 rounded-md border-slate-300">
			<option value="">Semua</option>
			{#each data.units as u (u)}
				<option value={u} selected={data.query.unit === u}>{u}</option>
			{/each}
		</select>
	</label>
	<button type="submit" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
		>Terapkan</button
	>
</form>

<DataTable
	{columns}
	rows={data.list.rows}
	total={data.list.total}
	page={data.list.page}
	pageSize={data.list.pageSize}
	sort={data.query.sort}
	dir={data.query.dir}
	rowKey={(r) => r.id}
	empty="Belum ada user."
>
	{#snippet cell(row, col)}
		{#if col.key === 'status'}
			<Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>
		{:else if col.key === 'roles'}
			{row.roles.join(', ') || '-'}
		{:else if col.key === 'lastLoginAt'}
			{fmtDate(row.lastLoginAt)}
		{:else if col.key === 'name'}
			<a
				href={resolve('/(app)/admin/users/[id]', { id: row.id })}
				class="font-medium text-[#17365D] hover:underline">{row.name}</a
			>
		{:else}
			{row[col.key as 'email' | 'unit'] ?? '-'}
		{/if}
	{/snippet}
	{#snippet rowActions(row)}
		<a
			href={resolve('/(app)/admin/users/[id]', { id: row.id })}
			class="text-sm text-[#17365D] hover:underline">Detail</a
		>
	{/snippet}
</DataTable>

<Modal bind:open={showCreate} title="Tambah user" onclose={() => (created = null)}>
	{#if created}
		<div class="space-y-3 text-sm">
			<p>
				User <strong>{created.email}</strong> dibuat. Berikan password sementara ini (hanya tampil sekali).
				User wajib menggantinya saat login pertama.
			</p>
			<code class="block rounded bg-slate-100 px-3 py-2 text-base select-all"
				>{created.tempPassword}</code
			>
			<button
				type="button"
				class="rounded-md bg-[#17365D] px-3 py-2 text-white"
				onclick={() => {
					showCreate = false;
					created = null;
				}}>Selesai</button
			>
		</div>
	{:else}
		<form
			method="POST"
			action="?/create"
			class="space-y-3 text-sm"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'success' && result.data?.created) {
						created = result.data.created as { email: string; tempPassword: string };
						toast.success('User dibuat');
						await update({ reset: true });
					} else {
						await update({ reset: false });
						if (result.type === 'failure') toast.error('Periksa isian form');
					}
				};
			}}
		>
			{#if errors._}<p class="text-red-600">{errors._}</p>{/if}
			{#each fields as f (f.name)}
				<label class="block">
					<span class="text-slate-700">{f.label}{f.required ? ' *' : ''}</span>
					<input
						name={f.name}
						type={f.type}
						required={f.required}
						class="mt-1 w-full rounded-md border-slate-300"
					/>
					{#if errors[f.name]}<span class="text-xs text-red-600">{errors[f.name]}</span>{/if}
				</label>
			{/each}
			<fieldset>
				<legend class="text-slate-700">Role *</legend>
				<div class="mt-1 grid grid-cols-2 gap-1">
					{#each data.roles as r (r.id)}
						<label class="flex items-center gap-2"
							><input type="checkbox" name="roleIds" value={r.id} />{roleNames.get(r.id)}</label
						>
					{/each}
				</div>
				{#if errors.roleIds}<span class="text-xs text-red-600">{errors.roleIds}</span>{/if}
			</fieldset>
			<div class="flex justify-end gap-2 pt-2">
				<button
					type="button"
					class="rounded-md border px-3 py-2"
					onclick={() => (showCreate = false)}>Batal</button
				>
				<button
					type="submit"
					disabled={submitting}
					class="rounded-md bg-[#17365D] px-3 py-2 text-white disabled:opacity-50">Simpan</button
				>
			</div>
		</form>
	{/if}
</Modal>
