import type { Handle } from '@sveltejs/kit';
import { ADMIN_IDS, REVIEWER_IDS } from '$env/static/private';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashToken } from '$lib/server/session';

const adminSet = new Set(
	(ADMIN_IDS || '').split(' ').map((id) => id.trim()).filter(Boolean)
);

const reviewerSet = new Set(
	(REVIEWER_IDS || '').split(' ').map((id) => id.trim()).filter(Boolean)
);

export const handle: Handle = async ({ event, resolve }) => {
	const rawToken = event.cookies.get('hca_session');

	if (rawToken) {
		const row = await db
			.select()
			.from(sessions)
			.innerJoin(users, eq(sessions.userId, users.id))
			.where(eq(sessions.id, hashToken(rawToken)))
			.limit(1)
			.then((rows) => rows[0] ?? null);

		if (row && row.sessions.expiresAt > new Date()) {
			const u = row.users;
			event.locals.user = {
				sub: u.hcaId,
				name: u.name ?? undefined,
				nickname: u.nickname ?? undefined,
				email: u.email ?? undefined,
				email_verified: u.emailVerified ?? undefined,
				slack_id: u.slackId ?? undefined,
				verification_status: u.verificationStatus ?? undefined,
				avatar_url: u.slackAvatarUrl ?? undefined,
				slack_display_name: u.slackDisplayName ?? undefined,
				ysws_eligible: u.yswsEligible ?? undefined
			};
			event.locals.isAdmin = adminSet.has(u.hcaId);
			event.locals.isReviewer = reviewerSet.has(u.hcaId);
		} else {
			if (row) {
				await db.delete(sessions).where(eq(sessions.id, hashToken(rawToken)));
			}
			event.locals.user = null;
			event.locals.isAdmin = false;
			event.locals.isReviewer = false;
			event.cookies.delete('hca_session', { path: '/' });
		}
	} else {
		event.locals.user = null;
		event.locals.isAdmin = false;
		event.locals.isReviewer = false;
	}

	return resolve(event);
};
