import { redirect, error } from '@sveltejs/kit';
import { HCA_CLIENT_ID, HCA_CLIENT_SECRET, HCA_REDIRECT_URI, SLACK_BOT_TOKEN, SESSION_SECRET } from '$env/static/private';
import { dev } from '$app/environment';
import { signCookie } from '$lib/server/session';
import type { RequestHandler } from './$types';

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

	const secret = SESSION_SECRET || (dev ? 'dev-secret-do-not-use-in-prod' : '');
	const payload = JSON.stringify({ access_token, user: { ...user, avatar_url, slack_display_name } });
	cookies.set('hca_session', signCookie(payload, secret), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 60 * 24 * 30
	});

	redirect(302, '/home');
};
