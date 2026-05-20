import type { Handle } from '@sveltejs/kit';
import { SESSION_SECRET, ADMIN_IDS, REVIEWER_IDS } from '$env/static/private';
import { dev } from '$app/environment';
import { verifyCookie } from '$lib/server/session';

const adminSet = new Set(
	(ADMIN_IDS || '').split(' ').map((id) => id.trim()).filter(Boolean)
);

const reviewerSet = new Set(
	(REVIEWER_IDS || '').split(' ').map((id) => id.trim()).filter(Boolean)
);

export const handle: Handle = async ({ event, resolve }) => {
	const session = event.cookies.get('hca_session');
	if (session) {
		try {
			const secret = SESSION_SECRET || (dev ? 'dev-secret-do-not-use-in-prod' : '');
			const raw = verifyCookie(session, secret);
			if (raw) {
				const { user } = JSON.parse(raw);
				event.locals.user = user;
				event.locals.isAdmin = adminSet.has(user?.sub ?? '');
				event.locals.isReviewer = reviewerSet.has(user?.sub ?? '');
			} else {
				event.locals.user = null;
				event.locals.isAdmin = false;
				event.locals.isReviewer = false;
				event.cookies.delete('hca_session', { path: '/' });
			}
		} catch {
			event.locals.user = null;
			event.locals.isAdmin = false;
			event.locals.isReviewer = false;
		}
	} else {
		event.locals.user = null;
		event.locals.isAdmin = false;
		event.locals.isReviewer = false;
	}
	return resolve(event);
};
