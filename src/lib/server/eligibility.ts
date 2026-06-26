// YSWS eligibility combines Hack Club Identity's verification check with an age
// fallback:
//   - `verified_eligible`      -> eligible, bypassing the age check entirely
//   - `verified_but_over_18`   -> hard-blocked from the platform
//   - `rejected`               -> hard-blocked from the platform
//   - everything else (needs_submission / pending / not_found / unknown / API
//     error) -> fall back to the age check (must be 13-18 inclusive). These
//     users are the "starter prize" tier when age-eligible.
//
// Ages come from Hack Club Auth's standard `birthdate` claim, stored as an ISO
// `YYYY-MM-DD` string in users.birthday.

export const MIN_AGE = 13;
export const MAX_AGE = 18;

/** Possible `result` values from GET /api/external/check. */
export type CheckResult =
	| 'needs_submission'
	| 'pending'
	| 'verified_eligible'
	| 'verified_but_over_18'
	| 'rejected'
	| 'not_found';

export type EligibilityDecision =
	| 'eligible'
	| 'blocked_over_18'
	| 'blocked_rejected'
	| 'blocked_age';

/**
 * Completed years of age for an ISO `YYYY-MM-DD` birthday string, or null if the
 * birthday is missing or not a valid date.
 */
export function calculateAge(birthday: string | null | undefined, now: Date = new Date()): number | null {
	if (!birthday) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthday.trim());
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);

	// Reject impossible dates (e.g. 2010-02-31) by round-tripping through Date.
	const dob = new Date(year, month - 1, day);
	if (dob.getFullYear() !== year || dob.getMonth() !== month - 1 || dob.getDate() !== day) {
		return null;
	}

	let age = now.getFullYear() - year;
	const hadBirthdayThisYear =
		now.getMonth() > month - 1 || (now.getMonth() === month - 1 && now.getDate() >= day);
	if (!hadBirthdayThisYear) age -= 1;

	return age;
}

/**
 * True when the birthday places the user in the eligible 13-18 age range (inclusive).
 * An unknown or invalid birthday is treated as ineligible — we can't verify the age.
 */
export function isAgeEligible(birthday: string | null | undefined): boolean {
	const age = calculateAge(birthday);
	if (age === null) return false;
	return age >= MIN_AGE && age <= MAX_AGE;
}

/**
 * Combine the IDV check result with the age fallback into a single decision.
 * `result` is null when the check couldn't be performed (network/API error),
 * which falls through to the age check by design.
 */
export function decideEligibility(
	result: CheckResult | null,
	birthday: string | null | undefined
): EligibilityDecision {
	if (result === 'verified_eligible') return 'eligible';
	if (result === 'verified_but_over_18') return 'blocked_over_18';
	if (result === 'rejected') return 'blocked_rejected';
	// needs_submission | pending | not_found | null -> age fallback
	return isAgeEligible(birthday) ? 'eligible' : 'blocked_age';
}

export const isEligibleDecision = (d: EligibilityDecision): boolean => d === 'eligible';

/** Human-facing reason a submission was blocked. */
export function eligibilityMessage(d: EligibilityDecision): string {
	switch (d) {
		case 'blocked_age':
			return 'you must be a hack clubber aged 13-18 to submit a project';
		case 'blocked_over_18':
			return 'your hack club identity verification shows you are over 18, so you are not eligible';
		case 'blocked_rejected':
			return 'your hack club identity verification was rejected, so you are not eligible';
		default:
			return 'you are not eligible to submit a project';
	}
}
