<script lang="ts">
	import { navigating } from '$app/state';

	let visible = $state(false);
	let progress = $state(0);

	let showTimer: ReturnType<typeof setTimeout> | undefined;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	let tick: ReturnType<typeof setInterval> | undefined;

	$effect(() => {
		if (navigating) {
			clearTimeout(showTimer);
			clearTimeout(hideTimer);
			clearInterval(tick);
			showTimer = setTimeout(() => {
				visible = true;
				progress = 0.08;
				tick = setInterval(() => {
					progress = progress + (0.85 - progress) * 0.12;
				}, 120);
			}, 250);
		} else {
			clearTimeout(showTimer);
			clearInterval(tick);
			if (visible) {
				progress = 1;
				hideTimer = setTimeout(() => {
					visible = false;
					progress = 0;
				}, 250);
			}
		}
	});
</script>

{#if visible}
	<div
		class="nav-progress"
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
		background-color: var(--color-text);
		transform-origin: left;
		transition: transform 200ms ease-out, opacity 200ms ease-out;
		pointer-events: none;
	}
</style>
