<script lang="ts">
	import { enhance } from '$app/forms';
	import { darkMode } from '$lib/stores/theme';

	// Guided macropad configurator. Options live on the left; the right side is a
	// placeholder for product imagery that renders per-selection later. Placing the
	// order posts to the `order` action, which records each parameter like a shop
	// item option and redirects to the orders page.

	let { data, form } = $props();

	let ordering = $state(false);

	type ColorOption = { name: string; hex: string };
	type SwitchOption = { name: string; desc: string };

	type Step =
		| {
				key: 'bottomCase' | 'topCase' | 'keycap';
				title: string;
				type: 'color';
				options: ColorOption[];
		  }
		| { key: 'keySwitch'; title: string; type: 'switch'; options: SwitchOption[] };

	const CASE_COLORS: ColorOption[] = [
		{ name: 'black', hex: '#1c1c1c' },
		{ name: 'white', hex: '#ffffff' },
		{ name: 'red', hex: '#d64545' }
	];

	const KEYCAP_COLORS: ColorOption[] = [
		{ name: 'black', hex: '#1c1c1c' },
		{ name: 'white', hex: '#ffffff' },
		{ name: 'red', hex: '#d64545' },
		{ name: 'blue', hex: '#4a72d6' },
		{ name: 'pink', hex: '#e86ea4' },
		{ name: 'orange', hex: '#e0913c' },
		{ name: 'purple', hex: '#8a5cd6' },
		{ name: 'green', hex: '#4caf6a' }
	];

	const STEPS: Step[] = [
		{ key: 'bottomCase', title: 'bottom case color', type: 'color', options: CASE_COLORS },
		{ key: 'topCase', title: 'top case color', type: 'color', options: CASE_COLORS },
		{ key: 'keycap', title: 'keycap', type: 'color', options: KEYCAP_COLORS },
		{
			key: 'keySwitch',
			title: 'key switch',
			type: 'switch',
			options: [
				{ name: 'linear', desc: 'smooth, satisfying keypress' },
				{ name: 'tactile', desc: 'a bump you can feel' },
				{ name: 'clicky', desc: 'a bump you can feel and hear' }
			]
		}
	];

	type SelectionKey = Step['key'];

	let stepIndex = $state(0);
	let selections = $state<Record<SelectionKey, string | null>>({
		bottomCase: null,
		topCase: null,
		keySwitch: null,
		keycap: null
	});

	const isSummary = $derived(stepIndex === STEPS.length);
	const currentStep = $derived(STEPS[stepIndex] ?? null);
	const currentSelected = $derived(currentStep ? selections[currentStep.key] : null);
	const allSelected = $derived(STEPS.every((s) => selections[s.key]));
	const canAfford = $derived(data.availableSeconds >= data.priceSeconds);

	// Live preview is composited from transparent PNG layers in static/img — each layer is
	// the full sketch with only its part filled, so stacking bottom → top → key builds the
	// configured onekey. The switch has no visible layer.
	const LAYER_PREFIX: Partial<Record<SelectionKey, string>> = {
		bottomCase: 'bottom',
		topCase: 'top',
		keycap: 'key'
	};
	const hasAnySelection = $derived(
		!!(selections.bottomCase || selections.topCase || selections.keycap)
	);

	// Preload every layer variant once so swaps between colors are instant.
	$effect(() => {
		for (const step of STEPS) {
			const prefix = LAYER_PREFIX[step.key];
			if (step.type !== 'color' || !prefix) continue;
			for (const opt of step.options) {
				const img = new Image();
				img.src = `/img/${prefix}-${opt.name}.png`;
			}
		}
	});

	function select(key: SelectionKey, value: string) {
		selections[key] = value;
	}

	// A step is reachable only once every step before it has a selection — you
	// can't skip ahead past an unanswered step (via the progress rail or otherwise).
	function canReach(i: number): boolean {
		for (let j = 0; j < i; j++) {
			if (!selections[STEPS[j].key]) return false;
		}
		return true;
	}

	function next() {
		if (stepIndex < STEPS.length && (isSummary || currentSelected)) stepIndex += 1;
	}

	function back() {
		if (stepIndex > 0) stepIndex -= 1;
	}

	function goTo(i: number) {
		if (canReach(i)) stepIndex = i;
	}

	function swatchHex(key: SelectionKey): string | null {
		const step = STEPS.find((s) => s.key === key);
		if (!step || step.type !== 'color') return null;
		return step.options.find((o) => o.name === selections[key])?.hex ?? null;
	}
</script>

<div class="page-header">
	<h1 class="heading">onekey</h1>
</div>

<!-- Progress rail -->
<div class="progress-row">
	<div class="progress">
		{#each STEPS as step, i (step.key)}
			<button
				type="button"
				class="node"
				class:active={i === stepIndex}
				class:done={i < stepIndex || isSummary}
				disabled={!canReach(i)}
				onclick={() => goTo(i)}
				aria-label={step.title}
			>
				{i + 1}
			</button>
			{#if i < STEPS.length - 1}
				<span class="connector" class:filled={i < stepIndex || isSummary}></span>
			{/if}
		{/each}
	</div>
	<span class="step-count">
		{isSummary ? 'review your build' : `step ${stepIndex + 1} of ${STEPS.length}`}
	</span>
</div>

<div class="configurator">
	<!-- LEFT: options / summary -->
	<div class="panel">
		{#if !isSummary && currentStep}
			<h2 class="step-title">{currentStep.title}</h2>

			{#if currentStep.type === 'color'}
				<div class="color-grid" class:keycap-grid={currentStep.key === 'keycap'}>
					{#each currentStep.options as opt (opt.name)}
						<button
							type="button"
							class="color-card"
							class:selected={currentSelected === opt.name}
							onclick={() => select(currentStep.key, opt.name)}
						>
							<span class="color-chip" style="--sw: {opt.hex};"></span>
							<span class="color-name">{opt.name}</span>
						</button>
					{/each}
				</div>
			{:else}
				<div class="switch-list">
					{#each currentStep.options as opt (opt.name)}
						<button
							type="button"
							class="opt-card"
							class:selected={currentSelected === opt.name}
							onclick={() => select(currentStep.key, opt.name)}
						>
							<span class="opt-card-name">{opt.name}</span>
							<span class="opt-card-desc">{opt.desc}</span>
						</button>
					{/each}
				</div>
			{/if}

			<div class="nav-row">
				{#if stepIndex > 0}
					<button type="button" class="btn-back" onclick={back}>← back</button>
				{/if}
				<button type="button" class="btn-next" disabled={!currentSelected} onclick={next}>
					{stepIndex === STEPS.length - 1 ? 'review →' : 'next →'}
				</button>
			</div>
		{:else}
			<!-- SUMMARY -->
			<h2 class="step-title">your onekey</h2>
			<ul class="summary-list">
				{#each STEPS as step (step.key)}
					<li class="summary-item">
						<button type="button" class="summary-edit" onclick={() => goTo(STEPS.indexOf(step))}>
							edit
						</button>
						<span class="summary-label">{step.title}</span>
						<span class="summary-value">
							{#if swatchHex(step.key)}
								<span class="summary-dot" style="--sw: {swatchHex(step.key)};"></span>
							{/if}
							{selections[step.key] ?? '—'}
						</span>
					</li>
				{/each}
			</ul>

			<div class="price-row">
				<span class="price-label">total</span>
				<span class="price-value">5 hours</span>
			</div>

			{#if form?.error}
				<p class="order-error">{form.error}</p>
			{/if}

			<form
				method="POST"
				action="?/order"
				use:enhance={() => {
					ordering = true;
					return async ({ update }) => {
						await update();
						ordering = false;
					};
				}}
			>
				{#each STEPS as step (step.key)}
					<input type="hidden" name="option_{step.title}" value={selections[step.key] ?? ''} />
				{/each}
				<div class="nav-row">
					<button type="button" class="btn-back" onclick={back}>← back</button>
					{#if !data.verified}
						<a href="https://auth.hackclub.com/verifications/new" class="btn-next btn-cta btn-cta-link">
							verify to order
						</a>
					{:else}
						<button
							type="submit"
							class="btn-next btn-cta"
							disabled={!allSelected || !canAfford || ordering}
						>
							{#if ordering}
								placing order…
							{:else if !canAfford}
								not enough hours
							{:else}
								get yours
							{/if}
						</button>
					{/if}
				</div>
			</form>
		{/if}
	</div>

	<!-- RIGHT: live layered preview -->
	<div class="preview">
		<div class="preview-stage" class:dark={$darkMode}>
			{#if hasAnySelection}
				<div class="onekey-stack">
					{#if selections.bottomCase}
						<img class="layer" src="/img/bottom-{selections.bottomCase}.png" alt="" />
					{/if}
					{#if selections.topCase}
						<img class="layer" src="/img/top-{selections.topCase}.png" alt="" />
					{/if}
					{#if selections.keycap}
						<img class="layer" src="/img/key-{selections.keycap}.png" alt="" />
					{/if}
					{#if $darkMode}
						<!-- Dark-mode overlay always renders last so it sits on top of every layer. -->
						<img class="layer" src="/img/dark-mode.png" alt="" />
					{/if}
				</div>
			{:else}
				<span class="preview-note">pick your colors to preview your onekey</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}

	.heading {
		font-size: clamp(2.5rem, 3.5vw, 3.5rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0;
	}

	/* ── PROGRESS ── */

	.progress-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.progress {
		display: flex;
		align-items: center;
	}

	.node {
		width: 2.1rem;
		height: 2.1rem;
		flex-shrink: 0;
		border-radius: var(--radius-pill);
		border: solid calc(var(--border-width) / 2);
		background: var(--color-bg);
		color: var(--color-text-soft);
		font-family: inherit;
		font-weight: bold;
		font-size: 0.9rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
	}

	.node.done {
		background: var(--color-text-soft);
		color: var(--color-bg);
		border-color: var(--color-text-soft);
	}

	.node.active {
		background: var(--color-text);
		color: var(--color-bg);
		border-color: var(--color-text);
	}

	/* Steps you haven't unlocked yet (a prior step is unanswered) aren't clickable. */
	.node:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.connector {
		width: clamp(1rem, 3vw, 2.5rem);
		height: calc(var(--border-width) / 2);
		background: var(--color-bg-soft);
		flex-shrink: 0;
	}

	.connector.filled {
		background: var(--color-text-soft);
	}

	.step-count {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text-soft);
	}

	/* ── LAYOUT ── */

	.configurator {
		display: grid;
		grid-template-columns: minmax(0, 26rem) 1fr;
		gap: clamp(1.5rem, 4vw, 4rem);
		align-items: start;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.step-title {
		font-size: clamp(1.5rem, 2.4vw, 2rem);
		font-weight: bold;
		letter-spacing: -0.02em;
		margin: 0;
	}

	/* ── COLOR CARDS ── */

	.color-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
		gap: 0.75rem;
	}

	/* Keycap step has 8 colors — lock it to a 4×2 grid with the name under the chip. */
	.color-grid.keycap-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.keycap-grid .color-card {
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
	}

	.color-card {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
		text-align: left;
		padding: 0.85rem 0.9rem;
		border-radius: var(--radius-card);
		border: solid calc(var(--border-width) / 2);
		background: var(--color-bg);
		cursor: pointer;
		font-family: inherit;
		color: var(--color-text);
		transition:
			border-color 0.15s,
			background 0.15s,
			color 0.15s;
	}

	.color-card:hover:not(.selected) {
		border-color: var(--color-text-soft);
	}

	/* Selected color fills in to match the switch cards. */
	.color-card.selected {
		background: var(--color-text);
		border-color: var(--color-text);
		color: var(--color-bg);
	}

	.color-chip {
		width: 1.6rem;
		height: 1.6rem;
		flex-shrink: 0;
		border-radius: var(--radius-pill);
		background: var(--sw);
		border: solid calc(var(--border-width) / 3)
			color-mix(in srgb, var(--color-text) 25%, transparent);
		box-sizing: border-box;
	}

	.color-card.selected .color-chip {
		border-color: color-mix(in srgb, var(--color-bg) 45%, transparent);
	}

	.color-name {
		font-size: 1rem;
		font-weight: 600;
		min-width: 0;
		line-height: 1.2;
		overflow-wrap: anywhere;
	}

	/* ── SWITCH CARDS ── */

	.switch-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.opt-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.2rem;
		text-align: left;
		padding: 1rem 1.25rem;
		border-radius: var(--radius-card);
		border: solid calc(var(--border-width) / 2);
		background: var(--color-bg);
		cursor: pointer;
		font-family: inherit;
		color: var(--color-text);
		transition:
			border-color 0.15s,
			background 0.15s,
			color 0.15s;
	}

	.opt-card:hover:not(.selected) {
		border-color: var(--color-text-soft);
	}

	/* Selected switch fills in so the choice reads clearly. */
	.opt-card.selected {
		background: var(--color-text);
		border-color: var(--color-text);
		color: var(--color-bg);
	}

	.opt-card-name {
		font-size: 1.1rem;
		font-weight: bold;
		letter-spacing: -0.01em;
	}

	.opt-card-desc {
		font-size: 0.9rem;
		color: var(--color-text-soft);
	}

	.opt-card.selected .opt-card-desc {
		color: var(--color-bg);
		opacity: 0.75;
	}

	/* ── NAV BUTTONS ── */

	.nav-row {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.btn-back,
	.btn-next {
		font-size: 0.95rem;
		font-weight: bold;
		font-family: inherit;
		border-radius: var(--radius-pill);
		padding: 0.6rem 1.4rem;
		cursor: pointer;
		border: solid var(--border-width);
	}

	.btn-back {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.btn-back:hover {
		border-style: dotted;
	}

	.btn-next {
		background: var(--color-text);
		color: var(--color-bg);
		border-color: var(--color-text);
		margin-left: auto;
		transition: opacity 0.1s;
	}

	.btn-next:hover:not(:disabled) {
		opacity: 0.85;
	}

	.btn-next:disabled {
		background: var(--color-bg-soft);
		color: var(--color-text-soft);
		border-color: var(--color-bg-soft);
		cursor: not-allowed;
	}

	/* ── SUMMARY ── */

	.summary-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.summary-item {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 0;
		border-bottom: solid calc(var(--border-width) / 4) var(--color-bg-soft);
	}

	.summary-label {
		order: 1;
		font-weight: 600;
		color: var(--color-text-soft);
	}

	.summary-value {
		order: 2;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: bold;
	}

	.summary-dot {
		width: 1.1rem;
		height: 1.1rem;
		border-radius: var(--radius-pill);
		background: var(--sw);
		border: solid calc(var(--border-width) / 4)
			color-mix(in srgb, var(--color-text) 20%, transparent);
		box-sizing: border-box;
	}

	.summary-edit {
		order: 3;
		font-size: 0.8rem;
		font-weight: bold;
		font-family: inherit;
		background: transparent;
		border: none;
		color: var(--color-text-soft);
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
	}

	.summary-edit:hover {
		color: var(--color-text);
	}

	.price-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-top: 0.5rem;
	}

	.price-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-soft);
	}

	.price-value {
		font-size: 1.5rem;
		font-weight: bold;
		letter-spacing: -0.02em;
	}

	.btn-cta {
		margin-left: auto;
	}

	.btn-cta-link {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.order-error {
		margin: -0.25rem 0 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: #c96a6a;
	}

	/* ── LIVE PREVIEW ── */

	.preview {
		position: sticky;
		top: 1.5rem;
	}

	.preview-stage {
		width: 100%;
		aspect-ratio: 1285 / 622;
		border-radius: var(--radius-card);
		/* Light-mode: light grey diagonal stripes. */
		background: repeating-linear-gradient(
			45deg,
			#dedede,
			#dedede 10px,
			#e8e8e8 10px,
			#e8e8e8 20px
		);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(0.75rem, 2vw, 1.75rem);
		box-sizing: border-box;
		overflow: hidden;
	}

	/* Dark-mode: dark grey diagonal stripes. */
	.preview-stage.dark {
		background: repeating-linear-gradient(
			45deg,
			#333333,
			#333333 10px,
			#3d3d3d 10px,
			#3d3d3d 20px
		);
	}

	.onekey-stack {
		position: relative;
		width: 100%;
		aspect-ratio: 1285 / 622;
	}

	.layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.preview-note {
		font-size: 0.95rem;
		font-weight: 600;
		color: #999;
		text-align: center;
		padding: 1rem;
	}

	/* ── RESPONSIVE ── */

	@media (max-width: 820px) {
		.configurator {
			grid-template-columns: 1fr;
		}

		.preview {
			position: static;
			order: -1;
		}
	}
</style>
