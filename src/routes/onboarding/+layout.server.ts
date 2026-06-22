import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!locals.user) redirect(302, '/?needs_auth=1');
	// Onboarding is strictly first-time-only — anyone who's finished it gets
	// bounced to the dashboard.
	if (locals.user.onboarded) redirect(302, '/home');

	return { user: locals.user };
}
