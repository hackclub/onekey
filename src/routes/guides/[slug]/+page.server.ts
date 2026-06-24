import { error } from '@sveltejs/kit';
import { getGuide } from '$lib/guides';

export function load({ params }) {
	const guide = getGuide(params.slug);
	if (!guide) error(404, 'Guide not found');
	return { guide };
}
