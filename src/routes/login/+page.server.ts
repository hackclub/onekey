import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

export async function load({ cookies, url }) {
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

	const email = url.searchParams.get('email');
	if (email) params.set('login_hint', email);

	redirect(302, `https://auth.hackclub.com/oauth/authorize?${params}`);
}
