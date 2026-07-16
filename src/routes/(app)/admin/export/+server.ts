import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, projects, projectApprovals } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

/** Quote a CSV cell if it contains a comma, quote, or newline; escape embedded quotes. */
function csvCell(value: string | null | undefined): string {
	const s = value == null ? '' : String(value);
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
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

	const lines = [HEADERS.join(',')];
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
				.map(csvCell)
				.join(',')
		);
	}

	// Prepend a UTF-8 BOM so Excel opens the file with correct encoding.
	const csv = '﻿' + lines.join('\r\n') + '\r\n';

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="onekey-accepted-people.csv"'
		}
	});
};
