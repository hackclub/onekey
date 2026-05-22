import { redirect, error, fail } from '@sveltejs/kit';
import { TOKEN_ENCRYPTION_KEY } from '$env/static/private';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { projects, users, projectEvents } from '$lib/server/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { uploadImageBlob } from '$lib/server/cdn';
import { decryptToken } from '$lib/server/session';

const HACKATIME_BASE_URL = 'https://hackatime.hackclub.com';
const DEV_ENCRYPTION_KEY = '0'.repeat(64);

async function getDbUser(hcaId: string) {
	const [row] = await db.select().from(users).where(eq(users.hcaId, hcaId)).limit(1);
	return row ?? null;
}

async function getHackatimeSeconds(dbUser: typeof users.$inferSelect, projectNames: string[]): Promise<number> {
	if (!projectNames.length) return 0;
	if (!dbUser.hackatimeTokenCt || !dbUser.hackatimeTokenIv || !dbUser.hackatimeTokenTag) return 0;

	const encKey = Buffer.from(TOKEN_ENCRYPTION_KEY || (dev ? DEV_ENCRYPTION_KEY : ''), 'hex');
	const accessToken = decryptToken(dbUser.hackatimeTokenCt, dbUser.hackatimeTokenIv, dbUser.hackatimeTokenTag, encKey);

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

export async function load({ locals, params }) {
	if (!locals.user) redirect(302, '/login');

	const id = parseInt(params.id, 10);
	if (isNaN(id)) error(404, 'project not found');

	const dbUser = await getDbUser(locals.user.sub);
	if (!dbUser) redirect(302, '/login');

	const [project] = await db
		.select()
		.from(projects)
		.where(eq(projects.id, id))
		.limit(1);

	if (!project || (!locals.isReviewer && project.userId !== dbUser.id)) {
		redirect(302, '/projects?error=not_found');
	}

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

	return {
		project,
		events,
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

		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const repoUrl = (form.get('repo_url') as string)?.trim() || null;
		const demoUrl = (form.get('demo_url') as string)?.trim() || null;
		const hackatimeProject = (form.get('hackatime_project') as string)?.trim() || null;

		if (!name) return fail(400, { error: 'project name is required' });

		const keepUrl = (form.get('screenshot_keep') as string)?.trim() || null;
		let screenshotUrl: string | null = keepUrl;
		const file = form.get('screenshot1');
		if (file instanceof File && file.size > 0) {
			try {
				screenshotUrl = await uploadImageBlob(file, file.name);
			} catch (e) {
				return fail(400, { error: `screenshot upload failed: ${(e as Error).message}` });
			}
		}

		const [updated] = await db
			.update(projects)
			.set({ name, description, screenshotUrl, repoUrl, demoUrl, hackatimeProject, updatedAt: new Date() })
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)))
			.returning({ id: projects.id });

		if (!updated && locals.isReviewer) return fail(403, { error: 'reviewers cannot edit other people\'s projects' });

		return { success: true };
	},

	submit: async ({ request, locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) redirect(302, '/login');

		const [existing] = await db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id), isNull(projects.status)))
			.limit(1);

		if (!existing) return fail(400, { error: 'project not found or already submitted' });

		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const repoUrl = (form.get('repo_url') as string)?.trim() || null;
		const demoUrl = (form.get('demo_url') as string)?.trim() || null;
		const hackatimeProject = (form.get('hackatime_project') as string)?.trim() || null;

		if (!name) return fail(400, { error: 'project name is required' });

		const keepUrl = (form.get('screenshot_keep') as string)?.trim() || null;
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
		if (!hackatimeProject) return fail(400, { error: 'hackatime project is required before submitting' });

		const projectNames = hackatimeProject.split(',').map((s) => s.trim()).filter(Boolean);
		const totalSeconds = await getHackatimeSeconds(dbUser, projectNames);
		if (totalSeconds < 3600) return fail(400, { error: `at least 1 hour of hackatime required (you have ${Math.floor(totalSeconds / 60)}m)` });

		await db
			.update(projects)
			.set({ name, description, screenshotUrl, repoUrl, demoUrl, hackatimeProject, status: 'pending', updatedAt: new Date() })
			.where(eq(projects.id, id));

		await db.insert(projectEvents).values({ projectId: id, actorId: dbUser.id, action: 'submitted' });

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) redirect(302, '/login');

		const [deleted] = await db
			.delete(projects)
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id), isNull(projects.status)))
			.returning({ id: projects.id });

		if (!deleted) return fail(403, { error: 'cannot delete a submitted or approved project' });

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

		const [updated] = await db
			.update(projects)
			.set({ status: null, updatedAt: new Date() })
			.where(and(eq(projects.id, id), eq(projects.status, 'pending')))
			.returning({ id: projects.id });

		if (!updated) return fail(400, { error: 'can only reject pending projects' });

		await db.insert(projectEvents).values({ projectId: id, actorId: reviewerDbUser.id, action: 'rejected', message, internalNote });

		return { success: true };
	},

	approve: async ({ request, locals, params }) => {
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

		const [project] = await db
			.select()
			.from(projects)
			.where(eq(projects.id, id))
			.limit(1);

		if (!project) error(404, 'project not found');

		if (project.userId === reviewerDbUser.id) {
			return fail(403, { error: "you can't approve your own project" });
		}

		const [ownerUser] = await db.select().from(users).where(eq(users.id, project.userId)).limit(1);

		const projectNames = (project.hackatimeProject ?? '').split(',').map((s) => s.trim()).filter(Boolean);
		const approvedSeconds = await getHackatimeSeconds(ownerUser, projectNames);

		await db
			.update(projects)
			.set({ status: 'approved', approvedSeconds, updatedAt: new Date() })
			.where(eq(projects.id, id));

		await db.insert(projectEvents).values({ projectId: id, actorId: reviewerDbUser.id, action: 'approved', message, internalNote });

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

		if (!message && !internalNote) return fail(400, { error: 'comment must have a message or internal note' });

		await db.insert(projectEvents).values({ projectId: id, actorId: reviewerDbUser.id, action: 'comment', message, internalNote });

		return { success: true };
	}
};
