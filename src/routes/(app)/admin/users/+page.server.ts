import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, balanceAdjustments } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendSlackDM } from '$lib/server/slack';
import { formatHours } from '$lib/format';
import { getAvailableSeconds } from '$lib/server/balance';

export async function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');

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
			yswsCheckResult: users.yswsCheckResult,
			birthday: users.birthday,
			streetAddress: users.streetAddress,
			addressLine2: users.addressLine2,
			locality: users.locality,
			region: users.region,
			postalCode: users.postalCode,
			country: users.country,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt
		})
		.from(users)
		.orderBy(desc(users.createdAt));

	const adminAlias = db.select({
		id: users.id,
		displayName: users.slackDisplayName,
		nickname: users.nickname,
		name: users.name
	}).from(users).as('admin_user');

	const allAdjustments = await db
		.select({
			id: balanceAdjustments.id,
			userId: balanceAdjustments.userId,
			seconds: balanceAdjustments.seconds,
			message: balanceAdjustments.message,
			createdAt: balanceAdjustments.createdAt,
			adminName: adminAlias.displayName,
			adminNickname: adminAlias.nickname,
			adminRealName: adminAlias.name
		})
		.from(balanceAdjustments)
		.innerJoin(adminAlias, eq(balanceAdjustments.adminId, adminAlias.id))
		.orderBy(desc(balanceAdjustments.createdAt));

	return { users: allUsers, adjustments: allAdjustments };
}

export const actions = {
	adjustBalance: async ({ request, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden');

		const form = await request.formData();
		const userId = form.get('user_id') as string;
		const minutes = parseInt(form.get('minutes') as string);
		const message = (form.get('message') as string)?.trim();

		if (!userId) return fail(400, { error: 'user id required' });
		if (!message) return fail(400, { error: 'message is required' });
		if (isNaN(minutes) || minutes === 0) return fail(400, { error: 'minutes must be a non-zero number' });

		const [adminUser] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.hcaId, locals.user!.sub))
			.limit(1);
		if (!adminUser) return fail(400, { error: 'admin user not found' });

		const [targetUser] = await db
			.select({ id: users.id, slackId: users.slackId })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		if (!targetUser) return fail(400, { error: 'user not found' });

		const seconds = minutes * 60;

		if (seconds < 0) {
			const currentBalance = await getAvailableSeconds(userId);
			if (currentBalance + seconds < 0) {
				return fail(400, {
					error: `adjustment would push balance below zero (current balance is ${formatHours(currentBalance)})`
				});
			}
		}

		await db.insert(balanceAdjustments).values({
			userId,
			adminId: adminUser.id,
			seconds,
			message
		});

		if (targetUser.slackId) {
			const verb = seconds > 0 ? 'added to' : 'deducted from';
			const absFormatted = formatHours(Math.abs(seconds));
			await sendSlackDM(
				targetUser.slackId,
				`*${absFormatted} has been ${verb} your onekey balance.*\n\n_"${message}"_\n\nView your balance at <https://onekey.hackclub.com/shop|onekey.hackclub.com/shop>.`
			);
		}

		return { success: true };
	}
};
