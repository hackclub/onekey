<!--
  <Keycap> - chunky 3D keyboard-keycap button.

  Usage (standalone):

    <script>
      import Keycap from '$lib/components/Keycap.svelte';
    </script>

    <Keycap pressed={isActive} color="var(--accent)" size={48}>
      <img src="/icons/key.svg" alt="" />
    </Keycap>

  Props:
    size    - outer square in px (default 62)
    pressed - "pushed down" visual state
    color   - top face color (any CSS color or var)
    border  - outer edge color
    children slot renders centered on the key face
-->

<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		size?: number | string;
		pressed?: boolean;
		dark?: boolean;
		color?: string;
		border?: string;
		children?: Snippet;
	};

	let {
		size = 62,
		pressed = false,
		dark = false,
		color = 'var(--keycap-color, white)',
		border = 'var(--keycap-border, #0e0f12)',
		children
	}: Props = $props();

	const sizeCss = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<div
	class="keycap"
	class:pressed
	class:dark
	style="--size: {sizeCss}; --color: {color}; --border: {border};"
>
	<div class="face">
		{@render children?.()}
	</div>
</div>

<style>
	.keycap {
		position: relative;
		width: var(--size);
		height: var(--size);
		box-sizing: border-box;
		padding: calc(var(--size) * 0.13) calc(var(--size) * 0.10);
		border-radius: calc(var(--size) * 0.07);
		border: calc(var(--size) * 0.033) solid var(--border);
		background: conic-gradient(
			from 315deg at 50% 50%,
			color-mix(in srgb, var(--color) 91%, white) 0deg 90deg,
			color-mix(in srgb, var(--color) 85%, black) 90deg 180deg,
			color-mix(in srgb, var(--color) 72%, black) 180deg 270deg,
			color-mix(in srgb, var(--color) 85%, black) 270deg 360deg
		);
		transition:
			transform 120ms ease-in,
			box-shadow 120ms ease-in;
		will-change: transform;
	}

	.keycap.dark {
		background: conic-gradient(
			from 315deg at 50% 50%,
			color-mix(in srgb, var(--color) 80%, white) 0deg 90deg,
			color-mix(in srgb, var(--color) 94%, white) 90deg 180deg,
			color-mix(in srgb, var(--color) 55%, black) 180deg 270deg,
			color-mix(in srgb, var(--color) 94%, white) 270deg 360deg
		);
		box-shadow: none;
	}

	.face {
		width: calc(100% - calc(var(--size) * 0.06));
		height: 100%;
		margin: 0 auto;
		border-radius: calc(var(--size) * 0.09);
		border: calc(var(--size) * 0.016) solid color-mix(in srgb, var(--border) 18%, transparent);
		background: var(--color);
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.07);
	}

	.keycap:not(.pressed):active,
	.keycap.pressed {
		transform: scale(0.93);
		box-shadow: none;
	}
</style>
