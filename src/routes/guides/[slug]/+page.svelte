<script lang="ts">
	import { page } from '$app/state';
	// highlight.js token colors for fenced code blocks (highlighted at parse time
	// in $lib/guides.ts). The dark theme suits the existing near-black <pre>.
	import 'highlight.js/styles/github-dark.css';

	let { data } = $props();
	const { guide } = data;

	let activeId = $state(guide.sections[0]?.id ?? '');
	let mobileNavOpen = $state(false);

	function scrollToSection(id: string) {
		activeId = id;
		mobileNavOpen = false;
		const el = document.getElementById('section-' + id);
		if (el) {
			const offset = 80;
			const top = el.getBoundingClientRect().top + window.scrollY - offset;
			window.scrollTo({ top, behavior: 'smooth' });
		}
	}

	// Update active section on scroll using IntersectionObserver
	import { onMount } from 'svelte';

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						activeId = entry.target.id.replace('section-', '');
					}
				}
			},
			{ rootMargin: '-20% 0px -70% 0px', threshold: 0 }
		);

		for (const section of guide.sections) {
			const el = document.getElementById('section-' + section.id);
			if (el) observer.observe(el);
		}

		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>{guide.title} — onekey guides</title>
	<meta name="description" content={guide.description} />
</svelte:head>

<div class="docs-layout">
	<!-- left sidebar -->
	<aside class="sidebar">
		<a href="/guides" class="back-link">← all guides</a>

		<div class="guide-meta">
			<div class="sidebar-pills">
				{#each guide.stack as tech}
					<span class="pill">{tech}</span>
				{/each}
			</div>
			<p class="sidebar-title">{guide.title}</p>
		</div>

		<nav class="section-nav" aria-label="guide sections">
			{#each guide.sections as section}
				<button
					class="nav-item"
					class:active={activeId === section.id}
					onclick={() => scrollToSection(section.id)}
				>
					{section.title}
				</button>
			{/each}
		</nav>
	</aside>

	<!-- mobile top bar -->
	<div class="mobile-bar">
		<a href="/guides" class="mobile-back">← guides</a>
		<button
			class="mobile-nav-toggle"
			onclick={() => (mobileNavOpen = !mobileNavOpen)}
			aria-expanded={mobileNavOpen}
		>
			{mobileNavOpen ? '✕ close' : '☰ sections'}
		</button>
	</div>

	{#if mobileNavOpen}
		<div class="mobile-nav-sheet">
			{#each guide.sections as section}
				<button
					class="mobile-nav-item"
					class:active={activeId === section.id}
					onclick={() => scrollToSection(section.id)}
				>
					{section.title}
				</button>
			{/each}
		</div>
	{/if}

	<!-- main content -->
	<main class="content">
		<div class="content-header">
			<div class="header-pills">
				{#each guide.stack as tech}
					<span class="pill">{tech}</span>
				{/each}
			</div>
			<h1 class="guide-title">{guide.title}</h1>
			<p class="guide-desc">{guide.description}</p>
		</div>

		<div class="sections">
			{#each guide.sections as section}
				<section id="section-{section.id}" class="section-block">
					<h2 class="section-heading">{section.title}</h2>
					<div class="section-content">
						{@html section.content}
					</div>
				</section>
			{/each}
		</div>

		<div class="footer-nav">
			<a href="/guides" class="footer-back">← back to guides</a>
		</div>
	</main>
</div>

<style>
	.docs-layout {
		display: grid;
		grid-template-columns: 240px 1fr;
		grid-template-rows: auto 1fr;
		min-height: calc(100vh - 56px);
		max-width: 1200px;
		margin: 0 auto;
	}

	/* sidebar */
	.sidebar {
		grid-column: 1;
		grid-row: 1 / -1;
		position: sticky;
		top: 5.4rem;
		height: calc(100vh - 5.4rem);
		overflow-y: auto;
		padding: 2rem 1.25rem 2rem 1.5rem;
		border-right: 1px solid #e5e7eb;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.back-link {
		font-size: 0.85rem;
		color: #666;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.1s;
	}

	.back-link:hover {
		color: #000;
		text-decoration: none;
	}

	.guide-meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.sidebar-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.sidebar-title {
		font-size: 0.88rem;
		font-weight: 600;
		line-height: 1.4;
		color: #333;
		margin: 0;
	}

	.section-nav {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.nav-item {
		font-family: 'Phantom Sans', sans-serif;
		font-size: 0.88rem;
		text-align: left;
		padding: 0.45rem 0.75rem;
		border-radius: 7px;
		border: none;
		background: none;
		color: #555;
		cursor: pointer;
		transition:
			background 0.1s,
			color 0.1s;
		line-height: 1.4;
	}

	.nav-item:hover {
		background: #f3f4f6;
		color: #000;
	}

	.nav-item.active {
		background: #000;
		color: #fff;
		font-weight: 600;
	}

	/* mobile bar */
	.mobile-bar {
		display: none;
		grid-column: 1 / -1;
		position: sticky;
		top: 0;
		z-index: 15;
		background: var(--color-bg);
		border-bottom: 1px solid #e5e7eb;
		padding: 0.6rem 1rem;
		align-items: center;
		justify-content: space-between;
	}

	.mobile-back {
		font-size: 0.85rem;
		color: #555;
		text-decoration: none;
	}

	.mobile-nav-toggle {
		font-family: 'Phantom Sans', sans-serif;
		font-size: 0.85rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 0.35rem 0.75rem;
		background: none;
		cursor: pointer;
		color: #333;
	}

	.mobile-nav-sheet {
		display: none;
		grid-column: 1 / -1;
		background: var(--color-bg);
		border-bottom: 1px solid #e5e7eb;
		padding: 0.75rem 1rem;
		flex-direction: column;
		gap: 0.1rem;
	}

	.mobile-nav-item {
		font-family: 'Phantom Sans', sans-serif;
		font-size: 0.9rem;
		text-align: left;
		padding: 0.55rem 0.75rem;
		border-radius: 7px;
		border: none;
		background: none;
		color: #444;
		cursor: pointer;
	}

	.mobile-nav-item.active {
		background: #000;
		color: #fff;
		font-weight: 600;
	}

	/* content */
	.content {
		grid-column: 2;
		padding: clamp(2rem, 4vw, 3.5rem) clamp(1.5rem, 5vw, 4rem);
		max-width: 780px;
	}

	.content-header {
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.header-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 0.9rem;
	}

	.pill {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		padding: 0.22rem 0.6rem;
		border-radius: 9999px;
		background: #f0f1f3;
		color: #444;
	}

	.guide-title {
		font-size: clamp(1.75rem, 3.5vw, 2.75rem);
		font-weight: 800;
		letter-spacing: -0.025em;
		line-height: 1.1;
		margin: 0 0 0.75rem;
	}

	.guide-desc {
		font-size: 1.05rem;
		color: #555;
		line-height: 1.65;
		margin: 0;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.section-block {
		scroll-margin-top: 80px;
	}

	.section-heading {
		font-size: 1.4rem;
		font-weight: 700;
		letter-spacing: -0.015em;
		margin: 0 0 1.1rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid #e5e7eb;
	}

	/* prose styles for {@html} content */
	.section-content :global(p) {
		font-size: 1rem;
		line-height: 1.75;
		color: #333;
		margin: 0 0 1rem;
	}

	.section-content :global(h3) {
		font-size: 1.05rem;
		font-weight: 700;
		margin: 1.5rem 0 0.5rem;
		color: #111;
	}

	.section-content :global(ul),
	.section-content :global(ol) {
		padding-left: 1.5rem;
		margin: 0 0 1rem;
	}

	.section-content :global(li) {
		font-size: 1rem;
		line-height: 1.7;
		color: #333;
		margin-bottom: 0.35rem;
	}

	.section-content :global(a) {
		color: #000;
		font-weight: 500;
	}

	.section-content :global(strong) {
		font-weight: 700;
		color: #111;
	}

	.section-content :global(code) {
		font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
		font-size: 0.88em;
		background: #f3f4f6;
		border-radius: 4px;
		padding: 0.1em 0.35em;
		color: #c7254e;
	}

	.section-content :global(pre) {
		background: #1a1a1a;
		color: #e8e8e8;
		border-radius: 10px;
		padding: 1.1rem 1.3rem;
		overflow-x: auto;
		margin: 1rem 0;
		font-size: 0.88rem;
		line-height: 1.65;
	}

	.section-content :global(pre code) {
		background: none;
		padding: 0;
		border-radius: 0;
		color: inherit;
		font-size: inherit;
	}

	.footer-nav {
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.footer-back {
		font-size: 0.9rem;
		font-weight: 500;
		color: #555;
		text-decoration: none;
		transition: color 0.1s;
	}

	.footer-back:hover {
		color: #000;
	}

	/* mobile */
	@media (max-width: 768px) {
		.docs-layout {
			grid-template-columns: 1fr;
		}

		.sidebar {
			display: none;
		}

		.mobile-bar {
			display: flex;
		}

		.mobile-nav-sheet {
			display: flex;
		}

		.content {
			grid-column: 1;
			padding: 1.5rem 1rem 3rem;
		}
	}
</style>
