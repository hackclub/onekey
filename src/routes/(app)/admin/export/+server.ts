import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, projects, projectApprovals } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

/** Normalize "smart"/typographic quote characters that sneak in via copy-paste to plain ASCII. */
function normalizeQuotes(value: string | null | undefined): string {
	return (value ?? '')
		.replace(/[‘’‚‛′‵`´]/g, "'") // single curly / prime / accents → '
		.replace(/[“”„‟″‶«»]/g, '"'); // double curly / prime / guillemets → "
}

/**
 * Prepare a tab-separated cell: normalize smart quotes, then flatten any tab or
 * newline (the TSV delimiters) to a single space so every record stays one line
 * and columns line up. No quote-wrapping needed since fields never contain tabs.
 */
function tsvCell(value: string | null | undefined): string {
	return normalizeQuotes(value)
		.replace(/[\t\r\n]+/g, ' ')
		.trim();
}

/** Split a single stored name into first/last: last whitespace-token is the last name. */
function splitName(full: string | null | undefined): { first: string; last: string } {
	const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return { first: '', last: '' };
	if (parts.length === 1) return { first: parts[0], last: '' };
	return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

const HEADERS = [
	'First Name',
	'Last Name',
	'Line 1',
	'Line 2',
	'City',
	'State/Province',
	'Postal_Code',
	'Country',
	'Email',
	'Rubber Stamps'
];

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.isAdmin) error(403, 'Forbidden');

	// One row per person who owns at least one project with an approved approval.
	const rows = await db
		.selectDistinct({
			name: users.name,
			email: users.email,
			streetAddress: users.streetAddress,
			addressLine2: users.addressLine2,
			locality: users.locality,
			region: users.region,
			postalCode: users.postalCode,
			country: users.country
		})
		.from(users)
		.innerJoin(projects, eq(projects.userId, users.id))
		.innerJoin(
			projectApprovals,
			and(eq(projectApprovals.projectId, projects.id), eq(projectApprovals.status, 'approved'))
		);

	const lines = [HEADERS.join('\t')];
	for (const r of rows) {
		const { first, last } = splitName(r.name);
		lines.push(
			[
				first,
				last,
				r.streetAddress,
				r.addressLine2,
				r.locality,
				r.region,
				r.postalCode,
				r.country,
				r.email,
				'onekey Stickers'
			]
				.map(tsvCell)
				.join('\t')
		);
	}

	// Prepend a UTF-8 BOM so Excel opens the file with correct encoding.
	const tsv = '﻿' + lines.join('\r\n') + '\r\n';

	return new Response(tsv, {
		headers: {
			'Content-Type': 'text/tab-separated-values; charset=utf-8',
			'Content-Disposition': 'attachment; filename="onekey-accepted-people.tsv"'
		}
	});
};
