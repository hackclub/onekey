import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		// Defense-in-depth against XSS: `script-src 'self'` blocks inline scripts and
		// `javascript:` URL navigation, so a stored bad URL can't execute even if one
		// slips past server-side validation. SvelteKit auto-injects nonces/hashes for
		// its own hydration scripts. `style-src` keeps unsafe-inline because the app
		// uses inline style attributes; style injection isn't the threat here.
		csp: {
			directives: {
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'blob:', 'https:'],
				'object-src': ['none'],
				'base-uri': ['self']
			}
		},
		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts']
			})
		}
	}
};

export default config;
