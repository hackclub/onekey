<script lang="ts">
	import { formatHours } from '$lib/format';

	let { data } = $props();

	const statusDot: Record<string, string> = {
		ordered: '#6b7280',
		packed: '#f59e0b',
		shipped: '#3b82f6',
		delivered: '#22c55e',
		refunded: '#ef4444'
	};

	function parseOptions(json: string): Record<string, string> {
		try { return JSON.parse(json); } catch { return {}; }
	}
</script>

<svelte:head>
	<title>onekey - your orders</title>
</svelte:head>

<div class="orders-page">
	<div class="page-header">
		<h1>your orders</h1>
		<a href="/shop" class="back-link">← shop</a>
	</div>

	{#if data.orders.length === 0}
		<div class="empty-state">
			<p>no orders yet. <a href="/shop">browse the shop →</a></p>
		</div>
	{:else}
		<div class="order-list">
			{#each data.orders as order (order.id)}
				{@const opts = parseOptions(order.selectedOptions)}
				{@const optEntries = Object.entries(opts)}
				<div class="order-card">
					<div class="order-left">
						{#if order.itemImageUrl}
							<img src={order.itemImageUrl} alt={order.itemName} class="order-thumb" />
						{/if}
						<div class="order-main">
							<span class="order-item">{order.itemName}</span>
							{#if optEntries.length > 0}
								<div class="opt-tags">
									{#each optEntries as [label, value]}
										<span class="opt-tag"><span class="opt-label">{label}:</span> {value}</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>
					<div class="order-meta">
						<span class="order-id">#{order.id}</span>
						<span class="order-price">{formatHours(order.priceSeconds)}</span>
						<span class="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
						<span class="status-badge">
							<span class="status-dot" style="background: {statusDot[order.status] ?? '#6b7280'}"></span>
							{order.status}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.orders-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.page-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.back-link {
		font-size: 0.9rem;
		font-weight: bold;
		color: var(--color-text);
		text-decoration: none;
		border-radius: var(--radius-pill);
		border: solid var(--border-width);
		padding: 0.4rem 1rem;
		transition: border-style 0.1s;
	}
	.back-link:hover { border-style: dotted; }

	h1 {
		font-size: clamp(2.5rem, 3.5vw, 3.5rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0;
	}

	.empty-state {
		color: var(--color-text-soft);
		font-size: 1.05rem;
	}

	.empty-state a {
		color: var(--color-text);
	}

	.order-list {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.2vw, 1.25rem);
	}

	.order-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.25rem;
		padding: clamp(1rem, 1.5vw, 1.5rem);
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		background: var(--color-bg);
		flex-wrap: wrap;
		transition: border-color 0.15s;
	}

	.order-card:hover {
		border-color: var(--color-text);
	}

	.order-left {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		min-width: 0;
	}

	.order-main {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	.order-item {
		font-weight: bold;
		font-size: 1.4rem;
		letter-spacing: -0.01em;
	}

	.order-thumb {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: calc(var(--radius-card) / 2);
		flex-shrink: 0;
		border: solid calc(var(--border-width) / 2);
	}

	.opt-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.25rem;
	}

	.opt-tag {
		font-size: 0.82rem;
		padding: 0.15rem 0.5rem;
		background: var(--color-bg-soft);
		border: solid calc(var(--border-width) / 2);
		border-radius: calc(var(--radius-card) / 2);
		color: var(--color-text-soft);
	}

	.opt-label {
		opacity: 0.6;
	}

	.order-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		flex-shrink: 0;
	}

	.order-id {
		font-size: 0.8rem;
		color: var(--color-text-soft);
		opacity: 0.5;
		font-family: monospace;
	}

	.order-price {
		font-size: 1.1rem;
		font-weight: bold;
		letter-spacing: -0.02em;
		color: var(--color-text-soft);
	}

	.order-date {
		font-size: 0.9rem;
		color: var(--color-text-soft);
	}

	.status-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: lowercase;
		padding: 0.25rem 0.7rem;
		border: solid calc(var(--border-width) / 2);
		border-radius: var(--radius-pill);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
