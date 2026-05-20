import { redirect } from '@sveltejs/kit';

export function load({ cookies }) {
	cookies.delete('hca_session', { path: '/' });
	redirect(302, '/');
}
