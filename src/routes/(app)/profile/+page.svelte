<svelte:head>
	<title>onekey - profile</title>
</svelte:head>

<p class="eyebrow">account</p>
<h1 class="heading">[name]</h1>

<div class="bento">
	<div class="card card-wide">
		<span class="card-label">details</span>
		<div class="field-list">
			<div class="field">
				<span class="field-key">name</span>
				<span class="field-val">[name]</span>
			</div>
			<div class="field">
				<span class="field-key">email</span>
				<span class="field-val">[email]</span>
			</div>
			<div class="field">
				<span class="field-key">joined</span>
				<span class="field-val">[date]</span>
			</div>
		</div>
	</div>

	<div class="card">
		<span class="card-label">submissions</span>
	</div>

	<div class="card">
		<span class="card-label">rewards</span>
	</div>
</div>

<style>
	.eyebrow {
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--rail-label);
		margin: 0 0;
	}

	.heading {
		font-size: clamp(2.5rem, 3.5vw, 3.5rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0 0 2.5rem;
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

	.card.card-wide {
		grid-column: span 2;
	}

	.card-label {
		display: block;
		font-size: clamp(0.8rem, 0.9vw, 1.1rem);
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--color-text-soft);
		margin-bottom: 1.25rem;
		font-weight: bold;
	}

	.field-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		gap: 1.5rem;
		align-items: baseline;
	}

	.field-key {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		width: 5rem;
		flex-shrink: 0;
	}

	.field-val {
		font-size: 0.95rem;
	}
</style>
