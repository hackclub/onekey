<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();

	// Verify banner is dismissible and remembered per-device. Start hidden so it can't flash
	// before we've read localStorage on mount.
	let bannerDismissed = $state(true);
	onMount(() => {
		bannerDismissed = localStorage.getItem('verifyBannerDismissed') === '1';
	});
	function dismissBanner() {
		bannerDismissed = true;
		localStorage.setItem('verifyBannerDismissed', '1');
	}
	const showVerifyBanner = $derived(
		data.user?.verification_status !== 'verified' && !bannerDismissed
	);

	const communityGoalHours = 1500;
	// svelte-ignore state_referenced_locally
	const communityHours = Math.floor((data.communityApprovedSeconds ?? 0) / 3600);
	const communityProgress = (communityHours / communityGoalHours) * 100;
	const goals = [
		{ pct: 6.67, label: "decide max's pfp", hours: '100 hours' },
		{ pct: 16.66, label: 'i want to cheese', hours: '250 hours' },
		{ pct: 33.33, label: 'water balloon firing squad', hours: '500 hours' },
		{ pct: 50, label: "dye max's hair", hours: '750 hours' },
		{ pct: 66.66, label: 'jenin and max tiktok dance', hours: '1000 hours' },
		{ pct: 100, label: 'catmaid for a day', hours: '1500 hours' }
	];

	const barSegments = Array.from({ length: 20 }, (_, i) => i);
	const allCompleted = communityProgress >= 100;
	const prevGoal = goals.findLast((g) => g.pct <= communityProgress) ?? {
		pct: 0,
		label: 'start',
		hours: '0 hours'
	};
	const nextGoal = goals.find((g) => g.pct > communityProgress) ?? goals[goals.length - 1];
	const segmentProgress = allCompleted
		? 100
		: ((communityProgress - prevGoal.pct) / (nextGoal.pct - prevGoal.pct)) * 100;

	// --- timed goal (admin-set) ---------------------------------------------
	// When a timed goal is set it replaces the community card. Progress
	// (currentHours/targetHours) is set manually by an admin; the ring counts
	// down from createdAt (full) to deadline (empty). After the deadline the
	// card shows a dimmed "time's up" state.
	const timedGoal = data.timedGoal;
	const goalPct = timedGoal
		? Math.max(0, Math.min(100, (timedGoal.currentHours / Math.max(1, timedGoal.targetHours)) * 100))
		: 0;
	const deadlineMs = timedGoal ? new Date(timedGoal.deadline).getTime() : 0;
	const startMs = timedGoal ? new Date(timedGoal.createdAt).getTime() : 0;
	const totalMs = Math.max(1, deadlineMs - startMs);
	const RING_R = 52;
	const ringCirc = 2 * Math.PI * RING_R;

	// `now` ticks every second so the countdown and ring animate live.
	// svelte-ignore state_referenced_locally
	let now = $state(Date.now());
	const remainingMs = $derived(Math.max(0, deadlineMs - now));
	const goalExpired = $derived(timedGoal ? remainingMs <= 0 : false);
	const ringFraction = $derived(Math.max(0, Math.min(1, remainingMs / totalMs)));
	const ringOffset = $derived(ringCirc * (1 - ringFraction));

	function formatRemaining(ms: number): string {
		const s = Math.floor(ms / 1000);
		const d = Math.floor(s / 86400);
		const h = Math.floor((s % 86400) / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		if (d > 0) return `${d}d ${h}h`;
		if (h > 0) return `${h}h ${m}m`;
		if (m > 0) return `${m}m ${sec}s`;
		return `${sec}s`;
	}
	const remainingLabel = $derived(formatRemaining(remainingMs));
	const deadlineLabel = timedGoal
		? new Date(timedGoal.deadline).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			})
		: '';

	onMount(() => {
		if (!timedGoal) return;
		const id = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(id);
	});
</script>

<div class="greeting-row">
	{#if data.user?.avatar_url}
		<img class="greeting-avatar" src={data.user.avatar_url} alt="avatar" />
	{/if}
	<div>
		<h1 class="greeting">welcome back, {data.user?.nickname ?? 'onekeyer!'}</h1>
		{#if data.user?.slack_display_name}
			<p class="slack-handle">@{data.user.slack_display_name}</p>
		{/if}
	</div>
</div>

{#if showVerifyBanner}
	<div class="verify-banner">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fill-rule="evenodd"
				d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
				clip-rule="evenodd"
			/>
		</svg>
		<span class="verify-banner-text"
			>verify your identity to gain access to a shop full of bigger, more awesome prizes. <a
				href="https://auth.hackclub.com/verifications/new"
				target="_blank"
				rel="noreferrer">verify your identity here</a
			></span
		>
		<button type="button" class="verify-banner-close" aria-label="dismiss" onclick={dismissBanner}
			>×</button
		>
	</div>
{/if}

<div class="bento">
	<div class="card card-started">
		<span class="started-title">get started</span>
		<ul class="started-list">
			<li class="started-item done">
				<span class="started-check"></span>
				<span>join onekey</span>
				<span class="started-action">joined!</span>
			</li>
			<li class="started-item" class:done={data.user?.hackatime_linked}>
				<span class="started-check"></span>
				<span>link hackatime</span>
				{#if data.user?.hackatime_linked}
					<span class="started-action">linked!</span>
				{:else}
					<a href="/auth/hackatime/start" class="started-action" data-sveltekit-reload>go</a>
				{/if}
			</li>
			<li
				class="started-item"
				class:done={!!(data.user?.street_address || data.user?.locality || data.user?.country)}
			>
				<span class="started-check"></span>
				<span>set your address</span>
				{#if data.user?.street_address || data.user?.locality || data.user?.country}
					<span class="started-action">done!</span>
				{:else}
					<a href="/account?edit=address" class="started-action">go</a>
				{/if}
			</li>
			<li class="started-item" class:done={data.hasProject}>
				<span class="started-check"></span>
				<span>make a project</span>
				{#if data.hasProject}
					<span class="started-action">done!</span>
				{:else}
					<a href="/projects?new=1" class="started-action">go</a>
				{/if}
			</li>
		</ul>
	</div>
	<div class="card card-hero card-hero-right">
		<img
			class="hero-bg hero-bg-left"
			src="https://cdn.hackclub.com/019ebe34-bdd6-7c22-bd7b-498b1e5a2e0e/image.png"
			alt=""
			aria-hidden="true"
		/>
		<span class="card-hero-label">items up to 50% off</span>
		<a href="/shop" class="hero-btn">
			view shop
			<svg
				fill-rule="evenodd"
				clip-rule="evenodd"
				stroke-linejoin="round"
				stroke-miterlimit="1.414"
				xmlns="http://www.w3.org/2000/svg"
				aria-label="right-caret"
				viewBox="0 0 32 32"
				preserveAspectRatio="xMidYMid meet"
				fill="currentColor"
				width="1em"
				height="1em"
				><path
					d="M11.6068 8.1099C11.2532 8.53417 11.3106 9.16473 11.7348 9.51829C13.3799 10.8952 17.2004 14.2798 18.5095 16.0001C17.1784 17.7493 13.4095 21.0851 11.7348 22.4819C11.3106 22.8355 11.2532 23.466 11.6068 23.8903C11.9604 24.3146 12.5913 24.3716 13.0156 24.018C14.8552 22.4864 18.8153 19.025 20.2164 17.0536C20.4346 16.7423 20.625 16.3902 20.625 16.0001C20.625 15.6099 20.4346 15.2578 20.2164 14.9466C18.8435 13.0149 14.8171 9.4852 13.0165 7.98291L13.0152 7.98186C12.5909 7.6283 11.9604 7.68562 11.6068 8.1099Z"
				/></svg
			>
		</a>
	</div>
	<div class="card card-hero">
		<img class="hero-bg" src="/img/frame1.png" alt="" aria-hidden="true" />
		<span class="card-hero-label">configure your onekey</span>
		<a href="/onekey" class="hero-btn">
			go
			<svg
				fill-rule="evenodd"
				clip-rule="evenodd"
				stroke-linejoin="round"
				stroke-miterlimit="1.414"
				xmlns="http://www.w3.org/2000/svg"
				aria-label="right-caret"
				viewBox="0 0 32 32"
				preserveAspectRatio="xMidYMid meet"
				fill="currentColor"
				width="1em"
				height="1em"
				><path
					d="M11.6068 8.1099C11.2532 8.53417 11.3106 9.16473 11.7348 9.51829C13.3799 10.8952 17.2004 14.2798 18.5095 16.0001C17.1784 17.7493 13.4095 21.0851 11.7348 22.4819C11.3106 22.8355 11.2532 23.466 11.6068 23.8903C11.9604 24.3146 12.5913 24.3716 13.0156 24.018C14.8552 22.4864 18.8153 19.025 20.2164 17.0536C20.4346 16.7423 20.625 16.3902 20.625 16.0001C20.625 15.6099 20.4346 15.2578 20.2164 14.9466C18.8435 13.0149 14.8171 9.4852 13.0165 7.98291L13.0152 7.98186C12.5909 7.6283 11.9604 7.68562 11.6068 8.1099Z"
				/></svg
			>
		</a>
	</div>

	{#if data.timedGoal}
		<!-- Timed goal card: replaces the community goals card while a goal is set.
		     Left = current goal + description + manual progress bar; right = a
		     countdown ring. Falls back to the community card (below) when cleared. -->
		<div class="card card-full goals-card timed-card" class:expired={goalExpired}>
			<div class="goals-main">
				<div class="goals-callouts">
					<div class="goals-callout-item">
						<span class="goals-callout-label">current goal</span>
						<span class="goals-callout-value">{data.timedGoal.name}</span>
					</div>
					<div class="goals-callout-item goals-callout-right">
						<span class="goals-callout-label">progress</span>
						<span class="goals-callout-value">{Math.round(goalPct)}%</span>
					</div>
				</div>
				{#if data.timedGoal.description}
					<span class="timed-desc">{data.timedGoal.description}</span>
				{/if}
				<div class="goals-bars">
					{#each barSegments as i (i)}
						<div class="goal-seg" class:filled={((i + 1) / 20) * 100 <= goalPct}></div>
					{/each}
				</div>
				<span class="card-label-hours timed-hours">
					{data.timedGoal.currentHours} / {data.timedGoal.targetHours} hours
				</span>
			</div>
			<div class="timed-stopwatch-section">
				<span class="goals-callout-label">time remaining</span>
				<div class="ring-wrap">
					<svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
						<circle class="ring-track" cx="60" cy="60" r={RING_R} />
						<circle
							class="ring-fill"
							cx="60"
							cy="60"
							r={RING_R}
							style="stroke-dasharray: {ringCirc}; stroke-dashoffset: {ringOffset};"
						/>
					</svg>
					<div class="ring-center">
						{#if goalExpired}
							<span class="ring-time up">time's up</span>
						{:else}
							<span class="ring-time">{remainingLabel}</span>
						{/if}
					</div>
				</div>
				<span class="timed-deadline">{goalExpired ? 'ended' : 'ends'} {deadlineLabel}</span>
			</div>
		</div>
	{:else}
	<div class="card card-full goals-card">
		<div class="goals-main">
			{#if allCompleted}
				<p class="goals-complete">all goals complete! 🎉</p>
			{:else}
				<div class="goals-callouts">
					<div class="goals-callout-item">
						<span class="goals-callout-label">next community goal</span>
						<span class="goals-callout-value">{nextGoal.label}</span>
					</div>
					<div class="goals-callout-item goals-callout-right">
						<span class="goals-callout-label">progress</span>
						<span class="goals-callout-value">{Math.round(segmentProgress)}%</span>
					</div>
				</div>
				<div class="goals-bars">
					{#each barSegments as i (i)}
						<div class="goal-seg" class:filled={((i + 1) / 20) * 100 <= segmentProgress}></div>
					{/each}
				</div>
			{/if}
		</div>
		<div class="goals-milestones-section">
			<span class="card-label-hours">{communityHours} / {communityGoalHours} hours</span>
			<ul class="milestone-list">
				{#each goals as g (g.pct)}
					<li class="milestone-row" class:reached={g.pct <= communityProgress}>
						<span class="milestone-dot"></span>
						<span class="milestone-label">{g.label}</span>
						<span class="milestone-hours">{g.hours}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
	{/if}

	<!-- <div class="card">
		<span class="card-label">[section]</span>
	</div>

	<div class="card">
		<span class="card-label">[section]</span>
	</div>

	<div class="card card-wide">
		<span class="card-label">[section]</span>
	</div>

	<div class="card card-sm">
		<span class="card-label">[section]</span>
	</div> -->
</div>

<style>
	.verify-banner {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: color-mix(in srgb, #d97706 12%, var(--color-bg));
		border: solid var(--border-width) color-mix(in srgb, #d97706 50%, transparent);
		border-radius: var(--radius-card);
		padding: 0.75rem 1.1rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text);
		margin: 1rem 0;
	}

	.verify-banner svg {
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
		color: #d97706;
	}

	.verify-banner-text {
		flex: 1;
	}

	.verify-banner a {
		color: var(--color-text);
		text-underline-offset: 2px;
	}

	.verify-banner a:hover {
		opacity: 0.7;
	}

	.verify-banner-close {
		flex-shrink: 0;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text);
		font-size: 1.7rem;
		line-height: 1;
		padding: 0 0.2rem;
		opacity: 0.55;
		font-family: inherit;
	}

	.verify-banner-close:hover {
		opacity: 1;
	}

	.greeting-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		margin: -0.49rem 0 1.25rem;
	}

	.greeting-avatar {
		width: clamp(3rem, 4.5vw, 5rem);
		height: clamp(3rem, 4.5vw, 5rem);
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		border: solid var(--border-width);
	}

	.greeting {
		font-size: clamp(2rem, 2.8vw, 2.85rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0;
	}

	.slack-handle {
		font-size: 1rem;
		font-weight: 500;
		color: var(--rail-label);
		margin: 0 0;
	}

	.bento {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(0.75rem, 1.2vw, 1.75rem);
	}

	.card {
		background: var(--color-bg);
		border-radius: var(--radius-card);
		border: solid var(--border-width);
		padding: clamp(1rem, 1.5vw, 1.75rem) clamp(1.1rem, 1.5vw, 1.75rem);
		min-height: clamp(6.5rem, 9vh, 12rem);
		box-sizing: border-box;
	}

	/* .card.card-wide { grid-column: span 2; }
	.card.card-sm { min-height: clamp(4rem, 6vh, 8rem); } */

	.card.card-full {
		grid-column: span 3;
	}

	.card.card-hero {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: clamp(1.5rem, 2.5vw, 3rem);
		padding-bottom: clamp(1.5rem, 2.5vw, 3rem);
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		right: -25%;
		top: 62.5%;
		transform: translateY(-50%) scaleX(-1);
		height: 120%;
		aspect-ratio: 35 / 30;
		object-fit: fill;
		opacity: 0.55;
		filter: blur(3.5px);
		z-index: 0;
		pointer-events: none;
		user-select: none;
	}

	.hero-bg-left {
		right: auto;
		left: -25%;
		transform: translateY(-50%);
		filter: blur(2.5px);
	}

	.card.card-hero-right {
		text-align: right;
	}

	.card.card-hero-right .hero-btn {
		align-self: flex-end;
	}

	.card-hero-label,
	.hero-btn {
		position: relative;
		z-index: 1;
	}

	.card-hero-label {
		font-size: clamp(2.2rem, 4.2vw, 5.5rem);
		font-weight: bold;
		letter-spacing: -0.04em;
		line-height: 0.92;
	}

	.hero-btn {
		align-self: flex-start;
		display: flex;
		align-items: center;
		gap: 0.15em;
		text-decoration: none;
		background: var(--color-text);
		color: var(--color-bg);
		font-weight: bold;
		border: none;
		border-radius: var(--radius-pill);
		padding: 0.76rem 1.2rem 0.76rem 1.7rem;
		font-size: clamp(1.2rem, 1.6vw, 1.8rem);
	}

	.hero-btn svg {
		transition: transform var(--transition-fast);
	}

	.hero-btn:hover svg {
		transform: translateX(0.1em);
	}

	.goals-card {
		display: flex;
		flex-direction: row;
		gap: clamp(1rem, 2vw, 2rem);
		min-height: clamp(11rem, 16vh, 22rem);
	}

	.goals-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.goals-milestones-section {
		width: clamp(12rem, 30%, 22rem);
		flex-shrink: 0;
		position: relative;
		padding-left: clamp(1rem, 2vw, 2rem);
	}

	.goals-milestones-section::before {
		content: '';
		position: absolute;
		left: 0;
		top: calc(-1 * clamp(1rem, 1.5vw, 1.75rem));
		bottom: calc(-1 * clamp(1rem, 1.5vw, 1.75rem));
		width: 0.15rem;
		background: rgba(0, 0, 0, 0.15);
		border-radius: 9999px;
	}

	.milestone-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.milestone-row {
		display: grid;
		grid-template-columns: 0.6rem 1fr auto;
		align-items: center;
		gap: 0.6rem;
		color: var(--rail-label);
	}

	.milestone-row.reached {
		color: var(--color-text);
	}

	.milestone-dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		border: 1.5px solid currentColor;
		flex-shrink: 0;
	}

	.milestone-row.reached .milestone-dot {
		background: currentColor;
	}

	.milestone-label {
		font-size: 0.75rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.milestone-hours {
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		white-space: nowrap;
	}

	.goals-callouts {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.goals-callout-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.goals-callout-right {
		text-align: right;
	}

	.goals-callout-label {
		font-size: clamp(0.8rem, 0.95vw, 1.05rem);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-soft);
	}

	.goals-callout-value {
		font-size: clamp(1.3rem, 1.9vw, 2.1rem);
		font-weight: bold;
		letter-spacing: -0.02em;
	}

	.goals-bars {
		display: flex;
		gap: 0.3rem;
		margin-top: auto;
		margin-bottom: auto;
	}

	.goal-seg {
		flex: 1;
		height: 4rem;
		border-radius: 5px;
		background: #d4d4d4;
	}

	.goal-seg.filled {
		background: var(--color-text);
	}

	/* --- timed goal card --- */
	.timed-card.expired {
		opacity: 0.55;
		filter: grayscale(0.5);
	}

	.timed-desc {
		display: block;
		font-size: clamp(0.8rem, 0.95vw, 1.05rem);
		font-weight: 500;
		color: var(--color-text-soft);
		margin-top: 0.4rem;
		max-width: none;
	}

	.timed-hours {
		margin-top: 1rem;
		margin-bottom: 0;
	}

	.timed-stopwatch-section {
		width: clamp(12rem, 30%, 22rem);
		flex-shrink: 0;
		position: relative;
		padding-left: clamp(1rem, 2vw, 2rem);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.timed-stopwatch-section::before {
		content: '';
		position: absolute;
		left: 0;
		top: calc(-1 * clamp(1rem, 1.5vw, 1.75rem));
		bottom: calc(-1 * clamp(1rem, 1.5vw, 1.75rem));
		width: 0.15rem;
		background: color-mix(in srgb, var(--color-text) 15%, transparent);
		border-radius: 9999px;
	}

	.ring-wrap {
		position: relative;
		width: clamp(7rem, 12vw, 11rem);
		aspect-ratio: 1;
	}

	.ring {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}

	.ring-track {
		fill: none;
		stroke: color-mix(in srgb, var(--color-text) 15%, transparent);
		stroke-width: 8;
	}

	.ring-fill {
		fill: none;
		stroke: var(--color-text);
		stroke-width: 8;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.5s linear;
	}

	.ring-center {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 0 0.5rem;
	}

	.ring-time {
		font-size: clamp(1.1rem, 1.7vw, 1.9rem);
		font-weight: bold;
		letter-spacing: -0.02em;
	}

	.ring-time.up {
		font-size: clamp(0.9rem, 1.3vw, 1.35rem);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-soft);
	}

	.timed-deadline {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: bold;
		color: var(--rail-label);
	}

	.goals-complete {
		font-size: clamp(2.5rem, 4vw, 5rem);
		font-weight: bold;
		letter-spacing: -0.02em;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0;
	}

	.card-started {
		display: flex;
		flex-direction: column;
	}

	.started-title {
		font-size: clamp(1.05rem, 1.35vw, 1.55rem);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-soft);
	}

	.started-list {
		list-style: none;
		margin-top: 0.8rem;
		margin-bottom: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1rem;
		flex: 1;
	}

	.started-item {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		font-size: clamp(1.05rem, 1.5vw, 1.75rem);
		font-weight: 500;
		color: var(--color-text);
	}

	.started-item > span:nth-child(2) {
		flex: 1;
	}

	.started-item.done {
		color: var(--rail-label);
		text-decoration: line-through;
	}

	.started-action {
		font-size: 0.7em;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		flex-shrink: 0;
	}

	span.started-action {
		text-decoration: none;
		color: var(--rail-label);
	}

	.started-check {
		width: 0.85rem;
		height: 0.85rem;
		border-radius: 5px;
		border: 0.08em solid currentColor;
		flex-shrink: 0;
		transform: translateY(0.1em);
	}

	.started-item.done .started-check {
		background: var(--rail-label);
		border-color: var(--rail-label);
	}

	.card-label-hours {
		display: block;
		font-size: clamp(0.95rem, 1.1vw, 1.3rem);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--color-text-soft);
		margin-bottom: 1.25rem;
		font-weight: bold;
	}

	@media (max-width: 767px) {
		.greeting {
			font-size: 1.8rem;
		}

		.greeting-avatar {
			width: 2.5rem;
			height: 2.5rem;
		}

		.bento {
			grid-template-columns: 1fr;
		}

		.card.card-full {
			grid-column: span 1;
		}

		.goals-card {
			flex-direction: column;
		}

		.goals-milestones-section,
		.timed-stopwatch-section {
			width: 100%;
			padding-left: 0;
			padding-top: clamp(1rem, 2vw, 2rem);
		}

		.goals-milestones-section::before,
		.timed-stopwatch-section::before {
			left: calc(-1 * clamp(1rem, 1.5vw, 1.75rem));
			right: calc(-1 * clamp(1rem, 1.5vw, 1.75rem));
			top: 0;
			bottom: auto;
			width: auto;
			height: 0.15rem;
		}

		.card-hero-label {
			font-size: 2rem;
		}

		.goals-callout-value {
			font-size: 1.4rem;
		}

		.goals-callouts {
			margin-bottom: 1.25rem;
		}

		.goal-seg {
			height: 2.5rem;
		}
	}
</style>
