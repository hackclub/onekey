<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	function displayName(o: typeof data.overrides[number]) {
		return o.slackDisplayName ?? o.nickname ?? o.name ?? null;
	}

	function fmt(date: Date | null) {
		if (!date) return '—';
		return new Date(date).toLocaleDateString();
	}
</script>

<div class="page">
	<div class="header">
		<a href="/admin" class="back">← admin</a>
		<h1>eligibility overrides <span class="count">({data.overrides.length})</span></h1>
		<p class="sub">these users can log in and submit projects even if they fail the IDV / age check</p>
	</div>

	<form method="POST" action="?/add" use:enhance class="add-form">
		<input
			type="text"
			name="identifier"
			class="add-input"
			placeholder="hca id, slack id, or email"
			required
			autocomplete="off"
			spellcheck="false"
		/>
		<input
			type="text"
			name="note"
			class="add-input note-input"
			placeholder="reason (optional)"
			autocomplete="off"
		/>
		<button type="submit" class="add-btn">add override</button>
		{#if form?.error}
			<span class="form-error">{form.error}</span>
		{/if}
	</form>

	{#if data.overrides.length === 0}
		<p class="empty">no overrides yet.</p>
	{:else}
		<div class="list">
			{#each data.overrides as o (o.id)}
				<div class="row">
					<div class="row-left">
						{#if o.slackAvatarUrl}
							<img src={o.slackAvatarUrl} alt="" class="avatar" />
						{:else}
							<div class="avatar placeholder-avatar"></div>
						{/if}
						<div class="row-info">
							<span class="name">{displayName(o) ?? '(not logged in yet)'}</span>
							<span class="hca-id">{o.identifier}</span>
							{#if o.note}
								<span class="note">{o.note}</span>
							{/if}
						</div>
					</div>
					<div class="row-right">
						<span class="added">added {fmt(o.createdAt)}</span>
						<form method="POST" action="?/remove" use:enhance>
							<input type="hidden" name="id" value={o.id} />
							<button type="submit" class="remove-btn">remove</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
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

	.sub {
		font-size: 0.85rem;
		color: #8a8f99;
		margin: 0;
	}

	.add-form {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.add-input {
		padding: 0.5rem 0.85rem;
		font-family: monospace;
		font-size: 0.85rem;
		background: var(--color-bg);
		color: var(--color-text);
		border: 1px solid #2a2f38;
		border-radius: 8px;
		outline: none;
		width: 280px;
	}

	.note-input {
		font-family: inherit;
	}

	.add-input:focus { border-color: #555b66; }
	.add-input::placeholder { color: #555b66; }

	.add-btn {
		padding: 0.5rem 1rem;
		font-family: inherit;
		font-size: 0.85rem;
		background: #1e2229;
		color: var(--color-text);
		border: 1px solid #2a2f38;
		border-radius: 8px;
		cursor: pointer;
	}

	.add-btn:hover { border-color: #555b66; }

	.form-error {
		font-size: 0.8rem;
		color: #ef4444;
	}

	.list {
		display: flex;
		flex-direction: column;
		border: 1px solid #2a2f38;
		border-radius: 10px;
		overflow: hidden;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.65rem 1rem;
		border-bottom: 1px solid #2a2f38;
	}

	.row:last-child { border-bottom: none; }

	.row-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.placeholder-avatar {
		background: #2a2f38;
	}

	.row-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.name {
		font-size: 0.9rem;
		font-weight: 600;
	}

	.hca-id {
		font-size: 0.75rem;
		font-family: monospace;
		color: #555b66;
	}

	.note {
		font-size: 0.78rem;
		color: #8a8f99;
	}

	.row-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.added {
		font-size: 0.75rem;
		color: #555b66;
	}

	.remove-btn {
		padding: 0.3rem 0.7rem;
		font-family: inherit;
		font-size: 0.78rem;
		background: transparent;
		color: #ef4444;
		border: 1px solid color-mix(in srgb, #ef4444 40%, transparent);
		border-radius: 6px;
		cursor: pointer;
	}

	.remove-btn:hover {
		background: color-mix(in srgb, #ef4444 10%, transparent);
		border-color: #ef4444;
	}

	.empty {
		color: #555b66;
		margin: 0;
		font-size: 0.9rem;
	}
</style>
