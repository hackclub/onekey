<script lang="ts">
	import { navigating } from '$app/state';
	import { untrack } from 'svelte';
	import { darkMode } from '$lib/stores/theme';

	let visible = $state(false);
	let progress = $state(0);

	let showTimer: ReturnType<typeof setTimeout> | undefined;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	let tick: ReturnType<typeof setInterval> | undefined;

	function clearAll() {
		clearTimeout(showTimer);
		clearTimeout(hideTimer);
		clearInterval(tick);
	}

	$effect(() => {
		// `navigating` from $app/state is a *stable* object — only its properties are
		// reactive. Reading `navigating.to` (null when idle, a target while a navigation
		// is in flight) is what registers the dependency so this effect re-runs on every
		// navigation. The old code read `navigating` itself, which never changes, so the
		// effect fired once and then went deaf — that was the "doesn't work" bug, not any
		// incompatibility with runes.
		const pending = navigating.to;

		// Keep the animation bookkeeping out of the dependency graph: writing
		// `visible`/`progress` must not re-trigger this effect. The only input is
		// navigation state.
		untrack(() => {
			clearAll();
			if (pending) {
				// Delay before showing so quick navigations don't flash the bar.
				showTimer = setTimeout(() => {
					visible = true;
					progress = 0.08;
					// Ease toward 85% while we wait — never reaches 100% until done.
					tick = setInterval(() => {
						progress += (0.85 - progress) * 0.12;
					}, 120);
				}, 250);
			} else if (visible) {
				// Navigation finished: snap to full, then fade out.
				progress = 1;
				hideTimer = setTimeout(() => {
					visible = false;
					progress = 0;
				}, 250);
			}
		});

		// Runs before each re-run and on unmount — stops timers from a cancelled phase.
		return clearAll;
	});
</script>

{#if visible}
	<div
		class="nav-progress"
		class:dark={$darkMode}
		style="transform: scaleX({progress}); opacity: {progress >= 1 ? 0 : 1};"
	></div>
{/if}

<style>
	.nav-progress {
		position: fixed;
		inset-inline: 0;
		top: 0;
		z-index: 9999;
		height: 2px;
		background-color: black;
		transform-origin: left;
		transition:
			transform 200ms ease-out,
			opacity 200ms ease-out;
		pointer-events: none;
	}

	/* The bar lives in the root layout, outside `.dashboard`, so it can't inherit the
	   dark-mode CSS vars — flip its color from the theme store instead. */
	.nav-progress.dark {
		background-color: white;
	}
</style>
