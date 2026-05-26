<script lang="ts">
	let { data } = $props();

	function formatHours(seconds: number) {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (h === 0) return `${m}m`;
		if (m === 0) return `${h}h`;
		return `${h}h ${m}m`;
	}
</script>

<svelte:head>
	<title>onekey - reviewer</title>
</svelte:head>

<div class="reviewer">
	<div class="header">
		<h1>review panel</h1>
		<p class="sub">
			logged in as <strong
				>@{data.user?.slack_display_name ??
					data.user?.nickname ??
					data.user?.name ??
					data.user?.email}</strong
			>
		</p>
	</div>

	{#if data.submitted.length === 0}
		<div class="placeholder">
			<p>no projects pending review.</p>
		</div>
	{:else}
		<div class="project-table">
			<div class="table-header">
				<span class="col-name">project</span>
				<span class="col-desc">description</span>
				<span class="col-author">author</span>
				<span class="col-hours">hours</span>
				<span class="col-submitted">submitted</span>
			</div>
			{#each data.submitted as project (project.id)}
				<a href="/projects/{project.id}" class="table-row">
					<span class="col-name">{project.name}</span>
					<span class="col-desc">{project.description ?? '—'}</span>
					<span class="col-author">{project.submitterSlack ?? project.submitterName ?? project.submitterEmail ?? 'unknown'}</span>
					<span class="col-hours">{formatHours(project.submittedSeconds)}</span>
					<span class="col-submitted">{new Date(project.submittedAt).toLocaleDateString()}</span>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.reviewer {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.header h1 {
		font-size: clamp(1.6rem, 3vw, 2.4rem);
		font-weight: 700;
		margin: 0 0 0.25rem;
		letter-spacing: -0.01em;
	}

	.sub {
		font-size: 0.95rem;
		color: var(--color-text-soft);
		margin: 0;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px dashed #2a2f38;
		border-radius: 12px;
		padding: 4rem 2rem;
		color: var(--color-text-soft);
		font-size: 0.95rem;
	}

	.placeholder p {
		margin: 0;
	}

	.project-table {
		display: flex;
		flex-direction: column;
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		overflow: hidden;
	}

	.table-header,
	.table-row {
		display: grid;
		grid-template-columns: 1.2fr 2fr 1fr 0.6fr 0.8fr;
		align-items: center;
		padding: 0.6rem 1.25rem;
		gap: 1rem;
	}

	.table-header {
		font-size: 0.7rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-soft);
		border-bottom: solid var(--border-width);
	}

	.table-row {
		text-decoration: none;
		color: var(--color-text);
		border-bottom: solid calc(var(--border-width) / 2) color-mix(in srgb, var(--color-text) 10%, transparent);
		transition: background 0.15s;
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.table-row:hover {
		background: color-mix(in srgb, var(--color-text) 5%, transparent);
	}

	.table-row {
		font-size: 0.9rem;
	}

	.col-name {
		font-weight: 600;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.col-desc,
	.col-author,
	.col-hours,
	.col-submitted {
		color: var(--color-text-soft);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

</style>
