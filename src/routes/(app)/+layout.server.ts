import { redirect } from '@sveltejs/kit';

export function load({ locals, url }) {
	if (!locals.user) redirect(302, '/?needs_auth=1');
	if (!locals.user.hackatime_linked && !url.pathname.startsWith('/auth/hackatime')) {
		redirect(302, '/auth/hackatime/start');
	}
	return { user: locals.user, isAdmin: locals.isAdmin, isReviewer: locals.isReviewer };
}
