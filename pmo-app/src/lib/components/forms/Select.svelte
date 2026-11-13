<script lang="ts">
	interface Option {
		value: string;
		label: string;
	}
	interface Props {
		name: string;
		label: string;
		/** Opsi dari `listMasterOptions()` di server, bukan hardcode. */
		options: Option[];
		value?: string;
		required?: boolean;
		placeholder?: string;
		error?: string;
	}
	let {
		name,
		label,
		options,
		value = $bindable(''),
		required = false,
		placeholder = '-- Pilih --',
		error
	}: Props = $props();
</script>

<label class="block text-sm">
	<span class="text-slate-700">{label}</span>
	<select {name} {required} bind:value class="mt-1 w-full rounded-md border-slate-300">
		<option value="">{placeholder}</option>
		{#each options as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
	</select>
	{#if error}<span class="mt-1 block text-xs text-red-600">{error}</span>{/if}
</label>
