<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatHours } from '$lib/format';

	let { data, form } = $props();

	let project = $derived(data.project);
	const derivedStatus = $derived(data.derivedStatus);
	const isDraft = $derived(derivedStatus === null);
	const isReviewerOrAdmin = $derived(data.isReviewer || data.isAdmin);

	let reviewAction = $state('comment');
	const reviewFormAction = $derived(
		reviewAction === 'approve' ? '?/approve' : reviewAction === 'reject' ? '?/reject' : '?/comment'
	);
	const reviewActionLabel = $derived(
		reviewAction === 'approve' ? 'approve' : reviewAction === 'reject' ? 'reject' : 'post comment'
	);
	const reviewActionClass = $derived(
		reviewAction === 'approve'
			? 'btn-approve'
			: reviewAction === 'reject'
				? 'btn-reject'
				: 'btn-save'
	);

	const canReship = $derived(
		data.isOwnProject && (derivedStatus === 'approved' || derivedStatus === 'rejected')
	);

	const canEdit = $derived(isDraft || canReship);

	// svelte-ignore state_referenced_locally
	let approvedHoursInput = $state(
		data.latestApproval
			? (Math.ceil((data.latestApproval.newSeconds / 3600) * 100) / 100).toFixed(2)
			: ''
	);
	const approvedHoursConverted = $derived(() => {
		const h = parseFloat(approvedHoursInput);
		if (!isFinite(h) || h <= 0) return null;
		const totalSeconds = Math.floor(h * 3600);
		const hrs = Math.floor(totalSeconds / 3600);
		const mins = Math.floor((totalSeconds % 3600) / 60);
		if (hrs === 0) return `${mins}m`;
		if (mins === 0) return `${hrs}h`;
		return `${hrs}h ${mins}m`;
	});

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

	const CHECKLIST_ITEMS = [
		'my project is open-source and has clean, frequent commits',
		'my project has a detailed README.md that was not written by an AI',
		'my project does not use any buttons other than a single key as input'
	];

	let showCheckModal = $state(false);
	let checkModalAction = $state<'submit' | 'reship'>('submit');
	let modalChecks = $state([false, false, false]);
	let actualSubmitBtnEl = $state<HTMLButtonElement | null>(null);

	const allChecked = $derived(modalChecks.every(Boolean));

	function openCheckModal(action: 'submit' | 'reship') {
		modalChecks = [false, false, false];
		checkModalAction = action;
		showCheckModal = true;
	}

	function closeCheckModal() {
		showCheckModal = false;
	}

	function confirmCheckModal() {
		showCheckModal = false;
		actualSubmitBtnEl?.click();
	}

	function formatDate(d: Date | string) {
		const date = new Date(d);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let screenshotPreview = $state('');
	let screenshotCleared = $state(false);
	let screenshotInput = $state<HTMLInputElement | null>(null);

	type HackatimeProject = { name: string; totalSeconds: number; lastSeen: number };
	let hackatimeProjects = $state<HackatimeProject[]>([]);
	let hackatimeLoading = $state(false);
	let hackatimeError = $state('');

	const MAX_HT_PROJECTS = 3;

	// eslint-disable-next-line svelte/prefer-writable-derived
	let selectedHtProjects = $state<string[]>([]);

	$effect(() => {
		selectedHtProjects = (project.hackatimeProject ?? '')
			.split(',')
			.map((s: string) => s.trim())
			.filter(Boolean);
	});

	$effect(() => {
		if (isDraft) loadHackatimeProjects();
	});

	const htValue = $derived(selectedHtProjects.join(', '));

	function addHtProject(name: string) {
		if (!name || selectedHtProjects.includes(name) || selectedHtProjects.length >= MAX_HT_PROJECTS)
			return;
		selectedHtProjects = [...selectedHtProjects, name];
	}

	function removeHtProject(idx: number) {
		selectedHtProjects = selectedHtProjects.filter((_, i) => i !== idx);
	}

	async function loadHackatimeProjects() {
		if (hackatimeProjects.length || hackatimeLoading) return;
		hackatimeLoading = true;
		hackatimeError = '';
		try {
			const res = await fetch('/api/hackatime/projects');
			if (!res.ok) throw new Error(await res.text());
			const json = await res.json();
			hackatimeProjects = json.projects;
		} catch {
			hackatimeError = 'could not load hackatime projects';
		} finally {
			hackatimeLoading = false;
		}
	}

	function handleFilePick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
		screenshotPreview = file ? URL.createObjectURL(file) : '';
		screenshotCleared = false;
	}

	function clearScreenshot() {
		if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
		screenshotPreview = '';
		screenshotCleared = true;
		if (screenshotInput) screenshotInput.value = '';
	}

	const displayUrl = $derived(
		screenshotCleared ? '' : screenshotPreview || project.screenshotUrl || ''
	);

	let showToast = $state(false);
	let showErrorToast = $state(false);
	let toastTimer: ReturnType<typeof setTimeout>;
	let errorToastTimer: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (form?.success) {
			clearTimeout(toastTimer);
			showToast = true;
			toastTimer = setTimeout(() => (showToast = false), 3500);
		}
	});

	$effect(() => {
		if (form?.error) {
			clearTimeout(errorToastTimer);
			showErrorToast = true;
			errorToastTimer = setTimeout(() => (showErrorToast = false), 3500);
		}
	});
</script>

<svelte:head>
	<title>onekey - {project.name}</title>
</svelte:head>

<a href="/projects" class="back">
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
		class="back-icon"
		><path
			d="M19.768,23.89c0.354,-0.424 0.296,-1.055 -0.128,-1.408c-1.645,-1.377 -5.465,-4.762 -6.774,-6.482c1.331,-1.749 5.1,-5.085 6.774,-6.482c0.424,-0.353 0.482,-0.984 0.128,-1.408c-0.353,-0.425 -0.984,-0.482 -1.409,-0.128c-1.839,1.532 -5.799,4.993 -7.2,6.964c-0.219,0.312 -0.409,0.664 -0.409,1.054c0,0.39 0.19,0.742 0.409,1.053c1.373,1.932 5.399,5.462 7.2,6.964l0.001,0.001c0.424,0.354 1.055,0.296 1.408,-0.128Z"
		/></svg
	>
	back to projects
</a>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="banner"
	role={canEdit ? 'button' : undefined}
	tabindex={canEdit ? 0 : undefined}
	aria-label={canEdit ? 'upload screenshot' : undefined}
	onclick={() => canEdit && screenshotInput?.click()}
	onkeydown={(e) => canEdit && (e.key === 'Enter' || e.key === ' ') && screenshotInput?.click()}
>
	{#if displayUrl}
		<img src={displayUrl} alt="{project.name} screenshot" class="banner-img" />
		{#if canEdit}
			<button
				type="button"
				class="banner-remove"
				aria-label="remove screenshot"
				onclick={(e) => {
					e.stopPropagation();
					clearScreenshot();
				}}>×</button
			>
		{/if}
	{:else}
		<span class="banner-empty">click to add screenshot</span>
	{/if}
	{#if canEdit}
		<div class="banner-overlay" aria-hidden="true">
			<svg
				fill-rule="evenodd"
				clip-rule="evenodd"
				stroke-linejoin="round"
				stroke-miterlimit="1.414"
				xmlns="http://www.w3.org/2000/svg"
				aria-label="camera"
				viewBox="0 0 32 32"
				preserveAspectRatio="xMidYMid meet"
				fill="currentColor"
				class="banner-icon"
			>
				<path
					d="M18.4941 6.96399C18.2617 5.82149 17.2225 4.96399 16.0007 4.96399C14.7784 4.96399 13.7396 5.82149 13.5073 6.96399C13.5007 6.99623 13.4987 7.02713 13.5008 7.05675C4.84338 7.22758 4 8.61743 4 17.036C4 26.203 5 27.036 16 27.036C27 27.036 28 26.203 28 17.036C28 8.61693 27.1565 7.22741 18.4976 7.05672C18.5017 7.02702 18.5006 6.99613 18.4941 6.96399ZM26 17.036C26 19.292 25.95 20.872 25.709 22.084C25.493 23.194 25.176 23.661 24.845 23.937C24.461 24.257 23.751 24.578 22.248 24.78C20.717 24.99 18.726 25.036 16 25.036C13.275 25.036 11.283 24.99 9.752 24.78C8.249 24.578 7.539 24.257 7.155 23.937C6.824 23.661 6.507 23.194 6.291 22.084C6.05 20.872 6 19.292 6 17.036C6 14.78 6.05 13.2 6.291 11.988C6.507 10.878 6.824 10.411 7.155 10.135C7.539 9.81501 8.249 9.49401 9.752 9.29101C11.283 9.08201 13.275 9.03601 16 9.03601C18.726 9.03601 20.717 9.08201 22.248 9.29101C23.751 9.49401 24.461 9.81501 24.845 10.135C25.176 10.411 25.493 10.878 25.709 11.988C25.95 13.2 26 14.78 26 17.036ZM19 17.036C19 18.6929 17.6569 20.036 16 20.036C14.3431 20.036 13 18.6929 13 17.036C13 15.3792 14.3431 14.036 16 14.036C17.6569 14.036 19 15.3792 19 17.036ZM21 17.036C21 19.7974 18.7614 22.036 16 22.036C13.2386 22.036 11 19.7974 11 17.036C11 14.2746 13.2386 12.036 16 12.036C18.7614 12.036 21 14.2746 21 17.036ZM9 13.536C9.829 13.536 10.5 12.864 10.5 12.036C10.5 11.208 9.829 10.536 9 10.536C8.171 10.536 7.5 11.208 7.5 12.036C7.5 12.864 8.171 13.536 9 13.536Z"
				/>
			</svg>
		</div>
	{/if}
</div>

<div class="bento">
	<div class="card card-wide" class:card-full={!isDraft && !canReship}>
		{#if canEdit}
			{#if form?.error}
				<p class="form-error">{form.error}</p>
			{/if}
			<form
				id="save-form"
				method="POST"
				action="?/save"
				enctype="multipart/form-data"
				use:enhance={() =>
					({ update }) =>
						update({ reset: false })}
				class="edit-form"
			>
				<input
					type="hidden"
					name="screenshot_keep"
					value={screenshotCleared ? '' : (project.screenshotUrl ?? '')}
				/>
				<input
					bind:this={screenshotInput}
					name="screenshot1"
					type="file"
					class="file-hidden"
					accept="image/jpeg,image/png,image/gif,image/webp"
					onchange={handleFilePick}
				/>
				<div class="edit-grid">
					<label class="edit-field edit-field-full">
						<span class="edit-field-label">name</span>
						<input class="edit-input" type="text" name="name" value={project.name} required />
					</label>
					<label class="edit-field edit-field-full">
						<span class="edit-field-label">description</span>
						<textarea class="edit-input edit-textarea" name="description"
							>{project.description ?? ''}</textarea
						>
					</label>
					<label class="edit-field">
						<span class="edit-field-label">repo url</span>
						<input
							class="edit-input"
							type="url"
							name="repo_url"
							value={project.repoUrl ?? ''}
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
							value={project.demoUrl ?? ''}
							placeholder="https://..."
							onblur={handleUrlBlur}
						/>
					</label>
					<div class="edit-field edit-field-full">
						<span class="edit-field-label">hackatime projects</span>
						<input type="hidden" name="hackatime_project" value={htValue} />
						<div class="ht-pills">
							{#each selectedHtProjects as name, i (name)}
								{@const seconds = hackatimeProjects.find((p) => p.name === name)?.totalSeconds ?? 0}
								<span class="ht-pill">
									{name}{#if seconds > 0}<span class="ht-pill-time">
											· {formatHours(seconds)}</span
										>{/if}
									<button type="button" class="ht-pill-remove" onclick={() => removeHtProject(i)}
										>×</button
									>
								</span>
							{/each}
							{#if selectedHtProjects.length < MAX_HT_PROJECTS}
								<details
									class="ht-dropdown"
									ontoggle={(e) => e.currentTarget.open && loadHackatimeProjects()}
								>
									<summary class="ht-add-btn">+ add project</summary>
									<div class="ht-dropdown-list">
										{#if hackatimeLoading}
											<span class="ht-dropdown-item ht-dropdown-muted">loading…</span>
										{:else if hackatimeError}
											<span class="ht-dropdown-item ht-dropdown-muted">{hackatimeError}</span>
										{:else if hackatimeProjects.filter((p) => !selectedHtProjects.includes(p.name)).length === 0}
											<span class="ht-dropdown-item ht-dropdown-muted">no projects found</span>
										{:else}
											{#each hackatimeProjects.filter((p) => !selectedHtProjects.includes(p.name)) as hp (hp.name)}
												<button
													type="button"
													class="ht-dropdown-item"
													onclick={(e) => {
														addHtProject(hp.name);
														(e.currentTarget.closest('details') as HTMLDetailsElement).open = false;
													}}>{hp.name} · {formatHours(hp.totalSeconds)}</button
												>
											{/each}
										{/if}
									</div>
								</details>
							{/if}
						</div>
					</div>
					<label class="edit-field edit-field-full">
						<span class="edit-field-label">AI declaration</span>
						<textarea class="edit-input edit-textarea" name="ai_declaration"
							>{project.aiDeclaration ?? ''}</textarea
						>
					</label>
				</div>
				<div class="edit-actions">
					<button type="submit" class="btn-save">save</button>
				</div>
				<button
					type="submit"
					formaction="?/submit"
					style="display:none"
					aria-hidden="true"
					tabindex="-1"
					bind:this={actualSubmitBtnEl}
				></button>
			</form>
		{:else}
			<div class="field-list">
				<div class="field">
					<span class="field-key">name</span>
					<span class="field-val">{project.name}</span>
				</div>
				{#if project.description}
					<div class="field">
						<span class="field-key">description</span>
						<span class="field-val">{project.description}</span>
					</div>
				{/if}
				{#if project.repoUrl}
					<div class="field">
						<span class="field-key">repo</span>
						<span class="field-val">
							<a href={project.repoUrl} target="_blank" rel="noopener noreferrer" class="ext-link"
								>{project.repoUrl}</a
							>
						</span>
					</div>
				{/if}
				{#if project.demoUrl}
					<div class="field">
						<span class="field-key">demo</span>
						<span class="field-val">
							<a href={project.demoUrl} target="_blank" rel="noopener noreferrer" class="ext-link"
								>{project.demoUrl}</a
							>
						</span>
					</div>
				{/if}
				{#if project.hackatimeProject}
					<div class="field">
						<span class="field-key">hackatime</span>
						<div class="field-val ht-pills-readonly">
							{#each project.hackatimeProject
								.split(',')
								.map((s) => s.trim())
								.filter(Boolean) as name (name)}
								<span class="ht-pill ht-pill-static">{name}</span>
							{/each}
						</div>
					</div>
				{/if}
				{#if project.aiDeclaration}
					<div class="field">
						<span class="field-key">AI use</span>
						<span class="field-val">{project.aiDeclaration}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if isDraft}
		<div class="card card-right">
			<span class="card-label">submit</span>
			<p class="danger-desc">ready? submit your project for review.</p>
			{#if form?.error && !form?.success}
				<p class="form-error">{form.error}</p>
			{/if}
			<button type="button" class="btn-submit" onclick={() => openCheckModal('submit')}
				>submit for review</button
			>

			<div class="danger-section has-top">
				<span class="card-label">danger zone</span>
				<p class="danger-desc">permanently delete this project - this cannot be undone.</p>
				<form method="POST" action="?/delete" use:enhance>
					<button type="submit" class="btn-delete">delete project</button>
				</form>
			</div>
		</div>
	{/if}

	{#if canReship}
		<div class="card card-right">
			<span class="card-label">reship</span>
			{#if data.availableSeconds >= 3600}
				<p class="danger-desc">
					you have {formatHours(data.availableSeconds)} of new work to submit.
				</p>
				{#if form?.error && !form?.success}
					<p class="form-error">{form.error}</p>
				{/if}
				<form method="POST" action="?/reship" use:enhance>
					<button type="submit" class="btn-submit">ship again</button>
				</form>
			{:else}
				<p class="danger-desc">
					keep working! you need at least 1 new hour since your last submission{data.availableSeconds >
					0
						? ` (you have ${formatHours(data.availableSeconds)})`
						: ''}.
				</p>
			{/if}
		</div>
	{/if}
</div>

{#if data.approvals.length > 0 || data.events.length > 0 || isReviewerOrAdmin}
	<div class="history">
		<h2 class="history-title">history</h2>

		{#if data.approvals.length > 0 || data.events.length > 0}
			{@const allEvents = [
				...data.approvals.map((a) => ({
					id: `approval-${a.id}`,
					type: 'approval' as const,
					action: a.status === 'pending' ? 'submitted' : a.status,
					time: a.status === 'pending' ? a.submittedAt : (a.reviewedAt ?? a.submittedAt),
					actorAvatar: a.reviewerAvatar,
					actorName: a.reviewerName,
					actorNickname: a.reviewerNickname,
					message: a.publicMessage,
					internalNote: a.internalNote,
					submittedSeconds: a.submittedSeconds,
					newSeconds: a.newSeconds,
					approvedSeconds: a.approvedSeconds,
					isSubmission: a.status === 'pending'
				})),
				...data.events.map((e) => ({
					id: `event-${e.id}`,
					type: 'comment' as const,
					action: e.action,
					time: e.createdAt,
					actorAvatar: e.actorAvatar,
					actorName: e.actorName,
					actorNickname: e.actorNickname,
					message: e.message,
					internalNote: e.internalNote,
					submittedSeconds: null,
					newSeconds: null,
					approvedSeconds: null,
					isSubmission: false
				}))
			]
				.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
				.filter((e) => e.action !== 'comment' || isReviewerOrAdmin)}
			<div class="event-list">
				{#each allEvents as event (event.id)}
					<div class="event">
						<div class="event-meta">
							{#if event.actorAvatar}
								<img class="event-avatar" src={event.actorAvatar} alt="" />
							{:else}
								<div class="event-avatar event-avatar-placeholder"></div>
							{/if}
							{#if event.isSubmission}
								<span class="event-actor">you</span>
							{:else}
								<span class="event-actor"
									>{event.actorNickname ?? event.actorName ?? 'reviewer'}</span
								>
							{/if}
							<span class="event-action event-action-{event.action}">{event.action}</span>
							{#if event.isSubmission && event.newSeconds}
								<span class="event-hours">{formatHours(event.newSeconds)} submitted</span>
							{:else if event.action === 'approved' && event.approvedSeconds}
								<span class="event-hours"
									>{event.newSeconds && event.approvedSeconds < event.newSeconds
										? `${formatHours(event.approvedSeconds)} of ${formatHours(event.newSeconds)}`
										: formatHours(event.approvedSeconds)} approved</span
								>
							{/if}
							<span class="event-time">{formatDate(event.time)}</span>
						</div>
						{#if event.message}
							<p class="event-message">{event.message}</p>
						{/if}
						{#if event.internalNote && isReviewerOrAdmin}
							<p class="event-internal">
								<span class="event-internal-label">internal</span>{event.internalNote}
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if isReviewerOrAdmin}
			<form method="POST" action={reviewFormAction} use:enhance class="comment-form">
				<div class="review-action-row">
					<span class="card-label">action</span>
					<select bind:value={reviewAction} class="review-select">
						<option value="comment">comment</option>
						{#if derivedStatus === 'pending'}
							{#if !data.isOwnProject}
								<option value="approve">approve</option>
							{/if}
							<option value="reject">reject</option>
						{/if}
					</select>
				</div>
				{#if reviewAction === 'approve'}
					<label class="review-hours-label">
						<span class="review-hours-text">hours to approve</span>
						<input
							type="number"
							name="approved_hours"
							class="review-input"
							min="0.01"
							max={data.latestApproval
								? Math.ceil((data.latestApproval.newSeconds / 3600) * 100) / 100
								: undefined}
							bind:value={approvedHoursInput}
							step="0.01"
							required
						/>
						<span class="review-hours-hint">
							{#if approvedHoursConverted()}
								= {approvedHoursConverted()} ·
							{/if}
							submitted: {data.latestApproval ? formatHours(data.latestApproval.newSeconds) : '—'}
						</span>
					</label>
					<textarea class="review-textarea" name="message" placeholder="message to author" required
					></textarea>
					<textarea
						class="review-textarea"
						name="internal_note"
						placeholder="internal note (reviewer-only)"
						required
					></textarea>
				{:else if reviewAction === 'reject'}
					<textarea class="review-textarea" name="message" placeholder="message to author" required
					></textarea>
					<textarea
						class="review-textarea"
						name="internal_note"
						placeholder="internal note (reviewer-only)"
						required
					></textarea>
				{:else}
					<textarea class="review-textarea" name="internal_note" placeholder="internal note"
					></textarea>
				{/if}
				<button type="submit" class={reviewActionClass}>{reviewActionLabel}</button>
			</form>
		{/if}
	</div>
{/if}

{#if showCheckModal}
	<div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="submission checklist">
		<div class="modal-box">
			<h2 class="modal-title">before you {checkModalAction === 'submit' ? 'submit' : 'reship'}</h2>
			<p class="modal-desc">please confirm the following:</p>
			<div class="checklist">
				{#each CHECKLIST_ITEMS as item, i (i)}
					<label class="check-item" class:checked={modalChecks[i]}>
						<input type="checkbox" bind:checked={modalChecks[i]} class="check-input" />
						<span class="check-box" aria-hidden="true">
							<svg
								class="check-svg"
								viewBox="0 0 12 10"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline class="check-mark" points="1.5,5 4.5,8 10.5,1" />
							</svg>
						</span>
						<span class="check-label">{item}</span>
					</label>
				{/each}
			</div>
			<div class="modal-actions">
				<button type="button" class="btn-modal-cancel" onclick={closeCheckModal}>cancel</button>
				<button
					type="button"
					class="btn-modal-confirm"
					onclick={confirmCheckModal}
					disabled={!allChecked}
					>{checkModalAction === 'submit' ? 'submit for review' : 'ship again'}</button
				>
			</div>
		</div>
	</div>
{/if}

{#if showToast}
	<div class="toast" role="alert">
		project saved!
		<button
			class="toast-close"
			onclick={() => {
				showToast = false;
				clearTimeout(toastTimer);
			}}>✕</button
		>
	</div>
{/if}

{#if showErrorToast && form?.error}
	<div class="toast toast-error" role="alert">
		{form.error}
		<button
			class="toast-close"
			onclick={() => {
				showErrorToast = false;
				clearTimeout(errorToastTimer);
			}}>✕</button
		>
	</div>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--rail-label);
		text-decoration: none;
		margin-bottom: 1.25rem;
	}

	.back:hover {
		color: var(--color-text);
	}

	.back-icon {
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
	}

	.banner {
		position: relative;
		width: 100%;
		height: 360px;
		border-radius: var(--radius-card);
		border: solid var(--border-width);
		box-sizing: border-box;
		margin-bottom: clamp(0.75rem, 1.2vw, 1.75rem);
		overflow: hidden;
		background: var(--color-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.banner[role='button']:focus-visible {
		outline: 2px solid var(--color-text);
		outline-offset: 2px;
	}

	.banner-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.banner-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.15s ease;
		pointer-events: none;
	}

	.banner:hover .banner-overlay {
		opacity: 1;
	}

	.banner-icon {
		width: 7rem;
		height: 7rem;
		color: white;
	}

	.banner-remove {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(0, 0, 0, 0.55);
		color: white;
		border: none;
		border-radius: 50%;
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1.9rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
		pointer-events: all;
	}

	.banner-remove:hover {
		background: rgba(0, 0, 0, 0.8);
	}

	.banner-empty {
		font-size: 1.6rem;
		font-weight: bold;
		color: var(--rail-label);
	}

	.file-hidden {
		display: none;
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
		box-sizing: border-box;
	}

	.card.card-wide {
		grid-column: span 2;
	}

	.card.card-full {
		grid-column: span 3;
	}

	.card.card-right {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.card-label {
		display: block;
		font-size: clamp(0.8rem, 0.9vw, 1.1rem);
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--color-text-soft);
		font-weight: bold;
		flex-shrink: 0;
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
		word-break: break-all;
	}

	.ext-link {
		color: var(--color-text-soft);
		font-size: 0.85rem;
	}

	.ext-link:hover {
		color: var(--color-text);
	}

	.edit-form {
		display: flex;
		flex-direction: column;
	}

	.edit-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.edit-field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.edit-field.edit-field-full {
		grid-column: span 2;
	}

	.edit-field-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		font-weight: 500;
	}

	.edit-input {
		background: transparent;
		border: solid calc(var(--border-width) / 2);
		border-radius: calc(var(--radius-card) / 2);
		padding: 0.45rem 0.65rem;
		font-size: 0.9rem;
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
		min-height: 5rem;
	}

	.ht-pills {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}

	.ht-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: var(--color-text);
		color: var(--color-bg);
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.65rem;
		font-size: 0.9rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.ht-pill-time {
		opacity: 0.7;
		font-weight: 400;
	}

	.ht-pill-remove {
		background: none;
		border: none;
		color: inherit;
		font-size: 1rem;
		line-height: 1;
		padding: 0;
		cursor: pointer;
		opacity: 0.6;
		font-family: inherit;
	}

	.ht-pill-remove:hover {
		opacity: 1;
	}

	.ht-pill-static {
		opacity: 1;
	}

	.ht-pills-readonly {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.ht-dropdown {
		position: relative;
	}

	.ht-add-btn {
		list-style: none;
		border: dotted calc(var(--border-width) / 2);
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.65rem;
		font-size: 0.9rem;
		font-family: inherit;
		color: var(--color-text-soft);
		cursor: pointer;
		white-space: nowrap;
		user-select: none;
	}

	.ht-add-btn::-webkit-details-marker {
		display: none;
	}

	.ht-add-btn:hover {
		color: var(--color-text);
		border-color: var(--color-text);
	}

	.ht-dropdown-list {
		position: absolute;
		top: calc(100% + 0.3rem);
		left: 0;
		z-index: 20;
		background: var(--color-bg);
		border: solid var(--border-width);
		border-radius: calc(var(--radius-card) / 2);
		padding: 0.3rem;
		display: flex;
		flex-direction: column;
		min-width: 14rem;
		max-height: 16rem;
		overflow-y: auto;
	}

	.ht-dropdown-item {
		background: none;
		border: none;
		font-family: inherit;
		font-size: 0.85rem;
		color: var(--color-text);
		padding: 0.4rem 0.6rem;
		border-radius: calc(var(--radius-card) / 3);
		cursor: pointer;
		text-align: left;
		white-space: nowrap;
	}

	.ht-dropdown-item:hover {
		background: var(--color-text);
		color: var(--color-bg);
	}

	.ht-dropdown-muted {
		color: var(--rail-label);
		cursor: default;
		font-size: 0.8rem;
	}

	.ht-dropdown-muted:hover {
		background: none;
		color: var(--rail-label);
	}

	.edit-actions {
		display: flex;
		gap: 0.6rem;
		margin-top: 1rem;
	}

	.btn-save {
		font-size: 0.85rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		border: solid var(--border-width) var(--color-text);
		font-family: inherit;
		background: var(--color-text);
		color: var(--color-bg);
		transition: none;
	}

	.btn-submit {
		font-size: 0.85rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		border: solid var(--border-width) var(--color-text);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
		width: 100%;
		transition:
			0.3s color,
			0.3s background-color;
	}

	.btn-submit:hover {
		background: var(--color-text);
		color: var(--color-bg);
		border-color: var(--color-text);
	}

	.danger-section {
		margin-top: auto;
	}

	.danger-section.has-top {
		padding-top: 1.5rem;
		margin-top: 1.5rem;
		border-top: solid calc(var(--border-width) / 2) #3a1a1a;
	}

	.danger-desc {
		font-size: 0.85rem;
		color: var(--rail-label);
		margin: 0.5rem 0 1rem;
	}

	.btn-delete {
		font-size: 0.85rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		border: solid var(--border-width) #c96a6a;
		font-family: inherit;
		background: transparent;
		color: #c96a6a;
		width: 100%;
		transition:
			0.3s color,
			0.3s background-color;
	}

	.btn-delete:hover {
		background: #c96a6a;
		color: white;
	}

	.btn-approve {
		font-size: 0.85rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		border: solid var(--border-width) #6abf6a;
		font-family: inherit;
		background: #6abf6a;
		color: black;
		width: 100%;
		transition: none;
	}

	.danger-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.danger-section.has-top {
		margin-top: 1.25rem;
		padding-top: 1.25rem;
		border-top: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
	}

	.btn-reject {
		font-size: 0.85rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		border: solid var(--border-width) #c9a84c;
		font-family: inherit;
		background: #c9a84c;
		color: black;
		width: 100%;
		transition: none;
	}

	.form-error {
		font-size: 0.8rem;
		color: #c96a6a;
		margin: 0 0 0.75rem;
	}

	.toast {
		position: fixed;
		top: clamp(0.75rem, 2vw, 1.5rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		background: #1a3a1a;
		color: #6abf6a;
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

	.review-action-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.review-select {
		background: transparent;
		border: solid calc(var(--border-width) / 2);
		border-radius: var(--radius-pill);
		padding: 0.25rem 0.6rem;
		font-size: 0.8rem;
		font-family: inherit;
		color: var(--color-text);
		cursor: pointer;
	}

	.review-select:focus {
		outline: none;
		border-color: var(--color-text);
	}

	.review-textarea {
		background: transparent;
		border: solid calc(var(--border-width) / 2);
		border-radius: calc(var(--radius-card) / 2);
		padding: 0.45rem 0.65rem;
		font-size: 0.8rem;
		font-family: inherit;
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
		resize: vertical;
		min-height: 3.5rem;
	}

	.review-textarea:focus {
		outline: none;
		border-color: var(--color-text);
	}

	.review-textarea::placeholder {
		color: var(--rail-label);
	}

	.history {
		margin-top: clamp(1.5rem, 2.5vw, 2.5rem);
	}

	.history-title {
		font-size: clamp(1rem, 1.2vw, 1.4rem);
		font-weight: bold;
		margin: 0 0 1rem;
		color: var(--color-text);
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.event {
		background: var(--color-bg);
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		padding: clamp(0.75rem, 1vw, 1.25rem);
	}

	.event-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.event-avatar {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.event-avatar-placeholder {
		background: var(--color-bg-soft);
		border: solid calc(var(--border-width) / 2);
	}

	.event-actor {
		font-size: 0.85rem;
		font-weight: 600;
	}

	.event-action {
		font-size: 0.65rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		border-radius: var(--radius-pill);
		padding: 0.15em 0.5em;
	}

	.event-action-submitted {
		background: #1a2a3a;
		color: #6aaabf;
	}
	.event-action-approved {
		background: #1a2a1a;
		color: #6abf6a;
	}
	.event-action-rejected {
		background: #2a1a1a;
		color: #c96a6a;
	}
	.event-action-comment {
		background: #2a2620;
		color: #c9a84c;
	}

	.event-time {
		font-size: 0.75rem;
		color: var(--rail-label);
		margin-left: auto;
	}

	.event-hours {
		font-size: 0.75rem;
		color: var(--color-text-soft);
		font-weight: 500;
	}

	.event-message {
		font-size: 0.85rem;
		margin: 0.6rem 0 0;
		line-height: 1.5;
	}

	.event-internal {
		font-size: 0.8rem;
		margin: 0.5rem 0 0;
		padding: 0.4rem 0.6rem;
		background: color-mix(in srgb, #c9a84c 8%, transparent);
		border-left: 2px solid #c9a84c;
		border-radius: 0 calc(var(--radius-card) / 3) calc(var(--radius-card) / 3) 0;
		color: var(--color-text-soft);
		line-height: 1.5;
	}

	.event-internal-label {
		font-size: 0.65rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #c9a84c;
		margin-right: 0.5rem;
	}

	.comment-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: var(--color-bg);
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		padding: clamp(0.75rem, 1vw, 1.25rem);
	}

	.comment-form .card-label {
		margin-bottom: 0.25rem;
	}

	.review-hours-label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.review-hours-text {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		font-weight: 500;
	}

	.review-input {
		background: transparent;
		border: solid calc(var(--border-width) / 2);
		border-radius: calc(var(--radius-card) / 2);
		padding: 0.35rem 0.65rem;
		font-size: 0.9rem;
		font-family: inherit;
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
	}

	.review-input:focus {
		outline: none;
		border-color: var(--color-text);
	}

	.review-hours-hint {
		font-size: 0.7rem;
		color: var(--rail-label);
	}

	/* submission checklist modal */

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(4px);
	}

	.modal-box {
		background: var(--color-bg);
		border: solid var(--border-width);
		border-radius: var(--radius-card);
		padding: clamp(1.5rem, 3vw, 2.5rem);
		width: min(540px, 90vw);
		max-height: 90vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.modal-title {
		font-size: clamp(1.4rem, 2vw, 1.8rem);
		font-weight: bold;
		letter-spacing: -0.03em;
		margin: 0;
	}

	.modal-desc {
		font-size: 0.85rem;
		color: var(--color-text-soft);
		margin: 0;
	}

	.checklist {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.check-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		border: solid calc(var(--border-width) / 2);
		border-radius: calc(var(--radius-card) / 1.5);
		cursor: pointer;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.check-item.checked {
		border-color: color-mix(in srgb, var(--color-text) 40%, transparent);
		background: color-mix(in srgb, var(--color-text) 6%, transparent);
	}

	.check-item.checked {
		border-color: var(--color-text);
	}

	.check-input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
		margin: -1px;
		pointer-events: none;
	}

	.check-box {
		flex-shrink: 0;
		width: 1rem;
		height: 1rem;
		border: solid var(--border-width) color-mix(in srgb, var(--color-text) 35%, transparent);
		border-radius: 5px;
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-bg);
		margin-top: 0;
		transition:
			background 0.15s,
			border-color 0.15s,
			transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.check-item.checked .check-box {
		background: var(--color-text);
		border-color: var(--color-text);
		transform: scale(1.08);
	}

	.check-input:focus-visible + .check-box {
		outline: 2px solid var(--color-text);
		outline-offset: 2px;
	}

	.check-svg {
		width: 0.85rem;
		height: 0.85rem;
	}

	.check-mark {
		stroke-dasharray: 15;
		stroke-dashoffset: 15;
		transition: stroke-dashoffset 0.22s ease 0.06s;
	}

	.check-item.checked .check-mark {
		stroke-dashoffset: 0;
	}

	.check-label {
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.ai-label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.ai-label-text {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--rail-label);
		font-weight: 500;
	}

	.ai-label-hint {
		font-size: 0.8rem;
		color: var(--color-text-soft);
	}

	.ai-textarea {
		background: transparent;
		border: solid calc(var(--border-width) / 2);
		border-radius: calc(var(--radius-card) / 2);
		padding: 0.45rem 0.65rem;
		font-size: 0.9rem;
		font-family: inherit;
		color: var(--color-text);
		width: 100%;
		box-sizing: border-box;
		resize: vertical;
		min-height: 5rem;
		margin-top: 0.15rem;
	}

	.ai-textarea:focus {
		outline: none;
		border-color: var(--color-text);
	}

	.ai-textarea::placeholder {
		color: var(--rail-label);
	}

	.modal-actions {
		display: flex;
		gap: 0.6rem;
		justify-content: flex-end;
	}

	.btn-modal-cancel {
		font-size: 0.85rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		border: solid var(--border-width);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text);
	}

	.btn-modal-cancel:hover {
		border-style: dotted;
	}

	.btn-modal-confirm {
		font-size: 0.85rem;
		font-weight: bold;
		border-radius: var(--radius-pill);
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		border: solid var(--border-width) var(--color-text);
		font-family: inherit;
		background: var(--color-text);
		color: var(--color-bg);
	}

	.btn-modal-confirm:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.req {
		color: #c96a6a;
	}
</style>
