import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export async function load() {
	const allUsers = await db
		.select({
			id: users.id,
			hcaId: users.hcaId,
			name: users.name,
			nickname: users.nickname,
			email: users.email,
			emailVerified: users.emailVerified,
			slackId: users.slackId,
			slackAvatarUrl: users.slackAvatarUrl,
			slackDisplayName: users.slackDisplayName,
			verificationStatus: users.verificationStatus,
			yswsEligible: users.yswsEligible,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt
		})
		.from(users)
		.orderBy(desc(users.createdAt));

	return { users: allUsers };
}
