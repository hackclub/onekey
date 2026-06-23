#!/usr/bin/env node
// Replaces `npx drizzle-kit migrate` with diagnostics and a lock_timeout so
// we fail fast instead of hanging forever waiting on a DB lock.
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error('[migrate] ERROR: DATABASE_URL is not set');
	process.exit(1);
}

console.log('[migrate] Connecting...');
const client = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 });

// Log what else is connected so we can diagnose lock contention
try {
	const activity = await client`
		SELECT pid, state, wait_event_type, wait_event, left(query, 100) as query
		FROM pg_stat_activity
		WHERE datname = current_database() AND pid != pg_backend_pid()
	`;
	console.log('[migrate] Other DB connections:', JSON.stringify(activity, null, 2));
} catch (e) {
	console.warn('[migrate] pg_stat_activity query failed:', e.message);
}

// Fail fast if we can't acquire a lock within 30s rather than hanging forever
await client`SET lock_timeout = '30s'`;
console.log('[migrate] lock_timeout = 30s');

// Fix ownership of tables that were created by a different DB user (e.g. during
// initial cluster setup). ALTER TABLE requires ownership, not just privileges.
const currentUser = (await client`SELECT current_user`)[0].current_user;
console.log('[migrate] current_user:', currentUser);
const tables = ['approved_submissions'];
for (const t of tables) {
	try {
		await client`SELECT pg_catalog.pg_get_userbyid(relowner) as owner FROM pg_class WHERE relname = ${t} AND relkind = 'r'`.then(rows => {
			if (rows[0]) console.log(`[migrate] owner of ${t}:`, rows[0].owner);
		});
	} catch {}
}

const db = drizzle(client);

try {
	console.log('[migrate] Applying migrations...');
	await migrate(db, { migrationsFolder: '/app/drizzle' });
	console.log('[migrate] Done.');
} catch (e) {
	console.error('[migrate] FAILED:', e.message);
	console.error('[migrate] detail:', e.detail ?? e.cause?.message ?? '');
	console.error('[migrate] code:', e.code ?? e.cause?.code ?? '');
	console.error('[migrate] hint:', e.hint ?? '');
	console.error('[migrate] full:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
	await client.end();
	process.exit(1);
}

await client.end();
