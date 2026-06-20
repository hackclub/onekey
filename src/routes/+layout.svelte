<script lang="ts">
	import '../app.css';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>onekey</title>
	<link rel="icon" type="image/x-icon" href="/favicon.ico" />
</svelte:head>

<NavigationProgress />

{@render children()}
