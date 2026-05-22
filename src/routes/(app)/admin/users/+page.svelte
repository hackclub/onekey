<script lang="ts">
	let { data } = $props();

	let query = $state('');

	const filtered = $derived(
		query.trim() === ''
			? data.users
			: data.users.filter((u) => {
					const q = query.toLowerCase();
					return (
						u.hcaId.toLowerCase().includes(q) ||
						u.name?.toLowerCase().includes(q) ||
						u.nickname?.toLowerCase().includes(q) ||
						u.email?.toLowerCase().includes(q) ||
						u.slackDisplayName?.toLowerCase().includes(q)
					);
				})
	);

	function fmt(date: Date | null) {
		if (!date) return '—';
		return new Date(date).toLocaleString();
	}

	function bool(val: boolean | null) {
		if (val === null || val === undefined) return '—';
		return val ? 'yes' : 'no';
	}
</script>

<svelte:head>
	<title>onekey - admin / users</title>
</svelte:head>

<div class="page">
	<div class="header">
		<a href="/admin" class="back">← admin</a>
		<h1>users <span class="count">({filtered.length}/{data.users.length})</span></h1>
	</div>

	<input
		class="search"
		type="search"
		placeholder="search by name, email, slack, hca id…"
		bind:value={query}
	/>

	<div class="list">
		{#each filtered as user (user.id)}
			<details class="row">
				<summary class="summary">
					{#if user.slackAvatarUrl}
						<img src={user.slackAvatarUrl} alt="" class="avatar" />
					{:else}
						<div class="avatar placeholder-avatar"></div>
					{/if}
					<span class="primary">{user.nickname ?? user.name ?? '(no name)'}</span>
					<span class="secondary">{user.email ?? '—'}</span>
					<span class="hca-id">{user.hcaId}</span>
					<span class="joined">{fmt(user.createdAt)}</span>
				</summary>

				<div class="detail">
					<dl>
						<dt>id</dt><dd>{user.id}</dd>
						<dt>hca id</dt><dd>{user.hcaId}</dd>
						<dt>name</dt><dd>{user.name ?? '—'}</dd>
						<dt>nickname</dt><dd>{user.nickname ?? '—'}</dd>
						<dt>email</dt><dd>{user.email ?? '—'}</dd>
						<dt>email verified</dt><dd>{bool(user.emailVerified)}</dd>
						<dt>slack id</dt><dd>{user.slackId ?? '—'}</dd>
						<dt>slack display name</dt><dd>{user.slackDisplayName ?? '—'}</dd>
						<dt>verification status</dt><dd>{user.verificationStatus ?? '—'}</dd>
						<dt>ysws eligible</dt><dd>{bool(user.yswsEligible)}</dd>
						<dt>street</dt><dd>{user.streetAddress ?? '—'}</dd>
						<dt>city</dt><dd>{user.locality ?? '—'}</dd>
						<dt>region</dt><dd>{user.region ?? '—'}</dd>
						<dt>postal</dt><dd>{user.postalCode ?? '—'}</dd>
						<dt>country</dt><dd>{user.country ?? '—'}</dd>
						<dt>joined</dt><dd>{fmt(user.createdAt)}</dd>
						<dt>last login</dt><dd>{fmt(user.updatedAt)}</dd>
					</dl>
				</div>
			</details>
		{:else}
			<p class="empty">no users yet.</p>
		{/each}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.back {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #8a8f99;
		text-decoration: none;
	}

	.back:hover { color: var(--color-text); }

	h1 {
		font-size: 1.6rem;
		font-weight: 700;
		margin: 0;
	}

	.count {
		font-weight: 400;
		color: #8a8f99;
	}

	.search {
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0.85rem;
		font-family: 'Phantom Sans', sans-serif;
		font-size: 0.85rem;
		background: var(--color-bg);
		color: var(--color-text);
		border: 1px solid #2a2f38;
		border-radius: 8px;
		outline: none;
	}

	.search:focus {
		border-color: #555b66;
	}

	.search::placeholder {
		color: #aaa;
	}

	.list {
		display: flex;
		flex-direction: column;
		border: 1px solid #2a2f38;
		border-radius: 10px;
		overflow: hidden;
	}

	.row {
		border-bottom: 1px solid #2a2f38;
	}

	.row:last-child { border-bottom: none; }

	.summary {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 1rem;
		cursor: pointer;
		list-style: none;
		font-size: 0.85rem;
		user-select: none;
	}

	.summary::-webkit-details-marker { display: none; }

	.summary:hover { background: #0d0f12; }
	.summary:hover .primary { color: #fff; }

	.avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.placeholder-avatar {
		background: #2a2f38;
	}

	.primary {
		font-weight: 600;
		min-width: 120px;
	}

	.secondary {
		color: #8a8f99;
		min-width: 180px;
	}

	.hca-id {
		color: #555b66;
		font-family: monospace;
		font-size: 0.78rem;
		flex: 1;
	}

	.joined {
		color: #555b66;
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.detail {
		padding: 0.75rem 1rem 0.75rem 2.5rem;
		background: var(--color-bg);
		border-top: 1px solid #1e2229;
	}

	dl {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 0.3rem 1rem;
		margin: 0;
		font-size: 0.82rem;
	}

	dt {
		color: #8a8f99;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		font-size: 0.72rem;
		align-self: center;
	}

	dd {
		margin: 0;
		font-family: monospace;
		word-break: break-all;
	}

	.empty {
		padding: 2rem;
		text-align: center;
		color: #555b66;
		margin: 0;
	}
</style>
