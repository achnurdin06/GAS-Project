<script lang="ts">
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import DataTable from '#lib/components/tables/DataTable.svelte';
	import type { Column } from '#lib/components/tables/types.ts';
	import Badge from '#lib/components/ui/Badge.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import type { AuditRow } from '#lib/server/services/audit.service.ts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selected = $state<AuditRow | null>(null);
	let modalOpen = $state(false);

	const columns: Column<AuditRow>[] = [
		{ key: 'occurredAt', label: 'Waktu', sortable: true },
		{ key: 'userName', label: 'User' },
		{ key: 'action', label: 'Aksi', sortable: true },
		{ key: 'entityType', label: 'Entitas' },
		{ key: 'entityId', label: 'ID' },
		{ key: 'ip', label: 'IP' }
	];

	const actionVariant: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'gray'> = {
		create: 'green',
		update: 'blue',
		delete: 'red',
		login: 'green',
		login_failed: 'red',
		logout: 'gray',
		account_locked: 'red',
		account_unlocked: 'amber',
		reset_password: 'amber',
		password_changed: 'blue',
		deactivate: 'amber',
		activate: 'green'
	};

	const dtf = new Intl.DateTimeFormat('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Asia/Jakarta'
	});

	function fmt(d: Date | string) {
		return dtf.format(new Date(d)).replace(/\./g, ':') + ' WIB';
	}
</script>

<svelte:head><title>Audit Trail · PMO System</title></svelte:head>

<PageHeader title="Audit Trail" subtitle="Log perubahan data & keamanan (append-only)" />

<form method="GET" class="mb-4 flex flex-wrap items-end gap-3 text-sm">
	<label>
		<span class="block text-slate-700">User</span>
		<select name="userId" class="mt-1 rounded-md border-slate-300">
			<option value="">Semua</option>
			{#each data.facets.users as u (u.id)}
				<option value={u.id} selected={data.filters.userId === u.id}>{u.name}</option>
			{/each}
		</select>
	</label>
	<label>
		<span class="block text-slate-700">Aksi</span>
		<select name="action" class="mt-1 rounded-md border-slate-300">
			<option value="">Semua</option>
			{#each data.facets.actions as a (a)}
				<option value={a} selected={data.filters.action === a}>{a}</option>
			{/each}
		</select>
	</label>
	<label>
		<span class="block text-slate-700">Entitas</span>
		<select name="entityType" class="mt-1 rounded-md border-slate-300">
			<option value="">Semua</option>
			{#each data.facets.entityTypes as e (e)}
				<option value={e} selected={data.filters.entityType === e}>{e}</option>
			{/each}
		</select>
	</label>
	<label>
		<span class="block text-slate-700">ID entitas</span>
		<input
			name="entityId"
			value={data.filters.entityId ?? ''}
			class="mt-1 rounded-md border-slate-300"
		/>
	</label>
	<label>
		<span class="block text-slate-700">Dari</span>
		<input
			type="date"
			name="from"
			value={data.filters.from ?? ''}
			class="mt-1 rounded-md border-slate-300"
		/>
	</label>
	<label>
		<span class="block text-slate-700">Sampai</span>
		<input
			type="date"
			name="to"
			value={data.filters.to ?? ''}
			class="mt-1 rounded-md border-slate-300"
		/>
	</label>
	<button type="submit" class="rounded-md border border-slate-300 bg-white px-3 py-2"
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
	rowKey={(r) => String(r.id)}
	empty="Belum ada catatan audit."
>
	{#snippet cell(row, col)}
		{#if col.key === 'occurredAt'}
			{fmt(row.occurredAt)}
		{:else if col.key === 'action'}
			<Badge variant={actionVariant[row.action] ?? 'gray'}>{row.action}</Badge>
		{:else if col.key === 'userName'}
			{row.userName ?? row.userEmail ?? '-'}
		{:else if col.key === 'entityId'}
			{#if row.entityId}
				<code class="text-xs">{row.entityId}</code>
			{:else}
				-
			{/if}
		{:else}
			{row[col.key as 'entityType' | 'ip'] ?? '-'}
		{/if}
	{/snippet}
	{#snippet rowActions(row)}
		<button
			type="button"
			class="text-[#17365D] hover:underline"
			onclick={() => {
				selected = row;
				modalOpen = true;
			}}>Detail</button
		>
	{/snippet}
</DataTable>

<Modal
	bind:open={modalOpen}
	title="Detail audit"
	onclose={() => {
		selected = null;
	}}
>
	{#if selected}
		<div class="max-h-[60vh] space-y-3 overflow-y-auto text-sm">
			<dl class="grid grid-cols-3 gap-1">
				<dt class="text-slate-500">Waktu</dt>
				<dd class="col-span-2">{fmt(selected.occurredAt)}</dd>
				<dt class="text-slate-500">User</dt>
				<dd class="col-span-2">{selected.userName ?? '-'} {selected.userEmail ?? ''}</dd>
				<dt class="text-slate-500">Aksi</dt>
				<dd class="col-span-2">
					<Badge variant={actionVariant[selected.action] ?? 'gray'}>{selected.action}</Badge>
				</dd>
				<dt class="text-slate-500">Entitas</dt>
				<dd class="col-span-2">{selected.entityType ?? '-'}</dd>
				<dt class="text-slate-500">ID</dt>
				<dd class="col-span-2 break-all">
					<code class="text-xs">{selected.entityId ?? '-'}</code>
				</dd>
				<dt class="text-slate-500">IP</dt>
				<dd class="col-span-2">{selected.ip ?? '-'}</dd>
			</dl>
			<div>
				<p class="mb-1 font-semibold text-slate-700">Sebelum</p>
				<pre class="max-h-48 overflow-auto rounded bg-slate-50 p-2 text-xs">{selected.before
						? JSON.stringify(selected.before, null, 2)
						: '-'}</pre>
			</div>
			<div>
				<p class="mb-1 font-semibold text-slate-700">Sesudah</p>
				<pre class="max-h-48 overflow-auto rounded bg-slate-50 p-2 text-xs">{selected.after
						? JSON.stringify(selected.after, null, 2)
						: '-'}</pre>
			</div>
		</div>
	{/if}
</Modal>
