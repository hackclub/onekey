import { db } from '$lib/server/db';
import { projects, users, projectApprovals } from '$lib/server/db/schema';
import { eq, sum } from 'drizzle-orm';

export async function load() {
	const rows = await db
		.select({
			id: projects.id,
			name: projects.name,
			description: projects.description,
			screenshotUrl: projects.screenshotUrl,
			demoUrl: projects.demoUrl,
			totalApprovedSeconds: sum(projectApprovals.approvedSeconds),
			authorName: users.slackDisplayName,
			authorNickname: users.nickname,
		})
		.from(projectApprovals)
		.innerJoin(projects, eq(projectApprovals.projectId, projects.id))
		.innerJoin(users, eq(projects.userId, users.id))
		.where(eq(projectApprovals.status, 'approved'))
		.groupBy(projects.id, users.id);

	return { projects: rows.map(r => ({ ...r, totalApprovedSeconds: Number(r.totalApprovedSeconds ?? 0) })) };
}
