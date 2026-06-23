<script lang="ts">
	import { formatHours } from '$lib/format';

	let { data } = $props();

	const clockSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor" stroke="currentColor" stroke-width="1.5" paint-order="stroke fill"><path d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"/><path d="M15.64 17a1 1 0 0 1-1-1V9a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1z"/><path d="M21.702 19.502a1 1 0 0 1-1.366.366l-5.196-3a1 1 0 0 1 1-1.732l5.196 3a1 1 0 0 1 .366 1.366z"/></svg>`;

	import { enhance } from '$app/forms';

	// svelte-ignore state_referenced_locally
	let visibleProjects = $state([...data.projects]);
	// svelte-ignore state_referenced_locally
	let hasMore = $state(data.hasMore);
	let loadingMore = $state(false);
	let sentinel = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore();
			},
			{ rootMargin: '300px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	async function loadMore() {
		if (loadingMore || !hasMore) return;
		loadingMore = true;
		try {
			const res = await fetch(`/api/explore?offset=${visibleProjects.length}`);
			if (res.ok) {
				const result = await res.json();
				visibleProjects = [...visibleProjects, ...result.projects];
				hasMore = result.hasMore;
			}
		} finally {
			loadingMore = false;
		}
	}
</script>


<div class="page-header">
	<h1 class="heading">explore</h1>
</div>

{#if visibleProjects.length === 0}
	<div class="placeholder">
		<p>no projects here yet. <strong><a href="/projects">be the first one!</a></strong></p>
	</div>
{:else}
	<div class="project-grid">
		{#each visibleProjects as project (project.id)}
			<div class="project-card-wrap">
			{#if data.isAdmin}
				<form method="POST" action="?/delete" use:enhance={() => {
					return ({ result }) => {
						if (result.type === 'success') visibleProjects = visibleProjects.filter(p => p.id !== project.id);
					};
				}}>
					<input type="hidden" name="id" value={project.id} />
					<button type="submit" class="btn-delete-project" onclick={(e) => { if (!confirm(`delete "${project.name}"?`)) e.preventDefault(); }}>delete</button>
				</form>
			{/if}
			<a
				href={project.demoUrl ?? '#'}
				target="_blank"
				rel="noopener noreferrer"
				class="project-card"
				class:no-demo={!project.demoUrl}
			>
				<div class="project-card-img-wrap">
					{#if project.screenshotUrl}
						<img
							src={project.screenshotUrl}
							alt="{project.name} screenshot"
							class="project-card-img"
						/>
					{/if}
				</div>
				<div class="project-card-top">
					<span class="project-name">{project.name}</span>
					{#if project.totalApprovedSeconds}
						<span class="ht-time"
							><span class="ht-icon">{@html clockSvg}</span>{formatHours(
								project.totalApprovedSeconds
							)}</span
						>
					{/if}
				</div>
				<span class="project-author"
					>by {project.authorName ?? project.authorNickname ?? 'unknown'}</span
				>
				{#if project.description}
					<p class="project-desc">{project.description}</p>
				{/if}
			</a>
			</div>
		{/each}
	</div>
	{#if hasMore}
		<div bind:this={sentinel} class="sentinel"></div>
	{/if}
	{#if loadingMore}
		<div class="loading-more">loading…</div>
	{/if}
{/if}

<style>
	.page-header {
		margin-bottom: 2rem;
	}

	.heading {
		font-size: clamp(2.5rem, 3.5vw, 3.5rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		border: dotted var(--border-width) var(--color-text);
		border-radius: var(--radius-card);
		padding: 4rem 2rem;
		color: var(--color-text-soft);
		font-size: 0.95rem;
	}

	.placeholder p {
		margin: 0;
	}

	.project-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
		gap: clamp(0.75rem, 1.2vw, 1.25rem);
	}

	.project-card {
		background: var(--color-bg);
		border-radius: var(--radius-card);
		border: solid var(--border-width);
		padding: clamp(1.25rem, 2vw, 2rem);
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: border-color 0.15s;
		overflow: hidden;
	}

	.project-card:hover {
		border-color: var(--color-text);
	}

	.project-card.no-demo {
		opacity: 0.5;
		cursor: default;
		pointer-events: none;
	}

	.project-card-img-wrap {
		width: calc(100% + 2 * clamp(1.25rem, 2vw, 2rem) + 2 * var(--border-width));
		margin: calc(-1 * (clamp(1.25rem, 2vw, 2rem) + var(--border-width)))
			calc(-1 * (clamp(1.25rem, 2vw, 2rem) + var(--border-width))) 0.75rem;
		height: 200px;
		flex-shrink: 0;
		background: #d9d9d9;
	}

	.project-card-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.project-card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.project-name {
		font-weight: bold;
		font-size: 1.6rem;
	}

	.ht-time {
		font-size: 1.3rem;
		font-weight: bold;
		letter-spacing: -0.02em;
		color: var(--color-text-soft);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.ht-icon {
		display: flex;
		width: 1em;
		height: 1em;
		flex-shrink: 0;
	}

	.ht-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.project-desc {
		font-size: 1.05rem;
		color: var(--color-text-soft);
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.project-author {
		font-size: 1rem;
		color: var(--color-text-soft);
	}

	.sentinel {
		height: 1px;
	}

	.loading-more {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-soft);
		font-size: 0.9rem;
	}

	.project-card-wrap {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.project-card-wrap .project-card {
		flex: 1;
	}

	.btn-delete-project {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 10;
		background: var(--color-bg);
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		padding: 0.2rem 0.5rem;
		font-size: 0.75rem;
		cursor: pointer;
		color: var(--color-text-soft);
	}

	.btn-delete-project:hover {
		color: var(--color-text);
	}
</style>
