import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Can't reach the final step without first linking Hackatime in the setup step.
	if (!locals.user?.hackatime_linked) redirect(302, '/onboarding/setup');
};

export const actions: Actions = {
	finish: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/?needs_auth=1');
		if (!locals.user.hackatime_linked) redirect(302, '/onboarding/setup');

		const data = await request.formData();
		const destination = (data.get('destination') as string) || '/home';

		await db
			.update(users)
			.set({ onboardedAt: new Date(), updatedAt: new Date() })
			.where(eq(users.hcaId, locals.user.sub));

		redirect(302, destination);
	}
};
