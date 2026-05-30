<script lang="ts">
	import '../app.css';

	let { children } = $props();
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

<!-- BETA BANNER: remove this block when out of beta -->
<div style="background:black;color:white;text-align:center;padding:16px 24px;font-size:0.875rem;font-weight:600;letter-spacing:0.02em;position:sticky;top:0;z-index:15;">
	BETA &mdash; this is a testing environment, projects will not be submitted to unified db and prizes will not be paid out.
</div>
<!-- END BETA BANNER -->

{@render children()}
