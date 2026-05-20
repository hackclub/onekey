import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashToken } from '$lib/server/session';

export async function load({ cookies }) {
	const rawToken = cookies.get('hca_session');
	if (rawToken) {
		await db.delete(sessions).where(eq(sessions.id, hashToken(rawToken)));
	}
	cookies.delete('hca_session', { path: '/' });
	redirect(302, '/');
}
