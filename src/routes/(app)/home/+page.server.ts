import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { eq, count, sum } from 'drizzle-orm';

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
		.select({ total: sum(projects.approvedSeconds) })
		.from(projects)
		.where(eq(projects.status, 'approved'));
	const communityApprovedSeconds = Number(r?.total ?? 0);

	return { user: locals.user, hasProject, communityApprovedSeconds };
}
