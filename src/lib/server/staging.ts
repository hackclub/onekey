import { env } from '$env/dynamic/private';

// Staging mode lets a non-production instance run without writing to external
// systems (e.g. Airtable), so test data never leaks into the real records.
// Enable by setting STAGING to "true", "1", or "yes".
export function isStaging(): boolean {
	const v = (env.STAGING ?? '').trim().toLowerCase();
	return v === 'true' || v === '1' || v === 'yes';
}
