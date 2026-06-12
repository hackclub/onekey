<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { darkMode } from '$lib/stores/theme';

	let { data } = $props();

	let editingAddress = $state(
		untrack(() => page.url.searchParams.get('edit') === 'address')
	);
	let sfxEnabled = $state(untrack(() => data.user?.key_sfx_enabled ?? true));

	let addressCardEl = $state<HTMLDivElement | null>(null);

	onMount(() => {
		if (editingAddress) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					addressCardEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				});
			});
		}
	});

	let sfxForm: HTMLFormElement;
	let sfxInput: HTMLInputElement;
	let darkForm: HTMLFormElement;
	let darkInput: HTMLInputElement;

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
</script>


<p class="eyebrow">account</p>
<div class="profile-header">
	{#if data.user?.avatar_url}
		<img class="profile-avatar" src={data.user.avatar_url} alt="avatar" />
	{/if}
	<h1 class="heading">{data.user?.nickname ?? data.user?.name ?? 'onekeyer'}</h1>
</div>

<div class="bento">
	<div class="card card-wide">
		<span class="card-label">details</span>
		<div class="field-list">
			{#if data.user?.name}
				<div class="field">
					<span class="field-key">name</span>
					<span class="field-val">{data.user.name}</span>
				</div>
			{/if}
			<div class="field">
				<span class="field-key">email</span>
				<span class="field-val">
					{data.user?.email ?? '—'}
					{#if data.user?.email_verified}<span class="badge">verified</span>{/if}
				</span>
			</div>
			{#if data.user?.slack_id}
				<div class="field">
					<span class="field-key">slack</span>
					<span class="field-val">{data.user.slack_id}</span>
				</div>
			{/if}
			{#if data.user?.verification_status}
				<div class="field">
					<span class="field-key">status</span>
					<span class="field-val">{data.user.verification_status}</span>
				</div>
			{/if}
		</div>
		<a href="/logout" class="logout-link">log out</a>
	</div>

	<div class="card">
		<span class="card-label">settings</span>
		<div class="settings-list">
			<form method="POST" action="?/saveDarkMode" bind:this={darkForm} use:enhance={() => () => {}}>
				<input
					type="hidden"
					name="dark_mode_enabled"
					bind:this={darkInput}
					value={$darkMode ? 'true' : 'false'}
				/>
				<label class="toggle-row">
					<span class="toggle-label">dark mode</span>
					<button
						type="button"
						class="toggle"
						class:on={$darkMode}
						role="switch"
						aria-checked={$darkMode}
						aria-label="dark mode"
						onclick={() => {
							const next = !$darkMode;
							darkMode.set(next);
							darkInput.value = next ? 'true' : 'false';
							darkForm.requestSubmit();
						}}
					>
						<span class="toggle-thumb"></span>
					</button>
				</label>
			</form>
			<form method="POST" action="?/saveSfx" bind:this={sfxForm} use:enhance>
				<input
					type="hidden"
					name="key_sfx_enabled"
					bind:this={sfxInput}
					value={sfxEnabled ? 'true' : 'false'}
				/>
				<label class="toggle-row">
					<span class="toggle-label">sidebar key sfx</span>
					<button
						type="button"
						class="toggle"
						class:on={sfxEnabled}
						role="switch"
						aria-checked={sfxEnabled}
						aria-label="sidebar key sfx"
						onclick={() => {
							sfxEnabled = !sfxEnabled;
							sfxInput.value = sfxEnabled ? 'true' : 'false';
							sfxForm.requestSubmit();
						}}
					>
						<span class="toggle-thumb"></span>
					</button>
				</label>
			</form>
		</div>
	</div>

	<div class="card card-full" bind:this={addressCardEl}>
		<div class="address-header">
			<span class="card-label">address</span>
			{#if !editingAddress}
				<button class="edit-link" onclick={() => (editingAddress = true)}>edit</button>
			{/if}
		</div>

		{#if editingAddress}
			<form
				method="POST"
				action="?/saveAddress"
				use:enhance={() => {
					return ({ update }) => {
						update();
						editingAddress = false;
					};
				}}
				class="edit-form"
			>
				<div class="edit-grid">
					<label class="edit-field edit-field-full">
						<span class="edit-field-label">address line 1</span>
						<input
							class="edit-input"
							type="text"
							name="street_address"
							value={data.user?.street_address ?? ''}
							placeholder="212 Battery St"
						/>
					</label>
					<label class="edit-field edit-field-full">
						<span class="edit-field-label">address line 2 (optional)</span>
						<input
							class="edit-input"
							type="text"
							name="address_line_2"
							value={data.user?.address_line_2 ?? ''}
							placeholder="Suite 3"
						/>
					</label>
					<label class="edit-field">
						<span class="edit-field-label">city</span>
						<input
							class="edit-input"
							type="text"
							name="locality"
							value={data.user?.locality ?? ''}
							placeholder="Burlington"
						/>
					</label>
					<label class="edit-field">
						<span class="edit-field-label">state / province</span>
						<input
							class="edit-input"
							type="text"
							name="region"
							value={data.user?.region ?? ''}
							placeholder="VT"
						/>
					</label>
					<label class="edit-field">
						<span class="edit-field-label">postal code</span>
						<input
							class="edit-input"
							type="text"
							name="postal_code"
							value={data.user?.postal_code ?? ''}
							placeholder="05401"
						/>
					</label>
					<label class="edit-field">
						<span class="edit-field-label">country</span>
						<input
							class="edit-input"
							type="text"
							name="country"
							value={data.user?.country ?? ''}
							placeholder="United States"
						/>
					</label>
				</div>
				<div class="edit-actions">
					<button type="submit" class="btn-save">save</button>
					<button type="button" class="btn-cancel" onclick={() => (editingAddress = false)}
						>cancel</button
					>
				</div>
			</form>
		{:else if hasAddress}
			<div class="field-list">
				{#if data.user?.street_address}
					<div class="field">
						<span class="field-key">address 1</span>
						<span class="field-val">{data.user.street_address}</span>
					</div>
				{/if}
				{#if data.user?.address_line_2}
					<div class="field">
						<span class="field-key">address 2</span>
						<span class="field-val">{data.user.address_line_2}</span>
					</div>
				{/if}
				{#if data.user?.locality}
					<div class="field">
						<span class="field-key">city</span>
						<span class="field-val">{data.user.locality}</span>
					</div>
				{/if}
				{#if data.user?.region}
					<div class="field">
						<span class="field-key">state</span>
						<span class="field-val">{data.user.region}</span>
					</div>
				{/if}
				{#if data.user?.postal_code}
					<div class="field">
						<span class="field-key">postal</span>
						<span class="field-val">{data.user.postal_code}</span>
					</div>
				{/if}
				{#if data.user?.country}
					<div class="field">
						<span class="field-key">country</span>
						<span class="field-val">{data.user.country}</span>
					</div>
				{/if}
			</div>
		{:else}
			<p class="no-address">
				no address set yet.
				<button class="no-address-cta" onclick={() => (editingAddress = true)}>add one</button>
			</p>
		{/if}
	</div>
</div>

<style>
	.profile-header {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		margin-bottom: 2.5rem;
	}

	.profile-header .heading {
		margin-bottom: 0;
	}

	.profile-avatar {
		width: clamp(3rem, 4.5vw, 5rem);
		height: clamp(3rem, 4.5vw, 5rem);
		border-radius: 50%;
		object-fit: cover;
		border: var(--border-width) solid;
		flex-shrink: 0;
	}

	.eyebrow {
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--rail-label);
		margin: 0 0;
	}

	.heading {
		font-size: clamp(2.5rem, 3.5vw, 3.5rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0;
	}

	.bento {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(0.75rem, 1.2vw, 1.75rem);
	}

	.card {
		background: var(--color-bg);
		border-radius: var(--radius-card);
		border: solid var(--border-width);
		padding: clamp(1rem, 1.5vw, 1.75rem) clamp(1.1rem, 1.5vw, 1.75rem);
		min-height: clamp(8rem, 12vh, 16rem);
		box-sizing: border-box;
	}

	.card.card-wide {
		grid-column: span 2;
	}

	.card.card-full {
		grid-column: span 3;
	}

	.card-label {
		display: block;
		font-size: clamp(0.8rem, 0.9vw, 1.1rem);
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--color-text-soft);
		margin-bottom: 1.25rem;
		font-weight: bold;
	}

	.field-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		gap: 1.5rem;
		align-items: baseline;
	}

	.field-key {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		width: 5rem;
		flex-shrink: 0;
	}

	.field-val {
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.badge {
		font-size: 0.6rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		background: var(--color-text);
		color: var(--color-bg);
		border-radius: var(--radius-pill);
		padding: 0.2em 0.55em;
	}

	.logout-link {
		display: inline-block;
		margin-top: 1.5rem;
		font-size: 0.85rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		text-decoration: none;
	}

	.logout-link:hover {
		color: var(--color-text);
	}

	/* settings */

	.settings-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		cursor: pointer;
	}

	.toggle-label {
		font-size: 0.85rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.toggle {
		position: relative;
		width: 2.4rem;
		height: 1.35rem;
		border-radius: 9999px;
		background: var(--rail-label);
		border: none;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.18s;
		padding: 0;
	}

	.toggle.on {
		background: var(--color-text);
	}

	.toggle-thumb {
		position: absolute;
		top: 0.18rem;
		left: 0.18rem;
		width: 0.95rem;
		height: 0.95rem;
		border-radius: 50%;
		background: var(--color-bg);
		transition: transform 0.18s;
	}

	.toggle.on .toggle-thumb {
		transform: translateX(1.05rem);
	}

	/* address */

	.address-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.address-header .card-label {
		margin-bottom: 0;
	}

	.edit-link {
		font-size: 0.7rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		margin-bottom: 1.25rem;
	}

	.edit-link:hover {
		color: var(--color-text);
	}

	.no-address {
		font-size: 0.95rem;
		color: var(--rail-label);
		margin: 0;
	}

	.no-address-cta {
		font-size: 0.95rem;
		color: var(--rail-label);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		text-decoration: underline;
	}

	.no-address-cta:hover {
		text-decoration-style: dotted;
	}

	.field-list {
		margin-top: 0;
	}

	.edit-form {
		margin-top: 1.25rem;
	}

	.edit-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.edit-field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.edit-field.edit-field-full {
		grid-column: span 2;
	}

	.edit-field-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		font-weight: 500;
	}

	.edit-input {
		background: transparent;
		border: solid calc(var(--border-width) / 2);
		border-radius: calc(var(--radius-card) / 2);
		padding: 0.45rem 0.65rem;
		font-size: 0.9rem;
		font-family: inherit;
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}

	.edit-input:focus {
		outline: none;
		border-color: var(--color-text);
	}

	.edit-actions {
		display: flex;
		gap: 0.6rem;
		margin-top: 1rem;
	}

	.btn-save,
	.btn-cancel {
		font-size: 0.85rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		border: solid var(--border-width);
		font-family: inherit;
	}

	.btn-save {
		background: var(--color-text);
		color: var(--color-bg);
		border-color: var(--color-text);
	}

	.btn-cancel {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.btn-cancel:hover {
		border-style: dotted;
		border-color: var(--color-text);
	}

	@media (max-width: 767px) {
		.heading {
			font-size: 1.8rem;
		}

		.bento {
			grid-template-columns: 1fr;
		}

		.card.card-wide,
		.card.card-full {
			grid-column: span 1;
		}

		.edit-grid {
			grid-template-columns: 1fr;
		}

		.edit-field.edit-field-full {
			grid-column: span 1;
		}
	}
</style>
