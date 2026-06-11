import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashToken, encryptToken } from '$lib/server/session';
import type { RequestHandler } from './$types';

const HACKATIME_BASE_URL = 'https://hackatime.hackclub.com';
const DEV_ENCRYPTION_KEY = '0'.repeat(64);

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const savedState = cookies.get('hackatime_state');

	if (!code) error(400, 'missing code');
	if (!savedState || state !== savedState) error(400, 'invalid state');

	cookies.delete('hackatime_state', { path: '/' });

	const rawToken = cookies.get('hca_session');
	if (!rawToken) redirect(302, '/?needs_auth=1');

	const row = await db
		.select()
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, hashToken(rawToken)))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	if (!row || row.sessions.expiresAt <= new Date()) redirect(302, '/?needs_auth=1');

	const redirectUri = env.HACKATIME_REDIRECT_URI || `${url.origin}/auth/hackatime/callback`;

	const tokenRes = await fetch(`${HACKATIME_BASE_URL}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: env.HACKATIME_CLIENT_ID,
			client_secret: env.HACKATIME_CLIENT_SECRET,
			redirect_uri: redirectUri,
			code
		})
	});

	if (!tokenRes.ok) error(502, 'hackatime token exchange failed');
	const { access_token } = await tokenRes.json();

	const meRes = await fetch(`${HACKATIME_BASE_URL}/api/v1/authenticated/me`, {
		headers: { Authorization: `Bearer ${access_token}` }
	});

	if (!meRes.ok) error(502, 'failed to fetch hackatime user info');
	const hackatimeUser = await meRes.json();
	const hackatimeUserId = String(hackatimeUser.data?.id ?? hackatimeUser.id ?? '');

	const encKey = Buffer.from(env.TOKEN_ENCRYPTION_KEY || (dev ? DEV_ENCRYPTION_KEY : ''), 'hex');
	const { ct, iv, tag } = encryptToken(access_token, encKey);

	await db
		.update(users)
		.set({
			hackatimeUserId,
			hackatimeTokenCt: ct,
			hackatimeTokenIv: iv,
			hackatimeTokenTag: tag,
			updatedAt: new Date()
		})
		.where(eq(users.id, row.users.id));

	redirect(302, '/home');
};
