<script lang="ts">
	import { formatHours } from '$lib/format';
	let { data } = $props();

	const top = $derived(data.items[0]?.total ?? 0);
	const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
</script>

<div class="shop-stats">
	<div class="header">
		<a href="/admin" class="back">← admin</a>
		<h1>shop statistics</h1>
		<p class="sub">most-ordered items, counting fulfilled orders and those still in the fulfillment queue. refunded orders are excluded.</p>
	</div>

	<section>
		<div class="grid">
			<div class="stat">
				<span class="stat-value">{data.totals.orders}</span>
				<span class="stat-label">orders (excl. refunds)</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.totals.fulfilled}</span>
				<span class="stat-label">fulfilled</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.totals.inQueue}</span>
				<span class="stat-label">in fulfillment queue</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.totals.distinctItems}</span>
				<span class="stat-label">distinct items ordered</span>
			</div>
			<div class="stat">
				<span class="stat-value">{formatHours(data.totals.spentSeconds)}</span>
				<span class="stat-label">tokens spent</span>
			</div>
		</div>
		{#if data.categories.length > 0}
			<div class="breakdown">
				<span class="breakdown-title">orders by category</span>
				<div class="pills">
					{#each data.categories as row (row.name)}
						<span class="pill"><strong>{row.n}</strong> {row.name}</span>
					{/each}
				</div>
			</div>
		{/if}
	</section>

	<section>
		<h2>most ordered items</h2>
		{#if data.items.length === 0}
			<p class="sub">no orders yet.</p>
		{:else}
			<ol class="items">
				{#each data.items as item, i (item.itemId)}
					<li class="item">
						<span class="rank">#{i + 1}</span>
						{#if item.imageUrl}
							<img src={item.imageUrl} alt="" class="thumb" />
						{:else}
							<div class="thumb placeholder"></div>
						{/if}
						<div class="item-body">
							<div class="item-meta">
								<span class="item-name">
									{item.name}
									{#if !item.available}<span class="tag">unavailable</span>{/if}
								</span>
								<span class="item-count">
									{item.total}
									<em>({pct(item.total, data.totals.orders)}% of orders)</em>
								</span>
							</div>
							<div class="bar-track">
								<div class="bar" style="width: {pct(item.total, top)}%"></div>
							</div>
							<div class="item-sub">
								<span>{item.category}</span>
								<span>{item.fulfilled} fulfilled · {item.inQueue} in queue</span>
								<span>{formatHours(item.spentSeconds)} spent</span>
							</div>
							{#if item.options.length > 0}
								<div class="pills">
									{#each item.options as opt (opt.label)}
										<span class="pill small"><strong>{opt.n}</strong> {opt.label}</span>
									{/each}
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
</div>

<style>
	.shop-stats {
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

	.pill.small {
		font-size: 0.75rem;
		padding: 0.2rem 0.6rem;
	}

	.pill strong {
		color: #e8eaf0;
	}

	.items {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.item {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border: 1px solid #2a2f38;
		border-radius: 10px;
		background: #0d0f12;
	}

	.rank {
		font-size: 0.9rem;
		font-weight: 700;
		color: #8a8f99;
		min-width: 2.2rem;
		padding-top: 0.6rem;
	}

	.thumb {
		width: 52px;
		height: 52px;
		border-radius: 8px;
		object-fit: contain;
		background: #1c2027;
		flex-shrink: 0;
	}

	.item-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.item-meta {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.item-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: #e8eaf0;
	}

	.tag {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.1rem 0.45rem;
		margin-left: 0.4rem;
		border-radius: 9999px;
		background: color-mix(in srgb, #f59e0b 15%, transparent);
		color: #f59e0b;
	}

	.item-count {
		font-size: 0.95rem;
		font-weight: 700;
		color: #e8eaf0;
	}

	.item-count em {
		font-style: normal;
		font-weight: 400;
		font-size: 0.8rem;
		color: #8a8f99;
	}

	.bar-track {
		height: 8px;
		border-radius: 9999px;
		background: #1c2027;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		border-radius: 9999px;
		background: linear-gradient(90deg, #60a5fa, #a78bfa);
		min-width: 2px;
	}

	.item-sub {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		font-size: 0.8rem;
		color: #8a8f99;
	}
</style>
