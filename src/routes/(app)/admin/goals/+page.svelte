<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let { data, form } = $props();

	// Format a stored instant into the value a datetime-local input expects
	// ("YYYY-MM-DDTHH:MM") using the browser's local timezone.
	function toLocalInput(d: string | Date | null): string {
		if (!d) return '';
		const date = new Date(d);
		if (isNaN(date.getTime())) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	const goal = $derived(data.goal);
	const isExpired = $derived(!!goal && new Date(goal.deadline).getTime() <= Date.now());

	// The deadline is a naive wall-clock value; the server can't know the admin's
	// timezone. So we do the conversion here in the browser: the visible input
	// holds local wall-clock time, and we submit an absolute UTC instant via the
	// hidden field. Prefill happens in onMount so it uses the admin's timezone
	// (not the server's, which would apply during SSR).
	let deadlineLocal = $state('');
	onMount(() => {
		if (goal?.deadline) deadlineLocal = toLocalInput(goal.deadline);
	});
	const deadlineIso = $derived(
		deadlineLocal && !isNaN(new Date(deadlineLocal).getTime())
			? new Date(deadlineLocal).toISOString()
			: ''
	);
</script>

<div class="page">
	<div class="header">
		<a href="/admin" class="back">← admin</a>
		<h1>timed goal</h1>
		<p class="sub">
			shows on the dashboard home in place of the community goals card. clear it to fall back to the
			community goals widget.
		</p>
	</div>

	{#if goal}
		<div class="status" class:expired={isExpired}>
			<span class="status-dot"></span>
			<span>
				{#if isExpired}
					<strong>{goal.name}</strong> has ended (deadline passed) — {data.currentHours}/{goal.targetHours}
					hours ({goal.allTime ? 'all-time' : 'in window'}), showing the “time's up” state.
				{:else}
					<strong>{goal.name}</strong> is live — {data.currentHours}/{goal.targetHours} approved hours
					counted so far ({goal.allTime ? 'all-time' : 'within the goal window'}).
				{/if}
			</span>
		</div>
	{:else}
		<div class="status none">
			<span class="status-dot"></span>
			<span>no timed goal set — the home card shows the community goals widget.</span>
		</div>
	{/if}

	<form method="POST" action="?/save" use:enhance class="goal-form">
		<label class="field">
			<span class="field-label">goal name</span>
			<input
				type="text"
				name="name"
				class="input"
				placeholder="e.g. hit 200 hours before the deadline"
				value={goal?.name ?? ''}
				required
				autocomplete="off"
			/>
		</label>

		<label class="field">
			<span class="field-label">description</span>
			<textarea
				name="description"
				class="input textarea"
				rows="2"
				placeholder="short line shown under the goal name (optional)">{goal?.description ?? ''}</textarea
			>
		</label>

		<label class="field">
			<span class="field-label">target hours</span>
			<input
				type="number"
				name="target_hours"
				class="input"
				min="1"
				step="1"
				value={goal?.targetHours ?? ''}
				required
			/>
			<span class="field-hint">
				progress is counted automatically from approved hours — no manual updates needed.
			</span>
		</label>

		<label class="checkbox-field">
			<input type="checkbox" name="all_time" checked={goal?.allTime ?? false} />
			<span>
				<span class="checkbox-label">count all-time approved hours</span>
				<span class="field-hint">
					off (default): only hours approved between the goal's start and deadline count. on: every
					approved hour counts, regardless of when it was approved.
				</span>
			</span>
		</label>

		<label class="field">
			<span class="field-label">deadline (your local time)</span>
			<input type="datetime-local" class="input" bind:value={deadlineLocal} required />
			<!-- absolute instant actually submitted, converted from the admin's tz -->
			<input type="hidden" name="deadline" value={deadlineIso} />
			<span class="field-hint">
				interpreted in your timezone. the countdown ring runs from now (when first created) to this
				deadline. in windowed mode this is also the end of the hour-counting window.
			</span>
		</label>

		<div class="actions">
			<button type="submit" class="save-btn">{goal ? 'update goal' : 'set goal'}</button>
			{#if form?.error}
				<span class="form-error">{form.error}</span>
			{:else if form?.success && !form?.cleared}
				<span class="form-ok">saved ✓</span>
			{/if}
		</div>
	</form>

	{#if goal}
		<form method="POST" action="?/clear" use:enhance class="clear-form">
			<button type="submit" class="clear-btn">clear goal (revert to community card)</button>
		</form>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 640px;
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

	.back:hover {
		color: var(--color-text);
	}

	h1 {
		font-size: 1.6rem;
		font-weight: 700;
		margin: 0;
	}

	.sub {
		font-size: 0.85rem;
		color: #8a8f99;
		margin: 0;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.85rem;
		padding: 0.7rem 1rem;
		border: 1px solid #2a2f38;
		border-radius: 10px;
		color: #cdd0d6;
	}

	.status-dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: #22c55e;
		flex-shrink: 0;
	}

	.status.none .status-dot,
	.status.expired .status-dot {
		background: #8a8f99;
	}

	.status.expired .status-dot {
		background: #ef4444;
	}

	.goal-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.field-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #8a8f99;
		font-weight: bold;
	}

	.field-hint {
		font-size: 0.75rem;
		color: #555b66;
	}

	.checkbox-field {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
	}

	.checkbox-field input {
		margin-top: 0.15rem;
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		accent-color: #22c55e;
	}

	.checkbox-field > span {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.checkbox-label {
		font-size: 0.85rem;
		font-weight: 600;
	}

	.row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.row .field {
		flex: 1;
		min-width: 140px;
	}

	.input {
		padding: 0.55rem 0.85rem;
		font-family: inherit;
		font-size: 0.9rem;
		background: var(--color-bg);
		color: var(--color-text);
		border: 1px solid #2a2f38;
		border-radius: 8px;
		outline: none;
	}

	.input:focus {
		border-color: #555b66;
	}

	.input::placeholder {
		color: #555b66;
	}

	.textarea {
		resize: vertical;
		font-family: inherit;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.save-btn {
		padding: 0.55rem 1.25rem;
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		background: #1e2229;
		color: var(--color-text);
		border: 1px solid #2a2f38;
		border-radius: 8px;
		cursor: pointer;
	}

	.save-btn:hover {
		border-color: #555b66;
	}

	.form-error {
		font-size: 0.8rem;
		color: #ef4444;
	}

	.form-ok {
		font-size: 0.8rem;
		color: #22c55e;
	}

	.clear-btn {
		padding: 0.45rem 0.9rem;
		font-family: inherit;
		font-size: 0.8rem;
		background: transparent;
		color: #ef4444;
		border: 1px solid color-mix(in srgb, #ef4444 40%, transparent);
		border-radius: 6px;
		cursor: pointer;
		align-self: flex-start;
	}

	.clear-btn:hover {
		background: color-mix(in srgb, #ef4444 10%, transparent);
		border-color: #ef4444;
	}
</style>
