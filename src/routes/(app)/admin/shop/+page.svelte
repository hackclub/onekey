<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatHours } from '$lib/format';

	let { data, form } = $props();

	type Category = typeof data.categories[number];
	type Item = Category['items'][number];

	let editingCatId = $state<number | null>(null);
	let editingItemId = $state<number | null>(null);

	function optionsToText(optionsJson: string): string {
		try {
			const opts = JSON.parse(optionsJson) as Array<{
				label: string;
				choices: Array<string | { name: string; imageUrl?: string }>;
			}>;
			return opts
				.map((o) => {
					const choices = o.choices
						.map((c) => {
							if (typeof c === 'string') return c;
							return c.imageUrl ? `${c.name}|${c.imageUrl}` : c.name;
						})
						.join(', ');
					return `${o.label}: ${choices}`;
				})
				.join('\n');
		} catch {
			return '';
		}
	}
</script>


<div class="admin-shop">
	<div class="page-header">
		<a href="/admin" class="back-link">← admin</a>
		<h1>shop management</h1>
	</div>

	{#if form?.error}
		<p class="form-error">{form.error}</p>
	{/if}

	<div class="panels">
		<!-- CATEGORIES PANEL -->
		<section class="panel">
			<h2 class="panel-title">categories</h2>

			{#each data.categories as cat (cat.id)}
				<div class="row">
					{#if editingCatId === cat.id}
						<form method="POST" action="?/updateCategory" use:enhance={() => ({ update }) => { editingCatId = null; update(); }} class="edit-form">
							<input type="hidden" name="id" value={cat.id} />
							<input class="input" type="text" name="name" value={cat.name} placeholder="name" required />
							<input class="input" type="text" name="description" value={cat.description ?? ''} placeholder="description" />
							<input class="input input-sm" type="number" name="sort_order" value={cat.sortOrder} placeholder="sort order" min="0" />
							<div class="row-actions">
								<button type="submit" class="btn btn-save">save</button>
								<button type="button" class="btn btn-cancel" onclick={() => editingCatId = null}>cancel</button>
							</div>
						</form>
					{:else}
						<div class="row-info">
							<span class="row-name">{cat.name}</span>
							{#if cat.description}<span class="row-desc">{cat.description}</span>{/if}
							<span class="row-meta">sort: {cat.sortOrder} · {cat.items.length} items · id: {cat.id}</span>
						</div>
						<div class="row-actions">
							<button type="button" class="btn btn-edit" onclick={() => editingCatId = cat.id}>edit</button>
							<form method="POST" action="?/deleteCategory" use:enhance>
								<input type="hidden" name="id" value={cat.id} />
								<button type="submit" class="btn btn-delete" onclick={(e) => { if (!confirm('delete this category and all its items?')) e.preventDefault(); }}>delete</button>
							</form>
						</div>
					{/if}
				</div>
			{/each}

			<form method="POST" action="?/createCategory" use:enhance class="add-form">
				<h3 class="add-title">add category</h3>
				<input class="input" type="text" name="name" placeholder="name" required />
				<input class="input" type="text" name="description" placeholder="description (optional)" />
				<input class="input input-sm" type="number" name="sort_order" placeholder="sort order (0)" min="0" value="0" />
				<button type="submit" class="btn btn-add">add category</button>
			</form>
		</section>

		<!-- ITEMS PANEL -->
		<section class="panel">
			<h2 class="panel-title">items</h2>

			{#each data.categories as cat (cat.id)}
				{#if cat.items.length > 0}
					<div class="cat-group">
						<span class="cat-group-label">{cat.name}</span>
						{#each cat.items as item (item.id)}
							<div class="row" class:unavailable={!item.available}>
								{#if editingItemId === item.id}
									<form method="POST" action="?/updateItem" use:enhance={() => ({ update }) => { editingItemId = null; update(); }} class="edit-form">
										<input type="hidden" name="id" value={item.id} />
										<select class="input" name="category_id" required>
											{#each data.categories as c (c.id)}
												<option value={c.id} selected={c.id === item.categoryId}>{c.name}</option>
											{/each}
										</select>
										<input class="input" type="text" name="name" value={item.name} placeholder="name" required />
										<input class="input" type="text" name="description" value={item.description ?? ''} placeholder="description" />
										<input class="input input-sm" type="number" name="price_hours" value={(item.priceSeconds / 3600).toFixed(1)} step="0.5" min="0.5" placeholder="price (hours)" required />
										<input class="input" type="url" name="image_url" value={item.imageUrl ?? ''} placeholder="image url (optional)" />
										<input class="input input-sm" type="number" name="stock" value={item.stock} placeholder="stock (-1 = unlimited)" />
										<textarea class="input input-textarea" name="options" placeholder={"options (one per line):\nColor: red|https://cdn.../red.png, blue|https://cdn.../blue.png, black\nSize: S, M, L"}>{optionsToText(item.options)}</textarea>
										<label class="check-label">
											<input type="hidden" name="available" value="false" disabled={item.available} />
											<input type="checkbox" name="available" value="true" checked={item.available} onchange={(e) => { const hidden = e.currentTarget.form?.querySelector('input[name="available"][type="hidden"]') as HTMLInputElement; if (hidden) hidden.disabled = e.currentTarget.checked; }} />
											available
										</label>
										<div class="row-actions">
											<button type="submit" class="btn btn-save">save</button>
											<button type="button" class="btn btn-cancel" onclick={() => editingItemId = null}>cancel</button>
										</div>
									</form>
								{:else}
									<div class="row-info">
										<span class="row-name">{item.name}</span>
										{#if item.description}<span class="row-desc">{item.description}</span>{/if}
										<span class="row-meta">
											{formatHours(item.priceSeconds)}
											· stock: {item.stock === -1 ? '∞' : item.stock}
											{#if !item.available}<span class="badge-unavail">unavailable</span>{/if}
											· id: {item.id}
										</span>
									</div>
									<div class="row-actions">
										<button type="button" class="btn btn-edit" onclick={() => editingItemId = item.id}>edit</button>
										<form method="POST" action="?/deleteItem" use:enhance>
											<input type="hidden" name="id" value={item.id} />
											<button type="submit" class="btn btn-delete" onclick={(e) => { if (!confirm('delete this item?')) e.preventDefault(); }}>delete</button>
										</form>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/each}

			{#if data.categories.length === 0}
				<p class="empty">create a category first.</p>
			{:else}
				<form method="POST" action="?/createItem" use:enhance class="add-form">
					<h3 class="add-title">add item</h3>
					<select class="input" name="category_id" required>
						<option value="" disabled selected>select category</option>
						{#each data.categories as cat (cat.id)}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
					<input class="input" type="text" name="name" placeholder="name" required />
					<input class="input" type="text" name="description" placeholder="description (optional)" />
					<input class="input input-sm" type="number" name="price_hours" step="0.5" min="0.5" placeholder="price in hours (e.g. 2)" required />
					<input class="input" type="url" name="image_url" placeholder="image url (optional)" />
					<input class="input input-sm" type="number" name="stock" placeholder="stock (-1 = unlimited)" value="-1" />
					<textarea class="input input-textarea" name="options" placeholder={"options (one per line):\nColor: red|https://cdn.../red.png, blue|https://cdn.../blue.png, black\nSize: S, M, L"}></textarea>
					<button type="submit" class="btn btn-add">add item</button>
				</form>
			{/if}
		</section>
	</div>
</div>

<style>
	.admin-shop {
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

	.form-error {
		color: #ff6b6b;
		font-size: 0.9rem;
		margin: 0;
	}

	.panels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 900px) {
		.panels { grid-template-columns: 1fr; }
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.panel-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-soft);
		font-weight: bold;
		margin: 0 0 0.5rem;
	}

	.row {
		border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.row.unavailable {
		opacity: 0.5;
	}

	.row-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	.row-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.row-desc {
		font-size: 0.8rem;
		color: var(--color-text-soft);
	}

	.row-meta {
		font-size: 0.75rem;
		color: var(--color-text-soft);
		opacity: 0.6;
		font-family: monospace;
	}

	.badge-unavail {
		color: #ff9a3c;
		font-weight: bold;
	}

	.row-actions {
		display: flex;
		gap: 0.4rem;
		flex-shrink: 0;
		align-items: center;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		width: 100%;
	}

	.input {
		background: var(--color-bg-soft);
		border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent);
		border-radius: 6px;
		padding: 0.4rem 0.6rem;
		color: var(--color-text);
		font-size: 0.85rem;
		font-family: inherit;
		width: 100%;
		box-sizing: border-box;
	}

	.input:focus {
		outline: none;
		border-color: color-mix(in srgb, var(--color-text) 40%, transparent);
	}

	.input-sm { max-width: 120px; }
	.input-textarea { resize: vertical; min-height: 70px; font-family: monospace; font-size: 0.8rem; }

	.check-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--color-text-soft);
		cursor: pointer;
	}

	.btn {
		font-size: 0.78rem;
		padding: 0.3rem 0.65rem;
		border-radius: 5px;
		cursor: pointer;
		border: 1px solid transparent;
		font-family: inherit;
		white-space: nowrap;
	}

	.btn-edit { background: var(--color-bg-soft); border-color: color-mix(in srgb, var(--color-text) 20%, transparent); color: var(--color-text); }
	.btn-edit:hover { border-color: color-mix(in srgb, var(--color-text) 40%, transparent); }
	.btn-save { background: color-mix(in srgb, #22c55e 15%, var(--color-bg)); border-color: color-mix(in srgb, #22c55e 35%, transparent); color: #22c55e; }
	.btn-save:hover { background: color-mix(in srgb, #22c55e 25%, var(--color-bg)); }
	.btn-cancel { background: var(--color-bg-soft); border-color: color-mix(in srgb, var(--color-text) 20%, transparent); color: var(--color-text-soft); }
	.btn-cancel:hover { color: var(--color-text); }
	.btn-delete { background: color-mix(in srgb, #ef4444 15%, var(--color-bg)); border-color: color-mix(in srgb, #ef4444 35%, transparent); color: #ef4444; }
	.btn-delete:hover { background: color-mix(in srgb, #ef4444 25%, var(--color-bg)); }
	.btn-add { background: var(--color-bg-soft); border-color: color-mix(in srgb, var(--color-text) 20%, transparent); color: var(--color-text); align-self: flex-start; }
	.btn-add:hover { border-color: color-mix(in srgb, var(--color-text) 40%, transparent); }

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
	}

	.add-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-soft);
		opacity: 0.7;
		margin: 0 0 0.25rem;
	}

	.cat-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}

	.cat-group-label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-soft);
		opacity: 0.7;
		padding-left: 0.25rem;
	}

	.empty {
		color: var(--color-text-soft);
		font-size: 0.9rem;
		margin: 0;
	}
</style>
