import { db } from '$lib/server/db';
import { eligibilityOverrides } from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';

/** Normalize an admin-entered identifier: trim, and lowercase emails. */
export function normalizeIdentifier(raw: string): string {
	const v = raw.trim();
	return v.includes('@') ? v.toLowerCase() : v;
}

/**
 * True when an admin has granted this user an eligibility override, matched on
 * any of their HCA id, Slack id, or email. Overridden users are treated as
 * eligible regardless of their IDV check result or age.
 */
export async function hasEligibilityOverride(user: {
	hcaId?: string | null;
	slackId?: string | null;
	email?: string | null;
}): Promise<boolean> {
	const candidates = [user.hcaId, user.slackId, user.email]
		.filter((v): v is string => !!v)
		.map(normalizeIdentifier);
	if (candidates.length === 0) return false;

	const rows = await db
		.select({ id: eligibilityOverrides.id })
		.from(eligibilityOverrides)
		.where(inArray(eligibilityOverrides.identifier, candidates))
		.limit(1);
	return rows.length > 0;
}
