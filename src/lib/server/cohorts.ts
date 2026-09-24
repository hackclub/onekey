import { db } from '$lib/server/db';
import { users, projects, projectApprovals } from '$lib/server/db/schema';
import { eq, and, isNotNull, ne } from 'drizzle-orm';

export type CohortKey = 'no_project' | 'no_hackatime' | 'not_shipped' | 'approved';

export const COHORTS: { key: CohortKey; label: string; description: string }[] = [
	{
		key: 'no_project',
		label: 'Signed up, no project',
		description: 'Users who have registered but have not created any project yet.'
	},
	{
		key: 'no_hackatime',
		label: 'Project, no Hackatime',
		description:
			'Users with at least one project, but none of their projects has a Hackatime project linked (and they have not shipped).'
	},
	{
		key: 'not_shipped',
		label: 'Hackatime linked, not shipped',
		description:
			'Users who linked a Hackatime project to at least one of their projects but have never submitted one for review.'
	},
	{
		key: 'approved',
		label: 'At least one project approved',
		description: 'Users who have had at least one of their projects approved by a reviewer.'
	}
];

export type CohortMember = {
	id: string;
	slackId: string | null;
	name: string;
};

export type Cohort = {
	key: CohortKey;
	reachable: CohortMember[]; // has a slackId — can be DM'd
	unreachableCount: number; // in this cohort but no slackId
};

const pickName = (u: {
	slackDisplayName: string | null;
	nickname: string | null;
	name: string | null;
	email: string | null;
}) => u.slackDisplayName || u.nickname || u.name || u.email || 'unknown';

/**
 * Bucket every user into at most one of four disjoint cohorts by their
 * FURTHEST milestone. Users who have shipped (have any approval row on a
 * project they own) but never had one approved are excluded entirely.
 *
 *   has an approval      -> approved
 *   else shipped         -> excluded
 *   else linked HT       -> not_shipped
 *   else has a project   -> no_hackatime
 *   else                 -> no_project
 */
export async function computeCohorts(): Promise<Record<CohortKey, Cohort>> {
	const hasHackatime = and(isNotNull(projects.hackatimeProject), ne(projects.hackatimeProject, ''));

	const [allUsers, projectOwners, hackatimeOwners, shippedOwners, approvedOwners] = await Promise.all([
		db
			.select({
				id: users.id,
				slackId: users.slackId,
				slackDisplayName: users.slackDisplayName,
				nickname: users.nickname,
				name: users.name,
				email: users.email
			})
			.from(users),
		db.selectDistinct({ userId: projects.userId }).from(projects),
		db.selectDistinct({ userId: projects.userId }).from(projects).where(hasHackatime),
		db
			.selectDistinct({ userId: projects.userId })
			.from(projectApprovals)
			.innerJoin(projects, eq(projectApprovals.projectId, projects.id)),
		db
			.selectDistinct({ userId: projects.userId })
			.from(projectApprovals)
			.innerJoin(projects, eq(projectApprovals.projectId, projects.id))
			.where(eq(projectApprovals.status, 'approved'))
	]);

	const hasProject = new Set(projectOwners.map((r) => r.userId));
	const hasHt = new Set(hackatimeOwners.map((r) => r.userId));
	const shipped = new Set(shippedOwners.map((r) => r.userId));
	const approved = new Set(approvedOwners.map((r) => r.userId));

	const result: Record<CohortKey, Cohort> = {
		no_project: { key: 'no_project', reachable: [], unreachableCount: 0 },
		no_hackatime: { key: 'no_hackatime', reachable: [], unreachableCount: 0 },
		not_shipped: { key: 'not_shipped', reachable: [], unreachableCount: 0 },
		approved: { key: 'approved', reachable: [], unreachableCount: 0 }
	};

	for (const u of allUsers) {
		let key: CohortKey;
		if (approved.has(u.id)) key = 'approved';
		else if (shipped.has(u.id)) continue; // shipped but nothing approved yet — not a target
		else if (hasHt.has(u.id)) key = 'not_shipped';
		else if (hasProject.has(u.id)) key = 'no_hackatime';
		else key = 'no_project';

		const cohort = result[key];
		if (u.slackId) {
			cohort.reachable.push({ id: u.id, slackId: u.slackId, name: pickName(u) });
		} else {
			cohort.unreachableCount++;
		}
	}

	for (const key of Object.keys(result) as CohortKey[]) {
		result[key].reachable.sort((a, b) => a.name.localeCompare(b.name));
	}

	return result;
}
