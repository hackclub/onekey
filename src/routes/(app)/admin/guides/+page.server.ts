import { guides } from '$lib/guides';

export function load() {
	return {
		guides: guides.map(({ slug, title, description, stack, sections }) => ({
			slug,
			title,
			description,
			stack,
			sectionCount: sections.length
		}))
	};
}
