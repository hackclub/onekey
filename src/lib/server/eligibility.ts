// YSWS eligibility is age-based: a user qualifies if they are 13 to 18 years old
// (inclusive) — i.e. on or after their 13th birthday and before their 19th birthday.
// Birthdays originate from Hack Club Auth's standard `birthdate` claim, stored as an
// ISO `YYYY-MM-DD` string in users.birthday.

export const MIN_AGE = 13;
export const MAX_AGE = 18;

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
export function isYswsEligible(birthday: string | null | undefined): boolean {
	const age = calculateAge(birthday);
	if (age === null) return false;
	return age >= MIN_AGE && age <= MAX_AGE;
}
