<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	const steps = ['/onboarding', '/onboarding/setup', '/onboarding/start'];
	const current = $derived(steps.indexOf(page.url.pathname));
</script>

<div class="onboarding">
	<main class="column">
		<nav class="steps-indicator" aria-label="onboarding progress">
			{#each steps as step, i (step)}
				<span class="step-dot" class:active={i <= current}></span>
			{/each}
		</nav>

		{@render children()}
	</main>
</div>

<style>
	/* Onboarding is always light, regardless of the user's saved theme — it lives
	   outside the dashboard's .dark scope and re-asserts the light tokens here. */
	.onboarding {
		--color-text: black;
		--color-text-soft: #282828;
		--color-bg: white;
		--rail-label: #8a8f99;
		min-height: 100vh;
		background: #fff;
		color: #000;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: clamp(2.5rem, 6vh, 6rem) clamp(1.25rem, 4vw, 3rem);
		box-sizing: border-box;
	}

	.column {
		width: 100%;
		max-width: 46rem;
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 2vw, 1.75rem);
	}

	.steps-indicator {
		display: flex;
		gap: 0.55rem;
		justify-content: flex-start;
		margin-bottom: clamp(0.5rem, 1vw, 1rem);
	}

	.step-dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		border: 0.13rem solid var(--color-text);
		opacity: 0.35;
		transition:
			opacity var(--transition-med),
			background-color var(--transition-med);
	}

	.step-dot.active {
		opacity: 1;
		background: var(--color-text);
	}

	/* ---- shared building blocks used across the onboarding pages ---- */

	:global(.onboarding .ob-title) {
		font-size: clamp(2rem, 3.4vw, 3.35rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0;
	}

	:global(.onboarding .ob-card) {
		background: var(--color-bg);
		border-radius: var(--radius-card);
		border: solid var(--border-width);
		padding: clamp(1.25rem, 2vw, 2rem);
		box-sizing: border-box;
	}

	:global(.onboarding .ob-card-label) {
		display: block;
		font-size: clamp(0.8rem, 0.9vw, 1.1rem);
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--color-text-soft);
		margin: 0 0 1.1rem;
		font-weight: bold;
	}

	:global(.onboarding .ob-text) {
		font-size: clamp(1rem, 1.15vw, 1.25rem);
		line-height: 1.7;
		margin: 0;
	}

	:global(.onboarding .ob-text + .ob-text) {
		margin-top: 1.1rem;
	}

	/* primary "next step" pill — grays out via .disabled */
	:global(.onboarding .ob-next) {
		align-self: flex-end;
		display: inline-flex;
		align-items: center;
		gap: 0.15em;
		text-decoration: none;
		background: var(--color-text);
		color: var(--color-bg);
		font-weight: bold;
		/* black border that reads as an extension of the fill, so the next
		   button matches the outlined back button's overall size */
		border: solid var(--border-width);
		border-color: var(--color-text);
		border-radius: var(--radius-pill);
		padding: 0.78rem 1.25rem 0.78rem 1.7rem;
		font-size: clamp(1.1rem, 1.5vw, 1.6rem);
		font-family: inherit;
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast);
	}

	:global(.onboarding .ob-next:hover) {
		background: var(--color-text-soft);
		border-color: var(--color-text-soft);
		color: var(--color-bg);
		text-decoration: none;
	}

	:global(.onboarding .ob-next svg) {
		transition: transform var(--transition-fast);
	}

	:global(.onboarding .ob-next:hover svg) {
		transform: translateX(0.1em);
	}

	:global(.onboarding .ob-next.disabled) {
		background: #d4d4d4;
		border-color: #d4d4d4;
		color: #fff;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* footer nav row: outlined back on the left, next on the right */
	:global(.onboarding .ob-nav) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		width: 100%;
	}

	:global(.onboarding .ob-nav .ob-next) {
		align-self: auto;
	}

	:global(.onboarding .ob-back) {
		display: inline-flex;
		align-items: center;
		gap: 0.15em;
		text-decoration: none;
		background: var(--color-bg);
		color: var(--color-text);
		font-weight: bold;
		border: solid var(--border-width);
		border-radius: var(--radius-pill);
		padding: 0.78rem 1.7rem 0.78rem 1.25rem;
		font-size: clamp(1.1rem, 1.5vw, 1.6rem);
		font-family: inherit;
		cursor: pointer;
		transition: border-style var(--transition-fast);
	}

	:global(.onboarding .ob-back:hover) {
		text-decoration: none;
		border-style: dotted;
	}

	:global(.onboarding .ob-back svg) {
		transform: scaleX(-1);
		transition: transform var(--transition-fast);
	}

	:global(.onboarding .ob-back:hover svg) {
		transform: scaleX(-1) translateX(0.1em);
	}

	@media (max-width: 767px) {
		.onboarding {
			align-items: flex-start;
		}

		:global(.onboarding .ob-next) {
			align-self: stretch;
			justify-content: center;
		}
	}
</style>
