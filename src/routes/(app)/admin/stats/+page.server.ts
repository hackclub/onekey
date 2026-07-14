import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, projects, projectApprovals, approvedSubmissions, shopOrders } from '$lib/server/db/schema';
import { sql, and, isNotNull, ne, eq, gt, notExists, count, countDistinct, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const num = (v: unknown) => Number(v ?? 0);

// hours rounded up to 1 decimal, then 10 hours = 1 weighted project, rounded to nearest 0.1
function weightedProjectValue(approvedSeconds: number): number {
	const hoursRoundedUp = Math.ceil((approvedSeconds / 3600) * 10) / 10;
	return Math.round(hoursRoundedUp) / 10;
}

export async function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');

	// a project counts as "hackatime-linked" when the column is set and non-empty
	const hasHackatime = and(isNotNull(projects.hackatimeProject), ne(projects.hackatimeProject, ''));

	// same "review queue" definition as /review: latest approval per project, still pending/soft_approved
	const pa2 = alias(projectApprovals, 'pa2');
	const inReviewQueue = and(
		sql`${projectApprovals.status} in ('pending', 'soft_approved')`,
		notExists(
			db
				.select({ x: sql`1` })
				.from(pa2)
				.where(and(eq(pa2.projectId, projectApprovals.projectId), gt(pa2.submittedAt, projectApprovals.submittedAt)))
		)
	);

	const [
		[userAgg],
		verificationRows,
		[projectAgg],
		[creatorAgg],
		[hackatimeAgg],
		[submitterAgg],
		approvalStatusRows,
		[approvedAgg],
		[approvedUserAgg],
		approvedSecondsRows,
		[pendingSecondsAgg],
		orderStatusRows,
		[spendAgg]
	] = await Promise.all([
		db
			.select({
				total: count(),
				onboarded: count(users.onboardedAt),
				yswsEligible: sql<number>`count(*) filter (where ${users.yswsEligible} = true)`.mapWith(Number),
				hackatimeLinked: count(users.hackatimeUserId),
				prizeClaimed: count(users.prizeClaimedAt)
			})
			.from(users),
		db
			.select({ status: users.verificationStatus, n: count() })
			.from(users)
			.groupBy(users.verificationStatus),
		db.select({ total: count() }).from(projects),
		db.select({ creators: countDistinct(projects.userId) }).from(projects),
		db
			.select({ withHackatime: count(), creators: countDistinct(projects.userId) })
			.from(projects)
			.where(hasHackatime),
		db.select({ submitters: countDistinct(projectApprovals.submittedById) }).from(projectApprovals),
		db
			.select({ status: projectApprovals.status, n: count() })
			.from(projectApprovals)
			.groupBy(projectApprovals.status),
		db
			.select({
				totalSeconds: sum(approvedSubmissions.approvedSeconds),
				n: count()
			})
			.from(approvedSubmissions),
		db.select({ approvers: countDistinct(approvedSubmissions.userId) }).from(approvedSubmissions),
		db.select({ approvedSeconds: approvedSubmissions.approvedSeconds }).from(approvedSubmissions),
		db
			.select({ totalSeconds: sum(projectApprovals.submittedSeconds) })
			.from(projectApprovals)
			.where(inReviewQueue),
		db.select({ status: shopOrders.status, n: count() }).from(shopOrders).groupBy(shopOrders.status),
		db
			.select({ spent: sum(shopOrders.priceSeconds) })
			.from(shopOrders)
			.where(ne(shopOrders.status, 'refunded'))
	]);

	const totalUsers = num(userAgg.total);
	const totalProjects = num(projectAgg.total);
	const creators = num(creatorAgg.creators);

	const byVerification = verificationRows
		.map((r) => ({ status: r.status ?? 'none', n: num(r.n) }))
		.sort((a, b) => b.n - a.n);

	const orderByStatus = orderStatusRows.map((r) => ({ status: r.status, n: num(r.n) }));
	const totalOrders = orderByStatus.reduce((s, r) => s + r.n, 0);
	const outstandingOrders = orderByStatus
		.filter((r) => r.status !== 'fulfilled' && r.status !== 'refunded')
		.reduce((s, r) => s + r.n, 0);

	const reviewByStatus = approvalStatusRows.map((r) => ({ status: r.status, n: num(r.n) }));
	const pendingReviews = reviewByStatus.find((r) => r.status === 'pending')?.n ?? 0;

	const totalWeightedProjects = approvedSecondsRows.reduce(
		(acc, r) => acc + weightedProjectValue(num(r.approvedSeconds)),
		0
	);

	return {
		users: {
			total: totalUsers,
			onboarded: num(userAgg.onboarded),
			yswsEligible: num(userAgg.yswsEligible),
			hackatimeLinked: num(userAgg.hackatimeLinked),
			prizeClaimed: num(userAgg.prizeClaimed),
			byVerification
		},
		projects: {
			total: totalProjects,
			creators,
			withHackatime: num(hackatimeAgg.withHackatime),
			creatorsWithHackatime: num(hackatimeAgg.creators),
			avgPerCreator: creators > 0 ? totalProjects / creators : 0
		},
		reviews: {
			byStatus: reviewByStatus,
			pending: pendingReviews,
			pendingSeconds: num(pendingSecondsAgg.totalSeconds),
			approvedCount: num(approvedAgg.n),
			totalApprovedSeconds: num(approvedAgg.totalSeconds),
			totalWeightedProjects
		},
		orders: {
			total: totalOrders,
			byStatus: orderByStatus,
			outstanding: outstandingOrders,
			spentSeconds: num(spendAgg.spent)
		},
		// users → created a project → linked hackatime → submitted for review → got approved
		funnel: [
			{ label: 'registered users', n: totalUsers },
			{ label: 'created a project', n: creators },
			{ label: 'linked a hackatime project', n: num(hackatimeAgg.creators) },
			{ label: 'submitted for review', n: num(submitterAgg.submitters) },
			{ label: 'got a project approved', n: num(approvedUserAgg.approvers) }
		]
	};
}
