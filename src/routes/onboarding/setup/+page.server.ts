import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const actions: Actions = {
	saveAddress: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/?needs_auth=1');
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
	}
};
