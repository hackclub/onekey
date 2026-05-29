import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { shopOrders, shopItems, shopCategories, users } from '$lib/server/db/schema';
import { eq, asc, notInArray } from 'drizzle-orm';

export async function load() {
	const orders = await db
		.select({
			id: shopOrders.id,
			status: shopOrders.status,
			priceSeconds: shopOrders.priceSeconds,
			selectedOptions: shopOrders.selectedOptions,
			createdAt: shopOrders.createdAt,
			itemName: shopItems.name,
			categoryName: shopCategories.name,
			userName: users.slackDisplayName,
			userNickname: users.nickname,
			userAvatar: users.slackAvatarUrl,
			userStreet: users.streetAddress,
			userLocality: users.locality,
			userRegion: users.region,
			userPostal: users.postalCode,
			userCountry: users.country
		})
		.from(shopOrders)
		.innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
		.innerJoin(shopCategories, eq(shopItems.categoryId, shopCategories.id))
		.innerJoin(users, eq(shopOrders.userId, users.id))
		.where(notInArray(shopOrders.status, ['delivered', 'refunded']))
		.orderBy(asc(shopOrders.createdAt));

	return { orders };
}

export const actions = {
	updateStatus: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(form.get('order_id') as string);
		const status = (form.get('status') as string)?.trim();

		const VALID = ['ordered', 'packed', 'shipped', 'delivered'];
		if (!id || isNaN(id)) return fail(400, { error: 'invalid order id' });
		if (!VALID.includes(status)) return fail(400, { error: 'invalid status' });

		await db.update(shopOrders)
			.set({ status, updatedAt: new Date() })
			.where(eq(shopOrders.id, id));

		return { success: true };
	},

	refund: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(form.get('order_id') as string);
		if (!id || isNaN(id)) return fail(400, { error: 'invalid order id' });

		await db.update(shopOrders)
			.set({ status: 'refunded', updatedAt: new Date() })
			.where(eq(shopOrders.id, id));

		return { success: true };
	}
};
