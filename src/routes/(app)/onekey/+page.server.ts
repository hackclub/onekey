import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	users,
	projects,
	projectApprovals,
	shopItems,
	shopOrders,
	shopCategories,
	balanceAdjustments
} from '$lib/server/db/schema';
import { eq, and, sum, notInArray } from 'drizzle-orm';
import { getAvailableSeconds } from '$lib/server/balance';

// The macropad is a real shop item so orders reuse the shop's balance/stock/options
// machinery, but it lives in its own hidden category and is flagged unavailable so it
// never appears in the normal shop grid — the /onekey configurator is its only entry point.
const MACROPAD_NAME = 'onekey macropad';
const MACROPAD_CATEGORY_SLUG = 'onekey';
const MACROPAD_IMAGE = 'https://cdn.hackclub.com/019f70a8-3c21-7cc6-898e-02a1197c3620/6ag9s64.png';
const MACROPAD_PRICE_SECONDS = 5 * 3600; // 5 hours

// The configurable parameters — each behaves like a shop item option (label → choices).
// Keep the labels in sync with the step titles in +page.svelte.
const MACROPAD_OPTIONS: { label: string; choices: string[] }[] = [
	{ label: 'bottom case color', choices: ['black', 'white', 'red'] },
	{ label: 'top case color', choices: ['black', 'white', 'red'] },
	{ label: 'key switch', choices: ['linear', 'tactile', 'clicky'] },
	{ label: 'keycap', choices: ['black', 'white', 'red', 'blue', 'pink', 'orange', 'purple', 'green'] }
];

async function getDbUser(hcaId: string) {
	const [u] = await db.select({ id: users.id }).from(users).where(eq(users.hcaId, hcaId)).limit(1);
	return u ?? null;
}

// deno-lint style transaction type is awkward to name; accept any drizzle executor.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getOrCreateMacropadItem(tx: Tx) {
	const [existing] = await tx
		.select()
		.from(shopItems)
		.where(eq(shopItems.name, MACROPAD_NAME))
		.limit(1);
	if (existing) return existing;

	let [cat] = await tx
		.select()
		.from(shopCategories)
		.where(eq(shopCategories.slug, MACROPAD_CATEGORY_SLUG))
		.limit(1);
	if (!cat) {
		[cat] = await tx
			.insert(shopCategories)
			.values({ name: 'onekey', slug: MACROPAD_CATEGORY_SLUG, sortOrder: 999 })
			.returning();
	}

	const [item] = await tx
		.insert(shopItems)
		.values({
			categoryId: cat.id,
			name: MACROPAD_NAME,
			description: 'one key. one dial. endless possibilities.',
			priceSeconds: MACROPAD_PRICE_SECONDS,
			imageUrl: MACROPAD_IMAGE,
			available: false, // hidden from the normal shop grid
			options: JSON.stringify(MACROPAD_OPTIONS),
			fulfilledLocally: false
		})
		.returning();
	return item;
}

export async function load({ locals }) {
	if (!locals.user) redirect(302, '/login');

	const verified = locals.user.verification_status === 'verified';
	const dbUser = await getDbUser(locals.user.sub);
	const availableSeconds = verified && dbUser ? await getAvailableSeconds(dbUser.id) : 0;

	return {
		verified,
		availableSeconds,
		priceSeconds: MACROPAD_PRICE_SECONDS
	};
}

export const actions = {
	order: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');
		if (locals.user.verification_status !== 'verified')
			return fail(403, { error: 'verify your identity to order' });

		const dbUser = await getDbUser(locals.user.sub);
		if (!dbUser) return fail(400, { error: 'user not found' });

		const form = await request.formData();

		// Collect and validate every configured parameter against its allowed choices.
		const selectedOptions: Record<string, string> = {};
		for (const { label, choices } of MACROPAD_OPTIONS) {
			const val = form.get(`option_${label}`);
			if (typeof val !== 'string' || !choices.includes(val)) {
				return fail(400, { error: `please choose a ${label}` });
			}
			selectedOptions[label] = val;
		}

		try {
			await db.transaction(async (tx) => {
				const item = await getOrCreateMacropadItem(tx);

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

		redirect(303, '/shop/orders');
	}
};
