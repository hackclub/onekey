import { error } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');
}
