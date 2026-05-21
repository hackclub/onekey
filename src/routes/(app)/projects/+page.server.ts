import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { uploadImageBlob } from '$lib/server/cdn';

export async function load({ locals }) {
	if (!locals.user) redirect(302, '/login');

	const [dbUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.hcaId, locals.user.sub))
		.limit(1);

	if (!dbUser) redirect(302, '/login');

	const userProjects = await db
		.select()
		.from(projects)
		.where(eq(projects.userId, dbUser.id))
		.orderBy(asc(projects.id));

	return { projects: userProjects };
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
