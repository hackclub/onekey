import { redirect, error } from '@sveltejs/kit';
import {
	HCA_CLIENT_ID,
	HCA_CLIENT_SECRET,
	HCA_REDIRECT_URI,
	SLACK_BOT_TOKEN,
	TOKEN_ENCRYPTION_KEY
} from '$env/static/private';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { encryptToken, generateSessionToken, hashToken } from '$lib/server/session';
import type { RequestHandler } from './$types';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEV_ENCRYPTION_KEY = '0'.repeat(64);

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const savedState = cookies.get('hca_state');

	if (!code) error(400, 'missing code');
	if (!savedState || state !== savedState) error(400, 'invalid state');

	cookies.delete('hca_state', { path: '/' });

	const tokenRes = await fetch('https://auth.hackclub.com/oauth/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: HCA_CLIENT_ID,
			client_secret: HCA_CLIENT_SECRET,
			redirect_uri: HCA_REDIRECT_URI,
			code
		})
	});

	if (!tokenRes.ok) error(502, 'token exchange failed');
	const { access_token } = await tokenRes.json();

	const meRes = await fetch('https://auth.hackclub.com/oauth/userinfo', {
		headers: { Authorization: `Bearer ${access_token}` }
	});

	if (!meRes.ok) error(502, 'failed to fetch user info');
	const user = await meRes.json();

	if (user.ysws_eligible === false) {
		redirect(302, '/ineligible');
	}

	let avatar_url: string | undefined;
	let slack_display_name: string | undefined;
	if (user.slack_id && SLACK_BOT_TOKEN) {
		const slackRes = await fetch(`https://slack.com/api/users.info?user=${user.slack_id}`, {
			headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` }
		});
		const slackData = await slackRes.json();
		avatar_url = slackData.user?.profile?.image_192 ?? slackData.user?.profile?.image_72 ?? undefined;
		slack_display_name = slackData.user?.profile?.display_name || slackData.user?.name || undefined;
	}

	const encKey = Buffer.from(TOKEN_ENCRYPTION_KEY || (dev ? DEV_ENCRYPTION_KEY : ''), 'hex');
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
		accessTokenCt: ct,
		accessTokenIv: iv,
		accessTokenTag: tag,
		updatedAt: new Date()
	};

	const [dbUser] = await db
		.insert(users)
		.values(userRow)
		.onConflictDoUpdate({ target: users.hcaId, set: userRow })
		.returning({ id: users.id });

	const rawToken = generateSessionToken();
	await db.insert(sessions).values({
		id: hashToken(rawToken),
		userId: dbUser.id,
		expiresAt: new Date(Date.now() + SESSION_TTL_MS)
	});

	cookies.set('hca_session', rawToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: SESSION_TTL_MS / 1000
	});

	redirect(302, '/home');
};
