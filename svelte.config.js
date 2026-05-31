import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'base-uri': ['self'],
				'font-src': ['self', 'https://fonts.gstatic.com'],
				'style-src': ['self', 'https://fonts.googleapis.com'],
				// Melt UI / Floating UI (and Svelte itself) set inline `style="..."` attributes
				// at runtime — e.g. for floating-element positioning — which can't be nonced or
				// hashed ahead of time. `style-src-attr` scopes this `unsafe-inline` relaxation to
				// inline style *attributes* only: inline `<style>` blocks stay protected by the
				// auto nonce/hash (mode: 'auto'), so CSS-injection exfiltration via an injected
				// `<style>` (e.g. attribute-selector data leaks) remains blocked. Caveat:
				// Safari/iOS < 15.4 ignore `style-src-attr` and fall back to `style-src`, where
				// these inline styles stay blocked — an acceptable trade-off for a modern app.
				'style-src-attr': ['unsafe-inline'],
				'img-src': ['self', 'data:'],
				'script-src': ['self'],
				'connect-src': ['self', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
				'frame-ancestors': ['none'],
				'form-action': ['self'],
				'object-src': ['none'],
				'upgrade-insecure-requests': true
			}
		}
	}
};

export default config;
