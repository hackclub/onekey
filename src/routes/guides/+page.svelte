<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>guides - onekey</title>
	<meta
		name="description"
		content="Step-by-step guides to help you build your one-key project and get it shipped."
	/>
</svelte:head>

<div class="page">
	<h1 class="section-head">guides</h1>
	<p class="subhead">step-by-step walkthroughs to help you build, ship, and submit your onekey project.</p>

	{#if data.guides.length === 0}
		<div class="empty">
			<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<rect width="48" height="48" rx="10" fill="currentColor" opacity="0.07" />
				<path d="M14 16h20M14 24h14M14 32h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
			</svg>
			<p>no guides yet - check back soon!</p>
		</div>
	{:else}
		<div class="grid">
			{#each data.guides as guide (guide.slug)}
				<a href="/guides/{guide.slug}" class="card bordered">
					<div class="thumbnail">
						<img
							src={guide.thumbnail}
							alt={guide.title}
							onerror={(e) => {
								(e.currentTarget as HTMLImageElement).style.display = 'none';
							}}
						/>
						<div class="thumbnail-fallback" aria-hidden="true">
							<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M14 16h20M14 24h14M14 32h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
							</svg>
						</div>
					</div>
					<div class="card-body">
						<span class="stack-label">{guide.stack.join(' · ')}</span>
						<h2 class="card-title">{guide.title}</h2>
						<p class="card-desc">{guide.description}</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: clamp(3rem, 5vw, 5rem) clamp(1.5rem, 4vw, 3rem) clamp(3rem, 6vw, 6rem);
	}

	.section-head {
		font-size: 4rem;
		font-weight: bold;
		color: var(--color-text);
		margin: 0 0 1rem;
		line-height: 1;
	}

	.subhead {
		font-size: 1.3rem;
		letter-spacing: 0.7px;
		color: var(--color-text-soft);
		margin: 0 0 3rem;
	}

	/* grid */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
		gap: clamp(0.75rem, 1.2vw, 1.5rem);
	}

	/* card — dashboard home style */
	.card {
		display: flex;
		flex-direction: column;
		border-radius: var(--radius-card);
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		box-sizing: border-box;
		transition: border-style var(--transition-fast);
	}

	.card:hover {
		text-decoration: none;
	}

	/* thumbnail */
	.thumbnail {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: var(--color-bg-soft);
		overflow: hidden;
		/* cancel the card padding so the image bleeds edge-to-edge */
		margin: calc(-1 * var(--border-width));
		width: calc(100% + 2 * var(--border-width));
		flex-shrink: 0;
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.thumbnail-fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #bbb;
	}

	.thumbnail-fallback svg {
		width: 40px;
		height: 40px;
	}

	/* hide fallback when image loaded */
	.thumbnail img:not([style*='display: none']) + .thumbnail-fallback {
		display: none;
	}

	/* card body */
	.card-body {
		padding: clamp(1rem, 1.5vw, 1.5rem);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.stack-label {
		font-size: clamp(0.75rem, 0.9vw, 0.9rem);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-soft);
	}

	.card-title {
		font-size: clamp(1.1rem, 1.5vw, 1.5rem);
		font-weight: bold;
		letter-spacing: -0.02em;
		line-height: 1.2;
		margin: 0;
	}

	.card-desc {
		font-size: clamp(0.85rem, 1vw, 1rem);
		color: var(--color-text-soft);
		line-height: 1.6;
		margin: 0;
	}

	/* empty state */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 5rem 0;
		color: #aaa;
		text-align: center;
	}

	.empty svg {
		width: 48px;
		height: 48px;
	}

	.empty p {
		font-size: 1rem;
		margin: 0;
		color: #999;
	}

	@media (max-width: 767px) {
		.section-head {
			font-size: 2.5rem;
		}

		.subhead {
			font-size: 1rem;
		}
	}
</style>
