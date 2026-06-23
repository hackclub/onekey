import { browser } from '$app/environment';
import { writable } from 'svelte/store';

function createSfxStore() {
	const initial = browser ? localStorage.getItem('key_sfx_enabled') === 'true' : false;
	const { subscribe, set, update } = writable(initial);

	return {
		subscribe,
		toggle() {
			update((v) => {
				const next = !v;
				if (browser) localStorage.setItem('key_sfx_enabled', String(next));
				return next;
			});
		},
		set(val: boolean) {
			if (browser) localStorage.setItem('key_sfx_enabled', String(val));
			set(val);
		}
	};
}

export const keySfxEnabled = createSfxStore();
