import { guides } from '$lib/guides';

export function load() {
	return {
		guides: guides.map(({ slug, title, description, thumbnail, stack }) => ({
			slug,
			title,
			description,
			thumbnail,
			stack
		}))
	};
}
