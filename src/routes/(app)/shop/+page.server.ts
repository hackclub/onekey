import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, projects, projectApprovals, shopItems, shopOrders, balanceAdjustments } from '$lib/server/db/schema';
import { eq, and, sum, notInArray, asc } from 'drizzle-orm';
import { shopCategories } from '$lib/server/db/schema';
import { getAvailableSeconds } from '$lib/server/balance';

async function getDbUser(hcaId: string) {
	const [u] = await db.select({ id: users.id }).from(users).where(eq(users.hcaId, hcaId)).limit(1);
	return u ?? null;
}

export async function load({ locals }) {
	if (!locals.user) redirect(302, '/login');

	const dbUser = await getDbUser(locals.user.sub);
	const availableSeconds = dbUser ? await getAvailableSeconds(dbUser.id) : 0;

	const categories = await db
		.select()
		.from(shopCategories)
		.orderBy(asc(shopCategories.sortOrder), asc(shopCategories.name));

	const items = await db
		.select()
		.from(shopItems)
		.where(eq(shopItems.available, true))
		.orderBy(asc(shopItems.categoryId), asc(shopItems.priceSeconds));

	const categoriesWithItems = categories
		.map((cat) => ({ ...cat, items: items.filter((i) => i.categoryId === cat.id) }))
		.filter((cat) => cat.items.length > 0);

	return { categories: categoriesWithItems, availableSeconds };
}

export const actions = {
	buy: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) return fail(400, { error: 'user not found' });

		const form = await request.formData();
		const itemId = parseInt(form.get('item_id') as string);
		if (!itemId || isNaN(itemId)) return fail(400, { error: 'invalid item' });

		const selectedOptions: Record<string, string> = {};
		for (const [key, val] of form.entries()) {
			if (key.startsWith('option_')) {
				selectedOptions[key.slice(7)] = val as string;
			}
		}

		try {
			await db.transaction(async (tx) => {
				const [item] = await tx
					.select()
					.from(shopItems)
					.where(and(eq(shopItems.id, itemId), eq(shopItems.available, true)));

				if (!item) throw new Error('item not found or unavailable');
				if (item.stock === 0) throw new Error('this item is out of stock');

				const [r] = await tx
					.select({ total: sum(projectApprovals.approvedSeconds) })
					.from(projectApprovals)
					.innerJoin(projects, eq(projectApprovals.projectId, projects.id))
					.where(and(eq(projects.userId, dbUser.id), eq(projectApprovals.status, 'approved')));
				const approved = Number(r?.total ?? 0);

				const [s] = await tx
					.select({ total: sum(shopOrders.priceSeconds) })
					.from(shopOrders)
					.where(and(eq(shopOrders.userId, dbUser.id), notInArray(shopOrders.status, ['cancelled', 'refunded'])));
				const spent = Number(s?.total ?? 0);

				const [adj] = await tx
					.select({ total: sum(balanceAdjustments.seconds) })
					.from(balanceAdjustments)
					.where(eq(balanceAdjustments.userId, dbUser.id));
				const adjusted = Number(adj?.total ?? 0);

				if (approved - spent + adjusted < item.priceSeconds) throw new Error('not enough hours available');

				await tx.insert(shopOrders).values({
					userId: dbUser.id,
					itemId: item.id,
					priceSeconds: item.priceSeconds,
					status: 'ordered',
					selectedOptions: JSON.stringify(selectedOptions)
				});

				if (item.stock !== -1) {
					await tx.update(shopItems)
						.set({ stock: item.stock - 1, updatedAt: new Date() })
						.where(eq(shopItems.id, item.id));
				}
			});
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}

		return { success: true };
	}
};
