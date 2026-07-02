import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { timedGoals } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { approvedHoursForGoal } from '$lib/server/goals';

export async function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');

	const [goal] = await db
		.select()
		.from(timedGoals)
		.orderBy(desc(timedGoals.createdAt))
		.limit(1);

	// Show the live computed progress so the admin sees what the home card shows.
	const currentHours = goal ? await approvedHoursForGoal(goal) : 0;

	return { goal: goal ?? null, currentHours };
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
		const targetHours = Number(form.get('target_hours'));
		const allTime = form.get('all_time') != null;
		const deadlineRaw = (form.get('deadline') as string | null)?.trim();

		if (!name) return fail(400, { error: 'goal name is required' });
		if (!Number.isFinite(targetHours) || targetHours < 1)
			return fail(400, { error: 'target hours must be at least 1' });
		if (!deadlineRaw) return fail(400, { error: 'deadline is required' });

		const deadline = new Date(deadlineRaw);
		if (isNaN(deadline.getTime())) return fail(400, { error: 'invalid deadline' });

		const values = {
			name,
			description,
			targetHours: Math.round(targetHours),
			allTime,
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
