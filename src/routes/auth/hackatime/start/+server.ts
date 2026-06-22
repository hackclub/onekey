import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashToken } from '$lib/server/session';
import type { RequestHandler } from './$types';

const HACKATIME_BASE_URL = 'https://hackatime.hackclub.com';

export const GET: RequestHandler = async ({ cookies, url }) => {
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

	const state = crypto.randomUUID();
	cookies.set('hackatime_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 10
	});

	// Where to send the user back to after linking. Only accept safe, internal
	// paths (a single leading slash) so this can't be turned into an open redirect.
	const returnTo = url.searchParams.get('return');
	if (returnTo && /^\/(?![/\\])/.test(returnTo)) {
		cookies.set('hackatime_return', returnTo, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 10
		});
	} else {
		cookies.delete('hackatime_return', { path: '/' });
	}

	const redirectUri = env.HACKATIME_REDIRECT_URI || `${url.origin}/auth/hackatime/callback`;

	const params = new URLSearchParams({
		client_id: env.HACKATIME_CLIENT_ID,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'profile read',
		state
	});

	redirect(302, `${HACKATIME_BASE_URL}/oauth/authorize?${params}`);
};
