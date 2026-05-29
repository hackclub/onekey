import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, shopOrders, shopItems, shopCategories } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) redirect(302, '/login');

	const [dbUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.hcaId, locals.user.sub))
		.limit(1);

	if (!dbUser) redirect(302, '/login');

	const orders = await db
		.select({
			id: shopOrders.id,
			status: shopOrders.status,
			priceSeconds: shopOrders.priceSeconds,
			selectedOptions: shopOrders.selectedOptions,
			createdAt: shopOrders.createdAt,
			itemName: shopItems.name,
			itemImageUrl: shopItems.imageUrl
		})
		.from(shopOrders)
		.innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
		.leftJoin(shopCategories, eq(shopItems.categoryId, shopCategories.id))
		.where(eq(shopOrders.userId, dbUser.id))
		.orderBy(desc(shopOrders.createdAt));

	return { orders };
}
