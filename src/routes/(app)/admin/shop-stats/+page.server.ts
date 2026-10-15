import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { shopOrders, shopItems, shopCategories } from '$lib/server/db/schema';
import { eq, ne } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');

	// refunded orders never shipped, so they don't count toward popularity
	const rows = await db
		.select({
			itemId: shopOrders.itemId,
			status: shopOrders.status,
			priceSeconds: shopOrders.priceSeconds,
			selectedOptions: shopOrders.selectedOptions,
			itemName: shopItems.name,
			imageUrl: shopItems.imageUrl,
			available: shopItems.available,
			categoryName: shopCategories.name
		})
		.from(shopOrders)
		.innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
		.innerJoin(shopCategories, eq(shopItems.categoryId, shopCategories.id))
		.where(ne(shopOrders.status, 'refunded'));

	type ItemStat = {
		itemId: number;
		name: string;
		category: string;
		imageUrl: string | null;
		available: boolean;
		total: number;
		fulfilled: number;
		inQueue: number;
		spentSeconds: number;
		options: Map<string, number>;
	};

	const byItem = new Map<number, ItemStat>();
	for (const r of rows) {
		let stat = byItem.get(r.itemId);
		if (!stat) {
			stat = {
				itemId: r.itemId,
				name: r.itemName,
				category: r.categoryName,
				imageUrl: r.imageUrl,
				available: r.available,
				total: 0,
				fulfilled: 0,
				inQueue: 0,
				spentSeconds: 0,
				options: new Map()
			};
			byItem.set(r.itemId, stat);
		}
		stat.total++;
		if (r.status === 'fulfilled') stat.fulfilled++;
		else stat.inQueue++;
		stat.spentSeconds += r.priceSeconds;

		let selected: Record<string, unknown> = {};
		try {
			selected = JSON.parse(r.selectedOptions) ?? {};
		} catch {
			// malformed options just don't contribute to the breakdown
		}
		const combo = Object.values(selected)
			.filter((v) => typeof v === 'string' && v !== '')
			.join(' / ');
		if (combo) stat.options.set(combo, (stat.options.get(combo) ?? 0) + 1);
	}

	const items = [...byItem.values()]
		.sort((a, b) => b.total - a.total || b.spentSeconds - a.spentSeconds)
		.map(({ options, ...rest }) => ({
			...rest,
			options: [...options.entries()]
				.map(([label, n]) => ({ label, n }))
				.sort((a, b) => b.n - a.n)
		}));

	const byCategory = new Map<string, number>();
	for (const item of items) byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.total);

	return {
		items,
		categories: [...byCategory.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n),
		totals: {
			orders: rows.length,
			fulfilled: items.reduce((s, i) => s + i.fulfilled, 0),
			inQueue: items.reduce((s, i) => s + i.inQueue, 0),
			spentSeconds: items.reduce((s, i) => s + i.spentSeconds, 0),
			distinctItems: items.length
		}
	};
}
