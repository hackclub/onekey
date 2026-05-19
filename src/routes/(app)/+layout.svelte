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
		--rail-bg: #000000;
		--rail-bg-2: #1c2027;
		--rail-line: #212328;
		--rail-label: #8a8f99;
		--keycap-color: white;
		--keycap-border: #0e0f12;
		min-height: 100vh;
	}

	.work {
		margin-left: max(110px, 17vh);
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.content {
		padding: clamp(2rem, 3vw, 4rem) clamp(1.5rem, 3vw, 3rem);
		width: 100%;
		flex: 1;
		font-size: 1rem;
		box-sizing: border-box;
		margin: 0;
	}

	.content :global(h1) {
		font-size: 2rem;
	}

</style>
