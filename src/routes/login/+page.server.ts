import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

export async function load({ cookies }) {
	const state = crypto.randomUUID();
	cookies.set('hca_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 10
	});

	const params = new URLSearchParams({
		client_id: env.HCA_CLIENT_ID,
		redirect_uri: env.HCA_REDIRECT_URI,
		response_type: 'code',
		scope: 'openid profile email slack_id verification_status',
		state
	});

	redirect(302, `https://auth.hackclub.com/oauth/authorize?${params}`);
}
