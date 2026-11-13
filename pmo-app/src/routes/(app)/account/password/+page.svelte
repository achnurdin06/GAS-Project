<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const fields = [
		{ name: 'currentPassword', label: 'Password saat ini', autocomplete: 'current-password' },
		{ name: 'newPassword', label: 'Password baru', autocomplete: 'new-password' },
		{ name: 'confirmPassword', label: 'Konfirmasi password baru', autocomplete: 'new-password' }
	] as const;
</script>

<svelte:head><title>Ganti Password · PMO System</title></svelte:head>

<PageHeader title="Ganti Password" subtitle="Minimal 8 karakter, kombinasi huruf dan angka" />

{#if data.forced}
	<p class="mb-4 max-w-md rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
		Anda wajib mengganti password sebelum melanjutkan.
	</p>
{/if}

<form method="POST" use:enhance class="max-w-md space-y-4 rounded-xl bg-white p-6 shadow">
	{#each fields as f (f.name)}
		<label class="block text-sm">
			<span class="text-slate-700">{f.label}</span>
			<input
				name={f.name}
				type="password"
				autocomplete={f.autocomplete}
				required
				class="mt-1 w-full rounded-md border-slate-300"
			/>
			{#if form?.errors?.[f.name]}
				<span class="mt-1 block text-xs text-red-600">{form.errors[f.name]}</span>
			{/if}
		</label>
	{/each}
	<button class="rounded-md bg-[#17365D] px-4 py-2 font-semibold text-white hover:bg-[#1F4E78]"
		>Simpan password</button
	>
</form>
