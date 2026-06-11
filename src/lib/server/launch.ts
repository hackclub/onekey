import { db } from './db';
import { siteSettings } from './db/schema';
import { eq } from 'drizzle-orm';

let cachedLaunched: boolean | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 15_000;

export async function getLaunched(): Promise<boolean> {
	if (cachedLaunched !== null && Date.now() < cacheExpiry) return cachedLaunched;
	const [row] = await db
		.select()
		.from(siteSettings)
		.where(eq(siteSettings.key, 'launched'))
		.limit(1);
	cachedLaunched = row?.value === 'true';
	cacheExpiry = Date.now() + CACHE_TTL_MS;
	return cachedLaunched;
}

export async function setLaunched(value: boolean): Promise<void> {
	await db
		.insert(siteSettings)
		.values({ key: 'launched', value: String(value) })
		.onConflictDoUpdate({ target: siteSettings.key, set: { value: String(value) } });
	cachedLaunched = value;
	cacheExpiry = Date.now() + CACHE_TTL_MS;
}
