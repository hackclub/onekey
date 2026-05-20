export function load({ locals, url }) {
	return { user: locals.user, needsAuth: url.searchParams.has('needs_auth') };
}
