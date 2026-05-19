<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { theme } from '$lib/theme.svelte';

	let { children } = $props();

	if (browser) {
		theme.dark = localStorage.getItem('theme') === 'dark';
	}
</script>

<svelte:head>
	<link rel="icon" type="image/x-icon" href="/favicon.ico" />
	<meta property="og:author" content="onekey - Hack Club" />
	<meta property="og:title" content="onekey" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://maxstellar.github.io/onekey/img/og-banner.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:description"
		content="make a program that only uses one key, get a one key macropad! A Hack Club program for teen coders."
	/>
	<meta name="twitter:site" content="onekey - Hack Club" />
	<meta name="twitter:title" content="onekey" />
	<meta
		name="twitter:description"
		content="make a program that only uses one key, get a one key macropad! A Hack Club program for teen coders."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image:src" content="https://maxstellar.github.io/onekey/img/og-banner.png" />
</svelte:head>

{@render children()}
