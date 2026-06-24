import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { encryptToken, generateSessionToken, hashToken } from '$lib/server/session';
import { getLaunched } from '$lib/server/launch';
import { inviteToChannel } from '$lib/server/slack';
import type { RequestHandler } from './$types';

const ONEKEY_CHANNEL_ID = 'C0AM132QQUR';

const adminSet = new Set((env.ADMIN_IDS || '').split(' ').map((id) => id.trim()).filter(Boolean));
const reviewerSet = new Set((env.REVIEWER_IDS || '').split(' ').map((id) => id.trim()).filter(Boolean));

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEV_ENCRYPTION_KEY = '0'.repeat(64);

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const savedState = cookies.get('hca_state');

	if (!code || !state) redirect(302, '/?error=auth_failed');
	if (!savedState || state !== savedState) redirect(302, '/?error=session_expired');

	cookies.delete('hca_state', { path: '/' });

	const tokenRes = await fetch('https://auth.hackclub.com/oauth/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: env.HCA_CLIENT_ID,
			client_secret: env.HCA_CLIENT_SECRET,
			redirect_uri: env.HCA_REDIRECT_URI,
			code
		})
	});

	if (!tokenRes.ok) error(502, 'token exchange failed');
	const tokenData = await tokenRes.json();
	const access_token: string | undefined = tokenData.access_token;
	if (!access_token) error(502, 'no access token returned');

	const meRes = await fetch('https://auth.hackclub.com/oauth/userinfo', {
		headers: { Authorization: `Bearer ${access_token}` }
	});

	if (!meRes.ok) error(502, 'failed to fetch user info');
	const user = await meRes.json();

	if (!user.sub) redirect(302, '/?error=auth_failed');

	if (user.ysws_eligible === false) {
		redirect(302, '/ineligible');
	}

	let avatar_url: string | undefined;
	let slack_display_name: string | undefined;
	if (user.slack_id && env.SLACK_BOT_TOKEN) {
		const slackRes = await fetch(`https://slack.com/api/users.info?user=${user.slack_id}`, {
			headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}` }
		});
		const slackData = await slackRes.json();
		avatar_url = slackData.user?.profile?.image_192 ?? slackData.user?.profile?.image_72 ?? undefined;
		slack_display_name = slackData.user?.profile?.display_name || slackData.user?.name || undefined;

		inviteToChannel(user.slack_id, ONEKEY_CHANNEL_ID).catch(() => {});
	}

	const encKey = Buffer.from(env.TOKEN_ENCRYPTION_KEY || (dev ? DEV_ENCRYPTION_KEY : ''), 'hex');
	const { ct, iv, tag } = encryptToken(access_token, encKey);

	const userRow = {
		hcaId: user.sub,
		name: user.name ?? null,
		nickname: user.nickname ?? null,
		email: user.email ?? null,
		emailVerified: user.email_verified ?? null,
		slackId: user.slack_id ?? null,
		slackAvatarUrl: avatar_url ?? null,
		slackDisplayName: slack_display_name ?? null,
		verificationStatus: user.verification_status ?? null,
		yswsEligible: user.ysws_eligible ?? null,
		birthday: user.birthdate ?? null,
		accessTokenCt: ct,
		accessTokenIv: iv,
		accessTokenTag: tag,
		updatedAt: new Date()
	};

	// Address comes from the HCA `address` scope. We only autofill blank fields —
	// never overwrite an address the user has already entered themselves.
	// HCA packs both street lines into `street_address`, newline-separated, so
	// split the first line into line 1 and fold any remainder into line 2.
	const addr = user.address ?? {};
	const [streetLine1, ...streetRest] = (addr.street_address ?? '').split(/\r?\n/);
	const addressInsert = {
		streetAddress: streetLine1?.trim() || null,
		addressLine2: streetRest.join(' ').trim() || null,
		locality: addr.locality ?? null,
		region: addr.region ?? null,
		postalCode: addr.postal_code ?? null,
		country: addr.country ?? null
	};

	const [dbUser] = await db
		.insert(users)
		.values({ ...userRow, ...addressInsert })
		.onConflictDoUpdate({
			target: users.hcaId,
			set: {
				...userRow,
				streetAddress: sql`coalesce(nullif(${users.streetAddress}, ''), ${addressInsert.streetAddress})`,
				addressLine2: sql`coalesce(nullif(${users.addressLine2}, ''), ${addressInsert.addressLine2})`,
				locality: sql`coalesce(nullif(${users.locality}, ''), ${addressInsert.locality})`,
				region: sql`coalesce(nullif(${users.region}, ''), ${addressInsert.region})`,
				postalCode: sql`coalesce(nullif(${users.postalCode}, ''), ${addressInsert.postalCode})`,
				country: sql`coalesce(nullif(${users.country}, ''), ${addressInsert.country})`
			}
		})
		.returning({ id: users.id, onboardedAt: users.onboardedAt });

	const rawToken = generateSessionToken();
	await db.insert(sessions).values({
		id: hashToken(rawToken),
		userId: dbUser.id,
		expiresAt: new Date(Date.now() + SESSION_TTL_MS)
	});

	const launched = await getLaunched();
	const isAdmin = adminSet.has(user.sub);
	const isReviewer = reviewerSet.has(user.sub);

	if (!launched && !isAdmin && !isReviewer) {
		// Site is locked — kill the session and send them back with a message
		await db.delete(sessions).where(eq(sessions.id, hashToken(rawToken)));
		redirect(302, '/?locked=1');
	}

	cookies.set('hca_session', rawToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: SESSION_TTL_MS / 1000
	});

	// First-time users go through onboarding; returning users land on the dashboard.
	redirect(302, dbUser.onboardedAt ? '/home' : '/onboarding');
};
