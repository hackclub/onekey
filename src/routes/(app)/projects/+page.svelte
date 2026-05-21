<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let creating = $state(false);
	let closing = $state(false);

	const CLOSE_MS = 160;

	function closeModal() {
		if (closing) return;
		closing = true;
		setTimeout(() => {
			creating = false;
			closing = false;
		}, CLOSE_MS);
	}
</script>

<svelte:head>
	<title>onekey - projects</title>
</svelte:head>

<svelte:window onkeydown={(e) => e.key === 'Escape' && creating && closeModal()} />

<div class="page-header">
	<h1 class="heading">your projects</h1>
</div>

<div class="project-grid">
	{#each data.projects as project (project.id)}
		<a href="/projects/{project.id}" class="project-card">
			{#if project.screenshotUrl}
				<div class="project-card-img-wrap">
					<img
						src={project.screenshotUrl}
						alt="{project.name} screenshot"
						class="project-card-img"
					/>
				</div>
			{/if}
			<div class="project-card-top">
				<span class="project-name">{project.name}</span>
				{#if project.status}
					<span class="status-badge status-{project.status}">{project.status}</span>
				{/if}
			</div>
			{#if project.description}
				<p class="project-desc">{project.description}</p>
			{/if}
		</a>
	{/each}

	<button type="button" class="project-card new-card bordered" onclick={() => (creating = true)}>
		<span class="new-plus">+</span>
		<span class="new-label">new project</span>
	</button>
</div>

{#if creating}
	<div
		class="modal-backdrop"
		class:closing
		role="dialog"
		aria-modal="true"
		aria-label="create project"
		onclick={(e) => e.target === e.currentTarget && closeModal()}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		tabindex="-1"
	>
		<div class="modal-box">
			{#if form?.error}
				<p class="form-error">{form.error}</p>
			{/if}
			<form method="POST" action="?/create" use:enhance class="create-form">
				<div class="create-grid">
					<label class="edit-field edit-field-full">
						<span class="edit-field-label">name <span class="req">*</span></span>
						<input
							class="edit-input"
							type="text"
							name="name"
							placeholder="my cool project"
							required
						/>
					</label>
					<label class="edit-field edit-field-full">
						<span class="edit-field-label">description <span class="req">*</span></span>
						<textarea
							class="edit-input edit-textarea"
							name="description"
							placeholder="what does it do?"
						></textarea>
					</label>
					<p class="url-disclaimer edit-field-full">you don't need to fill these out yet:</p>
					<label class="edit-field">
						<span class="edit-field-label">repo url</span>
						<input
							class="edit-input"
							type="url"
							name="repo_url"
							placeholder="https://github.com/..."
						/>
					</label>
					<label class="edit-field">
						<span class="edit-field-label">demo url</span>
						<input class="edit-input" type="url" name="demo_url" placeholder="https://..." />
					</label>
				</div>
				<div class="edit-actions">
					<button type="submit" class="btn-save">create</button>
					<button type="button" class="btn-cancel" onclick={closeModal}>cancel</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.heading {
		font-size: clamp(2.5rem, 3.5vw, 3.5rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 0;
	}

	.project-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
		gap: clamp(0.75rem, 1.2vw, 1.25rem);
	}

	.project-card {
		background: var(--color-bg);
		border-radius: var(--radius-card);
		border: solid var(--border-width);
		padding: clamp(1.25rem, 2vw, 2rem);
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: border-color 0.15s;
		overflow: hidden;
	}

	.project-card:hover {
		border-color: var(--color-text);
	}

	.project-card-img-wrap {
		width: calc(100% + 2 * clamp(1.25rem, 2vw, 2rem) + 2 * var(--border-width));
		margin: calc(-1 * (clamp(1.25rem, 2vw, 2rem) + var(--border-width)))
			calc(-1 * (clamp(1.25rem, 2vw, 2rem) + var(--border-width))) 0.75rem;
		height: 200px;
		flex-shrink: 0;
	}

	.project-card-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.project-card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.project-name {
		font-weight: bold;
		font-size: 1.4rem;
	}

	.status-badge {
		font-size: 0.6rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		border-radius: var(--radius-pill);
		padding: 0.2em 0.55em;
		flex-shrink: 0;
	}

	.status-pending {
		background: #2a2620;
		color: #c9a84c;
	}
	.status-approved {
		background: #1a2a1a;
		color: #6abf6a;
	}
	.status-rejected {
		background: #2a1a1a;
		color: #c96a6a;
	}

	.project-desc {
		font-size: 1.05rem;
		color: var(--color-text-soft);
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.new-card {
		cursor: pointer;
		font-family: inherit;
		align-items: center;
		justify-content: center;
		min-height: 12rem;
		gap: 0.5rem;
	}

	.new-card:hover {
		border-style: dotted;
		border-color: var(--color-text);
	}

	.new-plus {
		font-size: 3rem;
		font-weight: bold;
		line-height: 1;
		color: var(--color-text-soft);
	}

	.new-label {
		font-size: 0.9rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-soft);
	}

	/* modal */

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
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-backdrop.closing {
		animation: fade-out 0.16s ease forwards;
	}

	.modal-backdrop.closing .modal-box {
		animation: slide-down 0.16s ease forwards;
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
		padding: clamp(2rem, 3.5vw, 4rem);
		width: min(1000px, 90vw);
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

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.create-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}

	.edit-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.edit-field.edit-field-full {
		grid-column: span 2;
	}

	.edit-field-label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text);
		font-weight: 600;
	}

	.edit-input {
		background: transparent;
		border: solid calc(var(--border-width) / 2);
		border-radius: calc(var(--radius-card) / 2);
		padding: 0.65rem 0.9rem;
		font-size: 1.05rem;
		font-family: inherit;
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}

	.edit-input:focus {
		outline: none;
		border-color: var(--color-text);
	}

	.edit-textarea {
		resize: vertical;
		min-height: 7rem;
	}

	.edit-actions {
		display: flex;
		gap: 0.6rem;
		margin-top: 2rem;
	}

	.btn-save,
	.btn-cancel {
		font-size: 1rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.65rem 1.4rem;
		cursor: pointer;
		border: solid var(--border-width);
		font-family: inherit;
	}

	.btn-save {
		background: black;
		color: white;
		border-color: black;
	}

	.btn-cancel {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.btn-cancel:hover {
		border-style: dotted;
	}

	.form-error {
		font-size: 0.8rem;
		color: #c96a6a;
		margin: 0 0 0.75rem;
	}

	.req {
		color: #c96a6a;
	}

	.url-disclaimer {
		grid-column: span 2;
		font-size: 1rem;
		color: var(--rail-label);
		margin: 0.5rem 0 -0.5rem;
	}
</style>
