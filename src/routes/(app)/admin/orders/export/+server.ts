import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { shopOrders, shopItems, shopCategories, users } from '$lib/server/db/schema';
import { eq, asc, notInArray } from 'drizzle-orm';

/** Normalize "smart"/typographic quote characters that sneak in via copy-paste to plain ASCII. */
function normalizeQuotes(value: string | null | undefined): string {
	return (value ?? '')
		.replace(/[‘’‚‛′‵`´]/g, "'")
		.replace(/[“”„‟″‶«»]/g, '"');
}

/** Quote a CSV cell if it contains a comma, quote, or newline; escape embedded quotes. */
function csvCell(value: string | number | null | undefined): string {
	const s = normalizeQuotes(value == null ? '' : String(value));
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Split a single stored name into first/last: last whitespace-token is the last name. */
function splitName(full: string | null | undefined): { first: string; last: string } {
	const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return { first: '', last: '' };
	if (parts.length === 1) return { first: parts[0], last: '' };
	return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

/** Flatten the order's selected options JSON into "label: value; label: value". */
function formatOptions(json: string): string {
	try {
		const opts = JSON.parse(json) as Record<string, string>;
		return Object.entries(opts)
			.map(([k, v]) => `${k}: ${v}`)
			.join('; ');
	} catch {
		return '';
	}
}

const HEADERS = [
	'Order ID',
	'Status',
	'Ordered At',
	'Item',
	'Category',
	'Options',
	'Hours',
	'First Name',
	'Last Name',
	'Email',
	'Phone',
	'Slack ID',
	'Slack Handle',
	'Line 1',
	'Line 2',
	'City',
	'State/Province',
	'Postal_Code',
	'Country'
];

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.isAdmin) error(403, 'Forbidden');

	// Default to the open queue (same rows as the orders page). `?all=1` includes
	// fulfilled and refunded orders too.
	const includeAll = url.searchParams.get('all') === '1';

	const query = db
		.select({
			id: shopOrders.id,
			status: shopOrders.status,
			priceSeconds: shopOrders.priceSeconds,
			selectedOptions: shopOrders.selectedOptions,
			createdAt: shopOrders.createdAt,
			itemName: shopItems.name,
			categoryName: shopCategories.name,
			name: users.name,
			email: users.email,
			slackId: users.slackId,
			slackDisplayName: users.slackDisplayName,
			nickname: users.nickname,
			streetAddress: users.streetAddress,
			addressLine2: users.addressLine2,
			locality: users.locality,
			region: users.region,
			postalCode: users.postalCode,
			country: users.country
		})
		.from(shopOrders)
		.innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
		.innerJoin(shopCategories, eq(shopItems.categoryId, shopCategories.id))
		.innerJoin(users, eq(shopOrders.userId, users.id))
		.orderBy(asc(shopOrders.createdAt));

	const rows = includeAll
		? await query
		: await query.where(notInArray(shopOrders.status, ['fulfilled', 'refunded']));

	const lines = [HEADERS.join(',')];
	for (const r of rows) {
		const { first, last } = splitName(r.name);
		lines.push(
			[
				r.id,
				r.status,
				r.createdAt.toISOString(),
				r.itemName,
				r.categoryName,
				formatOptions(r.selectedOptions),
				(r.priceSeconds / 3600).toFixed(2),
				first,
				last,
				r.email,
				// Phone numbers aren't collected anywhere in the app yet; column kept so
				// the Airtable field mapping stays stable once they are.
				'',
				r.slackId,
				r.slackDisplayName ?? r.nickname,
				r.streetAddress,
				r.addressLine2,
				r.locality,
				r.region,
				r.postalCode,
				r.country
			]
				.map(csvCell)
				.join(',')
		);
	}

	// Prepend a UTF-8 BOM so Excel opens the file with correct encoding.
	const csv = '﻿' + lines.join('\r\n') + '\r\n';
	const stamp = new Date().toISOString().slice(0, 10);

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="onekey-orders-${includeAll ? 'all' : 'queue'}-${stamp}.csv"`
		}
	});
};
