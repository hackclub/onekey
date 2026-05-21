import { redirect, error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { uploadImageBlob } from '$lib/server/cdn';

async function getDbUser(hcaId: string) {
	const [row] = await db.select({ id: users.id }).from(users).where(eq(users.hcaId, hcaId)).limit(1);
	return row ?? null;
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
		.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)))
		.limit(1);

	if (!project) error(404, 'project not found');

	return { project };
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

		await db
			.update(projects)
			.set({ name, description, screenshotUrl, repoUrl, demoUrl, updatedAt: new Date() })
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)));

		return { success: true };
	},

	submit: async ({ locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) redirect(302, '/login');

		await db
			.update(projects)
			.set({ status: 'pending', updatedAt: new Date() })
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id), isNull(projects.status)));

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		const id = parseInt(params.id, 10);
		if (isNaN(id)) error(404, 'project not found');

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) redirect(302, '/login');

		await db
			.delete(projects)
			.where(and(eq(projects.id, id), eq(projects.userId, dbUser.id)));

		redirect(302, '/projects');
	}
};
