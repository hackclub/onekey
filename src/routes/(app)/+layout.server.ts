import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users, projectApprovals } from '$lib/server/db/schema';
import { eq, and, sum } from 'drizzle-orm';

export async function load({ locals, url }) {
	if (!locals.user) redirect(302, '/?needs_auth=1');
	if (!locals.user.hackatime_linked && !url.pathname.startsWith('/auth/hackatime')) {
		redirect(302, '/auth/hackatime/start');
	}

	let userApprovedSeconds = 0;
	let communityApprovedSeconds = 0;

	const [dbUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.hcaId, locals.user.sub))
		.limit(1);

	if (dbUser) {
		const [r] = await db
			.select({ total: sum(projectApprovals.approvedSeconds) })
			.from(projectApprovals)
			.innerJoin(projects, eq(projectApprovals.projectId, projects.id))
			.where(and(eq(projects.userId, dbUser.id), eq(projectApprovals.status, 'approved')));
		userApprovedSeconds = Number(r?.total ?? 0);
	}

	const [r2] = await db
		.select({ total: sum(projectApprovals.approvedSeconds) })
		.from(projectApprovals)
		.where(eq(projectApprovals.status, 'approved'));
	communityApprovedSeconds = Number(r2?.total ?? 0);

	return {
		user: locals.user,
		isAdmin: locals.isAdmin,
		isReviewer: locals.isReviewer,
		userApprovedSeconds,
		communityApprovedSeconds
	};
}
