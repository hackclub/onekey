import { json, error } from '@sveltejs/kit';
import { TOKEN_ENCRYPTION_KEY } from '$env/static/private';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashToken, decryptToken } from '$lib/server/session';
import type { RequestHandler } from './$types';

const HACKATIME_BASE_URL = 'https://hackatime.hackclub.com';
const DEV_ENCRYPTION_KEY = '0'.repeat(64);

export const GET: RequestHandler = async ({ cookies }) => {
	const rawToken = cookies.get('hca_session');
	if (!rawToken) error(401, 'not authenticated');

	const row = await db
		.select()
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, hashToken(rawToken)))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	if (!row || row.sessions.expiresAt <= new Date()) error(401, 'session expired');

	const u = row.users;
	if (!u.hackatimeTokenCt || !u.hackatimeTokenIv || !u.hackatimeTokenTag) {
		error(403, 'hackatime not linked');
	}

	const encKey = Buffer.from(TOKEN_ENCRYPTION_KEY || (dev ? DEV_ENCRYPTION_KEY : ''), 'hex');
	const accessToken = decryptToken(u.hackatimeTokenCt, u.hackatimeTokenIv, u.hackatimeTokenTag, encKey);

	const res = await fetch(`${HACKATIME_BASE_URL}/api/v1/authenticated/projects`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!res.ok) error(502, 'failed to fetch hackatime projects');

	const data = await res.json();
	const raw: unknown[] = Array.isArray(data) ? data : (data.data ?? data.projects ?? []);

	const projects = raw.map((p: any) => ({
		name: String(p.name ?? ''),
		totalSeconds: Number(p.total_seconds ?? p.totalSeconds ?? 0),
		lastSeen: Number(p.most_recent_heartbeat_at ?? p.last_heartbeat_at ?? p.lastSeen ?? 0)
	})).filter((p) => p.name);

	projects.sort((a, b) => b.lastSeen - a.lastSeen);

	return json({ projects });
};
