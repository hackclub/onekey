import { db } from '$lib/server/db';
import { projects, users, projectApprovals, timedGoals } from '$lib/server/db/schema';
import { eq, count, sum, desc } from 'drizzle-orm';

export async function load({ locals }) {
	let hasProject = false;

	if (locals.user) {
		const [dbUser] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.hcaId, locals.user.sub))
			.limit(1);

		if (dbUser) {
			const [{ total }] = await db
				.select({ total: count() })
				.from(projects)
				.where(eq(projects.userId, dbUser.id));
			hasProject = total > 0;
		}
	}

	const [r] = await db
		.select({ total: sum(projectApprovals.approvedSeconds) })
		.from(projectApprovals)
		.where(eq(projectApprovals.status, 'approved'));
	const communityApprovedSeconds = Number(r?.total ?? 0);

	// The current timed goal (latest row), or null to fall back to the community
	// goals card. Only the fields the card needs are returned.
	const [goal] = await db
		.select({
			name: timedGoals.name,
			description: timedGoals.description,
			currentHours: timedGoals.currentHours,
			targetHours: timedGoals.targetHours,
			deadline: timedGoals.deadline,
			createdAt: timedGoals.createdAt
		})
		.from(timedGoals)
		.orderBy(desc(timedGoals.createdAt))
		.limit(1);

	return { user: locals.user, hasProject, communityApprovedSeconds, timedGoal: goal ?? null };
}
