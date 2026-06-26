import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { shopCategories, shopItems, shopOrders } from '$lib/server/db/schema';
import { eq, asc, count } from 'drizzle-orm';

type Choice = { name: string; imageUrl?: string };
type OptionGroup = { label: string; choices: Choice[] };

function parseOptionsText(raw: string): OptionGroup[] {
	return raw
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const colonIdx = line.indexOf(':');
			if (colonIdx === -1) return null;
			const label = line.slice(0, colonIdx).trim();
			const choices = line
				.slice(colonIdx + 1)
				.split(',')
				.map((c) => c.trim())
				.filter(Boolean)
				.map((c): Choice => {
					const pipeIdx = c.indexOf('|');
					if (pipeIdx === -1) return { name: c };
					const name = c.slice(0, pipeIdx).trim();
					const imageUrl = c.slice(pipeIdx + 1).trim();
					return imageUrl ? { name, imageUrl } : { name };
				})
				.filter((c) => c.name);
			return label && choices.length ? { label, choices } : null;
		})
		.filter(Boolean) as OptionGroup[];
}

export async function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');
	const categories = await db
		.select()
		.from(shopCategories)
		.orderBy(asc(shopCategories.sortOrder), asc(shopCategories.name));

	const items = await db
		.select()
		.from(shopItems)
		.orderBy(asc(shopItems.categoryId), asc(shopItems.name));

	const categoriesWithItems = categories.map((cat) => ({
		...cat,
		items: items.filter((item) => item.categoryId === cat.id)
	}));

	return { categories: categoriesWithItems };
}

export const actions = {
	createCategory: async ({ request, locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const sortOrder = parseInt(form.get('sort_order') as string) || 0;

		if (!name) return fail(400, { error: 'name is required' });

		const slug = name
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');

		try {
			await db.insert(shopCategories).values({ name, slug, description, sortOrder });
		} catch {
			return fail(400, { error: 'slug already exists - try a different name' });
		}

		return { success: true };
	},

	updateCategory: async ({ request, locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
		const form = await request.formData();
		const id = parseInt(form.get('id') as string);
		const name = (form.get('name') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const sortOrder = parseInt(form.get('sort_order') as string) || 0;

		if (!id || !name) return fail(400, { error: 'id and name are required' });

		const slug = name
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');

		try {
			await db
				.update(shopCategories)
				.set({ name, slug, description, sortOrder })
				.where(eq(shopCategories.id, id));
		} catch {
			return fail(400, { error: 'slug already exists - try a different name' });
		}

		return { success: true };
	},

	deleteCategory: async ({ request, locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
		const form = await request.formData();
		const id = parseInt(form.get('id') as string);
		if (!id) return fail(400, { error: 'id is required' });

		// Check for orders on any items in this category
		const [{ value: orderCount }] = await db
			.select({ value: count() })
			.from(shopOrders)
			.innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
			.where(eq(shopItems.categoryId, id));

		if (orderCount > 0)
			return fail(400, { error: 'cannot delete - items in this category have existing orders' });

		await db.delete(shopCategories).where(eq(shopCategories.id, id));
		return { success: true };
	},

	createItem: async ({ request, locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
		const form = await request.formData();
		const categoryId = parseInt(form.get('category_id') as string);
		const name = (form.get('name') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const priceHours = parseFloat(form.get('price_hours') as string);
		const discountHoursRaw = (form.get('discount_hours') as string)?.trim() ?? '';
		const imageUrl = (form.get('image_url') as string)?.trim() || null;
		const stock = parseInt(form.get('stock') as string);
		const optionsRaw = (form.get('options') as string)?.trim() || '';
		const imagePadding = Math.max(0, parseInt(form.get('image_padding') as string) || 0);
		const fulfilledLocally = form.get('fulfilled_locally') === 'true';
		const unverifiedPrize = form.get('unverified_prize') === 'true';

		if (!categoryId || !name) return fail(400, { error: 'category and name are required' });
		if (isNaN(priceHours) || priceHours <= 0)
			return fail(400, { error: 'price must be a positive number' });

		const priceSeconds = Math.round(priceHours * 3600);
		let discountSeconds: number | null = null;
		if (discountHoursRaw !== '') {
			const dh = parseFloat(discountHoursRaw);
			if (isNaN(dh) || dh <= 0) return fail(400, { error: 'discount must be a positive number' });
			discountSeconds = Math.round(dh * 3600);
			if (discountSeconds >= priceSeconds)
				return fail(400, { error: 'discount price must be lower than regular price' });
		}
		const stockVal = isNaN(stock) ? -1 : stock;
		const options = parseOptionsText(optionsRaw);

		await db
			.insert(shopItems)
			.values({
				categoryId,
				name,
				description,
				priceSeconds,
				discountSeconds,
				imageUrl,
				stock: stockVal,
				options: JSON.stringify(options),
				imagePadding,
				fulfilledLocally,
				unverifiedPrize
			});
		return { success: true };
	},

	updateItem: async ({ request, locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
		const form = await request.formData();
		const id = parseInt(form.get('id') as string);
		const categoryId = parseInt(form.get('category_id') as string);
		const name = (form.get('name') as string)?.trim();
		const description = (form.get('description') as string)?.trim() || null;
		const priceHours = parseFloat(form.get('price_hours') as string);
		const discountHoursRaw = (form.get('discount_hours') as string)?.trim() ?? '';
		const imageUrl = (form.get('image_url') as string)?.trim() || null;
		const stock = parseInt(form.get('stock') as string);
		const available = form.get('available') === 'true';
		const optionsRaw = (form.get('options') as string)?.trim() || '';
		const imagePadding = Math.max(0, parseInt(form.get('image_padding') as string) || 0);
		const fulfilledLocally = form.get('fulfilled_locally') === 'true';
		const unverifiedPrize = form.get('unverified_prize') === 'true';

		if (!id || !categoryId || !name)
			return fail(400, { error: 'id, category, and name are required' });
		if (isNaN(priceHours) || priceHours <= 0)
			return fail(400, { error: 'price must be a positive number' });

		const priceSeconds = Math.round(priceHours * 3600);
		let discountSeconds: number | null = null;
		if (discountHoursRaw !== '') {
			const dh = parseFloat(discountHoursRaw);
			if (isNaN(dh) || dh <= 0) return fail(400, { error: 'discount must be a positive number' });
			discountSeconds = Math.round(dh * 3600);
			if (discountSeconds >= priceSeconds)
				return fail(400, { error: 'discount price must be lower than regular price' });
		}
		const stockVal = isNaN(stock) ? -1 : stock;
		const options = parseOptionsText(optionsRaw);

		await db
			.update(shopItems)
			.set({
				categoryId,
				name,
				description,
				priceSeconds,
				discountSeconds,
				imageUrl,
				stock: stockVal,
				available,
				options: JSON.stringify(options),
				imagePadding,
				fulfilledLocally,
				unverifiedPrize,
				updatedAt: new Date()
			})
			.where(eq(shopItems.id, id));
		return { success: true };
	},

	deleteItem: async ({ request, locals }) => {
		if (!locals.isAdmin) return fail(403, { error: 'forbidden' });
		const form = await request.formData();
		const id = parseInt(form.get('id') as string);
		if (!id) return fail(400, { error: 'id is required' });

		const [{ value: orderCount }] = await db
			.select({ value: count() })
			.from(shopOrders)
			.where(eq(shopOrders.itemId, id));

		if (orderCount > 0)
			return fail(400, {
				error: 'cannot delete - this item has existing orders. mark it unavailable instead.'
			});

		await db.delete(shopItems).where(eq(shopItems.id, id));
		return { success: true };
	}
};
