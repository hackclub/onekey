import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eligibilityOverrides, users } from '$lib/server/db/schema';
import { desc, eq, or, sql } from 'drizzle-orm';
import { normalizeIdentifier } from '$lib/server/eligibility-overrides';

export async function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');

	// Users only exist once they've logged in successfully, so the join is empty
	// until an overridden user signs in for the first time.
	const rows = await db
		.select({
			id: eligibilityOverrides.id,
			identifier: eligibilityOverrides.identifier,
			note: eligibilityOverrides.note,
			createdAt: eligibilityOverrides.createdAt,
			name: users.name,
			nickname: users.nickname,
			slackDisplayName: users.slackDisplayName,
			slackAvatarUrl: users.slackAvatarUrl
		})
		.from(eligibilityOverrides)
		.leftJoin(
			users,
			or(
				eq(eligibilityOverrides.identifier, users.hcaId),
				eq(eligibilityOverrides.identifier, users.slackId),
				eq(eligibilityOverrides.identifier, sql`lower(${users.email})`)
			)
		)
		.orderBy(desc(eligibilityOverrides.createdAt));

	return { overrides: rows };
}

export const actions = {
	add: async ({ request, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden');

		const data = await request.formData();
		const raw = (data.get('identifier') as string | null)?.trim();
		const note = (data.get('note') as string | null)?.trim() || null;

		if (!raw) return fail(400, { error: 'identifier is required' });
		const identifier = normalizeIdentifier(raw);

		const existing = await db
			.select()
			.from(eligibilityOverrides)
			.where(eq(eligibilityOverrides.identifier, identifier))
			.limit(1);
		if (existing.length > 0) return fail(409, { error: `${identifier} already has an override` });

		await db.insert(eligibilityOverrides).values({ identifier, note });
	},

	remove: async ({ request, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden');

		const data = await request.formData();
		const id = data.get('id') as string | null;

		if (!id) return fail(400, { error: 'id is required' });

		await db.delete(eligibilityOverrides).where(eq(eligibilityOverrides.id, id));
	}
};
