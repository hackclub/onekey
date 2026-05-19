<script lang="ts">
	import { page } from '$app/state';
	import Keycap from '../Keycap.svelte';

	const projectsSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="grid" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M12.862 12.776c.072-.302.138-.842.138-1.776s-.066-1.474-.138-1.776a2.012 2.012 0 0 0-.017-.069 2.103 2.103 0 0 0-.069-.017C12.474 9.066 11.934 9 11 9s-1.474.066-1.776.138a2.08 2.08 0 0 0-.069.017 2.08 2.08 0 0 0-.017.069C9.066 9.526 9 10.066 9 11s.066 1.474.138 1.776l.017.069.069.017c.302.072.842.138 1.776.138s1.474-.066 1.776-.138l.069-.017.017-.069zm10 0c.072-.302.138-.842.138-1.776s-.066-1.474-.138-1.776a2.012 2.012 0 0 0-.017-.069 2.103 2.103 0 0 0-.069-.017C22.474 9.066 21.934 9 21 9s-1.474.066-1.776.138a2.103 2.103 0 0 0-.069.017l-.017.069C19.066 9.526 19 10.066 19 11s.066 1.474.138 1.776l.017.069.069.017c.302.072.842.138 1.776.138s1.474-.066 1.776-.138l.069-.017.017-.069zm-10 10c.072-.302.138-.842.138-1.776s-.066-1.474-.138-1.776a2.034 2.034 0 0 0-.017-.069 2.034 2.034 0 0 0-.069-.017C12.474 19.066 11.934 19 11 19s-1.474.066-1.776.138a2.012 2.012 0 0 0-.069.017l-.017.069C9.066 19.526 9 20.066 9 21s.066 1.474.138 1.776l.017.069.069.017c.302.072.842.138 1.776.138s1.474-.066 1.776-.138l.069-.017.017-.069zm10 0c.072-.302.138-.842.138-1.776s-.066-1.474-.138-1.776a2.034 2.034 0 0 0-.017-.069 2.034 2.034 0 0 0-.069-.017C22.474 19.066 21.934 19 21 19s-1.474.066-1.776.138a2.034 2.034 0 0 0-.069.017l-.017.069c-.072.302-.138.842-.138 1.776s.066 1.474.138 1.776l.017.069.069.017c.302.072.842.138 1.776.138s1.474-.066 1.776-.138l.069-.017.017-.069zM15 11c0 2.007-.275 2.861-.707 3.293-.432.432-1.286.707-3.293.707s-2.861-.275-3.293-.707C7.275 13.861 7 13.007 7 11s.275-2.861.707-3.293C8.139 7.275 8.993 7 11 7s2.861.275 3.293.707C14.725 8.139 15 8.993 15 11zm10 0c0 2.007-.275 2.861-.707 3.293-.432.432-1.286.707-3.293.707s-2.861-.275-3.293-.707C17.275 13.861 17 13.007 17 11s.275-2.861.707-3.293C18.139 7.275 18.993 7 21 7s2.861.275 3.293.707C24.725 8.139 25 8.993 25 11zM14.293 24.293c.432-.432.707-1.286.707-3.293s-.275-2.861-.707-3.293C13.861 17.275 13.007 17 11 17s-2.861.275-3.293.707C7.275 18.139 7 18.993 7 21s.275 2.861.707 3.293C8.139 24.725 8.993 25 11 25s2.861-.275 3.293-.707zM25 21c0 2.007-.275 2.861-.707 3.293-.432.432-1.286.707-3.293.707s-2.861-.275-3.293-.707C17.275 23.861 17 23.007 17 21s.275-2.861.707-3.293C18.139 17.275 18.993 17 21 17s2.861.275 3.293.707c.432.432.707 1.286.707 3.293z"/></svg>`;

	const exploreSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="compass" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"/><path d="M21.657 10.343a1 1 0 0 1 .167 1.193L18.288 17.9a1 1 0 0 1-.388.388l-6.364 3.536a1 1 0 0 1-1.36-1.36l3.536-6.364a1 1 0 0 1 .388-.388l6.364-3.536a1 1 0 0 1 1.193.167zm-6.336 4.978l-1.697 3.055 3.055-1.697 1.697-3.055-3.055 1.697z"/></svg>`;

	const macropadSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="nut" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M17.602 4.57901C16.6234 3.96097 15.3766 3.96097 14.398 4.57901L6.89802 9.31585C6.02773 9.86551 5.5 10.823 5.5 11.8523V20.5969C5.5 21.6674 6.07044 22.6568 6.9969 23.1932L14.4969 27.5353C15.4267 28.0736 16.5734 28.0736 17.5031 27.5353L25.0031 23.1932C25.9296 22.6568 26.5 21.6674 26.5 20.5969V11.8523C26.5 10.823 25.9723 9.86551 25.102 9.31586L17.602 4.57901ZM15.466 6.26999C15.7922 6.06397 16.2078 6.06398 16.534 6.26999L24.034 11.0068C24.3241 11.1901 24.5 11.5092 24.5 11.8523V20.5969C24.5 20.9537 24.3099 21.2835 24.0011 21.4623L16.5011 25.8044C16.1911 25.9838 15.8089 25.9838 15.499 25.8044L7.99897 21.4623C7.69015 21.2835 7.5 20.9537 7.5 20.5969V11.8523C7.5 11.5092 7.67591 11.1901 7.96601 11.0068L15.466 6.26999ZM19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16C13 14.3431 14.3431 13 16 13C17.6569 13 19 14.3431 19 16ZM21 16C21 18.7614 18.7614 21 16 21C13.2386 21 11 18.7614 11 16C11 13.2386 13.2386 11 16 11C18.7614 11 21 13.2386 21 16Z"/></svg>`;

	const homeSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="home" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M16,5c-0.358,0 -0.736,0.149 -0.997,0.264c-0.297,0.13 -0.676,0.326 -1.077,0.555c-0.789,0.451 -1.798,1.102 -2.878,1.864c-2.149,1.518 -4.715,3.572 -6.755,5.61c-0.391,0.39 -0.391,1.024 0,1.414c0.39,0.391 1.024,0.391 1.414,0c1.96,-1.962 4.394,-3.908 6.495,-5.39c1.045,-0.738 1.974,-1.337 2.716,-1.761c0.365,-0.209 0.649,-0.357 0.887,-0.46c0.091,-0.04 0.154,-0.064 0.195,-0.078c0.041,0.014 0.104,0.038 0.194,0.078c0.239,0.103 0.523,0.251 0.888,0.46c0.742,0.424 1.671,1.023 2.716,1.761c2.101,1.482 4.535,3.428 6.495,5.39c0.39,0.391 1.024,0.391 1.414,0c0.391,-0.39 0.391,-1.024 0,-1.414c-2.04,-2.038 -4.606,-4.092 -6.755,-5.61c-1.08,-0.762 -2.089,-1.413 -2.878,-1.864c-0.401,-0.229 -0.78,-0.425 -1.077,-0.555c-0.262,-0.115 -0.639,-0.264 -0.997,-0.264Zm3.934,19.816c0.184,-0.028 0.358,-0.061 0.524,-0.098l0.014,-0.003c0.923,-0.2 1.291,-0.482 1.522,-0.79c0.292,-0.39 0.589,-1.123 0.774,-2.649l0.001,-0.003c0.165,-1.347 0.218,-3.047 0.229,-5.273c0.002,-0.552 0.45,-1 1.002,-1c0.552,0 1,0.448 0.998,1c-0.052,10.061 -1.005,11 -8.998,11c-7.993,0 -8.946,-0.939 -8.998,-11c-0.002,-0.552 0.446,-1 0.998,-1c0.552,0 1,0.448 1.002,1c0.011,2.226 0.064,3.926 0.229,5.273l0.001,0.003c0.185,1.526 0.482,2.259 0.774,2.649c0.231,0.308 0.599,0.59 1.523,0.79l0.013,0.003c0.166,0.037 0.34,0.07 0.524,0.098c-0.049,-0.788 -0.066,-1.718 -0.066,-2.816c0,-5.133 0.4,-6 4,-6c3.6,0 4,0.867 4,6c0,1.098 -0.017,2.028 -0.066,2.816Zm-2.015,0.16c0.062,-0.782 0.081,-1.74 0.081,-2.976c0,-1.258 -0.02,-2.159 -0.105,-2.87l0,-0.002c-0.081,-0.688 -0.196,-0.921 -0.228,-0.973c-0.001,-0.001 -0.001,-0.002 -0.001,-0.003c-0.002,-0.005 -0.007,-0.009 -0.012,-0.009c-0.019,-0.001 -0.042,-0.003 -0.073,-0.009c-0.004,-0.001 -0.009,-0.002 -0.012,-0.003c-0.338,-0.11 -0.751,-0.133 -1.568,-0.131l-0.002,0c-0.817,-0.002 -1.23,0.021 -1.568,0.131c-0.004,0.001 -0.008,0.002 -0.012,0.003c-0.031,0.006 -0.055,0.008 -0.073,0.009c-0.005,0 -0.01,0.004 -0.012,0.009c0,0.002 0,0.002 -0.001,0.003c-0.032,0.052 -0.147,0.285 -0.228,0.973l0,0.002c-0.085,0.711 -0.105,1.612 -0.105,2.87c0,1.236 0.019,2.194 0.08,2.976c0.569,0.018 1.204,0.024 1.92,0.024l0,0c0.715,0 1.35,-0.006 1.919,-0.024Z"/></svg>`;

	const shopSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="bag" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M19.229 17.06c-.65-.64-1.948-.96-3.247.32-1.298-1.28-2.597-.96-3.246-.32-2.597 2.56 2.45 5.94 3.246 5.94.797 0 5.844-3.38 3.247-5.94z"/><path d="M14 11.524a77.266 77.266 0 0 1 2-.024c10.083 0 11 1.5 11 8s-.917 8-11 8c-.711 0-1.377-.007-2-.024-8.208-.212-9-1.935-9-7.976s.792-7.764 9-7.976zM7 19.5c0 1.581.039 2.668.25 3.542.166.799.259 1.02.715 1.332.359.285 1.028.598 2.38.816 1.384.226 3.158.31 5.604.31H16c2.473 0 4.261-.083 5.655-.31 1.352-.218 2.021-.53 2.38-.816.456-.313.55-.533.715-1.332.211-.874.25-1.96.25-3.542 0-1.581-.039-2.668-.25-3.542-.166-.799-.259-1.02-.715-1.332-.359-.285-1.028-.598-2.38-.816-1.394-.227-3.182-.31-5.655-.31h-.05c-2.447 0-4.22.085-5.605.31-1.352.218-2.021.53-2.38.816-.456.313-.55.533-.715 1.332-.211.874-.25 1.96-.25 3.542z"/><path d="M16 4.5a5 5 0 0 0-5 5v2a1 1 0 1 0 2 0v-2a3 3 0 0 1 6 0v2a1 1 0 1 0 2 0v-2a5 5 0 0 0-5-5z"/></svg>`;

	type NavItem = { label: string; svg: string; href: string };

	const items: NavItem[] = [
		{ label: 'home', href: '/home', svg: homeSvg },
		{ label: 'projects', href: '/projects', svg: projectsSvg },
		{ label: 'explore', href: '/explore', svg: exploreSvg },
		{ label: 'shop', href: '/shop', svg: shopSvg },
		{ label: 'macropad', href: '/onekey', svg: macropadSvg }
	];

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	let pressedHref = $state<string | null>(null);

	function handlePress(href: string) {
		pressedHref = href;
		new Audio('/audio/key.wav').play().catch(() => {});
	}

	function handleRelease() {
		pressedHref = null;
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
				onmousedown={() => handlePress(item.href)}
				onmouseup={handleRelease}
				onmouseleave={handleRelease}
				ontouchstart={() => handlePress(item.href)}
				ontouchend={handleRelease}
			>
				<Keycap
					size="max(55px, 9vh)"
					color={active ? 'var(--keycap-border)' : 'var(--keycap-color)'}
					dark={active}
					pressed={pressedHref === item.href}
				>
					<span class="svg-icon" class:white={active}>{@html item.svg}</span>
				</Keycap>
				<span class="label">{item.label}</span>
			</a>
		{/each}
	</nav>

	<div class="bottom">
		<div class="divider"></div>
		<a href="/profile" class="avatar" aria-label="profile" draggable="false"></a>
	</div>
</aside>

<style>
	.rail {
		position: fixed;
		top: 0;
		left: 0;
		width: max(110px, 17vh);
		height: 100vh;
		background-color: var(--rail-bg);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: max(16px, 2.1vh) 0;
		gap: max(12px, 1.6vh);
		z-index: 20;
		box-sizing: border-box;
	}

	.brand {
		display: flex;
		justify-content: center;
		padding: 4px 0 8px;
		text-decoration: none;
	}

	.brand img {
		height: max(28px, 4.3vh);
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
		gap: max(16px, 2.3vh);
		background: #fff;
		padding: max(11px, 1.4vh) max(8px, 1.1vh) max(11px, 1.4vh);
		border-radius: max(8.7px, 1.4vh);
		overflow: hidden;
		margin-block: auto;
	}

	.item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: max(4px, 0.7vh);
		text-decoration: none;
		outline: none;
		border-radius: 8px;
		user-select: none;
		-webkit-user-drag: none;
	}

	.brand img {
		-webkit-user-drag: none;
		pointer-events: none;
	}

	.item.active :global(.face) {
		border-color: color-mix(in srgb, #ffffff 25%, transparent);
	}

	.item:focus-visible :global(.keycap) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}


	.svg-icon {
		display: flex;
		width: max(24px, 3.9vh);
		height: max(24px, 3.9vh);
		color: #000;
	}

	.svg-icon.white {
		color: #fff;
	}

	.svg-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.label {
		font-family: 'Phantom Sans', sans-serif;
		font-size: max(9px, 1.4vh);
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
		gap: max(11px, 1.5vh);
		width: 100%;
		padding-bottom: 4px;
	}

	.avatar {
		width: max(48px, 7.8vh);
		height: max(48px, 7.8vh);
		border-radius: 50%;
		background-color: var(--accent);
		border: max(2px, 0.4vh) solid var(--rail-bg-2);
	}
</style>
