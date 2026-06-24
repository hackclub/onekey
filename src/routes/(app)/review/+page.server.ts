import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users, projectApprovals } from '$lib/server/db/schema';
import { eq, and, asc, gt, notExists, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export async function load({ locals }) {
	if (!locals.isReviewer) error(403, 'Forbidden');

	const pa2 = alias(projectApprovals, 'pa2');

	const submitted = await db
		.select({
			id: projects.id,
			name: projects.name,
			description: projects.description,
			screenshotUrl: projects.screenshotUrl,
			repoUrl: projects.repoUrl,
			demoUrl: projects.demoUrl,
			hackatimeProject: projects.hackatimeProject,
			approvalId: projectApprovals.id,
			status: projectApprovals.status,
			submittedSeconds: projectApprovals.submittedSeconds,
			submittedAt: projectApprovals.submittedAt,
			submitterName: users.nickname,
			submitterSlack: users.slackDisplayName,
			submitterEmail: users.email,
		})
		.from(projectApprovals)
		.innerJoin(projects, eq(projectApprovals.projectId, projects.id))
		.innerJoin(users, eq(projects.userId, users.id))
		.where(
			and(
				sql`${projectApprovals.status} in ('pending', 'soft_approved')`,
				notExists(
					db.select({ x: sql`1` })
						.from(pa2)
						.where(
							and(
								eq(pa2.projectId, projectApprovals.projectId),
								gt(pa2.submittedAt, projectApprovals.submittedAt)
							)
						)
				)
			)
		)
		.orderBy(asc(projectApprovals.submittedAt));

	return { user: locals.user, submitted };
}
