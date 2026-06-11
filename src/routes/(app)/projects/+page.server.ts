import { redirect, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { uploadImageBlob } from '$lib/server/cdn';
import { decryptToken } from '$lib/server/session';

const HACKATIME_BASE_URL = 'https://hackatime.hackclub.com';
const DEV_ENCRYPTION_KEY = '0'.repeat(64);

export async function load({ locals }) {
	if (!locals.user) redirect(302, '/login');

	const [dbUser] = await db
		.select()
		.from(users)
		.where(eq(users.hcaId, locals.user.sub))
		.limit(1);

	if (!dbUser) redirect(302, '/login');

	const userProjects = await db
		.select()
		.from(projects)
		.where(eq(projects.userId, dbUser.id))
		.orderBy(asc(projects.id));

	// Fetch hackatime seconds map (project name → seconds)
	let htSecondsMap: Record<string, number> = {};
	if (dbUser.hackatimeTokenCt && dbUser.hackatimeTokenIv && dbUser.hackatimeTokenTag) {
		try {
			const encKey = Buffer.from(env.TOKEN_ENCRYPTION_KEY || (dev ? DEV_ENCRYPTION_KEY : ''), 'hex');
			const accessToken = decryptToken(dbUser.hackatimeTokenCt, dbUser.hackatimeTokenIv, dbUser.hackatimeTokenTag, encKey);
			const res = await fetch(`${HACKATIME_BASE_URL}/api/v1/authenticated/projects?include_archived=true`, {
				headers: { Authorization: `Bearer ${accessToken}` }
			});
			if (res.ok) {
				const data = await res.json();
				const raw: any[] = Array.isArray(data) ? data : (data.data ?? data.projects ?? []);
				for (const p of raw) {
					htSecondsMap[String(p.name ?? '')] = Number(p.total_seconds ?? p.totalSeconds ?? 0);
				}
			}
		} catch { /* best-effort; cards just won't show hours */ }
	}

	const projectsWithHours = userProjects.map((p) => {
		const names = (p.hackatimeProject ?? '').split(',').map((s) => s.trim()).filter(Boolean);
		const totalSeconds = names.reduce((sum, name) => sum + (htSecondsMap[name] ?? 0), 0);
		return { ...p, totalSeconds };
	});

	return { projects: projectsWithHours };
}

export const actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const [dbUser] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.hcaId, locals.user.sub))
			.limit(1);

		if (!dbUser) redirect(302, '/login');

		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const repoUrl = (form.get('repo_url') as string)?.trim() || null;
		const demoUrl = (form.get('demo_url') as string)?.trim() || null;

		if (!name) return fail(400, { error: 'project name is required' });

		let screenshotUrl: string | null = null;
		const file = form.get('screenshot1');
		if (file instanceof File && file.size > 0) {
			try {
				screenshotUrl = await uploadImageBlob(file, file.name);
			} catch (e) {
				return fail(400, { error: `screenshot upload failed: ${(e as Error).message}` });
			}
		}

		const [project] = await db
			.insert(projects)
			.values({ userId: dbUser.id, name, description, screenshotUrl, repoUrl, demoUrl })
			.returning({ id: projects.id });

		redirect(302, `/projects/${project.id}`);
	}
};
