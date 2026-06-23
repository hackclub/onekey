import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users, projectExploreSnapshots } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

const PAGE_SIZE = 24;

export async function load({ locals }) {
	const rows = await db
		.select({
			id: projectExploreSnapshots.projectId,
			name: projectExploreSnapshots.name,
			description: projectExploreSnapshots.description,
			screenshotUrl: projectExploreSnapshots.screenshotUrl,
			demoUrl: projectExploreSnapshots.demoUrl,
			totalApprovedSeconds: projectExploreSnapshots.totalApprovedSeconds,
			authorName: users.slackDisplayName,
			authorNickname: users.nickname
		})
		.from(projectExploreSnapshots)
		.innerJoin(projects, eq(projectExploreSnapshots.projectId, projects.id))
		.innerJoin(users, eq(projects.userId, users.id))
		.orderBy(desc(projectExploreSnapshots.projectId))
		.limit(PAGE_SIZE + 1);

	const hasMore = rows.length > PAGE_SIZE;
	return { projects: rows.slice(0, PAGE_SIZE), hasMore, isAdmin: locals.isAdmin };
}

export const actions = {
	delete: async ({ request, locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });

		const form = await request.formData();
		const id = parseInt(form.get('id') as string, 10);
		if (isNaN(id)) return fail(400, { error: 'invalid id' });

		await db.delete(projects).where(eq(projects.id, id));
		return { success: true };
	}
};
