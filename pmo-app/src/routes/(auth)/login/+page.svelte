<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Login · PMO System</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-slate-100 p-4">
	<form method="POST" use:enhance class="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow">
		<div>
			<h1 class="text-xl font-bold text-[#17365D]">PMO Project Control</h1>
			<p class="text-sm text-slate-500">Masuk untuk melanjutkan</p>
		</div>
		{#if form?.message}
			<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
		{/if}
		<label class="block text-sm">
			<span class="text-slate-700">Email</span>
			<input
				name="email"
				type="email"
				autocomplete="username"
				required
				value={form?.email ?? ''}
				class="mt-1 w-full rounded-md border-slate-300"
			/>
		</label>
		<label class="block text-sm">
			<span class="text-slate-700">Password</span>
			<input
				name="password"
				type="password"
				autocomplete="current-password"
				required
				class="mt-1 w-full rounded-md border-slate-300"
			/>
		</label>
		<button class="w-full rounded-md bg-[#17365D] py-2 font-semibold text-white hover:bg-[#1F4E78]"
			>Masuk</button
		>
	</form>
</main>
