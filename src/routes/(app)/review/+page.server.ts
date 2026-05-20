import { error } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.isReviewer) error(403, 'Forbidden');
	return { user: locals.user };
}
