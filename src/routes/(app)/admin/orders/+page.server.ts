import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { shopOrders, shopItems, shopCategories, users } from '$lib/server/db/schema';
import { eq, asc, notInArray } from 'drizzle-orm';
import { sendSlackDM } from '$lib/server/slack';

export async function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');
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
			userAddressLine2: users.addressLine2,
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
	updateStatus: async ({ request, locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
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

	refund: async ({ request, locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
		const form = await request.formData();
		const id = parseInt(form.get('order_id') as string);
		const message = (form.get('message') as string)?.trim() || null;
		if (!id || isNaN(id)) return fail(400, { error: 'invalid order id' });

		const [order] = await db
			.select({ itemName: shopItems.name, userSlackId: users.slackId })
			.from(shopOrders)
			.innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
			.innerJoin(users, eq(shopOrders.userId, users.id))
			.where(eq(shopOrders.id, id))
			.limit(1);

		await db.update(shopOrders)
			.set({ status: 'refunded', updatedAt: new Date() })
			.where(eq(shopOrders.id, id));

		if (order?.userSlackId) {
			const ordersUrl = `${new URL(request.url).origin}/shop/orders`;
			const text = message
				? `Your order *${order.itemName}* (order #${id}) has been refunded.\n\n_"${message}"_\n\n<${ordersUrl}|See your orders on the dashboard>`
				: `Your order *${order.itemName}* (order #${id}) has been refunded. <${ordersUrl}|See your orders on the dashboard>`;
			await sendSlackDM(order.userSlackId, text);
		}

		return { success: true };
	}
};
