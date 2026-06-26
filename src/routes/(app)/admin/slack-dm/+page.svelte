<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let selected = $state<string>('');
	let message = $state('');
	let imageUrl = $state('');
	let confirmText = $state('');

	const validImageUrl = $derived(/^https?:\/\/\S+/i.test(imageUrl.trim()));
	let sending = $state(false);
	let testing = $state(false);
	let showRecipients = $state(false);

	const selectedCohort = $derived(data.cohorts.find((c) => c.key === selected) ?? null);
	const canSend = $derived(
		!!selectedCohort &&
			selectedCohort.reachableCount > 0 &&
			message.trim().length > 0 &&
			confirmText.trim() === 'CONFIRM' &&
			data.tokenConfigured
	);
	const estSeconds = $derived(selectedCohort ? Math.ceil((selectedCohort.reachableCount * 0.35)) : 0);
	const estLabel = $derived(estSeconds < 60 ? `~${estSeconds}s` : `~${Math.ceil(estSeconds / 60)} min`);
</script>

<div class="admin-dm">
	<div class="header">
		<a href="/admin" class="back">← admin</a>
		<h1>slack mass DM</h1>
		<p class="sub">
			Send a DM <strong>from your own Slack account</strong> to a cohort of users. The three cohorts
			are disjoint — each user is bucketed by their furthest milestone.
		</p>
	</div>

	{#if !data.tokenConfigured}
		<div class="alert alert-warn">
			<strong>SLACK_USER_TOKEN is not set.</strong> Add your user token (xoxp-…) as the
			<code>SLACK_USER_TOKEN</code> env var on the server, then reload. Sending is disabled until then.
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error">{form.error}</div>
	{/if}
	{#if form?.tested}
		<div class="alert alert-ok">✅ Test DM sent to your account — check Slack.</div>
	{/if}
	{#if form?.sent}
		<div class="alert alert-ok">
			✅ Sent to <strong>{form.sentCount}</strong> user{form.sentCount === 1 ? '' : 's'}
			{#if form.failedCount > 0}
				· <span class="fail">{form.failedCount} failed</span>
			{/if}
			{#if form.failures?.length}
				<ul class="failures">
					{#each form.failures as f}
						<li>{f.name}: {f.error}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={({ action }) => {
			const isSend = action.search.includes('send');
			if (isSend) sending = true;
			else testing = true;
			return async ({ update }) => {
				await update();
				sending = false;
				testing = false;
				if (isSend) confirmText = '';
			};
		}}
	>
		<fieldset class="cohorts">
			<legend>1 · choose a cohort</legend>
			{#each data.cohorts as c (c.key)}
				<label class="cohort" class:active={selected === c.key}>
					<input type="radio" name="cohort" value={c.key} bind:group={selected} />
					<div class="cohort-body">
						<div class="cohort-top">
							<span class="cohort-label">{c.label}</span>
							<span class="cohort-count">{c.reachableCount}</span>
						</div>
						<p class="cohort-desc">{c.description}</p>
						{#if c.unreachableCount > 0}
							<p class="cohort-note">{c.unreachableCount} more in this group have no linked Slack — they'll be skipped.</p>
						{/if}
					</div>
				</label>
			{/each}
		</fieldset>

		<div class="field">
			<label for="message">2 · message <span class="hint">(Slack markdown supported)</span></label>
			<textarea
				id="message"
				name="message"
				bind:value={message}
				rows="6"
				placeholder="Hey! Noticed you signed up but haven't started a project yet…"
			></textarea>
		</div>

		<div class="field">
			<label for="image_url">image <span class="hint">(optional · public image URL, embedded below the text)</span></label>
			<input id="image_url" name="image_url" bind:value={imageUrl} autocomplete="off" placeholder="https://…/banner.png" />
			{#if imageUrl.trim() && !validImageUrl}
				<span class="warn-text">URL must start with http:// or https://</span>
			{/if}
			{#if validImageUrl}
				<img class="img-preview" src={imageUrl.trim()} alt="attachment preview" />
			{/if}
		</div>

		{#if selectedCohort}
			<div class="preview">
				<button type="button" class="link-btn" onclick={() => (showRecipients = !showRecipients)}>
					{showRecipients ? '▾' : '▸'} preview {selectedCohort.reachableCount} recipient{selectedCohort.reachableCount === 1 ? '' : 's'}
				</button>
				{#if showRecipients}
					<div class="recipients">
						{#each selectedCohort.reachable as r (r.id)}
							<span class="chip">{r.name}</span>
						{:else}
							<span class="muted">no reachable users in this cohort</span>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<div class="actions">
			<button
				type="submit"
				formaction="?/test"
				class="btn btn-secondary"
				disabled={!data.tokenConfigured || !message.trim() || testing || sending}
			>
				{testing ? 'sending…' : 'send test to myself'}
			</button>
		</div>

		<div class="field confirm-row">
			<label for="confirm">3 · type <code>CONFIRM</code> to enable sending</label>
			<input id="confirm" name="confirm" bind:value={confirmText} autocomplete="off" placeholder="CONFIRM" />
		</div>

		<div class="actions">
			<button type="submit" formaction="?/send" class="btn btn-danger" disabled={!canSend || sending || testing}>
				{#if sending}
					sending… do not close this page
				{:else if selectedCohort}
					send to {selectedCohort.reachableCount} user{selectedCohort.reachableCount === 1 ? '' : 's'} ({estLabel})
				{:else}
					send
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.admin-dm {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 720px;
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.back {
		font-size: 0.85rem;
		color: #8a8f99;
		text-decoration: none;
		margin-bottom: 0.25rem;
		display: inline-block;
	}

	.back:hover {
		color: #fff;
	}

	h1 {
		font-size: clamp(1.6rem, 3vw, 2.4rem);
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.sub {
		font-size: 0.9rem;
		color: #8a8f99;
		margin: 0;
		max-width: 60ch;
	}

	code {
		font-family: 'SFMono-Regular', 'Consolas', monospace;
		font-size: 0.85em;
		background: #1c2027;
		padding: 0.1em 0.4em;
		border-radius: 4px;
		color: #a78bfa;
	}

	.alert {
		padding: 0.85rem 1.1rem;
		border-radius: 10px;
		font-size: 0.88rem;
		line-height: 1.5;
		border: 1px solid transparent;
	}

	.alert-warn {
		background: color-mix(in srgb, #f59e0b 12%, transparent);
		border-color: color-mix(in srgb, #f59e0b 35%, transparent);
		color: #f3c77a;
	}

	.alert-error {
		background: color-mix(in srgb, #ef4444 12%, transparent);
		border-color: color-mix(in srgb, #ef4444 35%, transparent);
		color: #f3a3a3;
	}

	.alert-ok {
		background: color-mix(in srgb, #22c55e 12%, transparent);
		border-color: color-mix(in srgb, #22c55e 35%, transparent);
		color: #9be8b4;
	}

	.fail {
		color: #f3a3a3;
	}

	.failures {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
		font-size: 0.82rem;
		color: #c9ced8;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	legend,
	.field > label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #8a8f99;
		font-weight: 700;
		padding: 0;
		margin-bottom: 0.5rem;
	}

	.hint {
		text-transform: none;
		letter-spacing: 0;
		font-weight: 400;
		color: #5c626c;
	}

	.cohort {
		display: flex;
		gap: 0.75rem;
		padding: 0.9rem 1.1rem;
		border: 1px solid #2a2f38;
		border-radius: 10px;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
	}

	.cohort:hover {
		border-color: #3a3f48;
	}

	.cohort.active {
		border-color: #60a5fa;
		background: color-mix(in srgb, #60a5fa 8%, transparent);
	}

	.cohort input {
		margin-top: 0.2rem;
		accent-color: #60a5fa;
	}

	.cohort-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.cohort-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.cohort-label {
		font-weight: 600;
		color: #e8eaf0;
		font-size: 0.95rem;
	}

	.cohort-count {
		font-size: 1.1rem;
		font-weight: 700;
		color: #60a5fa;
		font-variant-numeric: tabular-nums;
	}

	.cohort-desc {
		margin: 0;
		font-size: 0.83rem;
		color: #8a8f99;
		line-height: 1.4;
	}

	.cohort-note {
		margin: 0.2rem 0 0;
		font-size: 0.78rem;
		color: #f3c77a;
	}

	.field {
		display: flex;
		flex-direction: column;
	}

	textarea,
	#confirm,
	#image_url {
		font-family: inherit;
		font-size: 0.95rem;
		padding: 0.7rem 0.9rem;
		border-radius: 8px;
		border: 1px solid #2a2f38;
		background: #0d0f12;
		color: #e8eaf0;
		resize: vertical;
	}

	textarea:focus,
	#confirm:focus,
	#image_url:focus {
		outline: none;
		border-color: #60a5fa;
	}

	.warn-text {
		margin-top: 0.4rem;
		font-size: 0.8rem;
		color: #f3c77a;
	}

	.img-preview {
		margin-top: 0.6rem;
		max-width: 280px;
		max-height: 180px;
		border-radius: 8px;
		border: 1px solid #2a2f38;
		object-fit: contain;
	}

	.preview {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.link-btn {
		background: none;
		border: none;
		color: #60a5fa;
		font-size: 0.85rem;
		font-family: inherit;
		cursor: pointer;
		padding: 0;
		text-align: left;
	}

	.recipients {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		max-height: 220px;
		overflow-y: auto;
		padding: 0.75rem;
		border: 1px solid #1f2937;
		border-radius: 8px;
	}

	.chip {
		font-size: 0.8rem;
		padding: 0.25rem 0.6rem;
		border-radius: 9999px;
		background: #1c2027;
		color: #c9ced8;
		border: 1px solid #2a2f38;
	}

	.muted {
		color: #5c626c;
		font-size: 0.85rem;
	}

	.confirm-row #confirm {
		max-width: 220px;
		letter-spacing: 0.1em;
	}

	.actions {
		display: flex;
	}

	.btn {
		font-family: inherit;
		font-size: 0.95rem;
		font-weight: 600;
		padding: 0.7rem 1.3rem;
		border-radius: 8px;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background 0.15s, opacity 0.15s;
	}

	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #1c2027;
		border-color: #2a2f38;
		color: #cdd0d6;
	}

	.btn-secondary:not(:disabled):hover {
		background: #242a33;
	}

	.btn-danger {
		background: color-mix(in srgb, #ef4444 18%, transparent);
		border-color: #ef4444;
		color: #f3a3a3;
	}

	.btn-danger:not(:disabled):hover {
		background: color-mix(in srgb, #ef4444 28%, transparent);
	}
</style>
