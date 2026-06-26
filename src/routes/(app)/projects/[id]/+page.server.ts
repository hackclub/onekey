import { redirect, error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import {
	projects,
	users,
	projectEvents,
	projectApprovals,
	projectExploreSnapshots,
	approvedSubmissions
} from '$lib/server/db/schema';
import { eq, and, ne, asc, desc, count, notExists, gt, sql, sum } from 'drizzle-orm';
import { sendSlackDM, inviteToChannel } from '$lib/server/slack';
import { uploadImageBlob } from '$lib/server/cdn';
import { createAirtableApprovalRecord } from '$lib/server/airtable';
import { decryptToken } from '$lib/server/session';
import { decideEligibility, isEligibleDecision, eligibilityMessage } from '$lib/server/eligibility';
import { checkYswsStatus } from '$lib/server/verification';

const HACKATIME_BASE_URL = 'https://hackatime.hackclub.com';
const DEV_ENCRYPTION_KEY = '0'.repeat(64);

async function getDbUser(hcaId: string) {
	const [row] = await db.select().from(users).where(eq(users.hcaId, hcaId)).limit(1);
	return row ?? null;
}

async function getHackatimeSeconds(
	dbUser: typeof users.$inferSelect,
	projectNames: string[]
): Promise<number> {
	if (!projectNames.length) return 0;
	if (!dbUser.hackatimeTokenCt || !dbUser.hackatimeTokenIv || !dbUser.hackatimeTokenTag) return 0;

	const encKey = Buffer.from(env.TOKEN_ENCRYPTION_KEY || (dev ? DEV_ENCRYPTION_KEY : ''), 'hex');
	const accessToken = decryptToken(
		dbUser.hackatimeTokenCt,
		dbUser.hackatimeTokenIv,
		dbUser.hackatimeTokenTag,
		encKey
	);

	const res = await fetch(`${HACKATIME_BASE_URL}/api/v1/authenticated/projects`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!res.ok) return 0;

	const data = await res.json();
	const raw: any[] = Array.isArray(data) ? data : (data.data ?? data.projects ?? []);
	const nameSet = new Set(projectNames);
	return raw
		.filter((p: any) => nameSet.has(String(p.name ?? '')))
		.reduce((sum: number, p: any) => sum + Number(p.total_seconds ?? p.totalSeconds ?? 0), 0);
}

async function getLatestApproval(projectId: number) {
	const [row] = await db
		.select()
		.from(projectApprovals)
		.where(eq(projectApprovals.projectId, projectId))
		.orderBy(desc(projectApprovals.submittedAt))
		.limit(1);
	return row ?? null;
}

export async function load({ locals, params }) {
	if (!locals.user) redirect(302, '/login');

	const id = parseInt(params.id, 10);
	if (isNaN(id)) error(404, 'project not found');

	const dbUser = await getDbUser(locals.user.sub);
	if (!dbUser) redirect(302, '/login');

	const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

	if (!project || (!locals.isReviewer && project.userId !== dbUser.id)) {
		redirect(302, '/projects?error=not_found');
	}

	const approvals = await db
		.select({
			id: projectApprovals.id,
			status: projectApprovals.status,
			submittedSeconds: projectApprovals.submittedSeconds,
			approvedSeconds: projectApprovals.approvedSeconds,
			publicMessage: projectApprovals.publicMessage,
			internalNote: projectApprovals.internalNote,
			submittedAt: projectApprovals.submittedAt,
			reviewedAt: projectApprovals.reviewedAt,
			reviewerName: users.name,
			reviewerNickname: users.nickname,
			reviewerAvatar: users.slackAvatarUrl
		})
		.from(projectApprovals)
		.leftJoin(users, eq(projectApprovals.reviewerId, users.id))
		.where(eq(projectApprovals.projectId, id))
		.orderBy(asc(projectApprovals.submittedAt));

	const approvalsWithDelta = approvals.map((a, i) => {
		const lastApproved = approvals
			.slice(0, i)
			.reverse()
			.find((prev) => prev.status === 'approved');
		const baseline = lastApproved?.submittedSeconds ?? 0;
		return { ...a, newSeconds: a.submittedSeconds - baseline };
	});

	// soft_approved is internal-only — non-reviewers/admins see it as still pending.
	// Relabel (rather than hide) the soft_approved approval so the author lands on the
	// pending view; hiding it would expose a stale approved/rejected status and wrongly
	// surface the reship/submit view while final confirmation is outstanding.
	const isInternal = locals.isReviewer || locals.isAdmin;
	const visibleApprovals = isInternal
		? approvalsWithDelta
		: approvalsWithDelta.map((a) => {
				if (a.status === 'soft_approved') {
					return {
						...a,
						status: 'pending',
						approvedSeconds: null,
						publicMessage: null,
						internalNote: null,
						reviewedAt: null,
						reviewerName: null,
						reviewerNickname: null,
						reviewerAvatar: null
					};
				}
				return { ...a, internalNote: null };
			});

	const latestApproval =
		visibleApprovals.length > 0 ? visibleApprovals[visibleApprovals.length - 1] : null;
	const derivedStatus: string | null = latestApproval?.status ?? null;

	const events = await db
		.select({
			id: projectEvents.id,
			action: projectEvents.action,
			message: projectEvents.message,
			internalNote: projectEvents.internalNote,
			createdAt: projectEvents.createdAt,
			actorName: users.name,
			actorNickname: users.nickname,
			actorAvatar: users.slackAvatarUrl
		})
		.from(projectEvents)
		.innerJoin(users, eq(projectEvents.actorId, users.id))
		.where(eq(projectEvents.projectId, id))
		.orderBy(asc(projectEvents.createdAt));

	let availableSeconds = 0;
	if (
		(derivedStatus === 'approved' || derivedStatus === 'rejected') &&
		latestApproval &&
		project.userId === dbUser.id
	) {
		const ownerUser = await db
			.select()
			.from(users)
			.where(eq(users.id, project.userId))
			.limit(1)
			.then((r) => r[0]);
		const projectNames = (project.hackatimeProject ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		const currentSeconds = await getHackatimeSeconds(ownerUser, projectNames);
		// After a rejection, measure new work against the last *approved* submission so
		// the rejected hours remain available for resubmission.
		const lastApproved = [...approvalsWithDelta].reverse().find((a) => a.status === 'approved');
		const baselineSeconds =
			derivedStatus === 'rejected'
				? (lastApproved?.submittedSeconds ?? 0)
				: latestApproval.submittedSeconds;
		availableSeconds = currentSeconds - baselineSeconds;
	}

	const linkedRows = await db
		.select({ hackatimeProject: projects.hackatimeProject })
		.from(projects)
		.where(and(ne(projects.id, id), eq(projects.userId, dbUser.id)));
	const linkedHackatimeProjects = linkedRows.flatMap((r) =>
		r.hackatimeProject
			? r.hackatimeProject
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: []
	);

	const [projectOwnerRow] = await db
		.select({
			name: users.name,
			nickname: users.nickname,
			avatar: users.slackAvatarUrl
		})
		.from(users)
		.where(eq(users.id, project.userId))
		.limit(1);

	const visibleEvents = isInternal
		? events
		: events
				.filter((e) => e.action !== 'soft_approved')
				.map(({ internalNote: _n, ...rest }) => ({ ...rest, internalNote: null }));

	return {
		project,
		approvals: visibleApprovals,
		events: visibleEvents,
		latestApproval,
		derivedStatus,
		availableSeconds,
		linkedHackatimeProjects,
		projectOwner: projectOwnerRow ?? null,
		isReviewer: locals.isReviewer,
		isAdmin: locals.isAdmin,
		isOwnProject: project.userId === dbUser.id
	};
}

export const actions = {
	save: async ({ request, locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) redirect(302, '/login');

		let form: FormData;
		try {
			form = await request.formData();
		} catch {
			return fail(400, { error: 'invalid form submission' });
		}
		const name = (form.get('name') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const repoUrl = (form.get('repo_url') as string)?.trim() || null;
		const demoUrl = (form.get('demo_url') as string)?.trim() || null;
		const hackatimeProject = (form.get('hackatime_project') as string)?.trim() || null;
		const aiDeclaration = (form.get('ai_declaration') as string)?.trim() || null;

		if (!name) return fail(400, { error: 'project name is required' });

		const [ownedProject] = await db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)))
			.limit(1);

		if (!ownedProject) return fail(403, { error: 'project not found' });

		const rawKeepUrl = (form.get('screenshot_keep') as string)?.trim() || null;
		const keepUrl =
			rawKeepUrl?.startsWith('https://cdn.hackclub.com/') ? rawKeepUrl : null;
		let screenshotUrl: string | null = keepUrl;
		const file = form.get('screenshot1');
		if (file instanceof File && file.size > 0) {
			try {
				screenshotUrl = await uploadImageBlob(file, file.name);
			} catch (e) {
				return fail(400, { error: `screenshot upload failed: ${(e as Error).message}` });
			}
		}

		await db
			.update(projects)
			.set({
				name,
				description,
				screenshotUrl,
				repoUrl,
				demoUrl,
				hackatimeProject,
				aiDeclaration,
				updatedAt: new Date()
			})
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)));

		return { success: true };
	},

	submit: async ({ request, locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) redirect(302, '/login');

		const [projectRow] = await db
			.select()
			.from(projects)
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)))
			.limit(1);

		if (!projectRow) return fail(400, { error: 'project not found' });

		const [{ total: approvalCount }] = await db
			.select({ total: count() })
			.from(projectApprovals)
			.where(eq(projectApprovals.projectId, id));

		if (approvalCount > 0)
			return fail(400, { error: 'project already submitted, use reship to submit new work' });

		const eligibility = decideEligibility(await checkYswsStatus(locals.user.sub), dbUser.birthday);
		if (!isEligibleDecision(eligibility))
			return fail(403, { error: eligibilityMessage(eligibility) });

		if (!dbUser.streetAddress || !dbUser.locality || !dbUser.country)
			return fail(400, {
				error: 'set your shipping address in account settings before submitting'
			});

		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const repoUrl = (form.get('repo_url') as string)?.trim() || null;
		const demoUrl = (form.get('demo_url') as string)?.trim() || null;
		const hackatimeProject = (form.get('hackatime_project') as string)?.trim() || null;

		if (!name) return fail(400, { error: 'project name is required' });

		const rawKeepUrl = (form.get('screenshot_keep') as string)?.trim() || null;
		const keepUrl =
			rawKeepUrl?.startsWith('https://cdn.hackclub.com/') ? rawKeepUrl : null;
		let screenshotUrl: string | null = keepUrl;
		const file = form.get('screenshot1');
		if (file instanceof File && file.size > 0) {
			try {
				screenshotUrl = await uploadImageBlob(file, file.name);
			} catch (e) {
				return fail(400, { error: `screenshot upload failed: ${(e as Error).message}` });
			}
		}

		if (!description) return fail(400, { error: 'description is required before submitting' });
		if (!repoUrl) return fail(400, { error: 'repo url is required before submitting' });
		if (!demoUrl) return fail(400, { error: 'demo url is required before submitting' });
		if (!screenshotUrl) return fail(400, { error: 'screenshot is required before submitting' });
		if (!hackatimeProject)
			return fail(400, { error: 'hackatime project is required before submitting' });

		const projectNames = hackatimeProject
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		const totalSeconds = await getHackatimeSeconds(dbUser, projectNames);
		if (totalSeconds < 3600)
			return fail(400, {
				error: `at least 1 hour of hackatime required (you have ${Math.floor(totalSeconds / 60)}m)`
			});

		const aiDeclaration = (form.get('ai_declaration') as string)?.trim() || null;

		await db
			.update(projects)
			.set({
				name,
				description,
				screenshotUrl,
				repoUrl,
				demoUrl,
				hackatimeProject,
				aiDeclaration,
				updatedAt: new Date()
			})
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)));

		await db.insert(projectApprovals).values({
			projectId: id,
			submittedById: dbUser.id,
			submittedSeconds: totalSeconds,
			status: 'pending',
			aiDeclaration
		});

		return { success: true };
	},

	reship: async ({ request, locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) redirect(302, '/login');

		const [projectRow] = await db
			.select()
			.from(projects)
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)))
			.limit(1);

		if (!projectRow) return fail(404, { error: 'project not found' });

		const latestApproval = await getLatestApproval(id);
		if (!latestApproval) return fail(400, { error: 'no prior submission found' });
		if (latestApproval.status === 'pending')
			return fail(400, { error: 'a review is already pending for this project' });

		const eligibility = decideEligibility(await checkYswsStatus(locals.user.sub), dbUser.birthday);
		if (!isEligibleDecision(eligibility))
			return fail(403, { error: eligibilityMessage(eligibility) });

		if (!dbUser.streetAddress || !dbUser.locality || !dbUser.country)
			return fail(400, {
				error: 'set your shipping address in account settings before submitting'
			});

		const projectNames = (projectRow.hackatimeProject ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		const currentSeconds = await getHackatimeSeconds(dbUser, projectNames);
		const availableSeconds = currentSeconds - latestApproval.submittedSeconds;

		// After rejection, users can reship with the same hours — no new work required
		const isRejection = latestApproval.status === 'rejected';
		if (!isRejection && availableSeconds < 3600) {
			const mins = Math.max(0, Math.floor(availableSeconds / 60));
			return fail(400, {
				error: `need at least 1 new hour since your last submission (you have ${mins}m of new work)`
			});
		}

		await db.insert(projectApprovals).values({
			projectId: id,
			submittedById: dbUser.id,
			submittedSeconds: currentSeconds,
			status: 'pending',
			aiDeclaration: projectRow.aiDeclaration ?? null
		});

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) redirect(302, '/login');

		const [ownedProject] = await db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)))
			.limit(1);

		if (!ownedProject) return fail(404, { error: 'project not found' });

		const [{ total: approvalCount }] = await db
			.select({ total: count() })
			.from(projectApprovals)
			.where(eq(projectApprovals.projectId, id));

		if (approvalCount > 0)
			return fail(403, { error: 'cannot delete a submitted or approved project' });

		await db.delete(projects).where(eq(projects.id, id));

		redirect(302, '/projects');
	},

	reject: async ({ request, locals, params }) => {
		if (!locals.isReviewer || !locals.user) return fail(403, { error: 'forbidden' });

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const reviewerDbUser = await getDbUser(locals.user.sub);
		if (!reviewerDbUser) return fail(403, { error: 'forbidden' });

		const form = await request.formData();
		const message = (form.get('message') as string)?.trim() || null;
		const internalNote = (form.get('internal_note') as string)?.trim() || null;

		if (!message) return fail(400, { error: 'message to author is required' });
		if (!internalNote) return fail(400, { error: 'internal note is required' });

		const latestApproval = await getLatestApproval(id);
		if (!latestApproval || (latestApproval.status !== 'pending' && latestApproval.status !== 'soft_approved')) {
			return fail(400, { error: 'can only reject pending or soft approved projects' });
		}

		await db
			.update(projectApprovals)
			.set({
				status: 'rejected',
				reviewerId: reviewerDbUser.id,
				publicMessage: message,
				internalNote,
				reviewedAt: new Date()
			})
			.where(eq(projectApprovals.id, latestApproval.id));

		const [rejectedProject] = await db
			.select({ name: projects.name, userId: projects.userId })
			.from(projects)
			.where(eq(projects.id, id))
			.limit(1);

		if (rejectedProject) {
			const [ownerUser] = await db
				.select({ slackId: users.slackId })
				.from(users)
				.where(eq(users.id, rejectedProject.userId))
				.limit(1);

			if (ownerUser?.slackId) {
				const dashboardUrl = `${new URL(request.url).origin}/projects/${id}`;
				const quote = message
					? `\n${message
							.split('\n')
							.map((l) => `>${l}`)
							.join('\n')}\n`
					: '\n';
				await sendSlackDM(
					ownerUser.slackId,
					`Your project *${rejectedProject.name}* was rejected.${quote}<${dashboardUrl}|See more on the dashboard>`
				);
			}
		}

		return { success: true };
	},

	softApprove: async ({ request, locals, params }) => {
		if ((!locals.isReviewer && !locals.isAdmin) || !locals.user)
			return fail(403, { error: 'forbidden' });

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const reviewerDbUser = await getDbUser(locals.user.sub);
		if (!reviewerDbUser) return fail(403, { error: 'forbidden' });

		const latestApproval = await getLatestApproval(id);
		if (!latestApproval || latestApproval.status !== 'pending') {
			return fail(400, { error: 'can only soft-approve pending projects' });
		}

		const form = await request.formData();
		const message = (form.get('message') as string)?.trim() || null;
		const internalNote = (form.get('internal_note') as string)?.trim() || null;
		const approvedMinutesRaw = form.get('approved_minutes');

		if (!message) return fail(400, { error: 'message to author is required' });
		if (!internalNote) return fail(400, { error: 'internal note is required' });

		// Compute delta: same as the full approve action
		const allApprovals = await db
			.select({
				submittedSeconds: projectApprovals.submittedSeconds,
				status: projectApprovals.status
			})
			.from(projectApprovals)
			.where(eq(projectApprovals.projectId, id))
			.orderBy(asc(projectApprovals.submittedAt));
		const currentIndex = allApprovals.findIndex(
			(a) => a.submittedSeconds === latestApproval.submittedSeconds
		);
		const lastApproved = allApprovals
			.slice(0, currentIndex)
			.reverse()
			.find((a) => a.status === 'approved');
		const prevSubmittedSeconds = lastApproved?.submittedSeconds ?? 0;
		const newSeconds = latestApproval.submittedSeconds - prevSubmittedSeconds;

		const approvedMinutes =
			approvedMinutesRaw !== null && approvedMinutesRaw !== ''
				? Math.floor(Number(approvedMinutesRaw))
				: Math.floor(newSeconds / 60);

		if (isNaN(approvedMinutes) || approvedMinutes <= 0) {
			return fail(400, { error: 'approved minutes must be greater than 0' });
		}

		const approvedSeconds = approvedMinutes * 60;

		const maxAllowedMinutes = Math.floor(newSeconds / 60);
		if (approvedMinutes > maxAllowedMinutes) {
			return fail(400, {
				error: `approved minutes cannot exceed submitted time (${maxAllowedMinutes}m)`
			});
		}

		await db
			.update(projectApprovals)
			.set({
				status: 'soft_approved',
				reviewerId: reviewerDbUser.id,
				approvedSeconds,
				publicMessage: message,
				internalNote,
				reviewedAt: new Date()
			})
			.where(eq(projectApprovals.id, latestApproval.id));

		return { success: true };
	},

	approve: async ({ request, locals, params }) => {
		if (!locals.isAdmin || !locals.user) return fail(403, { error: 'forbidden' });

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const reviewerDbUser = await getDbUser(locals.user.sub);
		if (!reviewerDbUser) return fail(403, { error: 'forbidden' });

		const latestApproval = await getLatestApproval(id);
		if (!latestApproval || (latestApproval.status !== 'pending' && latestApproval.status !== 'soft_approved')) {
			return fail(400, { error: 'can only approve pending or soft-approved projects' });
		}

		let approvedSeconds: number;
		let message: string | null;
		let internalNote: string | null;

		if (latestApproval.status === 'soft_approved') {
			// Confirm the existing soft approval — no form input needed
			if (!latestApproval.approvedSeconds) {
				return fail(400, { error: 'soft approval is missing approved seconds' });
			}
			approvedSeconds = latestApproval.approvedSeconds;
			message = latestApproval.publicMessage;
			internalNote = latestApproval.internalNote;
		} else {
			// Full approval from pending — require form data
			const form = await request.formData();
			message = (form.get('message') as string)?.trim() || null;
			internalNote = (form.get('internal_note') as string)?.trim() || null;
			const approvedMinutesRaw = form.get('approved_minutes');

			if (!message) return fail(400, { error: 'message to author is required' });
			if (!internalNote) return fail(400, { error: 'internal note is required' });

			// Compute delta: new hours since the last approved submission
			const allApprovals = await db
				.select({
					submittedSeconds: projectApprovals.submittedSeconds,
					status: projectApprovals.status
				})
				.from(projectApprovals)
				.where(eq(projectApprovals.projectId, id))
				.orderBy(asc(projectApprovals.submittedAt));
			const currentIndex = allApprovals.findIndex(
				(a) => a.submittedSeconds === latestApproval.submittedSeconds
			);
			const lastApproved = allApprovals
				.slice(0, currentIndex)
				.reverse()
				.find((a) => a.status === 'approved');
			const prevSubmittedSeconds = lastApproved?.submittedSeconds ?? 0;
			const newSeconds = latestApproval.submittedSeconds - prevSubmittedSeconds;

			const approvedMinutes =
				approvedMinutesRaw !== null && approvedMinutesRaw !== ''
					? Math.floor(Number(approvedMinutesRaw))
					: Math.floor(newSeconds / 60);

			if (isNaN(approvedMinutes) || approvedMinutes <= 0) {
				return fail(400, { error: 'approved minutes must be greater than 0' });
			}

			approvedSeconds = approvedMinutes * 60;

			const maxAllowedMinutes = Math.floor(newSeconds / 60);
			if (approvedMinutes > maxAllowedMinutes) {
				return fail(400, {
					error: `approved minutes cannot exceed submitted time (${maxAllowedMinutes}m)`
				});
			}
		}

		await db
			.update(projectApprovals)
			.set({
				status: 'approved',
				reviewerId: reviewerDbUser.id,
				approvedSeconds,
				publicMessage: message,
				internalNote,
				reviewedAt: new Date()
			})
			.where(eq(projectApprovals.id, latestApproval.id));

		// Upsert explore snapshot with project state at time of approval
		const [[projectData], [totalRow]] = await Promise.all([
			db.select().from(projects).where(eq(projects.id, id)).limit(1),
			db
				.select({ total: sum(projectApprovals.approvedSeconds) })
				.from(projectApprovals)
				.where(and(eq(projectApprovals.projectId, id), eq(projectApprovals.status, 'approved')))
		]);

		if (projectData) {
			const totalApprovedSeconds = Number(totalRow?.total ?? 0);

			const [authorUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, projectData.userId))
				.limit(1);

			await db.insert(approvedSubmissions).values({
				approvalId: latestApproval.id,
				projectId: id,
				userId: projectData.userId,
				authorName: authorUser?.name ?? null,
				authorHcaId: authorUser?.hcaId ?? null,
				authorEmail: authorUser?.email ?? null,
				authorStreetAddress: authorUser?.streetAddress ?? null,
				authorAddressLine2: authorUser?.addressLine2 ?? null,
				authorLocality: authorUser?.locality ?? null,
				authorRegion: authorUser?.region ?? null,
				authorPostalCode: authorUser?.postalCode ?? null,
				authorCountry: authorUser?.country ?? null,
				authorBirthday: authorUser?.birthday ?? null,
				projectName: projectData.name,
				projectDescription: projectData.description,
				projectRepoUrl: projectData.repoUrl,
				projectDemoUrl: projectData.demoUrl,
				projectScreenshotUrl: projectData.screenshotUrl,
				projectAiDeclaration: projectData.aiDeclaration,
				hackatimeProject: projectData.hackatimeProject,
				submittedSeconds: latestApproval.submittedSeconds,
				approvedSeconds,
				publicMessage: message,
				internalNote,
				submittedAt: latestApproval.submittedAt,
				approvedAt: new Date()
			});

			await createAirtableApprovalRecord({
				repoUrl: projectData.repoUrl,
				demoUrl: projectData.demoUrl,
				authorName: authorUser?.name ?? null,
				authorEmail: authorUser?.email ?? null,
				screenshotUrl: projectData.screenshotUrl,
				description: projectData.description,
				authorStreetAddress: authorUser?.streetAddress ?? null,
				authorAddressLine2: authorUser?.addressLine2 ?? null,
				authorLocality: authorUser?.locality ?? null,
				authorRegion: authorUser?.region ?? null,
				authorCountry: authorUser?.country ?? null,
				authorPostalCode: authorUser?.postalCode ?? null,
				authorBirthday: authorUser?.birthday ?? null,
				approvedSeconds,
				internalNote
			});

			await db
				.insert(projectExploreSnapshots)
				.values({
					projectId: id,
					name: projectData.name,
					description: projectData.description,
					screenshotUrl: projectData.screenshotUrl,
					demoUrl: projectData.demoUrl,
					totalApprovedSeconds,
					updatedAt: new Date()
				})
				.onConflictDoUpdate({
					target: projectExploreSnapshots.projectId,
					set: {
						name: projectData.name,
						description: projectData.description,
						screenshotUrl: projectData.screenshotUrl,
						demoUrl: projectData.demoUrl,
						totalApprovedSeconds,
						updatedAt: new Date()
					}
				});

			if (authorUser?.slackId) {
				const hours = (approvedSeconds / 3600).toFixed(1) + 'h';
				const dashboardUrl = `${new URL(request.url).origin}/projects/${id}`;
				const quote = message
					? `\n${message
							.split('\n')
							.map((l) => `>${l}`)
							.join('\n')}\n`
					: '\n';
				await sendSlackDM(
					authorUser.slackId,
					`Your project *${projectData.name}* was approved for ${hours}!${quote}<${dashboardUrl}|See more on the dashboard>`
				);
				// add the author to the approved-builders Slack channel on a hard approval
				if (env.SLACK_APPROVED_CHANNEL_ID) {
					await inviteToChannel(authorUser.slackId, env.SLACK_APPROVED_CHANNEL_ID);
				}
			}
		}

		return { success: true };
	},

	comment: async ({ request, locals, params }) => {
		if (!locals.isReviewer || !locals.user) return fail(403, { error: 'forbidden' });

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const reviewerDbUser = await getDbUser(locals.user.sub);
		if (!reviewerDbUser) return fail(403, { error: 'forbidden' });

		const form = await request.formData();
		const message = (form.get('message') as string)?.trim() || null;
		const internalNote = (form.get('internal_note') as string)?.trim() || null;

		if (!message && !internalNote)
			return fail(400, { error: 'comment must have a message or internal note' });

		const [projectRow] = await db
			.select({ id: projects.id })
			.from(projects)
			.where(eq(projects.id, id))
			.limit(1);

		if (!projectRow) return fail(404, { error: 'project not found' });

		await db.insert(projectEvents).values({
			projectId: id,
			actorId: reviewerDbUser.id,
			action: 'comment',
			message,
			internalNote
		});

		return { success: true };
	}
};
