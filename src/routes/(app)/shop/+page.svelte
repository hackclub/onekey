<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatHours } from '$lib/format';

	let { data, form } = $props();

	type Item = typeof data.categories[number]['items'][number];
	type Choice = { name: string; imageUrl?: string };
	type ItemOption = { label: string; choices: Choice[] };

	let modalItem = $state<Item | null>(null);
	let modalOptions = $state<ItemOption[]>([]);
	let modalClosing = $state(false);
	let displayedImageUrl = $state<string | null>(null);
	const CLOSE_MS = 160;

	function openModal(item: Item) {
		try {
			const raw = JSON.parse(item.options) as Array<{
				label: string;
				choices: Array<string | { name: string; imageUrl?: string }>;
			}>;
			modalOptions = raw.map((o) => ({
				label: o.label,
				choices: o.choices.map((c) => (typeof c === 'string' ? { name: c } : c))
			}));
		} catch {
			modalOptions = [];
		}
		// Preload all variant images so swaps are instant
		for (const opt of modalOptions) {
			for (const choice of opt.choices) {
				if (choice.imageUrl) {
					const img = new Image();
					img.src = choice.imageUrl;
				}
			}
		}
		displayedImageUrl = null;
		modalItem = item;
		modalClosing = false;
	}

	function handleChoiceChange(label: string, choiceName: string) {
		const grp = modalOptions.find((g) => g.label === label);
		const choice = grp?.choices.find((c) => c.name === choiceName);
		if (choice?.imageUrl) displayedImageUrl = choice.imageUrl;
	}

	function closeModal() {
		if (modalClosing) return;
		modalClosing = true;
		setTimeout(() => { modalItem = null; modalClosing = false; }, CLOSE_MS);
	}

	const clockSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor" stroke="currentColor" stroke-width="1.5" paint-order="stroke fill"><path d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"/><path d="M15.64 17a1 1 0 0 1-1-1V9a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1z"/><path d="M21.702 19.502a1 1 0 0 1-1.366.366l-5.196-3a1 1 0 0 1 1-1.732l5.196 3a1 1 0 0 1 .366 1.366z"/></svg>`;
	const caretSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="down-caret" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M 0.359841 9.01822C 0.784113 9.37178 1.41467 9.31446 1.76823 8.8902C 3.14518 7.2451 6.52975 3.42464 8.25002 2.11557C 9.99919 3.44663 13.335 7.21555 14.7318 8.8902C 15.0854 9.31446 15.7159 9.37178 16.1402 9.01822C 16.5645 8.66466 16.6215 8.03371 16.2679 7.60943C 14.7363 5.76983 11.2749 1.80977 9.30351 0.408618C 8.99227 0.190441 8.64018 0 8.25002 0C 7.85987 0 7.50778 0.190441 7.19654 0.408618C 5.26486 1.78153 1.73514 5.80788 0.232849 7.60856L 0.231804 7.60982C -0.12176 8.03409 -0.0644362 8.66466 0.359841 9.01822Z" transform="translate(7.12506 20.6251)scale(1 -1)"/></svg>`;
</script>


<svelte:window onkeydown={(e) => e.key === 'Escape' && modalItem && closeModal()} />

<div class="page-header">
	<div class="heading-row">
		<h1 class="heading">shop</h1>
		<span class="balance-display">
			<span class="balance-icon">{@html clockSvg}</span>
			{formatHours(data.availableSeconds)}
		</span>
	</div>
	<a href="/shop/orders" class="orders-btn bordered">your orders <svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor" class="btn-icon"><path d="M11.6068 8.1099C11.2532 8.53417 11.3106 9.16473 11.7348 9.51829C13.3799 10.8952 17.2004 14.2798 18.5095 16.0001C17.1784 17.7493 13.4095 21.0851 11.7348 22.4819C11.3106 22.8355 11.2532 23.466 11.6068 23.8903C11.9604 24.3146 12.5913 24.3716 13.0156 24.018C14.8552 22.4864 18.8153 19.025 20.2164 17.0536C20.4346 16.7423 20.625 16.3902 20.625 16.0001C20.625 15.6099 20.4346 15.2578 20.2164 14.9466C18.8435 13.0149 14.8171 9.4852 13.0165 7.98291L13.0152 7.98186C12.5909 7.6283 11.9604 7.68562 11.6068 8.1099Z"/></svg></a>
</div>

{#if form?.error}
	<p class="form-error">{form.error}</p>
{/if}
{#if form?.success}
	<p class="form-success">order placed!</p>
{/if}

{#if data.categories.length === 0}
	<div class="empty-state">
		<p>no items available yet — check back soon.</p>
	</div>
{:else}
	{#each data.categories as cat (cat.id)}
		<section class="category">
			<div class="cat-header">
				<h2 class="cat-name">{cat.name}</h2>
				{#if cat.description}<p class="cat-desc">{cat.description}</p>{/if}
			</div>
			<div class="item-grid">
				{#each cat.items as item (item.id)}
					{@const canAfford = data.availableSeconds >= item.priceSeconds}
					{@const outOfStock = item.stock === 0}
					<div
						class="item-card"
						role="button"
						tabindex={!outOfStock ? 0 : -1}
						aria-disabled={outOfStock}
						onclick={() => !outOfStock && openModal(item)}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && !outOfStock && openModal(item)}
					>
						<div class="item-img-wrap" style={item.imagePadding ? `padding: ${item.imagePadding}px; background: #fff;` : ''}>
							{#if item.imageUrl}
								<img src={item.imageUrl} alt={item.name} class="item-img" style={item.imagePadding ? 'object-fit: contain;' : ''} />
							{/if}
						</div>
						<div class="item-body">
							<div class="item-top">
								<span class="item-name">{item.name}</span>
								<span class="item-price">
									<span class="price-icon">{@html clockSvg}</span>{formatHours(item.priceSeconds)}
								</span>
							</div>
							{#if item.stock !== -1 && item.stock > 0}
								<span class="stock-badge">{item.stock} left</span>
							{/if}
							{#if item.description}
								<p class="item-desc">{item.description}</p>
							{/if}
						</div>
						<button
							class="btn-order"
							class:btn-order-disabled={outOfStock}
							disabled={outOfStock}
							tabindex="-1"
						>
							{#if outOfStock}
								out of stock
							{:else}
								buy for<span class="price-icon">{@html clockSvg}</span>{formatHours(item.priceSeconds)}
							{/if}
						</button>
					</div>
				{/each}
			</div>
		</section>
	{/each}
{/if}

<!-- ORDER CONFIRMATION MODAL -->
{#if modalItem}
	{@const currentImg = displayedImageUrl ?? modalItem.imageUrl}
	<div
		class="modal-backdrop"
		class:closing={modalClosing}
		role="dialog"
		aria-modal="true"
		onclick={(e) => e.target === e.currentTarget && closeModal()}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		tabindex="-1"
	>
		<div class="modal-box" class:closing={modalClosing}>
			{#if currentImg}
				<div class="modal-img-wrap" style={modalItem.imagePadding ? `padding: ${modalItem.imagePadding}px; background: #fff;` : ''}>
					<img src={currentImg} alt={modalItem.name} class="modal-img" style={modalItem.imagePadding ? 'object-fit: contain;' : ''} />
				</div>
			{/if}

			<div class="modal-body">
				<div class="modal-title-row">
					<h2 class="modal-title">{modalItem.name}</h2>
				</div>
				{#if modalItem.description}
					<p class="modal-desc">{modalItem.description}</p>
				{/if}

				<form method="POST" action="?/buy" use:enhance={() => async ({ update }) => { await update(); closeModal(); }} class="modal-form">
					<input type="hidden" name="item_id" value={modalItem.id} />

					{#if modalOptions.length > 0}
						<div class="modal-options">
							{#each modalOptions as opt}
								<label class="opt-field">
									<span class="opt-field-label">{opt.label}</span>
									<div class="select-wrap">
										<select
											name="option_{opt.label}"
											class="opt-select"
											required
											onchange={(e) => handleChoiceChange(opt.label, e.currentTarget.value)}
										>
											<option value="" disabled selected>select {opt.label.toLowerCase()}</option>
											{#each opt.choices as choice}
												<option value={choice.name}>{choice.name}</option>
											{/each}
										</select>
										<span class="select-caret">{@html caretSvg}</span>
									</div>
								</label>
							{/each}
						</div>
					{/if}

					<div class="modal-actions">
						<button type="submit" class="btn-confirm" disabled={data.availableSeconds < modalItem.priceSeconds}>
							{#if data.availableSeconds < modalItem.priceSeconds}
								not enough hours
							{:else}
								buy for<span class="price-icon">{@html clockSvg}</span>{formatHours(modalItem.priceSeconds)}
							{/if}
						</button>
						<button type="button" class="btn-cancel-modal" onclick={closeModal}>cancel</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── PAGE HEADER ── */

	.page-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.heading-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.heading {
		font-size: clamp(2.5rem, 3.5vw, 3.5rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0;
	}

	.balance-display {
		font-size: 1.3rem;
		font-weight: bold;
		letter-spacing: -0.02em;
		color: var(--color-text-soft);
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
	}

	.balance-icon,
	.price-icon {
		display: flex;
		width: 1em;
		height: 1em;
		flex-shrink: 0;
	}

	.btn-order .price-icon,
	.btn-confirm .price-icon {
		margin-left: 0.22rem;
		margin-right: 0.15rem;
	}

	.balance-icon :global(svg),
	.price-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.orders-btn {
		font-size: 0.9rem;
		font-weight: bold;
		text-decoration: none;
		color: var(--color-text);
		border-radius: var(--radius-pill);
		border: solid var(--border-width);
		padding: 0.4rem 1rem;
		transition: border-style 0.1s;
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
	}

	.btn-icon {
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
	}

	.orders-btn:hover {
		border-style: dotted;
	}

	.form-error {
		font-size: 0.8rem;
		color: #c96a6a;
		margin: -1rem 0 0.5rem;
	}

	.form-success {
		font-size: 0.8rem;
		color: #6dbb6d;
		margin: -1rem 0 0.5rem;
	}

	.empty-state {
		color: var(--color-text-soft);
		font-size: 1.05rem;
	}

	/* ── CATEGORY ── */

	.category {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.cat-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.cat-name {
		font-size: clamp(1.3rem, 2vw, 1.8rem);
		font-weight: bold;
		letter-spacing: -0.02em;
		margin: 0;
	}

	.cat-desc {
		margin: 0;
		font-size: 1rem;
		color: var(--color-text-soft);
	}

	/* ── ITEM GRID ── */

	.item-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: clamp(0.75rem, 1.2vw, 1.25rem);
	}

	.item-card {
		background: var(--color-bg);
		border-radius: var(--radius-card);
		border: solid var(--border-width);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: border-color 0.15s;
		cursor: pointer;
	}

	.item-card:hover {
		border-color: var(--color-text);
	}

	.item-img-wrap {
		width: 100%;
		height: 240px;
		flex-shrink: 0;
		background: var(--color-bg-soft);
		border-bottom: calc(var(--border-width) / 2) solid;
	}

	.item-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.item-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: clamp(0.85rem, 1.4vw, 1.25rem);
		flex: 1;
	}

	.item-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.item-name {
		font-weight: bold;
		font-size: 1.05rem;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}

	.item-price {
		font-size: 1.05rem;
		font-weight: bold;
		letter-spacing: -0.02em;
		color: var(--color-text-soft);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.item-price .price-icon {
		margin: 0;
	}


	.item-desc {
		margin: 0;
		font-size: 0.88rem;
		color: var(--color-text-soft);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.stock-badge {
		font-size: 0.8rem;
		color: var(--color-text-soft);
		font-weight: 600;
	}



	.btn-order {
		font-size: 0.9rem;
		font-weight: bold;
		padding: 0.6rem 1rem;
		border-radius: var(--radius-pill);
		border: solid var(--border-width);
		background: var(--color-text);
		color: var(--color-bg);
		cursor: pointer;
		font-family: inherit;
		width: calc(100% - 1.5rem);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		transition: opacity 0.1s;
		margin: auto 0.75rem 0.75rem;
	}

	.btn-order:disabled {
		background: var(--color-bg-soft);
		color: var(--color-text-soft);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.btn-order:not(:disabled):hover {
		opacity: 0.85;
	}

	/* ── MODAL ── */

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fade-in 0.18s ease both;
		backdrop-filter: blur(4px);
		padding: 1rem;
	}

	.modal-backdrop.closing {
		animation: fade-out 0.16s ease forwards;
	}

	.modal-backdrop.closing .modal-box {
		animation: slide-down 0.16s ease forwards;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes fade-out {
		from { opacity: 1; }
		to { opacity: 0; }
	}

	.modal-box {
		background: var(--color-bg);
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		width: min(580px, 100%);
		max-height: 90vh;
		overflow-y: auto;
		animation: slide-up 0.2s ease both;
	}

	@keyframes slide-up {
		from { transform: translateY(12px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	@keyframes slide-down {
		from { transform: translateY(0); opacity: 1; }
		to { transform: translateY(12px); opacity: 0; }
	}

	.modal-img-wrap {
		width: 100%;
		height: 320px;
		flex-shrink: 0;
		border-bottom: calc(var(--border-width) / 2) solid;
	}

	.modal-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: clamp(1.5rem, 2.5vw, 2.5rem);
	}

	.modal-title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.modal-title {
		font-size: 1.6rem;
		font-weight: bold;
		letter-spacing: -0.02em;
		margin: 0;
		line-height: 1.2;
	}

	.modal-desc {
		margin: -0.4rem 0 0;
		font-size: 1.05rem;
		color: var(--color-text-soft);
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.25rem;
	}

	.modal-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.opt-field {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.opt-field-label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text);
		font-weight: 600;
	}

	.select-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.opt-select {
		appearance: none;
		-webkit-appearance: none;
		background: transparent;
		border: solid var(--border-width);
		border-radius: var(--radius-pill);
		padding: 0.5rem 2.5rem 0.5rem 1rem;
		font-size: 0.9rem;
		font-family: inherit;
		color: var(--color-text);
		width: 100%;
		cursor: pointer;
	}

	.opt-select:hover {
		border-style: dotted;
	}

	.opt-select:focus {
		outline: none;
	}

	.select-caret {
		position: absolute;
		right: 0.85rem;
		pointer-events: none;
		display: flex;
		width: 0.65rem;
		height: 0.65rem;
		color: var(--color-text-soft);
	}

	.select-caret :global(svg) {
		width: 100%;
		height: 100%;
	}

	.modal-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-confirm,
	.btn-cancel-modal {
		font-size: 0.9rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.5rem 1rem;
		cursor: pointer;
		border: solid var(--border-width);
		font-family: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
	}

	.btn-confirm {
		background: var(--color-text);
		color: var(--color-bg);
		border-color: var(--color-text);
		flex: 1;
	}

	.btn-confirm:hover {
		opacity: 0.85;
	}

	.btn-cancel-modal {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.btn-cancel-modal:hover {
		border-style: dotted;
	}
</style>
