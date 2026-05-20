import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user) redirect(302, '/');
	return { user: locals.user, isAdmin: locals.isAdmin, isReviewer: locals.isReviewer };
}
