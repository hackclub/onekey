import { db } from '$lib/server/db';
import { projects, users, projectExploreSnapshots } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function load() {
	const rows = await db
		.select({
			id: projectExploreSnapshots.projectId,
			name: projectExploreSnapshots.name,
			description: projectExploreSnapshots.description,
			screenshotUrl: projectExploreSnapshots.screenshotUrl,
			demoUrl: projectExploreSnapshots.demoUrl,
			totalApprovedSeconds: projectExploreSnapshots.totalApprovedSeconds,
			authorName: users.slackDisplayName,
			authorNickname: users.nickname,
		})
		.from(projectExploreSnapshots)
		.innerJoin(projects, eq(projectExploreSnapshots.projectId, projects.id))
		.innerJoin(users, eq(projects.userId, users.id));

	return { projects: rows };
}
