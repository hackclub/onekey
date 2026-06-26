<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();
</script>


<div class="admin">
	<div class="header">
		<h1>admin panel</h1>
		<p class="sub">logged in as <strong>@{data.user?.slack_display_name ?? data.user?.nickname ?? data.user?.name ?? data.user?.email}</strong></p>
	</div>

	<form
		method="POST"
		action={data.isLaunched ? '?/lock' : '?/launch'}
		use:enhance
		class="launch-form"
	>
		<button type="submit" class="launch-btn" class:launched={data.isLaunched}>
			{#if data.isLaunched}
				🔓 platform is live - click to lock
			{:else}
				🚀 launch platform
			{/if}
		</button>
	</form>

	<div class="cards">
		<a href="/admin/users" class="card">
			<span class="card-label">users</span>
			<p class="card-desc">view all registered users and their data</p>
		</a>
		<a href="/admin/shop" class="card">
			<span class="card-label">shop</span>
			<p class="card-desc">manage shop categories and items</p>
		</a>
		<a href="/admin/orders" class="card">
			<span class="card-label">orders</span>
			<p class="card-desc">view and fulfill orders (oldest first)</p>
		</a>
		<a href="/admin/reviewers" class="card">
			<span class="card-label">reviewers</span>
			<p class="card-desc">manage who can access review pages</p>
		</a>
		<a href="/admin/guides" class="card">
			<span class="card-label">guides</span>
			<p class="card-desc">view published guides</p>
		</a>
		<a href="/admin/stats" class="card">
			<span class="card-label">stats</span>
			<p class="card-desc">key platform statistics and the submission funnel</p>
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

	.launch-form {
		display: contents;
	}

	.launch-btn {
		font-size: 1rem;
		font-weight: 700;
		font-family: inherit;
		padding: 0.75rem 1.5rem;
		border-radius: 10px;
		border: 2px solid #22c55e;
		background: color-mix(in srgb, #22c55e 15%, transparent);
		color: #22c55e;
		cursor: pointer;
		transition: background 0.15s;
		align-self: flex-start;
	}

	.launch-btn:hover {
		background: color-mix(in srgb, #22c55e 25%, transparent);
	}

	.launch-btn.launched {
		border-color: #ef4444;
		background: color-mix(in srgb, #ef4444 15%, transparent);
		color: #ef4444;
	}

	.launch-btn.launched:hover {
		background: color-mix(in srgb, #ef4444 25%, transparent);
	}
</style>
