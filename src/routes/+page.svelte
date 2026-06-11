<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let showToast = $state(data.needsAuth);
	// svelte-ignore state_referenced_locally
	let showLockedToast = $state(data.locked);
	let toastTimer: ReturnType<typeof setTimeout>;
	let lockedToastTimer: ReturnType<typeof setTimeout>;

	const framesDown = ['/img/frame1.png', '/img/frame2.png', '/img/frame3.png', '/img/frame4.png'];
	const framesUp = ['/img/frame4.png', '/img/frame3.png', '/img/frame1.png'];

	let keyFrame = $state(framesDown[0]);
	let isPressed = false;
	let email = $state('');

	function animateFrames(frames: string[]) {
		let i = 0;
		const interval = setInterval(() => {
			keyFrame = frames[i];
			i++;
			if (i === frames.length) clearInterval(interval);
		}, 30);
	}

	function handleKeyDown() {
		isPressed = true;
		new Audio('/audio/key.wav').play().catch(() => {});
		animateFrames(framesDown);
	}

	const sections = ['landing', 'about', 'faq'] as const;
	type Section = (typeof sections)[number];
	let activeNav = $state<Section>('landing');

	function scrollToAnchor(id: string) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
	}

	onMount(() => {
		for (const src of [...framesDown, ...framesUp]) {
			const img = new Image();
			img.src = src;
		}

		if (showToast) {
			replaceState(resolve('/'), {});
			toastTimer = setTimeout(() => (showToast = false), 4000);
		}
		if (showLockedToast) {
			replaceState(resolve('/'), {});
			lockedToastTimer = setTimeout(() => (showLockedToast = false), 5000);
		}

		const handleMouseUp = () => {
			if (!isPressed) return;
			isPressed = false;
			animateFrames(framesUp);
		};
		document.addEventListener('mouseup', handleMouseUp);

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						activeNav = entry.target.id as Section;
					}
				}
			},
			{ rootMargin: '-50% 0px -49% 0px', threshold: 0 }
		);
		for (const id of sections) {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		}

		return () => {
			document.removeEventListener('mouseup', handleMouseUp);
			observer.disconnect();
		};
	});
</script>

<svelte:head>
	<meta property="og:author" content="onekey - Hack Club" />
	<meta property="og:title" content="onekey" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://maxstellar.github.io/onekey/img/og-banner.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:description"
		content="make a program that only uses one key, get a one key macropad! A Hack Club program for teen coders."
	/>
	<meta name="twitter:site" content="onekey - Hack Club" />
	<meta name="twitter:title" content="onekey" />
	<meta
		name="twitter:description"
		content="make a program that only uses one key, get a one key macropad! A Hack Club program for teen coders."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image:src" content="https://maxstellar.github.io/onekey/img/og-banner.png" />
</svelte:head>

{#if showToast}
	<div class="toast" role="alert">
		you need to be logged in to access this!
		<button
			class="toast-close"
			onclick={() => {
				showToast = false;
				clearTimeout(toastTimer);
			}}>✕</button
		>
	</div>
{/if}

{#if showLockedToast}
	<div class="toast toast-locked" role="alert">
		the platform isn't ready yet — stay tuned!
		<button
			class="toast-close"
			onclick={() => {
				showLockedToast = false;
				clearTimeout(lockedToastTimer);
			}}>✕</button
		>
	</div>
{/if}

<header>
	<button
		class="bordered nav-btn"
		class:nav-active={activeNav === 'landing'}
		onclick={() => scrollToAnchor('home')}
	>
		<img src="https://icons.hackclub.com/api/icons/black/home.svg" width="30" alt="" />
		<span>home</span>
	</button>
	<button
		class="bordered nav-btn"
		class:nav-active={activeNav === 'about'}
		onclick={() => scrollToAnchor('about')}
	>
		<img src="https://icons.hackclub.com/api/icons/black/info.svg" width="30" alt="" />
		<span>about</span>
	</button>
	<button
		class="bordered nav-btn"
		class:nav-active={activeNav === 'faq'}
		onclick={() => scrollToAnchor('faq')}
	>
		<img src="https://icons.hackclub.com/api/icons/black/support.svg" width="32" alt="" />
		<span>faq</span>
	</button>
</header>

<a href="https://hackclub.com/">
	<img
		id="home"
		src="https://assets.hackclub.com/flag-orpheus-top-bw.svg"
		class="hc-logo"
		loading="lazy"
		decoding="async"
		alt="Hack Club"
	/>
</a>

<div id="landing" class="section">
	<div class="display">
		<img
			draggable="false"
			onmousedown={handleKeyDown}
			class="key-img"
			src={keyFrame}
			alt="duct-taped one-key macropad"
			role="presentation"
		/>
	</div>
	<div class="panel">
		<img class="logo" src="/img/onekey.png" alt="onekey" />
		<p class="tagline">make a program that only uses one key, get a one key macropad!</p>
		{#if data.isLaunched}
			{#if data.user}
				<a href="/home" class="button filled cta">go to dashboard</a>
			{:else}
				<form
					class="cta-row"
					onsubmit={(e) => {
						e.preventDefault();
						window.location.href = `/login${email ? `?email=${encodeURIComponent(email)}` : ''}`;
					}}
				>
					<input
						type="email"
						class="email-input bordered"
						placeholder="your@email.com"
						bind:value={email}
					/>
					<button type="submit" class="button filled cta">get started</button>
				</form>
			{/if}
		{:else}
			<a
				href="https://onekey.fillout.com/rsvp"
				target="_blank"
				rel="noopener noreferrer"
				class="button filled cta">RSVP!</a
			>
		{/if}
	</div>
</div>

<div id="about" class="section about-section">
	<div class="content">
		<h1 class="section-head">about onekey</h1>
		<p class="tldr">
			<strong>you ship:</strong> a game, app, or program that only uses one key<br />
			<strong>we ship:</strong> a customizable, community-designed one key macropad!
		</p>
		<p>
			programs these days require too many keys—WASD or arrow keys to move, or even the entire
			keyboard to type!<br /><br />
			let's simplify things: by rejecting modernity's plethora of buttons and keys, and writing programs
			that only require one key!
		</p>
		<p class="subhead subhead-spaced"><strong>how do i participate?</strong></p>
		<p>
			sign up, and ship projects that only use one key! use
			<a href="https://hackatime.hackclub.com/">hackatime</a> to track your progress, and qualify for
			prizes at different milestones of time spent! the coolest projects will qualify for special prizes
			or customizations.
		</p>
		<p class="subhead subhead-spaced"><strong>what can i even make?</strong></p>
		<p>
			while it might seem difficult to think of ideas at first, you'll come to realize a lot can be
			done with just one key.<br />
			for inspiration, here are some famous examples, or check out
			<a href="https://maxstellar.github.io/onekey-examples/">some that i made myself!</a><br />
			the gallery is currently under construction, but when it's finished, you'll be able to view other
			teens' work.
		</p>
		<div class="row">
			<div class="card example-card bordered">
				<div class="text-center">
					<img class="example-img" src="/img/Osu!_logo_2024.png" alt="osu! logo" />
				</div>
				<p>
					<strong>osu!</strong><br />a rhythm game where you aim at circles and tap a single key at
					the right time!
				</p>
			</div>
			<div class="card example-card bordered">
				<div class="text-center">
					<img class="example-img" src="/img/geometry_dash.png" alt="geometry dash logo" />
				</div>
				<p>
					<strong>geometry dash</strong><br />a platformer where you tap a single key to jump over
					spikes!
				</p>
			</div>
			<div class="card example-card bordered">
				<div class="text-center">
					<img class="example-img" src="/img/stack.png" alt="stack logo" />
				</div>
				<p>
					<strong>stack</strong><br />a mobile game where you tap a single key to place moving
					blocks and build a tower!
				</p>
			</div>
		</div>
		<p class="subhead subhead-spaced"><strong>what do i get?</strong></p>
		<p>
			you can get a community-designed macropad with only onekey™!<br />
			you'll be able to unlock different customizations for your macropad's keycap + case design, by participating
			in various side quests or meeting certain requirements.
		</p>
	</div>
</div>

<div id="faq" class="section">
	<div class="content">
		<h1 class="section-head">faq</h1>
		<div class="faq-section">
			<div class="row duo">
				<div class="card faq-card bordered">
					<p class="subhead"><strong>who is eligible?</strong></p>
					<p>to be eligible for onekey, you need to be between the ages for 13 and 18.</p>
				</div>
				<div class="card faq-card bordered">
					<p class="subhead"><strong>how much does it cost?</strong></p>
					<p>
						it's 100% free! if you qualify, we'll pay for all your prizes + shipping (except customs
						fees)!
					</p>
				</div>
			</div>
			<div class="row duo">
				<div class="card faq-card bordered">
					<p class="subhead"><strong>what counts as "one key?"</strong></p>
					<p>
						your app should be controllable with only one key! anything else where you're pressing a
						button or clicking something for input is not allowed! mouse movement, mic, camera are
						acceptable.
					</p>
				</div>
				<div class="card faq-card bordered">
					<p class="subhead"><strong>the macropads are customizable?</strong></p>
					<p>
						yes, sort of... when claiming your prize, you can choose between a variety of different
						options, like case color, keycap design, and key switch. you'll be able to unlock more
						options by completing sidequests!
					</p>
				</div>
			</div>
			<div class="row duo">
				<div class="card faq-card bordered">
					<p class="subhead"><strong>what can i make?</strong></p>
					<p>
						all types of projects are allowed! whether it's a game, an app, or a website, as long as
						it only uses one key, it qualifies!
					</p>
				</div>
				<div class="card faq-card bordered">
					<p class="subhead"><strong>how many projects can i make?</strong></p>
					<p>
						as many as you'd like! there's no limit, but once you finish all side quests and meet
						all milestones, you'll have already unlocked all unique prizes.
					</p>
				</div>
			</div>
			<div class="row duo">
				<div class="card faq-card faq-card-wide bordered">
					<p class="subhead"><strong>is this legit? what's hack club?</strong></p>
					<p>
						we're legit! hack club is the world's largest community of teenage makers, and a
						501(c)(3) nonprofit. we've hosted programs like
						<a href="https://highseas.hackclub.com/">high seas</a> and
						<a href="https://summer.hackclub.com/">summer of making</a> which gave out prizes for building
						other sorts of projects. we're supported by donations from companies like GitHub or individual
						generous donations!
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<footer>
	<p>
		made with ❤︎⁠ by <a href="https://hackclub.com/">hack club</a> and
		<a href="https://github.com/maxstellar/">@maxstellar</a><br />
		design inspired by <a href="https://scraps.hackclub.com/">scraps</a> and
		<a href="https://github.com/notaroomba/">@notaroomba</a>
	</p>
</footer>

<style>
	.toast {
		position: fixed;
		top: clamp(0.75rem, 2vw, 1.5rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		background: var(--color-text);
		color: var(--color-bg);
		font-family: 'Phantom Sans', sans-serif;
		font-size: clamp(0.75rem, 1.2vw, 1rem);
		padding: clamp(0.4rem, 0.8vw, 0.7rem) clamp(0.75rem, 1.2vw, 1.25rem);
		border-radius: 9999px;
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 0.8vw, 0.75rem);
		white-space: nowrap;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.toast-close {
		background: none;
		border: none;
		color: inherit;
		font-size: 0.75rem;
		padding: 0;
		cursor: pointer;
		opacity: 0.6;
		line-height: 1;
		border-radius: 0;
	}

	.toast-close:hover {
		opacity: 1;
	}

	.toast-locked {
		background: #1a1a2e;
		color: #a78bfa;
	}

	.panel {
		margin-top: 20vh;
		margin-left: 7rem;
	}

	.logo {
		height: auto;
		width: 37rem;
	}

	.key-img {
		margin-left: 3rem;
		margin-top: 15vh;
		height: 30rem;
		width: 35rem;
		user-select: none;
	}

	.tagline {
		font-size: 2rem;
		text-align: left;
		margin-right: 3rem;
	}

	.cta-row {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
	}

	.email-input {
		font-family: 'Phantom Sans', sans-serif;
		font-size: 1.6rem;
		padding: 1.275rem 1.8rem;
		background: var(--color-bg);
		color: var(--color-text);
		border-radius: var(--radius-pill);
		width: 21.5rem;
		outline: none;
	}

	.email-input::placeholder {
		color: var(--color-text-soft);
		opacity: 0.7;
	}

	.cta {
		display: inline-block;
		font-size: 1.8rem;
		padding: 1.35rem 2.4rem;
	}

	.tldr {
		font-size: 1.13rem;
	}

	.about-section {
		background-color: var(--color-bg-soft);
		margin-top: 15rem;
		color: var(--color-text-soft);
	}

	.example-card {
		width: 30%;
	}

	.example-img {
		height: auto;
		width: 10rem;
	}

	.faq-section {
		color: var(--color-text-soft);
	}

	.faq-card {
		width: 43.305%;
		margin-bottom: 1rem;
	}

	.faq-card-wide {
		width: calc(86.61% + 3.5rem);
	}

	@media screen and (max-width: 1400px) {
		.logo {
			width: 31rem;
		}

		.tagline {
			font-size: 1.6rem;
		}

		.cta {
			font-size: 1.4rem;
			padding: 1.05rem 1.9rem;
		}

		.email-input {
			font-size: 1.2rem;
			padding: 1.05rem 1.5rem;
			width: 17rem;
		}

		.key-img {
			height: 24rem;
			width: 28rem;
		}
	}

	@media only screen and (max-width: 767px) {
		.logo {
			width: auto;
			height: 10vh;
		}

		.display {
			width: 100%;
			display: flex;
			justify-content: center;
		}

		.key-img {
			height: 40vh;
			width: 45vh;
			margin-top: 15vh;
			margin-left: 0;
		}

		.panel {
			text-align: center;
			margin-left: 0;
			margin-top: 10vh;
		}

		.tagline {
			font-size: 4.3vw;
			margin-left: auto;
			margin-right: auto;
			text-align: center;
			padding: 0 1.5rem;
		}

		.cta-row {
			justify-content: center;
		}

		.email-input {
			display: none;
		}

		#landing {
			height: 75vh;
		}

		.faq-card p {
			font-size: 2vh;
		}

		.example-card p {
			font-size: 1.6vh;
		}

		.example-img {
			height: auto;
			width: 15vw;
		}

		.duo {
			display: contents;
		}

		.duo div {
			width: 87%;
		}
	}
</style>
