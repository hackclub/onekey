<script lang="ts">
	let { data } = $props();
	const { user } = data;
</script>

<svelte:head>
	<title>onekey - account</title>
</svelte:head>

<p class="eyebrow">account</p>
<div class="profile-header">
	{#if user?.avatar_url}
		<img class="profile-avatar" src={user.avatar_url} alt="avatar" />
	{/if}
	<h1 class="heading">{user?.nickname ?? user?.name ?? 'onekeyer'}</h1>
</div>

<div class="bento">
	<div class="card card-wide">
		<span class="card-label">details</span>
		<div class="field-list">
			{#if user?.name}
				<div class="field">
					<span class="field-key">name</span>
					<span class="field-val">{user.name}</span>
				</div>
			{/if}
			<div class="field">
				<span class="field-key">email</span>
				<span class="field-val">
					{user?.email ?? '—'}
					{#if user?.email_verified}<span class="badge">verified</span>{/if}
				</span>
			</div>
			{#if user?.slack_id}
				<div class="field">
					<span class="field-key">slack</span>
					<span class="field-val">{user.slack_id}</span>
				</div>
			{/if}
			{#if user?.verification_status}
				<div class="field">
					<span class="field-key">status</span>
					<span class="field-val">{user.verification_status}</span>
				</div>
			{/if}
		</div>
		<a href="/logout" class="logout-link">log out</a>
	</div>

	{#if user?.address}
		<div class="card">
			<span class="card-label">address</span>
			<div class="field-list">
				{#if user.address.street_address}
					<div class="field">
						<span class="field-key">street</span>
						<span class="field-val">{user.address.street_address}</span>
					</div>
				{/if}
				{#if user.address.locality}
					<div class="field">
						<span class="field-key">city</span>
						<span class="field-val">{user.address.locality}</span>
					</div>
				{/if}
				{#if user.address.region}
					<div class="field">
						<span class="field-key">region</span>
						<span class="field-val">{user.address.region}</span>
					</div>
				{/if}
				{#if user.address.postal_code}
					<div class="field">
						<span class="field-key">postal</span>
						<span class="field-val">{user.address.postal_code}</span>
					</div>
				{/if}
				{#if user.address.country}
					<div class="field">
						<span class="field-key">country</span>
						<span class="field-val">{user.address.country}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
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
		background: black;
		color: white;
		border-radius: var(--radius-pill);
		padding: 0.2em 0.55em;
	}

	.logout-link {
		display: inline-block;
		margin-top: 1.5rem;
		font-size: 0.7rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		text-decoration: none;
	}

	.logout-link:hover {
		color: var(--color-text);
	}
</style>
