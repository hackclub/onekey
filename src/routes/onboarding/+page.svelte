<script lang="ts">
	const steps = [
		{
			title: 'come up with an idea',
			desc: "we'll help you brainstorm something you're happy with!"
		},
		{
			title: 'make your project',
			desc: 'work on your project over some amount of hours, logging your time using hackatime!'
		},
		{
			title: 'submit your project',
			desc: 'once your project is ready for others to see, share it with other teens doing the same thing!'
		},
		{
			title: 'claim your prize(s)!',
			desc: 'get a customizable one key macropad for 5 hours, or choose any number of prizes from our shop!'
		}
	];
</script>

<h1 class="ob-title">welcome to onekey!</h1>

<section class="ob-card">
	<p class="ob-text">
		for developers, there are a million different things that you could make, but you're never happy
		with what you come up with. but when you limit your options, every idea becomes much more
		creative.
	</p>
	<p class="ob-text">
		onekey restricts you to only one mode of input - a single key on your keyboard. it's up to you
		to turn this key into unlimited possibilities.
	</p>
</section>

<section class="ob-card">
	<span class="ob-card-label">how it works</span>
	<ol class="steps-row">
		{#each steps as step, i (step.title)}
			<li class="step">
				<span class="step-num">{i + 1}</span>
				<h3 class="step-title">{step.title}</h3>
				<p class="step-desc">{step.desc}</p>
			</li>
		{/each}
	</ol>
</section>

<a href="/onboarding/setup" class="ob-next">
	let's go!
	<svg
		fill-rule="evenodd"
		clip-rule="evenodd"
		stroke-linejoin="round"
		stroke-miterlimit="1.414"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
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

<style>
	.steps-row {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: clamp(0.85rem, 1.6vw, 1.5rem);
	}

	.step {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.step-num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.85rem;
		height: 1.85rem;
		border-radius: 50%;
		background: var(--color-text);
		color: var(--color-bg);
		font-weight: bold;
		font-size: 0.95rem;
		margin-bottom: 0.35rem;
	}

	.step-title {
		font-size: clamp(0.95rem, 1.1vw, 1.2rem);
		font-weight: bold;
		letter-spacing: -0.01em;
		line-height: 1.15;
		margin: 0;
	}

	.step-desc {
		font-size: clamp(0.8rem, 0.95vw, 1rem);
		line-height: 1.45;
		color: var(--color-text-soft);
		margin: 0;
	}

	@media (max-width: 767px) {
		.steps-row {
			grid-template-columns: 1fr 1fr;
			gap: 1.25rem;
		}
	}
</style>
