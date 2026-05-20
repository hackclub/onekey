<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>onekey - admin</title>
</svelte:head>

<div class="admin">
	<div class="header">
		<h1>admin panel</h1>
		<p class="sub">logged in as <strong>@{data.user?.slack_display_name ?? data.user?.nickname ?? data.user?.name ?? data.user?.email}</strong></p>
	</div>

	<div class="cards">
		<a href="/admin/users" class="card">
			<span class="card-label">users</span>
			<p class="card-desc">view all registered users and their data</p>
		</a>
	</div>
</div>

<style>
	.admin {
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

	.cards {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid #2a2f38;
		border-radius: 10px;
		text-decoration: none;
		color: inherit;
		min-width: 200px;
		transition: border-color 0.15s, background 0.15s;
	}

	.card:hover {
		border-color: #3a3f48;
		background: #0d0f12;
	}

	.card-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #8a8f99;
		font-weight: bold;
	}

	.card-desc {
		margin: 0;
		font-size: 0.9rem;
		color: #cdd0d6;
	}
</style>
