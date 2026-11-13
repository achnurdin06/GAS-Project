<script lang="ts">
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHeader
	title={`Project ${data.code}`}
	subtitle="Overview · Milestone · Task · Work Item · RAID · CR · Budget · Gate · Billing · Snapshot"
/>
