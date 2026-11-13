<script lang="ts" generics="T extends object">
	import { goto } from '$app/navigation';
	import { page as pageState } from '$app/state';
	import type { Snippet } from 'svelte';
	import { PAGE_SIZES } from '#lib/schemas/list-query.ts';
	import type { Column } from './types.ts';

	interface Props {
		columns: Column<T>[];
		rows: T[];
		total: number;
		page: number;
		pageSize: number;
		sort?: string;
		dir?: 'asc' | 'desc';
		rowKey: (row: T) => string;
		empty?: string;
		cell?: Snippet<[T, Column<T>]>;
		rowActions?: Snippet<[T]>;
	}
	let {
		columns,
		rows,
		total,
		page,
		pageSize,
		sort,
		dir = 'asc',
		rowKey,
		empty = 'Tidak ada data.',
		cell,
		rowActions
	}: Props = $props();

	const lastPage = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const from = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	const to = $derived(Math.min(total, page * pageSize));

	function navigate(patch: Record<string, string | number | undefined>) {
		const url = new URL(pageState.url.href);
		for (const [k, v] of Object.entries(patch)) {
			if (v === undefined) url.searchParams.delete(k);
			else url.searchParams.set(k, String(v));
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- hanya mengubah query halaman saat ini
		goto(url, { reset: false });
	}

	function toggleSort(key: string) {
		const nextDir = sort === key && dir === 'asc' ? 'desc' : 'asc';
		navigate({ sort: key, dir: nextDir, page: 1 });
	}
</script>

<div class="overflow-hidden rounded-xl bg-white shadow">
	<div class="overflow-x-auto">
		<table class="min-w-full text-sm">
			<thead class="bg-[#17365D] text-left text-white">
				<tr>
					{#each columns as c (c.key)}
						<th
							class="px-3 py-2 font-semibold {c.align === 'right' ? 'text-right' : ''}"
							aria-sort={sort === c.key ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
						>
							{#if c.sortable}
								<button type="button" class="font-semibold" onclick={() => toggleSort(c.key)}>
									{c.label}{sort === c.key ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
								</button>
							{:else}
								{c.label}
							{/if}
						</th>
					{/each}
					{#if rowActions}<th class="px-3 py-2"><span class="sr-only">Aksi</span></th>{/if}
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#each rows as row (rowKey(row))}
					<tr class="hover:bg-slate-50">
						{#each columns as c (c.key)}
							<td class="px-3 py-2 {c.align === 'right' ? 'text-right' : ''}">
								{#if cell}
									{@render cell(row, c)}
								{:else}
									{c.value?.(row) ?? '-'}
								{/if}
							</td>
						{/each}
						{#if rowActions}
							<td class="px-3 py-2 text-right whitespace-nowrap">{@render rowActions(row)}</td>
						{/if}
					</tr>
				{:else}
					<tr>
						<td
							class="px-3 py-8 text-center text-slate-500"
							colspan={columns.length + (rowActions ? 1 : 0)}>{empty}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div
		class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-sm text-slate-600"
	>
		<span>{from}–{to} dari {total}</span>
		<div class="flex items-center gap-2">
			<label class="flex items-center gap-1">
				Baris
				<select
					class="rounded-md border-slate-300 py-1 text-sm"
					value={pageSize}
					onchange={(e) => navigate({ pageSize: e.currentTarget.value, page: 1 })}
				>
					{#each PAGE_SIZES as s (s)}<option value={s}>{s}</option>{/each}
				</select>
			</label>
			<button
				type="button"
				class="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
				disabled={page <= 1}
				onclick={() => navigate({ page: page - 1 })}>Sebelumnya</button
			>
			<span>Hal. {page} / {lastPage}</span>
			<button
				type="button"
				class="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
				disabled={page >= lastPage}
				onclick={() => navigate({ page: page + 1 })}>Berikutnya</button
			>
		</div>
	</div>
</div>
