import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export function load({ locals }) {
	if (!locals.user) redirect(302, '/login');
	return { user: locals.user };
}

export const actions = {
	saveAddress: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const form = await request.formData();
		await db
			.update(users)
			.set({
				streetAddress: (form.get('street_address') as string)?.trim() || null,
				addressLine2: (form.get('address_line_2') as string)?.trim() || null,
				locality: (form.get('locality') as string)?.trim() || null,
				region: (form.get('region') as string)?.trim() || null,
				postalCode: (form.get('postal_code') as string)?.trim() || null,
				country: (form.get('country') as string)?.trim() || null,
				updatedAt: new Date()
			})
			.where(eq(users.hcaId, locals.user.sub));
		return { success: true };
	},

	saveNickname: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const form = await request.formData();
		await db
			.update(users)
			.set({ nickname: (form.get('nickname') as string)?.trim() || null, updatedAt: new Date() })
			.where(eq(users.hcaId, locals.user.sub));
		return { success: true };
	},

	saveDarkMode: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const form = await request.formData();
		await db
			.update(users)
			.set({ darkModeEnabled: form.get('dark_mode_enabled') === 'true', updatedAt: new Date() })
			.where(eq(users.hcaId, locals.user.sub));
		return { success: true };
	}
};
