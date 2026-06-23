<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';

	let { data, form } = $props();

	const linked = $derived(data.user?.hackatime_linked ?? false);

	const hasAddress = $derived(
		!!(
			data.user?.street_address ||
			data.user?.address_line_2 ||
			data.user?.locality ||
			data.user?.region ||
			data.user?.postal_code ||
			data.user?.country
		)
	);

	// If an address is already present on first load, it came from the HCA autofill
	// in the auth callback (the user hasn't touched anything yet).
	const autofilledFromHca = untrack(() => hasAddress);

	// The address step is satisfied once there's an address or the user opts to skip.
	let skippedAddress = $state(false);
	const addressDone = $derived(hasAddress || skippedAddress);

	const canProceed = $derived(linked && addressDone);
</script>

<h1 class="ob-title">let's get you setup</h1>

<section class="ob-card hackatime-card">
	<div class="hackatime-card-content">
		<span class="ob-card-label">hackatime</span>
		<p class="ob-text">
			hackatime is the tool you'll use to track your coding time!<br />if you want to learn more or
			need help setting up, see our tutorial below!
		</p>
		<div class="hackatime-action">
		{#if linked}
			<button type="button" class="hackatime-btn linked" disabled>hackatime linked</button>
		{:else}
			<a
				href="/auth/hackatime/start?return=/onboarding/setup"
				class="hackatime-btn"
				data-sveltekit-reload
			>
				link hackatime
				<svg
					fill-rule="evenodd"
					clip-rule="evenodd"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
					viewBox="0 0 32 32"
					preserveAspectRatio="xMidYMid meet"
					fill="currentColor"
					style="width:1em;height:1em;flex-shrink:0"
					><path
						d="M8.26533 22.3155L22.3035 8.27736C21.1495 8.2793 20.2555 8.36029 18.7669 8.49512L18.5569 8.51413C18.0069 8.56413 17.5205 8.15879 17.4705 7.60878C17.4205 7.05876 17.8375 6.64361 18.3763 6.5223C20.2342 6.10404 21.6484 6.10404 24.15 6.35514C24.5244 6.42095 24.908 6.53525 25.1839 6.81113C25.4598 7.08702 25.5741 7.47064 25.6399 7.845C25.891 10.3467 25.891 11.7609 25.4728 13.6176L25.4727 13.6192C25.4227 14.1692 24.9363 14.5745 24.3862 14.5245C23.8362 14.4745 23.4309 13.9881 23.4809 13.4381L23.5092 13.1202C23.6342 11.7164 23.7135 10.8267 23.7167 9.69262L9.68059 23.7287Z"
					></path></svg
				>
			</a>
		{/if}
		<a
			href="https://www.youtube.com/watch?v=grriwsX5mIo"
			target="_blank"
			rel="noopener noreferrer"
			class="hackatime-btn tutorial"
		>
			tutorial
		</a>
	</div>
	</div>
	<img src="/img/hackatime-logo-bw.png" alt="Hackatime" class="hackatime-logo" />
</section>

<section class="ob-card">
	<div class="address-label-row">
		<span class="ob-card-label">address</span>
		<button type="button" class="info" aria-label="why do we need your address?">
			<svg
				fill-rule="evenodd"
				clip-rule="evenodd"
				stroke-linejoin="round"
				stroke-miterlimit="1.414"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				viewBox="0 0 32 32"
				preserveAspectRatio="xMidYMid meet"
				fill="currentColor"
				width="1em"
				height="1em"
			>
				<path
					d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"
				/>
				<path
					d="M16 12.75a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16 22.25c-.552 0-1-.392-1-.875v-6.25c0-.483.448-.875 1-.875s1 .392 1 .875v6.25c0 .483-.448.875-1 .875z"
				/>
			</svg>
			<span class="info-tooltip" role="tooltip">
				<strong>why do we need your address?</strong>
				for your hard work, we'll be able to send you prizes - and we need a place to send them!
			</span>
		</button>
	</div>
	{#if autofilledFromHca}
		<p class="address-note">autofilled from your hack club account - double-check it's correct!</p>
	{/if}
	<form
		method="POST"
		action="?/saveAddress"
		class="address-form"
		use:enhance={() => {
			return ({ update }) => update({ reset: false });
		}}
	>
		<div class="address-grid">
			<label class="address-field address-field-full">
				<span class="address-field-label">address line 1</span>
				<input
					class="address-input"
					type="text"
					name="street_address"
					value={data.user?.street_address ?? ''}
					placeholder="212 Battery St"
				/>
			</label>
			<label class="address-field address-field-full">
				<span class="address-field-label">address line 2 (optional)</span>
				<input
					class="address-input"
					type="text"
					name="address_line_2"
					value={data.user?.address_line_2 ?? ''}
					placeholder="Suite 3"
				/>
			</label>
			<label class="address-field">
				<span class="address-field-label">city</span>
				<input
					class="address-input"
					type="text"
					name="locality"
					value={data.user?.locality ?? ''}
					placeholder="Burlington"
				/>
			</label>
			<label class="address-field">
				<span class="address-field-label">state / province</span>
				<input
					class="address-input"
					type="text"
					name="region"
					value={data.user?.region ?? ''}
					placeholder="VT"
				/>
			</label>
			<label class="address-field">
				<span class="address-field-label">postal code</span>
				<input
					class="address-input"
					type="text"
					name="postal_code"
					value={data.user?.postal_code ?? ''}
					placeholder="05401"
				/>
			</label>
			<label class="address-field">
				<span class="address-field-label">country</span>
				<input
					class="address-input"
					type="text"
					name="country"
					value={data.user?.country ?? ''}
					placeholder="United States"
				/>
			</label>
		</div>
		<div class="address-actions">
			<button type="submit" class="address-save">save address</button>
			{#if !addressDone}
				<button type="button" class="address-skip" onclick={() => (skippedAddress = true)}>
					i'll do this later
				</button>
			{:else if skippedAddress}
				<span class="address-status">you can add this anytime in settings.</span>
			{:else if form?.success}
				<span class="address-status">saved!</span>
			{/if}
		</div>
	</form>
</section>

<div class="ob-nav">
	<a href="/onboarding" class="ob-back">
		<svg
			fill-rule="evenodd"
			clip-rule="evenodd"
			stroke-linejoin="round"
			stroke-miterlimit="1.414"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			viewBox="0 0 32 32"
			preserveAspectRatio="xMidYMid meet"
			fill="currentColor"
			width="1em"
			height="1em"
			><path
				d="M11.6068 8.1099C11.2532 8.53417 11.3106 9.16473 11.7348 9.51829C13.3799 10.8952 17.2004 14.2798 18.5095 16.0001C17.1784 17.7493 13.4095 21.0851 11.7348 22.4819C11.3106 22.8355 11.2532 23.466 11.6068 23.8903C11.9604 24.3146 12.5913 24.3716 13.0156 24.018C14.8552 22.4864 18.8153 19.025 20.2164 17.0536C20.4346 16.7423 20.625 16.3902 20.625 16.0001C20.625 15.6099 20.4346 15.2578 20.2164 14.9466C18.8435 13.0149 14.8171 9.4852 13.0165 7.98291L13.0152 7.98186C12.5909 7.6283 11.9604 7.68562 11.6068 8.1099Z"
			/></svg
		>
		back
	</a>
	{#if canProceed}
		<a href="/onboarding/start" class="ob-next">
			next
			<svg
				fill-rule="evenodd"
				clip-rule="evenodd"
				stroke-linejoin="round"
				stroke-miterlimit="1.414"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				viewBox="0 0 32 32"
				preserveAspectRatio="xMidYMid meet"
				fill="currentColor"
				width="1em"
				height="1em"
				><path
					d="M11.6068 8.1099C11.2532 8.53417 11.3106 9.16473 11.7348 9.51829C13.3799 10.8952 17.2004 14.2798 18.5095 16.0001C17.1784 17.7493 13.4095 21.0851 11.7348 22.4819C11.3106 22.8355 11.2532 23.466 11.6068 23.8903C11.9604 24.3146 12.5913 24.3716 13.0156 24.018C14.8552 22.4864 18.8153 19.025 20.2164 17.0536C20.4346 16.7423 20.625 16.3902 20.625 16.0001C20.625 15.6099 20.4346 15.2578 20.2164 14.9466C18.8435 13.0149 14.8171 9.4852 13.0165 7.98291L13.0152 7.98186C12.5909 7.6283 11.9604 7.68562 11.6068 8.1099Z"
				/></svg
			>
		</a>
	{:else}
		<span class="ob-next disabled" aria-disabled="true">
			next
			<svg
				fill-rule="evenodd"
				clip-rule="evenodd"
				stroke-linejoin="round"
				stroke-miterlimit="1.414"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				viewBox="0 0 32 32"
				preserveAspectRatio="xMidYMid meet"
				fill="currentColor"
				width="1em"
				height="1em"
				><path
					d="M11.6068 8.1099C11.2532 8.53417 11.3106 9.16473 11.7348 9.51829C13.3799 10.8952 17.2004 14.2798 18.5095 16.0001C17.1784 17.7493 13.4095 21.0851 11.7348 22.4819C11.3106 22.8355 11.2532 23.466 11.6068 23.8903C11.9604 24.3146 12.5913 24.3716 13.0156 24.018C14.8552 22.4864 18.8153 19.025 20.2164 17.0536C20.4346 16.7423 20.625 16.3902 20.625 16.0001C20.625 15.6099 20.4346 15.2578 20.2164 14.9466C18.8435 13.0149 14.8171 9.4852 13.0165 7.98291L13.0152 7.98186C12.5909 7.6283 11.9604 7.68562 11.6068 8.1099Z"
				/></svg
			>
		</span>
	{/if}
</div>

<style>
	.hackatime-card {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.hackatime-card-content {
		flex: 1;
		min-width: 0;
	}

	.hackatime-logo {
		align-self: stretch;
		width: auto;
		max-width: clamp(6rem, 12vw, 12rem);
		object-fit: contain;
		flex-shrink: 0;
		opacity: 0.85;
	}

	.hackatime-action {
		margin-top: 1.4rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.hackatime-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		text-decoration: none;
		background: var(--color-text);
		color: var(--color-bg);
		font-weight: bold;
		border: solid var(--border-width);
		border-color: var(--color-text);
		border-radius: var(--radius-pill);
		padding: 0.6rem 1.2rem;
		font-size: clamp(1rem, 1.3vw, 1.4rem);
		font-family: inherit;
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.hackatime-btn:not(:disabled):not(.tutorial):hover {
		background: var(--color-text-soft);
		border-color: var(--color-text-soft);
		color: var(--color-bg);
		text-decoration: none;
	}

	/* once linked, the action is done — show a grayed-out, outlined disabled
	   button matching the shop's disabled buttons */
	.hackatime-btn.linked {
		background: var(--color-bg-soft);
		color: var(--color-text-soft);
		border-color: var(--color-text-soft);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.hackatime-btn.tutorial {
		background: var(--color-bg);
		color: var(--color-text);
		border-color: var(--color-text);
	}

	.hackatime-btn.tutorial:hover {
		border-style: dotted;
	}

	/* address card */

	.address-label-row {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin-bottom: 1.1rem;
	}

	.address-label-row :global(.ob-card-label) {
		margin-bottom: 0;
	}

	.info {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background: none;
		color: var(--rail-label);
		cursor: help;
		font: inherit;
		line-height: 0;
		transition: color var(--transition-fast);
	}

	.info svg {
		width: 1.2rem;
		height: 1.2rem;
		display: block;
	}

	.info:hover,
	.info:focus-visible {
		color: var(--color-text);
		outline: none;
	}

	.info-tooltip {
		position: absolute;
		bottom: calc(100% + 0.55rem);
		left: 0;
		width: max-content;
		max-width: 18rem;
		background: var(--color-text);
		color: var(--color-bg);
		border-radius: calc(var(--radius-card) / 1.5);
		padding: 0.7rem 0.85rem;
		font-size: clamp(0.8rem, 0.95vw, 0.95rem);
		line-height: 1.5;
		font-weight: 500;
		text-align: left;
		opacity: 0;
		transform: translateY(0.25rem);
		pointer-events: none;
		z-index: 5;
		transition:
			opacity var(--transition-fast),
			transform var(--transition-fast);
	}

	.info-tooltip strong {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: bold;
	}

	.info:hover .info-tooltip,
	.info:focus-visible .info-tooltip {
		opacity: 1;
		transform: translateY(0);
	}

	.address-note {
		font-size: clamp(0.85rem, 1vw, 1rem);
		color: var(--rail-label);
		margin: 0 0 1.1rem;
		line-height: 1.5;
	}

	.address-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.address-field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.address-field.address-field-full {
		grid-column: span 2;
	}

	.address-field-label {
		font-size: clamp(0.7rem, 0.85vw, 0.9rem);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		font-weight: 500;
	}

	.address-input {
		background: transparent;
		border: solid calc(var(--border-width) / 2);
		border-radius: calc(var(--radius-card) / 2);
		padding: 0.5rem 0.7rem;
		font-size: clamp(0.85rem, 1vw, 1rem);
		font-family: inherit;
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}

	.address-input:focus {
		outline: none;
		border-color: var(--color-text);
	}

	.address-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 1.1rem;
	}

	.address-save {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		font-size: clamp(1rem, 1.3vw, 1.4rem);
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.6rem 1.2rem;
		cursor: pointer;
		border: solid var(--border-width);
		border-color: var(--color-text);
		background: var(--color-text);
		color: var(--color-bg);
		font-family: inherit;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.address-save:hover {
		background: var(--color-text-soft);
		border-color: var(--color-text-soft);
	}

	.address-skip {
		font-size: clamp(1rem, 1.3vw, 1.4rem);
		font-weight: normal;
		color: var(--rail-label);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.address-skip:hover {
		color: var(--color-text);
	}

	.address-status {
		font-size: clamp(1rem, 1.3vw, 1.4rem);
		font-weight: 500;
		color: var(--rail-label);
	}

	@media (max-width: 767px) {
		.address-grid {
			grid-template-columns: 1fr;
		}

		.address-field.address-field-full {
			grid-column: span 1;
		}
	}
</style>
