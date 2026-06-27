import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users, projectExploreSnapshots } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

const PAGE_SIZE = 24;

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return new Response('forbidden', { status: 403 });

	const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10));

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
		.orderBy(desc(projectExploreSnapshots.updatedAt), desc(projectExploreSnapshots.projectId))
		.limit(PAGE_SIZE + 1)
		.offset(offset);

	const hasMore = rows.length > PAGE_SIZE;
	return json({ projects: rows.slice(0, PAGE_SIZE), hasMore });
};
