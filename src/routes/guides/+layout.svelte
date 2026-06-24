<script lang="ts">
	let { children, data } = $props();
</script>

<div class="guides-shell">
	<header>
		<a href="/" class="brand" aria-label="onekey home" draggable="false">
			<img
				src="https://assets.hackclub.com/flag-standalone-bw.svg"
				alt="Hack Club"
				class="flag"
				draggable="false"
			/>
		</a>

		{#if data.user}
			<a href="/home" class="button filled nav-btn">dashboard</a>
		{:else}
			<a href="/login" class="button filled nav-btn">sign in</a>
		{/if}
	</header>

	{@render children()}
</div>

<style>
	.guides-shell {
		min-height: 100vh;
		background: var(--color-bg);
		color: var(--color-text);
	}

	header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: var(--color-bg);
		padding: 1.5rem 3rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand {
		display: flex;
		align-items: center;
		text-decoration: none;
	}

	.flag {
		height: 3rem;
		width: auto;
		display: block;
	}
</style>
