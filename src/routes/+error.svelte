<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>onekey - {page.status}</title>
</svelte:head>

<div class="error-page">
	<p class="status">{page.status}</p>
	<h1 class="message">{page.error?.message ?? 'something went wrong'}</h1>
	<a href="/home" class="home">go home</a>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 0 clamp(2rem, 8vw, 8rem);
		box-sizing: border-box;
	}

	.status {
		font-size: clamp(6rem, 18vw, 14rem);
		font-weight: 800;
		letter-spacing: -0.04em;
		line-height: 1;
		color: var(--color-text);
		margin: 0 0 0.25rem;
	}

	h1 {
		font-size: clamp(1.4rem, 2.5vw, 2rem);
		font-weight: 500;
		letter-spacing: -0.01em;
		margin: 0 0 2rem;
		color: var(--color-text-soft);
		line-height: 1.3;
	}

	.home {
		font-size: 1rem;
		font-weight: bold;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
</style>
