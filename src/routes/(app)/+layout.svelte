<script lang="ts">
	import KeycapRail from '$lib/components/nav/KeycapRail.svelte';

	let { children } = $props();
</script>

<div class="dashboard">
	<KeycapRail />
	<div class="work">
		<main class="content">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.dashboard {
		--rail-bg: #15171b;
		--rail-bg-2: #1c2027;
		--rail-line: #2a2e36;
		--rail-label: #8a8f99;
		--accent: #ec3750;
		--keycap-color: #f5f1e8;
		--keycap-border: #0e0f12;
		min-height: 100vh;
	}

	.work {
		margin-left: clamp(110px, 9.5vw, 170px);
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.content {
		padding: clamp(2rem, 3vw, 4rem) clamp(1.5rem, 3vw, 3rem);
		max-width: 80rem;
		width: 100%;
		margin: 0 auto;
		flex: 1;
		font-size: clamp(1rem, 1vw, 1.3rem);
		box-sizing: border-box;
	}

	.content :global(h1) {
		font-size: clamp(2rem, 3vw, 3.5rem);
		margin-bottom: 1rem;
	}

	.content :global(p) {
		font-size: clamp(1.05rem, 1vw, 1.3rem);
	}
</style>
