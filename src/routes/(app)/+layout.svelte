<script lang="ts">
	import KeycapRail from '$lib/components/nav/KeycapRail.svelte';
	import { page } from '$app/state';
	import { darkMode } from '$lib/stores/theme';

	let { children, data } = $props();

	$effect(() => {
		darkMode.set(data.user?.dark_mode_enabled ?? false);
	});
</script>

<div class="dashboard" class:dark={$darkMode}>
	<KeycapRail />
	<div class="work">
		{#if page.data.isAdmin || page.data.isReviewer}
			<div class="badge-tray">
				{#if page.data.isReviewer}
					<a
						href="/review"
						class="role-badge"
						class:active={page.url.pathname.startsWith('/review')}
					>
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
		background-color: var(--color-bg);
		color: var(--color-text);
	}

	.dashboard.dark {
		--color-text: white;
		--color-text-soft: #d0d0d0;
		--color-bg: #0f0f0f;
		--color-bg-soft: #1a1a1a;
		--keycap-color: #1c1c1c;
		--keycap-active: white;
	}

	:global(.dashboard.dark .nav) {
		background: #1c1c1c;
	}

	/* swap gradients: active key gets the light gradient, inactive gets the dark one */
	:global(.dashboard.dark .keycap:not(.dark)) {
		background: conic-gradient(
			from 315deg at 50% 50%,
			color-mix(in srgb, var(--color) 80%, white) 0deg 90deg,
			color-mix(in srgb, var(--color) 94%, white) 90deg 180deg,
			color-mix(in srgb, var(--color) 55%, black) 180deg 270deg,
			color-mix(in srgb, var(--color) 94%, white) 270deg 360deg
		);
	}

	:global(.dashboard.dark .keycap.dark) {
		background: conic-gradient(
			from 315deg at 50% 50%,
			color-mix(in srgb, var(--color) 91%, white) 0deg 90deg,
			color-mix(in srgb, var(--color) 85%, black) 90deg 180deg,
			color-mix(in srgb, var(--color) 72%, black) 180deg 270deg,
			color-mix(in srgb, var(--color) 85%, black) 270deg 360deg
		);
		border-color: color-mix(in srgb, var(--keycap-active, white) 72%, black);
	}

	:global(.dashboard.dark .svg-icon) {
		color: white;
	}

	:global(.dashboard.dark .svg-icon.white) {
		color: black;
	}

	:global(.dashboard.dark .label) {
		color: #9da2ab;
	}

	:global(.dashboard.dark .item.active .label) {
		color: white;
	}

	:global(.dashboard.dark .hero-bg) {
		filter: invert(1) blur(3.5px);
	}

	:global(.dashboard.dark .goal-seg:not(.filled)) {
		background: #555;
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
		transition:
			color 0.15s,
			background 0.15s,
			border-color 0.15s;
	}

	.role-badge:hover,
	.role-badge.active {
		color: #fff;
		background: #2a2f38;
		border-color: #3a3f48;
	}

	@media (max-width: 767px) {
		.work {
			margin-left: 0;
			margin-top: 52px;
			margin-bottom: 80px;
		}

		.content {
			padding: 1.25rem 1rem;
		}
	}
</style>
