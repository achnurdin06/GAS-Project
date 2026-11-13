<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { resolve } from '$app/paths';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import Badge from '#lib/components/ui/Badge.svelte';
	import { toast } from '#lib/components/ui/toast.svelte.ts';
	import { PROJECT_ROLES } from '#lib/schemas/user.schema.ts';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let tempPassword = $state<string | null>(null);
	const errors = $derived(form && 'errors' in form ? (form.errors as Record<string, string>) : {});
	const d = $derived(data.detail);

	const fields = $derived<
		{ name: string; label: string; value: string | null; required: boolean }[]
	>([
		{ name: 'name', label: 'Nama *', value: d.name, required: true },
		{ name: 'username', label: 'Username', value: d.username, required: false },
		{ name: 'title', label: 'Jabatan', value: d.title, required: false },
		{ name: 'unit', label: 'Unit', value: d.unit, required: false },
		{ name: 'phone', label: 'Telepon', value: d.phone, required: false }
	]);

	const statusVariant = { Active: 'green', Inactive: 'gray', Locked: 'red' } as const;
	const statusLabel = { Active: 'Aktif', Inactive: 'Nonaktif', Locked: 'Terkunci' } as const;

	const submit: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				const res = result.data as { message?: string; tempPassword?: string } | undefined;
				if (res?.tempPassword) tempPassword = res.tempPassword;
				else tempPassword = null;
				toast.success(res?.message ?? 'Password direset');
			} else if (result.type === 'failure') {
				const err = (result.data as { errors?: Record<string, string> } | undefined)?.errors;
				toast.error(err ? (Object.values(err)[0] ?? 'Gagal') : 'Gagal');
			}
			await update({ reset: false });
		};
	};
</script>

<svelte:head><title>{d.name} · User Management</title></svelte:head>

<PageHeader title={d.name} subtitle={d.email}>
	{#snippet actions()}
		<a href={resolve('/(app)/admin/users')} class="text-sm text-[#17365D] hover:underline"
			>← Daftar user</a
		>
	{/snippet}
</PageHeader>

<div class="mb-4 flex items-center gap-3 text-sm">
	<Badge variant={statusVariant[d.status]}>{statusLabel[d.status]}</Badge>
	{#if d.mustChangePassword}<Badge variant="amber">Wajib ganti password</Badge>{/if}
</div>

{#if tempPassword}
	<div class="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
		Password sementara (hanya tampil sekali):
		<code class="ml-2 rounded bg-white px-2 py-1 text-base select-all">{tempPassword}</code>
	</div>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
	<section class="rounded-xl bg-white p-5 shadow">
		<h2 class="mb-3 font-semibold text-[#17365D]">Profil</h2>
		<form method="POST" action="?/update" use:enhance={submit} class="space-y-3 text-sm">
			{#each fields as f (f.name)}
				<label class="block">
					<span class="text-slate-700">{f.label}</span>
					<input
						name={f.name}
						value={f.value ?? ''}
						required={f.required}
						disabled={!data.can.update}
						class="mt-1 w-full rounded-md border-slate-300 disabled:bg-slate-100"
					/>
					{#if errors[f.name]}<span class="text-xs text-red-600">{errors[f.name]}</span>{/if}
				</label>
			{/each}
			{#if data.can.update}
				<button type="submit" class="rounded-md bg-[#17365D] px-3 py-2 text-white"
					>Simpan profil</button
				>
			{/if}
		</form>
	</section>

	<div class="space-y-6">
		<section class="rounded-xl bg-white p-5 shadow">
			<h2 class="mb-3 font-semibold text-[#17365D]">Role</h2>
			<form method="POST" action="?/roles" use:enhance={submit} class="space-y-3 text-sm">
				<div class="grid grid-cols-2 gap-1">
					{#each data.roles as r (r.id)}
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								name="roleIds"
								value={r.id}
								checked={d.roleIds.includes(r.id)}
								disabled={!data.can.update}
							/>{r.name}
						</label>
					{/each}
				</div>
				{#if errors.roleIds}<span class="text-xs text-red-600">{errors.roleIds}</span>{/if}
				{#if data.can.update}
					<button type="submit" class="rounded-md bg-[#17365D] px-3 py-2 text-white"
						>Simpan role</button
					>
				{/if}
			</form>
		</section>

		{#if data.can.update}
			<section class="rounded-xl bg-white p-5 shadow">
				<h2 class="mb-3 font-semibold text-[#17365D]">Akun</h2>
				<div class="flex flex-wrap gap-2 text-sm">
					<form method="POST" action="?/resetPassword" use:enhance={submit}>
						<button type="submit" class="rounded-md border border-slate-300 px-3 py-2"
							>Reset password</button
						>
					</form>
					{#if !data.isSelf}
						<form method="POST" action="?/toggleActive" use:enhance={submit}>
							<input
								type="hidden"
								name="active"
								value={d.status === 'Inactive' ? 'true' : 'false'}
							/>
							<button
								type="submit"
								class="rounded-md border px-3 py-2 {d.status === 'Inactive'
									? 'border-green-600 text-green-700'
									: 'border-red-600 text-red-700'}"
								>{d.status === 'Inactive' ? 'Aktifkan' : 'Nonaktifkan'}</button
							>
						</form>
					{/if}
				</div>
			</section>
		{/if}
	</div>
</div>

<section class="mt-6 rounded-xl bg-white p-5 shadow">
	<h2 class="mb-3 font-semibold text-[#17365D]">Assignment project</h2>
	{#if d.projects.length === 0}
		<p class="text-sm text-slate-500">Belum ada project.</p>
	{:else}
		<ul class="divide-y text-sm">
			{#each d.projects as p (p.projectId + p.projectRole)}
				<li class="flex items-center justify-between py-2">
					<span>{p.code} — {p.name} <Badge variant="blue">{p.projectRole}</Badge></span>
					{#if data.can.update}
						<form method="POST" action="?/removeProject" use:enhance={submit}>
							<input type="hidden" name="projectId" value={p.projectId} />
							<input type="hidden" name="projectRole" value={p.projectRole} />
							<button type="submit" class="text-red-700 hover:underline">Hapus</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
	{#if data.can.update}
		<form
			method="POST"
			action="?/addProject"
			use:enhance={submit}
			class="mt-4 flex flex-wrap items-end gap-3 text-sm"
		>
			<label>
				<span class="block text-slate-700">Project</span>
				<select name="projectId" required class="mt-1 rounded-md border-slate-300">
					<option value="">-- Pilih --</option>
					{#each data.projects as p (p.id)}<option value={p.id}>{p.code} — {p.name}</option>{/each}
				</select>
			</label>
			<label>
				<span class="block text-slate-700">Peran</span>
				<select name="projectRole" required class="mt-1 rounded-md border-slate-300">
					{#each PROJECT_ROLES as r (r)}<option value={r}>{r}</option>{/each}
				</select>
			</label>
			<button type="submit" class="rounded-md bg-[#17365D] px-3 py-2 text-white">Tambah</button>
		</form>
	{/if}
</section>
