<script lang="ts">
	import KeycapRail from '$lib/components/nav/KeycapRail.svelte';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<div class="dashboard">
	<KeycapRail />
	<div class="work">
		{#if page.data.isAdmin || page.data.isReviewer}
			<div class="badge-tray">
				{#if page.data.isReviewer}
					<a href="/review" class="role-badge" class:active={page.url.pathname.startsWith('/review')}>
						review
					</a>
				{/if}
				{#if page.data.isAdmin}
					<a href="/admin" class="role-badge" class:active={page.url.pathname.startsWith('/admin')}>
						admin
					</a>
				{/if}
			</div>
		{/if}
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
		position: relative;
	}

	.content {
		padding: clamp(2rem, 3vw, 4rem) clamp(1.5rem, 3vw, 3rem);
		width: 100%;
		flex: 1;
		font-size: 1rem;
		box-sizing: border-box;
		margin: 0;
	}

	.badge-tray {
		position: fixed;
		top: clamp(12px, 2vh, 20px);
		right: clamp(12px, 2vw, 24px);
		z-index: 10;
		display: flex;
		gap: 6px;
	}

	.role-badge {
		font-family: 'Phantom Sans', sans-serif;
		font-size: max(9px, 1.2vh);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		text-decoration: none;
		padding: 5px 12px;
		border-radius: 6px;
		background: #1c2027;
		color: #8a8f99;
		border: 1px solid #212328;
		transition: color 0.15s, background 0.15s, border-color 0.15s;
	}

	.role-badge:hover,
	.role-badge.active {
		color: #fff;
		background: #2a2f38;
		border-color: #3a3f48;
	}
</style>
