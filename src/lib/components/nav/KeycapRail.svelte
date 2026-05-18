<script lang="ts">
	import { page } from '$app/state';
	import Keycap from '../Keycap.svelte';

	const projectsSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="grid" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M12.862 12.776c.072-.302.138-.842.138-1.776s-.066-1.474-.138-1.776a2.012 2.012 0 0 0-.017-.069 2.103 2.103 0 0 0-.069-.017C12.474 9.066 11.934 9 11 9s-1.474.066-1.776.138a2.08 2.08 0 0 0-.069.017 2.08 2.08 0 0 0-.017.069C9.066 9.526 9 10.066 9 11s.066 1.474.138 1.776l.017.069.069.017c.302.072.842.138 1.776.138s1.474-.066 1.776-.138l.069-.017.017-.069zm10 0c.072-.302.138-.842.138-1.776s-.066-1.474-.138-1.776a2.012 2.012 0 0 0-.017-.069 2.103 2.103 0 0 0-.069-.017C22.474 9.066 21.934 9 21 9s-1.474.066-1.776.138a2.103 2.103 0 0 0-.069.017l-.017.069C19.066 9.526 19 10.066 19 11s.066 1.474.138 1.776l.017.069.069.017c.302.072.842.138 1.776.138s1.474-.066 1.776-.138l.069-.017.017-.069zm-10 10c.072-.302.138-.842.138-1.776s-.066-1.474-.138-1.776a2.034 2.034 0 0 0-.017-.069 2.034 2.034 0 0 0-.069-.017C12.474 19.066 11.934 19 11 19s-1.474.066-1.776.138a2.012 2.012 0 0 0-.069.017l-.017.069C9.066 19.526 9 20.066 9 21s.066 1.474.138 1.776l.017.069.069.017c.302.072.842.138 1.776.138s1.474-.066 1.776-.138l.069-.017.017-.069zm10 0c.072-.302.138-.842.138-1.776s-.066-1.474-.138-1.776a2.034 2.034 0 0 0-.017-.069 2.034 2.034 0 0 0-.069-.017C22.474 19.066 21.934 19 21 19s-1.474.066-1.776.138a2.034 2.034 0 0 0-.069.017l-.017.069c-.072.302-.138.842-.138 1.776s.066 1.474.138 1.776l.017.069.069.017c.302.072.842.138 1.776.138s1.474-.066 1.776-.138l.069-.017.017-.069zM15 11c0 2.007-.275 2.861-.707 3.293-.432.432-1.286.707-3.293.707s-2.861-.275-3.293-.707C7.275 13.861 7 13.007 7 11s.275-2.861.707-3.293C8.139 7.275 8.993 7 11 7s2.861.275 3.293.707C14.725 8.139 15 8.993 15 11zm10 0c0 2.007-.275 2.861-.707 3.293-.432.432-1.286.707-3.293.707s-2.861-.275-3.293-.707C17.275 13.861 17 13.007 17 11s.275-2.861.707-3.293C18.139 7.275 18.993 7 21 7s2.861.275 3.293.707C24.725 8.139 25 8.993 25 11zM14.293 24.293c.432-.432.707-1.286.707-3.293s-.275-2.861-.707-3.293C13.861 17.275 13.007 17 11 17s-2.861.275-3.293.707C7.275 18.139 7 18.993 7 21s.275 2.861.707 3.293C8.139 24.725 8.993 25 11 25s2.861-.275 3.293-.707zM25 21c0 2.007-.275 2.861-.707 3.293-.432.432-1.286.707-3.293.707s-2.861-.275-3.293-.707C17.275 23.861 17 23.007 17 21s.275-2.861.707-3.293C18.139 17.275 18.993 17 21 17s2.861.275 3.293.707c.432.432.707 1.286.707 3.293z"/></svg>`;

	const exploreSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="compass" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"/><path d="M21.657 10.343a1 1 0 0 1 .167 1.193L18.288 17.9a1 1 0 0 1-.388.388l-6.364 3.536a1 1 0 0 1-1.36-1.36l3.536-6.364a1 1 0 0 1 .388-.388l6.364-3.536a1 1 0 0 1 1.193.167zm-6.336 4.978l-1.697 3.055 3.055-1.697 1.697-3.055-3.055 1.697z"/></svg>`;

	const macropadSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="nut" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M17.602 4.57901C16.6234 3.96097 15.3766 3.96097 14.398 4.57901L6.89802 9.31585C6.02773 9.86551 5.5 10.823 5.5 11.8523V20.5969C5.5 21.6674 6.07044 22.6568 6.9969 23.1932L14.4969 27.5353C15.4267 28.0736 16.5734 28.0736 17.5031 27.5353L25.0031 23.1932C25.9296 22.6568 26.5 21.6674 26.5 20.5969V11.8523C26.5 10.823 25.9723 9.86551 25.102 9.31586L17.602 4.57901ZM15.466 6.26999C15.7922 6.06397 16.2078 6.06398 16.534 6.26999L24.034 11.0068C24.3241 11.1901 24.5 11.5092 24.5 11.8523V20.5969C24.5 20.9537 24.3099 21.2835 24.0011 21.4623L16.5011 25.8044C16.1911 25.9838 15.8089 25.9838 15.499 25.8044L7.99897 21.4623C7.69015 21.2835 7.5 20.9537 7.5 20.5969V11.8523C7.5 11.5092 7.67591 11.1901 7.96601 11.0068L15.466 6.26999ZM19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16C13 14.3431 14.3431 13 16 13C17.6569 13 19 14.3431 19 16ZM21 16C21 18.7614 18.7614 21 16 21C13.2386 21 11 18.7614 11 16C11 13.2386 13.2386 11 16 11C18.7614 11 21 13.2386 21 16Z"/></svg>`;

	type NavItem = { label: string; href: string; icon?: string; svg?: string };

	const items: NavItem[] = [
		{ label: 'home', href: '/home', icon: 'home' },
		{ label: 'projects', href: '/projects', svg: projectsSvg },
		{ label: 'shop', href: '/shop', icon: 'bag' },
		{ label: 'explore', href: '/explore', svg: exploreSvg },
		{ label: 'macropad', href: '/onekey', svg: macropadSvg }
	];

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	function iconUrl(name: string, color: 'white' | 'black') {
		return `https://icons.hackclub.com/api/icons/${color}/${name}.svg`;
	}
</script>

<aside class="rail">
	<a href="/" class="brand" aria-label="onekey landing" draggable="false">
		<img
			src="https://assets.hackclub.com/flag-standalone-bw.svg"
			alt="Hack Club"
			draggable="false"
		/>
	</a>

	<div class="divider"></div>

	<nav class="nav" aria-label="primary">
		{#each items as item (item.href)}
			{@const active = isActive(item.href)}
			<a
				href={item.href}
				class="item"
				class:active
				aria-current={active ? 'page' : undefined}
				draggable="false"
			>
				<Keycap
					size="clamp(60px, 5.5vw, 90px)"
					color={active ? 'var(--keycap-border)' : 'var(--keycap-color)'}
				>
					{#if item.svg}
						<span class="svg-icon" class:white={active}>{@html item.svg}</span>
					{:else if item.icon}
						<img
							src={iconUrl(item.icon, active ? 'white' : 'black')}
							alt=""
							draggable="false"
						/>
					{/if}
				</Keycap>
				<span class="label">{item.label}</span>
			</a>
		{/each}
	</nav>

	<div class="bottom">
		<div class="divider"></div>
		<div class="avatar" aria-label="user avatar"></div>
	</div>
</aside>

<style>
	.rail {
		position: fixed;
		top: 0;
		left: 0;
		width: clamp(110px, 9.5vw, 170px);
		height: 100vh;
		background-color: var(--rail-bg);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: clamp(1rem, 1.2vw, 1.6rem) 0;
		gap: clamp(0.75rem, 0.9vw, 1.25rem);
		z-index: 20;
		box-sizing: border-box;
	}

	.brand {
		display: flex;
		justify-content: center;
		padding: 0.25rem 0 0.5rem;
		text-decoration: none;
	}

	.brand img {
		height: clamp(28px, 2.4vw, 40px);
		filter: invert(1);
	}

	.divider {
		width: 70%;
		height: 1px;
		background-color: var(--rail-line);
	}

	.nav {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.75rem, 1vw, 1.3rem);
		background: #fff;
		padding: clamp(0.35rem, 0.4vw, 0.6rem) clamp(0.5rem, 0.6vw, 0.85rem) clamp(0.5rem, 0.6vw, 0.85rem);
		border-radius: clamp(8.7px, 0.8vw, 13.05px);
	}

	.item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(8px, 0.7vw, 12px);
		text-decoration: none;
		outline: none;
		border-radius: 8px;
		user-select: none;
		-webkit-user-drag: none;
	}

	.item img,
	.brand img {
		-webkit-user-drag: none;
		pointer-events: none;
	}

	.item:focus-visible :global(.keycap) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.item.active :global(.face) {
		border-color: color-mix(in srgb, #ffffff 25%, transparent);
	}

	.svg-icon {
		display: flex;
		width: clamp(24px, 2.2vw, 36px);
		height: clamp(24px, 2.2vw, 36px);
		color: #000;
	}

	.svg-icon.white {
		color: #fff;
	}

	.svg-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.item img {
		width: clamp(24px, 2.2vw, 36px);
		height: clamp(24px, 2.2vw, 36px);
	}

.label {
		font-family: 'Phantom Sans', sans-serif;
		font-size: clamp(9px, 0.8vw, 12px);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8a8f99;
	}

	.item.active .label {
		color: #0e0f12;
	}

	.bottom {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.7rem, 0.85vw, 1.1rem);
		width: 100%;
		padding-bottom: 0.25rem;
	}

	.avatar {
		width: clamp(48px, 4.4vw, 70px);
		height: clamp(48px, 4.4vw, 70px);
		border-radius: 50%;
		background-color: var(--accent);
		border: 3px solid var(--rail-bg-2);
	}
</style>
