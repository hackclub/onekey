import type { CheckResult } from '$lib/server/eligibility';

// Hack Club Identity's public verification check (no auth required).
const CHECK_URL = 'https://auth.hackclub.com/api/external/check';

const VALID_RESULTS: CheckResult[] = [
	'needs_submission',
	'pending',
	'verified_eligible',
	'verified_but_over_18',
	'rejected',
	'not_found'
];

/**
 * Look up a user's YSWS verification status by their IDV id (the `ident!…` HCA
 * `sub`). Returns the result string, or null if the endpoint is unreachable,
 * errors, or returns something unexpected — callers fall back to the age check
 * on null.
 */
export async function checkYswsStatus(idvId: string): Promise<CheckResult | null> {
	if (!idvId) return null;
	try {
		const res = await fetch(`${CHECK_URL}?idv_id=${encodeURIComponent(idvId)}`, {
			headers: { Accept: 'application/json' }
		});
		if (!res.ok) return null;
		const data = await res.json();
		const result = data?.result;
		return VALID_RESULTS.includes(result) ? (result as CheckResult) : null;
	} catch {
		return null;
	}
}
