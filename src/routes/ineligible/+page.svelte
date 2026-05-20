<svelte:head>
	<title>onekey - not eligible</title>
</svelte:head>

<div class="page">
	<h1 class="heading">not eligible</h1>
	<p class="body">your hack club account is not marked as ysws eligible. onekey is only open to verified hack clubbers aged 13-18.</p>
	<p class="body">if you think this is a mistake, check your verification status at <a href="https://auth.hackclub.com">auth.hackclub.com</a> or reach out in the hack club slack.</p>
	<a href="/" class="back">back to landing</a>
</div>

<style>
	.page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 4rem;
		max-width: 40rem;
	}

	.heading {
		font-size: clamp(2.5rem, 5vw, 5rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0 0 1.5rem;
	}

	.body {
		font-size: 1.1rem;
		color: #555;
		margin: 0 0 1rem;
		line-height: 1.6;
	}

	.back {
		margin-top: 2rem;
		font-size: 0.8rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #888;
		text-decoration: none;
		display: inline-block;
	}

	.back:hover {
		color: black;
	}
</style>
