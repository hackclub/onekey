import type { Handle } from '@sveltejs/kit';
import { SESSION_SECRET } from '$env/static/private';
import { dev } from '$app/environment';
import { verifyCookie } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	const session = event.cookies.get('hca_session');
	if (session) {
		try {
			const secret = SESSION_SECRET || (dev ? 'dev-secret-do-not-use-in-prod' : '');
	const raw = verifyCookie(session, secret);
			if (raw) {
				const { user } = JSON.parse(raw);
				event.locals.user = user;
			} else {
				event.locals.user = null;
				event.cookies.delete('hca_session', { path: '/' });
			}
		} catch {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}
	return resolve(event);
};
