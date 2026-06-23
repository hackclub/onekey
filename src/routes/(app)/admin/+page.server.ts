import { error, fail } from '@sveltejs/kit';
import { setLaunched } from '$lib/server/launch';

export function load({ locals }) {
	if (!locals.isAdmin) error(403, 'forbidden');
	return { user: locals.user, isLaunched: locals.isLaunched };
}

export const actions = {
	launch: async ({ locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
		await setLaunched(true);
		return { success: true };
	},
	lock: async ({ locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
		await setLaunched(false);
		return { success: true };
	}
};
