<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let showToast = $state(data.needsAuth);
	// svelte-ignore state_referenced_locally
	let showLockedToast = $state(data.locked);
	// svelte-ignore state_referenced_locally
	let showAuthErrorToast = $state(!!data.authError);
	let toastTimer: ReturnType<typeof setTimeout>;
	let lockedToastTimer: ReturnType<typeof setTimeout>;
	let authErrorToastTimer: ReturnType<typeof setTimeout>;

	const authErrorMessage =
		data.authError === 'session_expired'
			? 'login session expired — please try again!'
			: data.authError
				? 'something went wrong with login — please try again!'
				: '';

	const framesDown = ['/img/frame1.png', '/img/frame2.png', '/img/frame3.png', '/img/frame4.png'];
	const framesUp = ['/img/frame4.png', '/img/frame3.png', '/img/frame1.png'];

	// matches the clock icon used as the shop's "hours" currency marker
	const clockSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor" stroke="currentColor" stroke-width="1.5" paint-order="stroke fill"><path d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"/><path d="M15.64 17a1 1 0 0 1-1-1V9a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1z"/><path d="M21.702 19.502a1 1 0 0 1-1.366.366l-5.196-3a1 1 0 0 1 1-1.732l5.196 3a1 1 0 0 1 .366 1.366z"/></svg>`;

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
		if (showAuthErrorToast) {
			replaceState(resolve('/'), {});
			authErrorToastTimer = setTimeout(() => (showAuthErrorToast = false), 6000);
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
	<meta property="og:url" content="https://onekey.hackclub.com/" />
	<meta property="og:image" content="https://onekey.hackclub.com/img/og-banner.png" />
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
	<meta name="twitter:image:src" content="https://onekey.hackclub.com/img/og-banner.png" />
	<link rel="canonical" href="https://onekey.hackclub.com/" />
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
		the platform isn't ready yet - stay tuned!
		<button
			class="toast-close"
			onclick={() => {
				showLockedToast = false;
				clearTimeout(lockedToastTimer);
			}}>✕</button
		>
	</div>
{/if}

{#if showAuthErrorToast}
	<div class="toast toast-error" role="alert">
		{authErrorMessage}
		<button
			class="toast-close"
			onclick={() => {
				showAuthErrorToast = false;
				clearTimeout(authErrorToastTimer);
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
		<svg
			fill-rule="evenodd"
			clip-rule="evenodd"
			stroke-linejoin="round"
			stroke-miterlimit="1.414"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			viewBox="0 0 32 32"
			preserveAspectRatio="xMidYMid meet"
			fill="currentColor"
			width="30"
			height="30"
			><path
				d="M16,5c-0.358,0 -0.736,0.149 -0.997,0.264c-0.297,0.13 -0.676,0.326 -1.077,0.555c-0.789,0.451 -1.798,1.102 -2.878,1.864c-2.149,1.518 -4.715,3.572 -6.755,5.61c-0.391,0.39 -0.391,1.024 0,1.414c0.39,0.391 1.024,0.391 1.414,0c1.96,-1.962 4.394,-3.908 6.495,-5.39c1.045,-0.738 1.974,-1.337 2.716,-1.761c0.365,-0.209 0.649,-0.357 0.887,-0.46c0.091,-0.04 0.154,-0.064 0.195,-0.078c0.041,0.014 0.104,0.038 0.194,0.078c0.239,0.103 0.523,0.251 0.888,0.46c0.742,0.424 1.671,1.023 2.716,1.761c2.101,1.482 4.535,3.428 6.495,5.39c0.39,0.391 1.024,0.391 1.414,0c0.391,-0.39 0.391,-1.024 0,-1.414c-2.04,-2.038 -4.606,-4.092 -6.755,-5.61c-1.08,-0.762 -2.089,-1.413 -2.878,-1.864c-0.401,-0.229 -0.78,-0.425 -1.077,-0.555c-0.262,-0.115 -0.639,-0.264 -0.997,-0.264Zm3.934,19.816c0.184,-0.028 0.358,-0.061 0.524,-0.098l0.014,-0.003c0.923,-0.2 1.291,-0.482 1.522,-0.79c0.292,-0.39 0.589,-1.123 0.774,-2.649l0.001,-0.003c0.165,-1.347 0.218,-3.047 0.229,-5.273c0.002,-0.552 0.45,-1 1.002,-1c0.552,0 1,0.448 0.998,1c-0.052,10.061 -1.005,11 -8.998,11c-7.993,0 -8.946,-0.939 -8.998,-11c-0.002,-0.552 0.446,-1 0.998,-1c0.552,0 1,0.448 1.002,1c0.011,2.226 0.064,3.926 0.229,5.273l0.001,0.003c0.185,1.526 0.482,2.259 0.774,2.649c0.231,0.308 0.599,0.59 1.523,0.79l0.013,0.003c0.166,0.037 0.34,0.07 0.524,0.098c-0.049,-0.788 -0.066,-1.718 -0.066,-2.816c0,-5.133 0.4,-6 4,-6c3.6,0 4,0.867 4,6c0,1.098 -0.017,2.028 -0.066,2.816Zm-2.015,0.16c0.062,-0.782 0.081,-1.74 0.081,-2.976c0,-1.258 -0.02,-2.159 -0.105,-2.87l0,-0.002c-0.081,-0.688 -0.196,-0.921 -0.228,-0.973c-0.001,-0.001 -0.001,-0.002 -0.001,-0.003c-0.002,-0.005 -0.007,-0.009 -0.012,-0.009c-0.019,-0.001 -0.042,-0.003 -0.073,-0.009c-0.004,-0.001 -0.009,-0.002 -0.012,-0.003c-0.338,-0.11 -0.751,-0.133 -1.568,-0.131l-0.002,0c-0.817,-0.002 -1.23,0.021 -1.568,0.131c-0.004,0.001 -0.008,0.002 -0.012,0.003c-0.031,0.006 -0.055,0.008 -0.073,0.009c-0.005,0 -0.01,0.004 -0.012,0.009c0,0.002 0,0.002 -0.001,0.003c-0.032,0.052 -0.147,0.285 -0.228,0.973l0,0.002c-0.085,0.711 -0.105,1.612 -0.105,2.87c0,1.236 0.019,2.194 0.08,2.976c0.569,0.018 1.204,0.024 1.92,0.024l0,0c0.715,0 1.35,-0.006 1.919,-0.024Z"
			/></svg
		>
		<span>home</span>
	</button>
	<button
		class="bordered nav-btn"
		class:nav-active={activeNav === 'about'}
		onclick={() => scrollToAnchor('about')}
	>
		<svg
			fill-rule="evenodd"
			clip-rule="evenodd"
			stroke-linejoin="round"
			stroke-miterlimit="1.414"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			viewBox="0 0 32 32"
			preserveAspectRatio="xMidYMid meet"
			fill="currentColor"
			width="30"
			height="30"
			><path
				d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"
			/><path
				d="M16 12.75a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16 22.25c-.552 0-1-.392-1-.875v-6.25c0-.483.448-.875 1-.875s1 .392 1 .875v6.25c0 .483-.448.875-1 .875z"
			/></svg
		>
		<span>about</span>
	</button>
	<button
		class="bordered nav-btn"
		class:nav-active={activeNav === 'faq'}
		onclick={() => scrollToAnchor('faq')}
	>
		<svg
			fill-rule="evenodd"
			clip-rule="evenodd"
			stroke-linejoin="round"
			stroke-miterlimit="1.414"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			viewBox="0 0 32 32"
			preserveAspectRatio="xMidYMid meet"
			fill="currentColor"
			width="32"
			height="32"
			><g transform="translate(5 7)"
				><path
					d="M 9 0.0236206C 9.62299 0.00744629 10.2887 0 11 0C 21.0833 0 22 1.5 22 8C 22 14.5 21.0833 16 11 16C 10.6595 16 10.3294 15.9982 10.0095 15.9947L 10.0082 15.9949C 10.0077 15.995 10.0071 15.9952 10.0067 15.9955L 5.55469 18.9636C 4.89014 19.4066 4 18.9302 4 18.1315L 4 15.4624C 4 15.4601 3.99835 15.4581 3.99609 15.4575C 1.01367 14.723 0.223999 13.1274 0.046051 10C 0.0114746 9.3927 0 8.72772 0 8C 0 1.95856 0.791901 0.236511 9 0.0236206ZM 2.47714 12.2372C 2.13568 11.5002 2 10.2927 2 8C 1.99951 6.41864 2.03903 5.33221 2.24951 4.4577C 2.41556 3.659 2.50861 3.43878 2.96548 3.12634C 3.3237 2.84076 3.99329 2.52826 5.34534 2.31049C 6.72906 2.08453 8.50272 2.00055 10.9492 2L 11 2C 13.4727 1.99945 15.2614 2.08295 16.6547 2.31049C 18.0067 2.52826 18.6763 2.84076 19.0345 3.12634C 19.4914 3.43878 19.5844 3.659 19.7505 4.4577C 19.961 5.33221 20.0005 6.41864 20 8C 20.0005 9.58136 19.961 10.6678 19.7505 11.5423C 19.5844 12.341 19.4914 12.5612 19.0345 12.8737C 18.6763 13.1592 18.0067 13.4717 16.6547 13.6895C 15.2614 13.9171 13.4727 14.0005 11 14C 10.6648 14 10.3458 13.9983 10.0316 13.9948C 9.73151 14.014 9.15842 14.1841 8.89725 14.3315L 6 16.263L 6 15.4624C 6 14.4967 5.32776 13.7258 4.47443 13.5156C 3.08609 13.1736 2.70114 12.7207 2.47714 12.2372ZM 10.9824 5.88C 12.2809 4.59998 13.5794 4.91998 14.2287 5.56C 16.8257 8.12 11.7788 11.5 10.9824 11.5C 10.1859 11.5 5.13913 8.12 7.73615 5.56C 8.38538 4.91998 9.6839 4.59998 10.9824 5.88Z"
				/></g
			></svg
		>
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
			ontouchend={(e) => {
				e.preventDefault();
				new Audio('/audio/key.wav').play().catch(() => {});
				animateFrames(framesDown);
				setTimeout(() => animateFrames(framesUp), framesDown.length * 30);
			}}
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
			programs these days require too many keys-WASD or arrow keys to move, or even the entire
			keyboard to type!<br /><br />
			let's simplify things: by rejecting modernity's plethora of buttons and keys, and writing programs
			that only require one key!
		</p>
		<p class="subhead subhead-spaced"><strong>how do i participate?</strong></p>
		<p>
			sign up, and ship projects that only use one key! use
			<a href="https://hackatime.hackclub.com/">hackatime</a> to track your time - every hour you log
			becomes balance to spend in the shop. the coolest projects can earn bonus prizes and customizations,
			too!
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
			a community-designed macropad, made with only onekey™!<br />
			every hour you ship becomes balance to spend in the shop - buy the macropad itself, then deck it
			out with keycaps, fancy cables, or even just buy a whole keyboard. the more you build, the more
			you can grab:
		</p>
		<div class="row shop-row">
			<div class="shop-example-col">
				<div class="card shop-example-card bordered">
					<img
						class="shop-example-img shop-example-img-macropad"
						src="/img/frame1.png"
						alt="onekey macropad"
					/>
					<strong class="shop-example-name">onekey macropad</strong>
				</div>
				<div class="card shop-price-card bordered">
					<span class="shop-price"><span class="clock-icon">{@html clockSvg}</span>5 hours</span>
				</div>
			</div>
			<div class="shop-example-col">
				<div class="card shop-example-card bordered">
					<img
						class="shop-example-img"
						src="https://cdn.hackclub.com/019eb4d8-d445-71a6-91c4-832af4c143f4/image.png"
						alt="duckey keycap"
					/>
					<strong class="shop-example-name">duckey keycap</strong>
				</div>
				<div class="card shop-price-card bordered">
					<span class="shop-price"><span class="clock-icon">{@html clockSvg}</span>3 hours</span>
				</div>
			</div>
			<div class="shop-example-col">
				<div class="card shop-example-card bordered">
					<img
						class="shop-example-img shop-example-img-blahaj"
						src="https://cdn.hackclub.com/019f04cd-73ee-755a-b897-2a34a6adefb1/PE730956.avif"
						alt="blahaj"
					/>
					<strong class="shop-example-name">blahaj</strong>
				</div>
				<div class="card shop-price-card bordered">
					<span class="shop-price"><span class="clock-icon">{@html clockSvg}</span>3 hours</span>
				</div>
			</div>
			<div class="shop-example-col">
				<div class="card shop-example-card bordered">
					<img
						class="shop-example-img"
						src="https://cdn.hackclub.com/019eb4e1-d0d2-7de0-b063-e2ba5f0c269b/image.png"
						alt="evoworks evo80"
					/>
					<strong class="shop-example-name">evoworks evo80</strong>
				</div>
				<div class="card shop-price-card bordered">
					<span class="shop-price"><span class="clock-icon">{@html clockSvg}</span>32 hours</span>
				</div>
			</div>
		</div>
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
						the main point of your project should generally revolve around only one key, but other
						controls are fine to have if they are really needed.<br />as long as your idea embodies
						the concept well and is polished, there should be no reason we can't accept it!
					</p>
				</div>
				<div class="card faq-card bordered">
					<p class="subhead"><strong>the macropads are customizable?</strong></p>
					<p>
						yes! the macropad is just the start - in the shop you can spend your hours on different
						case colors, keycap designs, and key switches to make it your own. the more you build,
						the more you can claim.
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
						as many as you'd like! there's no limit, so keep building interesting, creative, and
						unique things to your heart's content!
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

	.toast-error {
		background: #2a0a0a;
		color: #f87171;
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

		#landing {
			height: 100svh;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 10vw;
			box-sizing: border-box;
			padding-top: 7rem;
			padding-bottom: 2rem;
		}

		.display {
			width: 100%;
			display: flex;
			justify-content: center;
		}

		.key-img {
			height: 34svh;
			width: 38svh;
			margin-top: 0;
			margin-left: 0;
		}

		.panel {
			text-align: center;
			margin-left: 0;
			margin-top: 0;
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

		.about-section {
			margin-top: 0;
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

	/* ---------- shop item examples ---------- */
	.shop-row {
		flex-wrap: wrap;
		margin-top: 1.5rem;
	}

	.shop-example-col {
		width: calc(25% - 0.75rem);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.shop-example-card {
		flex: 1;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		overflow: hidden;
	}

	.shop-price-card {
		text-align: center;
	}

	.shop-example-img {
		width: 100%;
		align-self: center;
		aspect-ratio: 1 / 1;
		object-fit: cover;
		border-radius: 0.6rem;
		margin-bottom: 1.5rem;
	}

	/* match the hero key image's 35rem × 30rem aspect ratio (stretched, not cropped) */
	.shop-example-img-macropad {
		aspect-ratio: 35 / 30;
		object-fit: fill;
		/* shorter than the square images — center it in the leftover space, nudged up a touch */
		margin-top: auto;
		transform: translateY(-0.25rem);
	}

	/* blahaj is landscape — use its natural ratio so it fills the card width
	   (no square crop, no letterbox) and center it in the leftover height */
	.shop-example-img-blahaj {
		aspect-ratio: 820 / 523;
		object-fit: cover;
		object-position: left center;
		margin-top: auto;
		transform: scale(1.4);
	}

	.shop-example-name {
		font-size: 1.2rem;
		text-align: center;
		margin-top: auto;
	}

	.shop-price {
		align-self: center;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-weight: bold;
		font-size: 1.45rem;
		color: var(--color-text-soft);
	}

	.clock-icon {
		display: inline-flex;
		width: 1em;
		height: 1em;
	}

	.clock-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	@media only screen and (max-width: 767px) {
		.shop-example-col {
			width: 100%;
		}
	}
</style>
