<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>onekey - reviewer</title>
</svelte:head>

<div class="reviewer">
	<div class="header">
		<h1>review panel</h1>
		<p class="sub">
			logged in as <strong>{data.user?.nickname ?? data.user?.name ?? data.user?.email}</strong>
		</p>
	</div>

	<div class="placeholder">
		<p>nothing here yet.</p>
	</div>
</div>

<style>
	.reviewer {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.header h1 {
		font-size: clamp(1.6rem, 3vw, 2.4rem);
		font-weight: 700;
		margin: 0 0 0.25rem;
		letter-spacing: -0.01em;
	}

	.sub {
		font-size: 0.95rem;
		color: #8a8f99;
		margin: 0;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px dashed #2a2f38;
		border-radius: 12px;
		padding: 4rem 2rem;
		color: #8a8f99;
		font-size: 0.95rem;
	}

	.placeholder p {
		margin: 0;
	}
</style>
