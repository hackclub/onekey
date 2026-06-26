import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	users,
	projects,
	projectApprovals,
	shopItems,
	shopOrders,
	balanceAdjustments
} from '$lib/server/db/schema';
import { eq, and, sum, notInArray, asc, count, sql } from 'drizzle-orm';
import { shopCategories } from '$lib/server/db/schema';
import { getAvailableSeconds } from '$lib/server/balance';

async function getDbUser(hcaId: string) {
	const [u] = await db
		.select({ id: users.id, prizeClaimedAt: users.prizeClaimedAt })
		.from(users)
		.where(eq(users.hcaId, hcaId))
		.limit(1);
	return u ?? null;
}

async function hasApprovedProject(dbUserId: string) {
	const [a] = await db
		.select({ total: count() })
		.from(projectApprovals)
		.innerJoin(projects, eq(projectApprovals.projectId, projects.id))
		.where(and(eq(projects.userId, dbUserId), eq(projectApprovals.status, 'approved')));
	return Number(a?.total ?? 0) > 0;
}

export async function load({ locals }) {
	if (!locals.user) redirect(302, '/login');

	const verified = locals.user.verification_status === 'verified';
	const dbUser = await getDbUser(locals.user.sub);

	const categories = await db
		.select()
		.from(shopCategories)
		.orderBy(asc(shopCategories.sortOrder), asc(shopCategories.name));

	// The main shop never shows the unverified-tier prizes; they're claim-only.
	const items = await db
		.select()
		.from(shopItems)
		.where(and(eq(shopItems.available, true), eq(shopItems.unverifiedPrize, false)))
		.orderBy(
			asc(shopItems.categoryId),
			asc(sql`coalesce(${shopItems.discountSeconds}, ${shopItems.priceSeconds})`),
			sql`lower(${shopItems.name})`
		);

	const categoriesWithItems = categories
		.map((cat) => ({ ...cat, items: items.filter((i) => i.categoryId === cat.id) }))
		.filter((cat) => cat.items.length > 0);

	// Verified users: real wallet + full shop access. Unverified users: balance hidden
	// (sent as 0 so it can't leak), shop locked, and a one-time prize-claim path instead.
	const availableSeconds = verified && dbUser ? await getAvailableSeconds(dbUser.id) : 0;

	const prizeItems = verified
		? []
		: await db
				.select()
				.from(shopItems)
				.where(and(eq(shopItems.available, true), eq(shopItems.unverifiedPrize, true)))
				.orderBy(
					asc(sql`coalesce(${shopItems.discountSeconds}, ${shopItems.priceSeconds})`),
					sql`lower(${shopItems.name})`
				);

	return {
		categories: categoriesWithItems,
		availableSeconds,
		verified,
		prizeItems,
		hasApprovedProject: !verified && dbUser ? await hasApprovedProject(dbUser.id) : false,
		prizeClaimed: !!dbUser?.prizeClaimedAt
	};
}

export const actions = {
	buy: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');
		if (locals.user.verification_status !== 'verified')
			return fail(403, { error: 'verify your identity to shop' });

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
				if (item.unverifiedPrize) throw new Error('item not found or unavailable');
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
					.where(
						and(
							eq(shopOrders.userId, dbUser.id),
							notInArray(shopOrders.status, ['cancelled', 'refunded'])
						)
					);
				const spent = Number(s?.total ?? 0);

				const [adj] = await tx
					.select({ total: sum(balanceAdjustments.seconds) })
					.from(balanceAdjustments)
					.where(eq(balanceAdjustments.userId, dbUser.id));
				const adjusted = Number(adj?.total ?? 0);

				const effectivePrice = item.discountSeconds ?? item.priceSeconds;
				if (approved - spent + adjusted < effectivePrice)
					throw new Error('not enough hours available');

				await tx.insert(shopOrders).values({
					userId: dbUser.id,
					itemId: item.id,
					priceSeconds: effectivePrice,
					status: 'ordered',
					selectedOptions: JSON.stringify(selectedOptions)
				});

				if (item.stock !== -1) {
					await tx
						.update(shopItems)
						.set({ stock: item.stock - 1, updatedAt: new Date() })
						.where(eq(shopItems.id, item.id));
				}
			});
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}

		return { success: true };
	},

	// One-time consolation prize for unverified users: pick one flagged prize item after a
	// project is approved. Deducts hours from their (hidden) balance like a normal order, and
	// flips users.prize_claimed_at so it can never be claimed again.
	claimPrize: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');
		if (locals.user.verification_status === 'verified')
			return fail(400, { error: 'your identity is verified - use the shop instead' });

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) return fail(400, { error: 'user not found' });
		if (dbUser.prizeClaimedAt) return fail(400, { error: "you've already claimed your prize" });

		const form = await request.formData();
		const itemId = parseInt(form.get('item_id') as string);
		if (!itemId || isNaN(itemId)) return fail(400, { error: 'invalid prize' });

		const selectedOptions: Record<string, string> = {};
		for (const [key, val] of form.entries()) {
			if (key.startsWith('option_')) {
				selectedOptions[key.slice(7)] = val as string;
			}
		}

		try {
			await db.transaction(async (tx) => {
				if (!(await hasApprovedProject(dbUser.id)))
					throw new Error('get a project approved before claiming a prize');

				// Re-check the claim flag inside the transaction to avoid a double-claim race.
				const [freshUser] = await tx
					.select({ prizeClaimedAt: users.prizeClaimedAt })
					.from(users)
					.where(eq(users.id, dbUser.id));
				if (freshUser?.prizeClaimedAt) throw new Error("you've already claimed your prize");

				const [item] = await tx
					.select()
					.from(shopItems)
					.where(
						and(
							eq(shopItems.id, itemId),
							eq(shopItems.available, true),
							eq(shopItems.unverifiedPrize, true)
						)
					);

				if (!item) throw new Error('prize not found or unavailable');
				if (item.stock === 0) throw new Error('this prize is out of stock');

				const [r] = await tx
					.select({ total: sum(projectApprovals.approvedSeconds) })
					.from(projectApprovals)
					.innerJoin(projects, eq(projectApprovals.projectId, projects.id))
					.where(and(eq(projects.userId, dbUser.id), eq(projectApprovals.status, 'approved')));
				const approved = Number(r?.total ?? 0);

				const [s] = await tx
					.select({ total: sum(shopOrders.priceSeconds) })
					.from(shopOrders)
					.where(
						and(
							eq(shopOrders.userId, dbUser.id),
							notInArray(shopOrders.status, ['cancelled', 'refunded'])
						)
					);
				const spent = Number(s?.total ?? 0);

				const [adj] = await tx
					.select({ total: sum(balanceAdjustments.seconds) })
					.from(balanceAdjustments)
					.where(eq(balanceAdjustments.userId, dbUser.id));
				const adjusted = Number(adj?.total ?? 0);

				const effectivePrice = item.discountSeconds ?? item.priceSeconds;
				// Balance is hidden from unverified users, so keep this message vague rather than
				// revealing the exact figure.
				if (approved - spent + adjusted < effectivePrice)
					throw new Error("you haven't earned enough hours for this prize yet - keep shipping!");

				await tx.insert(shopOrders).values({
					userId: dbUser.id,
					itemId: item.id,
					priceSeconds: effectivePrice,
					status: 'ordered',
					selectedOptions: JSON.stringify(selectedOptions)
				});

				if (item.stock !== -1) {
					await tx
						.update(shopItems)
						.set({ stock: item.stock - 1, updatedAt: new Date() })
						.where(eq(shopItems.id, item.id));
				}

				await tx
					.update(users)
					.set({ prizeClaimedAt: new Date(), updatedAt: new Date() })
					.where(eq(users.id, dbUser.id));
			});
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}

		return { success: true, claimed: true };
	}
};
