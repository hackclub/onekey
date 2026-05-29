<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatHours } from '$lib/format';

	let { data, form } = $props();

	let search = $state('');
	const filteredOrders = $derived(
		search.trim() === ''
			? data.orders
			: data.orders.filter(o => String(o.id).includes(search.trim()))
	);

	const STATUSES = ['ordered', 'packed', 'shipped', 'delivered'];

	const statusDot: Record<string, string> = {
		ordered: '#6b7280',
		packed: '#f59e0b',
		shipped: '#3b82f6',
		delivered: '#22c55e',
		refunded: '#ef4444'
	};

	function formatAddress(order: typeof data.orders[number]) {
		const parts = [order.userStreet, order.userLocality, order.userRegion, order.userPostal, order.userCountry];
		return parts.filter(Boolean).join(', ') || null;
	}

	function parseOptions(json: string): Record<string, string> {
		try { return JSON.parse(json); } catch { return {}; }
	}
</script>

<svelte:head>
	<title>onekey - admin: orders</title>
</svelte:head>

<div class="admin-orders">
	<div class="page-header">
		<a href="/admin" class="back-link">← admin</a>
		<h1>orders</h1>
		<p class="sub">oldest first — fulfill in order shown.</p>
		<input
			type="text"
			class="search-input"
			placeholder="search by order id…"
			bind:value={search}
		/>
	</div>

	{#if form?.error}
		<p class="form-error">{form.error}</p>
	{/if}

	{#if filteredOrders.length === 0}
		<p class="empty">{data.orders.length === 0 ? 'no orders yet.' : 'no orders match that id.'}</p>
	{:else}
		<div class="order-list">
			{#each filteredOrders as order (order.id)}
				{@const opts = parseOptions(order.selectedOptions)}
				{@const optEntries = Object.entries(opts)}
				{@const address = formatAddress(order)}
				{@const isRefunded = order.status === 'refunded'}
				<div class="order-row" class:refunded={isRefunded}>
					<div class="user-info">
						{#if order.userAvatar}
							<img src={order.userAvatar} alt="avatar" class="avatar" />
						{:else}
							<div class="avatar avatar-placeholder"></div>
						{/if}
						<div class="user-details">
							<span class="username">@{order.userName ?? order.userNickname ?? 'unknown'}</span>
							{#if address}
								<span class="address">{address}</span>
							{:else}
								<span class="address no-address">no address on file</span>
							{/if}
						</div>
					</div>

					<div class="item-info">
						<span class="item-name">{order.itemName}</span>
						<span class="item-cat">{order.categoryName}</span>
						{#if optEntries.length > 0}
							<div class="opt-tags">
								{#each optEntries as [label, value]}
									<span class="opt-tag"><span class="opt-label">{label}:</span> {value}</span>
								{/each}
							</div>
						{/if}
					</div>

					<div class="order-meta">
						<span class="price">{formatHours(order.priceSeconds)}</span>
						<span class="date">{new Date(order.createdAt).toLocaleDateString()}</span>
						<span class="order-id">#{order.id}</span>
					</div>

					<div class="order-actions">
						{#if !isRefunded}
							<form method="POST" action="?/updateStatus" use:enhance class="status-form">
								<input type="hidden" name="order_id" value={order.id} />
								<span class="status-dot-inline" style="background: {statusDot[order.status] ?? '#6b7280'}"></span>
								<select name="status" class="status-select">
									{#each STATUSES as s}
										<option value={s} selected={s === order.status}>{s}</option>
									{/each}
								</select>
								<button type="submit" class="btn-update">update</button>
							</form>
							<form method="POST" action="?/refund" use:enhance class="refund-form">
								<input type="hidden" name="order_id" value={order.id} />
								<button
									type="submit"
									class="btn-refund"
									onclick={(e) => { if (!confirm('refund this order? the user\'s hours will be restored.')) e.preventDefault(); }}
								>refund</button>
							</form>
						{:else}
							<span class="refunded-badge">
								<span class="status-dot-inline" style="background: {statusDot.refunded}"></span>
								refunded
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.admin-orders {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.back-link {
		font-size: 0.85rem;
		color: var(--color-text-soft);
		text-decoration: none;
	}
	.back-link:hover { color: var(--color-text); }

	h1 {
		font-size: clamp(1.4rem, 2.5vw, 2rem);
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.sub {
		font-size: 0.85rem;
		color: var(--color-text-soft);
		margin: 0;
	}

	.search-input {
		margin-top: 0.5rem;
		background: var(--color-bg-soft);
		border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
		border-radius: 6px;
		padding: 0.35rem 0.65rem;
		color: var(--color-text);
		font-size: 0.82rem;
		font-family: inherit;
		width: 180px;
	}

	.search-input:focus {
		outline: none;
		border-color: color-mix(in srgb, var(--color-text) 40%, transparent);
	}

	.search-input::placeholder {
		color: var(--color-text-soft);
		opacity: 0.5;
	}

	.form-error {
		color: #ff6b6b;
		font-size: 0.9rem;
		margin: 0;
	}

	.empty {
		color: var(--color-text-soft);
		font-size: 0.9rem;
	}

	.order-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.order-row {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.85rem 1rem;
		border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
		border-radius: 8px;
		flex-wrap: wrap;
	}

	.order-row.refunded {
		opacity: 0.5;
		border-style: dashed;
	}

	.user-info {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		min-width: 160px;
	}

	.avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.avatar-placeholder {
		background: color-mix(in srgb, var(--color-text) 20%, transparent);
	}

	.user-details {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.username {
		font-size: 0.85rem;
		color: var(--color-text);
		font-weight: 500;
	}

	.address {
		font-size: 0.73rem;
		color: var(--color-text-soft);
		line-height: 1.3;
		max-width: 180px;
	}

	.no-address {
		color: var(--color-text-soft);
		opacity: 0.4;
		font-style: italic;
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		flex: 1;
		min-width: 120px;
	}

	.item-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.item-cat {
		font-size: 0.75rem;
		color: var(--color-text-soft);
		opacity: 0.7;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.opt-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-top: 0.25rem;
	}

	.opt-tag {
		font-size: 0.73rem;
		padding: 0.1rem 0.4rem;
		background: var(--color-bg-soft);
		border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
		border-radius: 4px;
		color: var(--color-text-soft);
	}

	.opt-label {
		opacity: 0.6;
	}

	.order-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.price {
		font-size: 0.82rem;
		font-weight: 600;
		padding: 0.15rem 0.4rem;
		background: var(--color-bg-soft);
		border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
		border-radius: 4px;
		color: var(--color-text);
	}

	.date {
		font-size: 0.8rem;
		color: var(--color-text-soft);
		white-space: nowrap;
	}

	.order-id {
		font-size: 0.75rem;
		color: var(--color-text-soft);
		opacity: 0.4;
		font-family: monospace;
	}

	.order-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
		flex-wrap: wrap;
	}

	.status-form {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.refund-form {
		display: contents;
	}

	.status-dot-inline {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-select {
		background: var(--color-bg-soft);
		border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
		border-radius: 5px;
		padding: 0.3rem 0.5rem;
		color: var(--color-text);
		font-size: 0.8rem;
		font-family: inherit;
		cursor: pointer;
	}

	.status-select:focus {
		outline: none;
		border-color: color-mix(in srgb, var(--color-text) 40%, transparent);
	}

	.btn-update {
		font-size: 0.78rem;
		padding: 0.3rem 0.6rem;
		border-radius: 5px;
		border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
		background: var(--color-bg-soft);
		color: var(--color-text);
		cursor: pointer;
		font-family: inherit;
		white-space: nowrap;
	}

	.btn-update:hover {
		border-color: color-mix(in srgb, var(--color-text) 40%, transparent);
	}

	.btn-refund {
		font-size: 0.78rem;
		padding: 0.3rem 0.6rem;
		border-radius: 5px;
		border: 1px solid color-mix(in srgb, #ef4444 35%, transparent);
		background: color-mix(in srgb, #ef4444 15%, var(--color-bg));
		color: #ef4444;
		cursor: pointer;
		font-family: inherit;
		white-space: nowrap;
	}

	.btn-refund:hover {
		background: color-mix(in srgb, #ef4444 25%, var(--color-bg));
	}

	.refunded-badge {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--color-text-soft);
	}
</style>
