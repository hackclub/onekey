import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashToken } from '$lib/server/session';
import { getLaunched } from '$lib/server/launch';

const adminSet = new Set(
	(env.ADMIN_IDS || '').split(' ').map((id) => id.trim()).filter(Boolean)
);

const reviewerSet = new Set(
	(env.REVIEWER_IDS || '').split(' ').map((id) => id.trim()).filter(Boolean)
);

// Paths always accessible regardless of launch state
function isPublicPath(pathname: string): boolean {
	return (
		pathname === '/' ||
		pathname === '/login' ||
		pathname === '/ineligible' ||
		pathname.startsWith('/auth/') ||
		pathname.startsWith('/img/') ||
		pathname.startsWith('/audio/')
	);
}

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
				ysws_eligible: u.yswsEligible ?? undefined,
				hackatime_linked: !!(u.hackatimeTokenCt && u.hackatimeTokenIv && u.hackatimeTokenTag),
				street_address: u.streetAddress ?? undefined,
				address_line_2: u.addressLine2 ?? undefined,
				locality: u.locality ?? undefined,
				region: u.region ?? undefined,
				postal_code: u.postalCode ?? undefined,
				country: u.country ?? undefined,
				key_sfx_enabled: u.keySfxEnabled,
				dark_mode_enabled: u.darkModeEnabled
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

	const launched = await getLaunched();
	event.locals.isLaunched = launched;

	// Block non-admin access to everything except public paths when not launched
	if (!launched && !event.locals.isAdmin && !isPublicPath(event.url.pathname)) {
		return Response.redirect(`${event.url.origin}/`, 302);
	}

	return resolve(event);
};
