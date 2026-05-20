<script lang="ts">
	let { data } = $props();

	const personalHours = 47.6;
	const communityGoalHours = 2000;
	let communityHours = $state(670);
	const communityProgress = $derived((communityHours / communityGoalHours) * 100);
	const goals = [
		{ pct: 5, label: "decide max's pfp", hours: '100 hours' },
		{ pct: 12.5, label: 'i want to cheese', hours: '250 hours' },
		{ pct: 25, label: "dye max's hair", hours: '500 hours' },
		{ pct: 37.5, label: "bleach [redacted]'s hair", hours: '750 hours' },
		{ pct: 50, label: "dye jenin's hair", hours: '1000 hours' },
		{ pct: 75, label: 'tiktok dance', hours: '1500 hours' },
		{ pct: 100, label: 'catmaid for a day', hours: '2000 hours' }
	];

	const barSegments = Array.from({ length: 20 }, (_, i) => i);
	const allCompleted = $derived(communityProgress >= 100);
	const prevGoal = $derived(
		goals.findLast((g) => g.pct <= communityProgress) ?? {
			pct: 0,
			label: 'start',
			hours: '0 hours'
		}
	);
	const nextGoal = $derived(
		goals.find((g) => g.pct > communityProgress) ?? goals[goals.length - 1]
	);
	const segmentProgress = $derived(
		allCompleted ? 100 : ((communityProgress - prevGoal.pct) / (nextGoal.pct - prevGoal.pct)) * 100
	);
</script>

<svelte:head>
	<title>onekey - home</title>
</svelte:head>

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

<div class="bento">
	<div class="card card-started">
		<span class="started-title">get started</span>
		<ul class="started-list">
			<li class="started-item done">
				<span class="started-check"></span>
				<span>join onekey</span>
				<span class="started-action">joined!</span>
			</li>
			<li class="started-item">
				<span class="started-check"></span>
				<span>create a project</span>
				<a href="/projects" class="started-action">go</a>
			</li>
			<li class="started-item">
				<span class="started-check"></span>
				<span>fortnite</span>
				<a href="/fortnite" class="started-action">go</a>
			</li>
			<li class="started-item">
				<span class="started-check"></span>
				<span>skibidi</span>
				<a href="/skibidi" class="started-action">go</a>
			</li>
		</ul>
	</div>
	<div class="card">
		<span class="card-label">[section]</span>
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
	.greeting-row {
		display: flex;
		align-items: flex-end;
		gap: 0.85rem;
		margin: 1rem 0 1.25rem;
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
		font-size: clamp(2.5rem, 3.5vw, 3.5rem);
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
		min-height: clamp(8rem, 12vh, 16rem);
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
		background: black;
		color: white;
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

	.card-hours {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.hours-label {
		font-size: clamp(1.5rem, 3vw, 4rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.hours-value {
		font-size: clamp(4rem, 9vw, 10rem);
		font-weight: 500;
		letter-spacing: -0.04em;
		line-height: 0.9;
	}

	.hours-unit {
		margin-left: 0.05em;
		font-size: 0.85em;
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
		background: black;
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
		font-size: clamp(1.2rem, 1.6vw, 1.85rem);
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
</style>
