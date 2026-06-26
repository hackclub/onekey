<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatHours } from '$lib/format';

	let { data, form } = $props();

	type Item = (typeof data.categories)[number]['items'][number];
	type Choice = { name: string; imageUrl?: string };
	type ItemOption = { label: string; choices: Choice[] };

	let modalItem = $state<Item | null>(null);
	let modalMode = $state<'buy' | 'claim'>('buy');
	let modalOptions = $state<ItemOption[]>([]);
	let modalClosing = $state(false);
	let displayedImageUrl = $state<string | null>(null);
	const CLOSE_MS = 160;

	function openModal(item: Item, mode: 'buy' | 'claim' = 'buy') {
		modalMode = mode;
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
		setTimeout(() => {
			modalItem = null;
			modalClosing = false;
		}, CLOSE_MS);
	}

	const clockSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor" stroke="currentColor" stroke-width="1.5" paint-order="stroke fill"><path d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"/><path d="M15.64 17a1 1 0 0 1-1-1V9a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1z"/><path d="M21.702 19.502a1 1 0 0 1-1.366.366l-5.196-3a1 1 0 0 1 1-1.732l5.196 3a1 1 0 0 1 .366 1.366z"/></svg>`;
	const caretSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="down-caret" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M 0.359841 9.01822C 0.784113 9.37178 1.41467 9.31446 1.76823 8.8902C 3.14518 7.2451 6.52975 3.42464 8.25002 2.11557C 9.99919 3.44663 13.335 7.21555 14.7318 8.8902C 15.0854 9.31446 15.7159 9.37178 16.1402 9.01822C 16.5645 8.66466 16.6215 8.03371 16.2679 7.60943C 14.7363 5.76983 11.2749 1.80977 9.30351 0.408618C 8.99227 0.190441 8.64018 0 8.25002 0C 7.85987 0 7.50778 0.190441 7.19654 0.408618C 5.26486 1.78153 1.73514 5.80788 0.232849 7.60856L 0.231804 7.60982C -0.12176 8.03409 -0.0644362 8.66466 0.359841 9.01822Z" transform="translate(7.12506 20.6251)scale(1 -1)"/></svg>`;
	const lockSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="private" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M19.196 6.238C18.44 6.041 17.479 5.999 16 6c-1.479-.001-2.44.041-3.195.238-.606.15-.826.343-.976.551-.208.291-.451.872-.613 2.111-.119.895-.178 1.972-.202 3.315C12.316 12.052 13.951 12 16 12s3.684.052 4.986.215c-.024-1.343-.083-2.42-.201-3.315-.162-1.239-.406-1.82-.614-2.111-.15-.208-.37-.401-.976-.551zm3.797 6.403C22.894 4.897 21.803 4 16.001 4s-6.893.897-6.992 8.641c-2.604.885-3.008 2.911-3.008 7.359 0 7 1 8 10 8s10-1 10-8c0-4.448-.404-6.474-3.008-7.359zm-5.992 8.092a2 2 0 1 0-2 0V22a1 1 0 0 0 2 0v-1.267z"/></svg>`;
	const giftSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/><path d="M12 8S11 4 8.5 4 6 7 8 8M12 8s1-4 3.5-4S18 7 16 8"/></svg>`;
	const enterSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M18.496,10.132c-0.479,-0.274 -1.09,-0.108 -1.364,0.372c-0.274,0.479 -0.108,1.09 0.372,1.364c1.554,0.886 3.031,1.929 4.357,3.132l-13.861,0c-0.552,0 -1,0.448 -1,1c0,0.552 0.448,1 1,1l13.861,0c-1.326,1.203 -2.803,2.246 -4.357,3.132c-0.48,0.274 -0.646,0.885 -0.372,1.364c0.274,0.48 0.885,0.646 1.364,0.372c2.16,-1.237 4.859,-2.886 6.237,-5.061c0.076,-0.12 0.267,-0.431 0.267,-0.807c0,-0.376 -0.191,-0.687 -0.267,-0.807c-1.403,-2.215 -4.021,-3.792 -6.237,-5.061Z"/></svg>`;
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && modalItem && closeModal()} />

<div class="page-header">
	<div class="heading-row">
		<h1 class="heading">shop</h1>
		{#if data.verified}
			<span class="balance-display">
				<span class="dot-sep">·</span>
				<span class="balance-label">balance:</span>
				<span class="balance-icon">{@html clockSvg}</span>
				{formatHours(data.availableSeconds)}
			</span>
		{/if}
	</div>
	<a href="/shop/orders" class="orders-btn bordered"
		>your orders <svg
			fill-rule="evenodd"
			clip-rule="evenodd"
			stroke-linejoin="round"
			stroke-miterlimit="1.414"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			viewBox="0 0 32 32"
			preserveAspectRatio="xMidYMid meet"
			fill="currentColor"
			class="btn-icon"
			><path
				d="M11.6068 8.1099C11.2532 8.53417 11.3106 9.16473 11.7348 9.51829C13.3799 10.8952 17.2004 14.2798 18.5095 16.0001C17.1784 17.7493 13.4095 21.0851 11.7348 22.4819C11.3106 22.8355 11.2532 23.466 11.6068 23.8903C11.9604 24.3146 12.5913 24.3716 13.0156 24.018C14.8552 22.4864 18.8153 19.025 20.2164 17.0536C20.4346 16.7423 20.625 16.3902 20.625 16.0001C20.625 15.6099 20.4346 15.2578 20.2164 14.9466C18.8435 13.0149 14.8171 9.4852 13.0165 7.98291L13.0152 7.98186C12.5909 7.6283 11.9604 7.68562 11.6068 8.1099Z"
			/></svg
		></a
	>
</div>

{#if form?.error}
	<p class="form-error">{form.error}</p>
{/if}
{#if form?.success}
	<p class="form-success">{form.claimed ? 'prize claimed!' : 'order placed!'}</p>
{/if}

{#if data.verified}
	{@render shopGrid()}
{:else}
	<div class="locked-shop">
		<div class="locked-grid" inert aria-hidden="true">
			{@render shopGrid()}
		</div>
		<div class="lock-overlay">
			{#if data.prizeClaimed}
				<div class="lock-panel">
					<span class="lock-icon" aria-hidden="true">{@html lockSvg}</span>
					<h2 class="lock-title">prize claimed!</h2>
					<p class="lock-desc">
						you've claimed your one prize. verify your identity to unlock the full shop and start
						spending your hours on bigger, better stuff.
					</p>
					<a
						href="https://auth.hackclub.com/verifications/new"
						target="_blank"
						rel="noreferrer"
						class="lock-verify-btn">verify your identity</a
					>
				</div>
			{:else if data.hasApprovedProject && data.prizeItems.length > 0}
				<div class="lock-panel lock-panel-prizes">
					<span class="lock-icon" aria-hidden="true">{@html giftSvg}</span>
					<h2 class="lock-title">claim a prize</h2>
					<p class="lock-desc">
						nice work getting a project approved! since you're not verified yet, pick <strong
							>one</strong
						> of these to claim. or verify your identity to unlock the full shop instead.
					</p>
					<div class="prize-grid">
						{#each data.prizeItems as prize (prize.id)}
							{@const prizeOut = prize.stock === 0}
							<button
								type="button"
								class="prize-card"
								disabled={prizeOut}
								onclick={() => !prizeOut && openModal(prize, 'claim')}
							>
								<div
									class="prize-img-wrap"
									style={prize.imagePadding ? `--img-pad: ${prize.imagePadding}px;` : ''}
								>
									{#if prize.imageUrl}
										<img
											src={prize.imageUrl}
											alt={prize.name}
											class="prize-img"
											style={prize.imagePadding ? 'object-fit: contain;' : ''}
										/>
									{/if}
								</div>
								<span class="prize-name">{prize.name}</span>
								<span class="prize-claim-btn" class:prize-claim-btn-out={prizeOut}>
									{prizeOut ? 'out of stock' : 'claim'}
								</span>
							</button>
						{/each}
					</div>
					<a
						href="https://auth.hackclub.com/verifications/new"
						target="_blank"
						rel="noreferrer"
						class="lock-verify-link"
						>or verify to unlock the full shop <span class="enter-icon">{@html enterSvg}</span></a
					>
				</div>
			{:else}
				<div class="lock-panel" class:lock-panel-prizes={data.prizeItems.length > 0}>
					<span class="lock-icon" aria-hidden="true">{@html lockSvg}</span>
					<h2 class="lock-title">the shop is locked</h2>
					<p class="lock-desc">
						verify your identity to unlock a shop full of bigger, more awesome prizes - or get a
						project approved to claim one of these starter prizes.
					</p>
					{#if data.prizeItems.length > 0}
						<div class="prize-grid">
							{#each data.prizeItems as prize (prize.id)}
								<div class="prize-card prize-card-preview">
									<div
										class="prize-img-wrap"
										style={prize.imagePadding ? `--img-pad: ${prize.imagePadding}px;` : ''}
									>
										{#if prize.imageUrl}
											<img
												src={prize.imageUrl}
												alt={prize.name}
												class="prize-img"
												style={prize.imagePadding ? 'object-fit: contain;' : ''}
											/>
										{/if}
									</div>
									<span class="prize-name">{prize.name}</span>
									{#if prize.description}
										<span class="prize-desc">{prize.description}</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
					<a
						href="https://auth.hackclub.com/verifications/new"
						target="_blank"
						rel="noreferrer"
						class="lock-verify-btn">verify your identity</a
					>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#snippet shopGrid()}
	{#if data.categories.length === 0}
		<div class="empty-state">
			<p>no items available yet - check back soon.</p>
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
						{@const effectivePrice = item.discountSeconds ?? item.priceSeconds}
						{@const isDiscounted = item.discountSeconds != null}
						{@const outOfStock = item.stock === 0}
						<div
							class="item-card"
							role="button"
							tabindex={!outOfStock ? 0 : -1}
							aria-disabled={outOfStock}
							onclick={() => !outOfStock && openModal(item)}
							onkeydown={(e) =>
								(e.key === 'Enter' || e.key === ' ') && !outOfStock && openModal(item)}
						>
							<div
								class="item-img-wrap"
								style={item.imagePadding ? `--img-pad: ${item.imagePadding}px;` : ''}
							>
								{#if item.imageUrl}
									<img
										src={item.imageUrl}
										alt={item.name}
										class="item-img"
										style={item.imagePadding ? 'object-fit: contain;' : ''}
									/>
								{/if}
								{#if isDiscounted}
									<span class="discount-flag">sale</span>
								{/if}
							</div>
							<div class="item-body">
								<div class="item-top">
									<span class="item-name">{item.name}</span>
									<span class="item-price">
										{#if isDiscounted}
											<span class="item-price-original">
												<span class="price-icon">{@html clockSvg}</span>{formatHours(
													item.priceSeconds
												)}
												<svg
													class="price-strike"
													viewBox="0 0 100 100"
													preserveAspectRatio="none"
													aria-hidden="true"
												>
													<line x1="2" y1="38" x2="98" y2="9" vector-effect="non-scaling-stroke" />
												</svg>
											</span>
											<span class="item-price-sale"
												><span class="price-icon">{@html clockSvg}</span>{formatHours(
													effectivePrice
												)}</span
											>
										{:else}
											<span class="price-icon">{@html clockSvg}</span>{formatHours(effectivePrice)}
										{/if}
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
								class:btn-order-discounted={isDiscounted && !outOfStock}
								disabled={outOfStock}
								tabindex="-1"
							>
								{#if outOfStock}
									out of stock
								{:else}
									buy for<span class="price-icon">{@html clockSvg}</span>{formatHours(
										effectivePrice
									)}
								{/if}
							</button>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
{/snippet}

<!-- ORDER / PRIZE CONFIRMATION MODAL -->
{#if modalItem}
	{@const currentImg = displayedImageUrl ?? modalItem.imageUrl}
	{@const modalEffective = modalItem.discountSeconds ?? modalItem.priceSeconds}
	{@const modalDiscounted = modalItem.discountSeconds != null}
	{@const isClaim = modalMode === 'claim'}
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
				<div
					class="modal-img-wrap"
					style={modalItem.imagePadding
						? `--img-pad: ${modalItem.imagePadding}px; background: #fff;`
						: ''}
				>
					<img
						src={currentImg}
						alt={modalItem.name}
						class="modal-img"
						style={modalItem.imagePadding ? 'object-fit: contain;' : ''}
					/>
				</div>
			{/if}

			<div class="modal-body">
				<div class="modal-title-row">
					<h2 class="modal-title">{modalItem.name}</h2>
				</div>
				{#if modalItem.description}
					<p class="modal-desc">{modalItem.description}</p>
				{/if}

				<form
					method="POST"
					action={isClaim ? '?/claimPrize' : '?/buy'}
					use:enhance={() =>
						async ({ update }) => {
							await update();
							closeModal();
						}}
					class="modal-form"
					class:tight-top={modalOptions.length === 0 && (modalItem.fulfilledLocally || isClaim)}
				>
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

					{#if isClaim}
						<p class="modal-disclaimer">
							this is your <strong>one</strong> prize - choose carefully! once you claim it you won't
							be able to claim another. verify your identity any time to unlock the full shop.
						</p>
					{:else if modalItem.fulfilledLocally}
						<p class="modal-disclaimer">
							this item is fulfilled locally and doesn't ship from HQ - if we can't fulfill it in
							your region, it'll be substituted for a similar item or you'll be given a grant for
							it!
						</p>
					{/if}

					<div class="modal-actions">
						{#if isClaim}
							<button type="submit" class="btn-confirm">claim this prize</button>
						{:else}
							<button
								type="submit"
								class="btn-confirm"
								class:btn-confirm-discounted={modalDiscounted &&
									data.availableSeconds >= modalEffective}
								disabled={data.availableSeconds < modalEffective}
							>
								{#if data.availableSeconds < modalEffective}
									not enough hours
								{:else}
									buy for<span class="price-icon">{@html clockSvg}</span>{formatHours(
										modalEffective
									)}
									{#if modalDiscounted}
										<span class="btn-confirm-original"
											><span class="price-icon">{@html clockSvg}</span>{formatHours(
												modalItem.priceSeconds
											)}</span
										>
									{/if}
								{/if}
							</button>
						{/if}
						<button type="button" class="btn-cancel-modal" onclick={closeModal}>cancel</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── LOCKED SHOP (unverified) ── */

	.locked-shop {
		position: relative;
	}

	.locked-grid {
		filter: blur(7px);
		opacity: 0.5;
		pointer-events: none;
		user-select: none;
		/* keep enough height behind the overlay so the blur reads as "a shop is here" */
		min-height: 60vh;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(to bottom, #000 35%, transparent 95%);
		mask-image: linear-gradient(to bottom, #000 35%, transparent 95%);
	}

	.lock-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: clamp(1rem, 6vh, 5rem) 1rem;
	}

	.lock-panel {
		background: var(--color-bg);
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		padding: clamp(1.5rem, 3vw, 2.5rem);
		max-width: 30rem;
		width: 100%;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
	}

	.lock-panel-prizes {
		max-width: 38rem;
	}

	.lock-icon {
		display: flex;
		width: 3.75rem;
		height: 3.75rem;
		color: var(--color-text);
	}

	.lock-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.lock-title {
		font-size: clamp(1.5rem, 2.4vw, 2rem);
		font-weight: bold;
		letter-spacing: -0.02em;
		margin: 0;
	}

	.lock-desc {
		margin: 0;
		font-size: 0.98rem;
		line-height: 1.5;
		color: var(--color-text-soft);
	}

	.lock-verify-btn {
		margin-top: 0.4rem;
		text-decoration: none;
		background: var(--color-text);
		color: var(--color-bg);
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.65rem 1.5rem;
		font-size: 1rem;
		transition: opacity 0.1s;
	}

	.lock-verify-btn:hover {
		opacity: 0.85;
	}

	.lock-verify-link {
		margin-top: 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-soft);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.1em;
	}

	.enter-icon {
		display: inline-flex;
		width: 1.6em;
		height: 1.6em;
		flex-shrink: 0;
	}

	.enter-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.lock-verify-link:hover {
		color: var(--color-text);
	}

	.prize-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		width: 100%;
		margin-top: 0.4rem;
	}

	.prize-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-bg);
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		padding: 0.75rem 0.75rem 0.85rem;
		cursor: pointer;
		font-family: inherit;
		color: var(--color-text);
		transition: border-color 0.15s;
	}

	.prize-card:hover:not(:disabled) {
		border-color: var(--color-text);
	}

	.prize-card:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Preview-only cards (shown before a user has earned a claim) are non-interactive. */
	.prize-card-preview {
		cursor: default;
	}

	.prize-desc {
		font-size: 0.78rem;
		line-height: 1.35;
		color: var(--color-text-soft);
		text-align: center;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.prize-img-wrap {
		width: 100%;
		aspect-ratio: 1 / 1;
		background: #fff;
		border-radius: calc(var(--radius-card) - 4px);
		border: calc(var(--border-width) / 2) solid;
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
	}

	.prize-img {
		position: absolute;
		top: var(--img-pad, 0px);
		left: var(--img-pad, 0px);
		width: calc(100% - 2 * var(--img-pad, 0px));
		height: calc(100% - 2 * var(--img-pad, 0px));
		object-fit: cover;
		display: block;
	}

	.prize-name {
		font-weight: bold;
		font-size: 1.1rem;
		line-height: 1.2;
		letter-spacing: -0.01em;
	}

	/* Claim button on each prize card — mirrors the regular shop's buy button (.btn-order). */
	.prize-claim-btn {
		margin-top: auto;
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-pill);
		border: solid var(--border-width);
		background: var(--color-text);
		color: var(--color-bg);
		font-size: 0.8rem;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.prize-claim-btn-out {
		background: var(--color-bg-soft);
		color: var(--color-text-soft);
		opacity: 0.6;
	}

	@media (max-width: 540px) {
		.prize-grid {
			grid-template-columns: 1fr;
		}
	}

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
		align-self: flex-end;
		margin-bottom: 0.5rem;
	}

	.dot-sep {
		opacity: 0.35;
	}

	.balance-label {
		font-size: 0.75em;
		opacity: 0.6;
		letter-spacing: 0;
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
		margin-top: 1.5rem;
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
		aspect-ratio: 16 / 9;
		flex-shrink: 0;
		background: #fff;
		border-bottom: calc(var(--border-width) / 2) solid;
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
	}

	.item-img {
		position: absolute;
		top: var(--img-pad, 0px);
		left: var(--img-pad, 0px);
		width: calc(100% - 2 * var(--img-pad, 0px));
		height: calc(100% - 2 * var(--img-pad, 0px));
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
		gap: 0.45rem;
	}

	.item-price .price-icon {
		margin: 0;
	}

	.item-price-sale {
		display: inline-flex;
		align-items: center;
		gap: 0.18rem;
		color: #d64545;
	}

	.item-price-original {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.18rem;
		font-size: 0.82em;
		color: var(--color-text-soft);
		font-weight: 600;
	}

	/* Diagonal strike drawn as an SVG so the thickness stays crisp and constant
	   regardless of the (variable-width) price text it crosses. */
	.item-price-original .price-strike {
		position: absolute;
		inset: 0 -2px;
		overflow: visible;
		pointer-events: none;
	}

	.item-price-original .price-strike line {
		stroke: #d64545;
		stroke-width: 2.5;
		stroke-linecap: round;
	}

	.discount-flag {
		position: absolute;
		top: 0.55rem;
		left: 0.55rem;
		z-index: 2;
		font-size: 0.7rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		background: #d64545;
		color: #fff;
		padding: 0.22rem 0.55rem;
		border-radius: var(--radius-pill);
	}

	.btn-order-discounted {
		background: #d64545;
		border-color: #d64545;
		color: #fff;
	}

	.btn-confirm-discounted {
		background: #d64545;
		border-color: #d64545;
	}

	.btn-confirm-original {
		display: inline-flex;
		align-items: center;
		gap: 0.18rem;
		margin-left: 0.5em;
		font-size: 0.78em;
		opacity: 0.7;
		text-decoration: line-through;
		text-decoration-thickness: 1.5px;
		font-weight: 600;
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
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fade-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	.modal-box {
		background: var(--color-bg);
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		width: clamp(380px, 32vw, 580px);
		max-height: 90vh;
		overflow-y: auto;
		animation: slide-up 0.2s ease both;
	}

	@keyframes slide-up {
		from {
			transform: translateY(12px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes slide-down {
		from {
			transform: translateY(0);
			opacity: 1;
		}
		to {
			transform: translateY(12px);
			opacity: 0;
		}
	}

	.modal-img-wrap {
		width: 100%;
		aspect-ratio: 16 / 9;
		flex-shrink: 0;
		border-bottom: calc(var(--border-width) / 2) solid;
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
	}

	.modal-img {
		position: absolute;
		top: var(--img-pad, 0px);
		left: var(--img-pad, 0px);
		width: calc(100% - 2 * var(--img-pad, 0px));
		height: calc(100% - 2 * var(--img-pad, 0px));
		object-fit: cover;
		display: block;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: clamp(20px, 2.2vw, 50px);
	}

	.modal-title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.modal-title {
		font-size: clamp(26px, 1.6rem, 60px);
		font-weight: bold;
		letter-spacing: -0.02em;
		margin: 0;
		line-height: 1.2;
	}

	.modal-desc {
		margin: -0.4rem 0 0;
		font-size: clamp(15px, 1.05rem, 38px);
		color: var(--color-text-soft);
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.25rem;
	}

	/* No options to select → the disclaimer is the form's first row; drop the
	   extra top margin so it sits on the body's normal rhythm under the description. */
	.modal-form.tight-top {
		margin-top: 0;
	}

	.modal-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-disclaimer {
		margin: 0;
		font-size: clamp(11px, 0.78rem, 22px);
		line-height: 1.45;
		color: var(--color-text-soft);
		opacity: 0.85;
		border-left: 2px solid color-mix(in srgb, var(--color-text) 25%, transparent);
		padding-left: 0.7rem;
	}

	.opt-field {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.opt-field-label {
		font-size: clamp(12px, 0.8rem, 28px);
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
		padding: 0.55em 2.5em 0.55em 1em;
		font-size: clamp(14px, 0.9rem, 32px);
		font-family: inherit;
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
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
		font-size: clamp(14px, 0.9rem, 32px);
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.55em 1.1em;
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

	.btn-confirm:disabled {
		background: transparent;
		color: var(--color-text);
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-cancel-modal {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.btn-cancel-modal:hover {
		border-style: dotted;
	}
</style>
