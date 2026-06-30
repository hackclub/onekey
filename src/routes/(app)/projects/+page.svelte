<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { formatHours } from '$lib/format';

	let { data, form } = $props();

	const clockSvg = `<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor" stroke="currentColor" stroke-width="1.5" paint-order="stroke fill"><path d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"/><path d="M15.64 17a1 1 0 0 1-1-1V9a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1z"/><path d="M21.702 19.502a1 1 0 0 1-1.366.366l-5.196-3a1 1 0 0 1 1-1.732l5.196 3a1 1 0 0 1 .366 1.366z"/></svg>`;

	let showErrorToast = $state(page.url.searchParams.get('error') === 'not_found');
	let errorToastTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (showErrorToast) {
			errorToastTimer = setTimeout(() => (showErrorToast = false), 3500);
			return () => clearTimeout(errorToastTimer);
		}
	});

	let creating = $state(page.url.searchParams.get('new') === '1');
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

	function handleUrlBlur(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const val = input.value.trim();
		if (!val) {
			input.setCustomValidity('');
			return;
		}
		const withProtocol =
			val.startsWith('http://') || val.startsWith('https://') ? val : 'https://' + val;
		input.value = withProtocol;
		try {
			const url = new URL(withProtocol);
			if (!url.hostname.includes('.')) {
				input.setCustomValidity('please enter a valid url (e.g. https://example.com)');
				input.reportValidity();
			} else {
				input.setCustomValidity('');
			}
		} catch {
			input.setCustomValidity('please enter a valid url');
			input.reportValidity();
		}
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && creating && closeModal()} />

<div class="page-header">
	<h1 class="heading">your projects</h1>
</div>

<div class="project-grid">
	{#each data.projects as project (project.id)}
		<a href="/projects/{project.id}" class="project-card">
			<div class="project-card-img-wrap">
				{#if project.screenshotUrl}
					<img
						src={project.screenshotUrl}
						alt="{project.name} screenshot"
						class="project-card-img"
					/>
				{/if}
			</div>
			<div class="project-card-top">
				<span class="project-name">{project.name}</span>
				{#if project.totalSeconds > 0}
					<span class="ht-time"
						><span class="ht-icon">{@html clockSvg}</span>{formatHours(project.totalSeconds)}</span
					>
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

{#if showErrorToast}
	<div class="toast toast-error" role="alert">
		this project doesn't exist!
		<button
			class="toast-close"
			onclick={() => {
				showErrorToast = false;
				clearTimeout(errorToastTimer);
			}}>✕</button
		>
	</div>
{/if}

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
							onblur={handleUrlBlur}
						/>
					</label>
					<label class="edit-field">
						<span class="edit-field-label">demo url</span>
						<input
							class="edit-input"
							type="url"
							name="demo_url"
							placeholder="https://..."
							onblur={handleUrlBlur}
						/>
					</label>
				</div>
				<div class="edit-actions">
					<button type="button" class="btn-cancel" onclick={closeModal}>cancel</button>
					<button type="submit" class="btn-save">create</button>
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
		grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
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
		background-color: var(--color-bg);
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
		background: #d9d9d9;
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

	.ht-time {
		font-size: 1.3rem;
		font-weight: bold;
		letter-spacing: -0.02em;
		color: var(--color-text-soft);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.ht-icon {
		display: flex;
		width: 1em;
		height: 1em;
		flex-shrink: 0;
	}

	.ht-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.project-name {
		font-weight: bold;
		font-size: 1.6rem;
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
		justify-content: flex-end;
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
		background: var(--color-text);
		color: var(--color-bg);
		border-color: var(--color-text);
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

	.toast {
		position: fixed;
		top: clamp(0.75rem, 2vw, 1.5rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		font-size: clamp(0.75rem, 1.2vw, 1rem);
		padding: clamp(0.4rem, 0.8vw, 0.7rem) clamp(0.75rem, 1.2vw, 1.25rem);
		border-radius: 9999px;
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 0.8vw, 0.75rem);
		white-space: nowrap;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
	}

	.toast-error {
		background: #3a1a1a;
		color: #c96a6a;
	}

	.toast-close {
		background: none;
		border: none;
		color: inherit;
		font-size: 0.75rem;
		padding: 0;
		cursor: pointer;
		opacity: 0.6;
		line-height: 1;
		font-family: inherit;
	}

	.toast-close:hover {
		opacity: 1;
	}

	.url-disclaimer {
		grid-column: span 2;
		font-size: 1rem;
		color: var(--rail-label);
		margin: 0.5rem 0 -0.5rem;
	}
</style>
