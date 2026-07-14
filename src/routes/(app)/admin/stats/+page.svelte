<script lang="ts">
	import { formatHours } from '$lib/format';
	let { data } = $props();

	const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

	const funnelTop = $derived(data.funnel[0]?.n ?? 0);
</script>

<div class="admin-stats">
	<div class="header">
		<a href="/admin" class="back">← admin</a>
		<h1>stats</h1>
		<p class="sub">a live snapshot of platform activity. numbers update on every page load.</p>
	</div>

	<section>
		<h2>users</h2>
		<div class="grid">
			<div class="stat">
				<span class="stat-value">{data.users.total}</span>
				<span class="stat-label">registered users</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.users.onboarded}</span>
				<span class="stat-label">onboarded <em>({pct(data.users.onboarded, data.users.total)}%)</em></span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.users.hackatimeLinked}</span>
				<span class="stat-label">hackatime linked <em>({pct(data.users.hackatimeLinked, data.users.total)}%)</em></span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.users.yswsEligible}</span>
				<span class="stat-label">ysws eligible</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.users.prizeClaimed}</span>
				<span class="stat-label">claimed unverified prize</span>
			</div>
		</div>
		<div class="breakdown">
			<span class="breakdown-title">by verification status</span>
			<div class="pills">
				{#each data.users.byVerification as row (row.status)}
					<span class="pill"><strong>{row.n}</strong> {row.status}</span>
				{/each}
			</div>
		</div>
	</section>

	<section>
		<h2>projects</h2>
		<div class="grid">
			<div class="stat">
				<span class="stat-value">{data.projects.total}</span>
				<span class="stat-label">projects created</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.projects.creators}</span>
				<span class="stat-label">users with ≥1 project</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.projects.withHackatime}</span>
				<span class="stat-label">projects with hackatime <em>({pct(data.projects.withHackatime, data.projects.total)}%)</em></span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.projects.creatorsWithHackatime}</span>
				<span class="stat-label">users who linked hackatime</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.projects.avgPerCreator.toFixed(1)}</span>
				<span class="stat-label">avg projects / creator</span>
			</div>
		</div>
	</section>

	<section>
		<h2>reviews</h2>
		<div class="grid">
			<div class="stat">
				<span class="stat-value">{data.reviews.pending}</span>
				<span class="stat-label">awaiting review</span>
			</div>
			<div class="stat">
				<span class="stat-value">{formatHours(data.reviews.pendingSeconds)}</span>
				<span class="stat-label">hours pending review</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.reviews.approvedCount}</span>
				<span class="stat-label">approved submissions</span>
			</div>
			<div class="stat">
				<span class="stat-value">{formatHours(data.reviews.totalApprovedSeconds)}</span>
				<span class="stat-label">total approved hours</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.reviews.totalWeightedProjects.toFixed(1)}</span>
				<span class="stat-label">weighted projects</span>
			</div>
		</div>
		<div class="breakdown">
			<span class="breakdown-title">submissions by status</span>
			<div class="pills">
				{#each data.reviews.byStatus as row (row.status)}
					<span class="pill"><strong>{row.n}</strong> {row.status}</span>
				{/each}
			</div>
		</div>
	</section>

	<section>
		<h2>orders</h2>
		<div class="grid">
			<div class="stat">
				<span class="stat-value">{data.orders.total}</span>
				<span class="stat-label">total orders</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.orders.outstanding}</span>
				<span class="stat-label">outstanding (unfulfilled)</span>
			</div>
			<div class="stat">
				<span class="stat-value">{formatHours(data.orders.spentSeconds)}</span>
				<span class="stat-label">tokens spent (excl. refunds)</span>
			</div>
		</div>
		<div class="breakdown">
			<span class="breakdown-title">orders by status</span>
			<div class="pills">
				{#each data.orders.byStatus as row (row.status)}
					<span class="pill"><strong>{row.n}</strong> {row.status}</span>
				{/each}
			</div>
		</div>
	</section>

	<section>
		<h2>submission funnel</h2>
		<p class="sub">share of registered users reaching each stage, with drop-off between steps.</p>
		<div class="funnel">
			{#each data.funnel as step, i (step.label)}
				<div class="funnel-row">
					<div class="funnel-meta">
						<span class="funnel-label">{step.label}</span>
						<span class="funnel-num">
							{step.n}
							<em>({pct(step.n, funnelTop)}% of users)</em>
							{#if i > 0}
								<span class="funnel-step" class:drop={step.n < data.funnel[i - 1].n}>
									{pct(step.n, data.funnel[i - 1].n)}% of prev
								</span>
							{/if}
						</span>
					</div>
					<div class="funnel-bar-track">
						<div class="funnel-bar" style="width: {pct(step.n, funnelTop)}%"></div>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.admin-stats {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.back {
		font-size: 0.85rem;
		color: #8a8f99;
		text-decoration: none;
		margin-bottom: 0.25rem;
		display: inline-block;
	}

	.back:hover {
		color: #fff;
	}

	h1 {
		font-size: clamp(1.6rem, 3vw, 2.4rem);
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.sub {
		font-size: 0.9rem;
		color: #8a8f99;
		margin: 0;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h2 {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #8a8f99;
		font-weight: 700;
		margin: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.85rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1.1rem 1.25rem;
		border: 1px solid #2a2f38;
		border-radius: 10px;
		background: #0d0f12;
	}

	.stat-value {
		font-size: 1.8rem;
		font-weight: 700;
		line-height: 1;
		color: #e8eaf0;
		letter-spacing: -0.02em;
	}

	.stat-label {
		font-size: 0.82rem;
		color: #8a8f99;
	}

	.stat-label em {
		font-style: normal;
		color: #60a5fa;
	}

	.breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.breakdown-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #8a8f99;
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.pill {
		font-size: 0.82rem;
		padding: 0.3rem 0.7rem;
		border-radius: 9999px;
		background: #1c2027;
		color: #c9ced8;
		border: 1px solid #2a2f38;
	}

	.pill strong {
		color: #e8eaf0;
	}

	.funnel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.funnel-row {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.funnel-meta {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.funnel-label {
		font-size: 0.9rem;
		color: #cdd0d6;
		font-weight: 600;
	}

	.funnel-num {
		font-size: 0.85rem;
		color: #e8eaf0;
		font-weight: 600;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.funnel-num em {
		font-style: normal;
		font-weight: 400;
		color: #8a8f99;
	}

	.funnel-step {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.1rem 0.45rem;
		border-radius: 9999px;
		background: color-mix(in srgb, #22c55e 15%, transparent);
		color: #22c55e;
	}

	.funnel-step.drop {
		background: color-mix(in srgb, #f59e0b 15%, transparent);
		color: #f59e0b;
	}

	.funnel-bar-track {
		height: 10px;
		border-radius: 9999px;
		background: #1c2027;
		overflow: hidden;
	}

	.funnel-bar {
		height: 100%;
		border-radius: 9999px;
		background: linear-gradient(90deg, #60a5fa, #a78bfa);
		min-width: 2px;
		transition: width 0.3s;
	}
</style>
