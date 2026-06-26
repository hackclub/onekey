import { env } from '$env/dynamic/private';

export interface AirtableApprovalFields {
	repoUrl: string | null;
	demoUrl: string | null;
	authorName: string | null;
	authorEmail: string | null;
	screenshotUrl: string | null;
	description: string | null;
	authorStreetAddress: string | null;
	authorAddressLine2: string | null;
	authorLocality: string | null;
	authorRegion: string | null;
	authorCountry: string | null;
	authorPostalCode: string | null;
	authorBirthday: string | null;
	approvedSeconds: number;
	internalNote: string | null;
}

function splitName(fullName: string | null): { first: string | null; last: string | null } {
	if (!fullName?.trim()) return { first: null, last: null };
	const parts = fullName.trim().split(/\s+/);
	if (parts.length === 1) return { first: parts[0], last: null };
	return {
		first: parts.slice(0, -1).join(' '),
		last: parts[parts.length - 1]
	};
}

function extractGithubUsername(repoUrl: string | null): string | null {
	if (!repoUrl) return null;
	try {
		const url = new URL(repoUrl);
		if (url.hostname === 'github.com') {
			const parts = url.pathname.split('/').filter(Boolean);
			return parts[0] ?? null;
		}
	} catch {
		// not a valid URL
	}
	return repoUrl;
}

export async function createAirtableApprovalRecord(fields: AirtableApprovalFields): Promise<void> {
	const apiKey = env.AIRTABLE_API_KEY;
	const baseId = env.AIRTABLE_BASE_ID;
	const tableName = env.AIRTABLE_TABLE_NAME;

	if (!apiKey || !baseId || !tableName) {
		throw new Error(
			'Airtable not configured — set AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME'
		);
	}

	const { first, last } = splitName(fields.authorName);
	const hoursSpent = Math.ceil((fields.approvedSeconds / 3600) * 10) / 10;
	const githubUsername = extractGithubUsername(fields.repoUrl);

	const record: Record<string, unknown> = {};

	function set(key: string, value: unknown) {
		if (value !== null && value !== undefined && value !== '') {
			record[key] = value;
		}
	}

	set('Code URL', fields.repoUrl);
	set('Playable URL', fields.demoUrl);
	set('First Name', first);
	set('Last Name', last);
	set('Email', fields.authorEmail);
	if (fields.screenshotUrl) record['Screenshot'] = [{ url: fields.screenshotUrl }];
	set('Description', fields.description);
	set('GitHub Username', githubUsername);
	set('Address (Line 1)', fields.authorStreetAddress);
	set('Address (Line 2)', fields.authorAddressLine2);
	set('City', fields.authorLocality);
	set('State / Province', fields.authorRegion);
	set('Country', fields.authorCountry);
	set('ZIP / Postal Code', fields.authorPostalCode);
	set('Birthday', fields.authorBirthday);
	set('Optional - Override Hours Spent', hoursSpent);
	set('Optional - Override Hours Spent Justification', fields.internalNote);

	const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ fields: record })
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Airtable API error ${res.status}: ${body}`);
	}
}
