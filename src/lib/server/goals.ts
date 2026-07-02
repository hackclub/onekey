import { db } from './db';
import { projectApprovals } from './db/schema';
import { and, eq, gte, lte, sum } from 'drizzle-orm';

/**
 * Approved hours counting toward a timed goal.
 *
 * By default only submissions approved within the goal's window count — i.e.
 * reviewed between the goal's createdAt (ring full) and its deadline (ring
 * empty). Because reviewedAt can never be in the future, this naturally
 * includes everything approved so far and freezes once the deadline passes.
 *
 * When `allTime` is set, every approved submission counts regardless of when it
 * was reviewed — the same pool the community goals card uses.
 *
 * Only status = 'approved' rows count (matching the community card); pending and
 * soft_approved submissions are excluded.
 */
export async function approvedHoursForGoal(goal: {
	createdAt: Date;
	deadline: Date;
	allTime: boolean;
}): Promise<number> {
	const conditions = [eq(projectApprovals.status, 'approved')];
	if (!goal.allTime) {
		conditions.push(gte(projectApprovals.reviewedAt, goal.createdAt));
		conditions.push(lte(projectApprovals.reviewedAt, goal.deadline));
	}

	const [r] = await db
		.select({ total: sum(projectApprovals.approvedSeconds) })
		.from(projectApprovals)
		.where(and(...conditions));

	return Math.floor(Number(r?.total ?? 0) / 3600);
}
