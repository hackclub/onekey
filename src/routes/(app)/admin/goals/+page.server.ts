import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { timedGoals } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');

	const [goal] = await db
		.select()
		.from(timedGoals)
		.orderBy(desc(timedGoals.createdAt))
		.limit(1);

	return { goal: goal ?? null };
}

export const actions = {
	// Create or update the single current timed goal. Editing an existing goal
	// preserves its createdAt so the countdown ring keeps its original start
	// point; creating a fresh goal starts the ring now.
	save: async ({ request, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden');

		const form = await request.formData();
		const name = (form.get('name') as string | null)?.trim();
		const description = (form.get('description') as string | null)?.trim() || null;
		const currentHours = Number(form.get('current_hours'));
		const targetHours = Number(form.get('target_hours'));
		const deadlineRaw = (form.get('deadline') as string | null)?.trim();

		if (!name) return fail(400, { error: 'goal name is required' });
		if (!Number.isFinite(currentHours) || currentHours < 0)
			return fail(400, { error: 'current hours must be 0 or more' });
		if (!Number.isFinite(targetHours) || targetHours < 1)
			return fail(400, { error: 'target hours must be at least 1' });
		if (!deadlineRaw) return fail(400, { error: 'deadline is required' });

		const deadline = new Date(deadlineRaw);
		if (isNaN(deadline.getTime())) return fail(400, { error: 'invalid deadline' });

		const values = {
			name,
			description,
			currentHours: Math.round(currentHours),
			targetHours: Math.round(targetHours),
			deadline
		};

		const [existing] = await db
			.select({ id: timedGoals.id })
			.from(timedGoals)
			.orderBy(desc(timedGoals.createdAt))
			.limit(1);

		if (existing) {
			await db
				.update(timedGoals)
				.set({ ...values, updatedAt: new Date() })
				.where(eq(timedGoals.id, existing.id));
		} else {
			await db.insert(timedGoals).values(values);
		}

		return { success: true };
	},

	// Remove the current goal so the home card falls back to community goals.
	clear: async ({ locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden');
		await db.delete(timedGoals);
		return { success: true, cleared: true };
	}
};
