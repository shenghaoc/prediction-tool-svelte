import { describe, expect, it } from 'vitest';

import { handle, SECURITY_HEADERS } from './hooks.server';

function expectSecurityHeaders(headers: Headers) {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		expect(headers.get(name)).toBe(value);
	}
}

describe('hooks.server handle', () => {
	it('injects a supported language from cookies into the html element', async () => {
		const response = await handle({
			event: {
				cookies: {
					get: () => 'zh'
				}
			} as never,
			resolve: async (_event, options) => {
				const html =
					options?.transformPageChunk?.({
						html: '<html lang="%lang%"></html>',
						done: true
					}) ?? '';
				return new Response(html, { headers: new Headers() });
			}
		});

		expect(await response.text()).toBe('<html lang="zh"></html>');
		expectSecurityHeaders(response.headers);
	});

	it('falls back to english for unsupported languages', async () => {
		const response = await handle({
			event: {
				cookies: {
					get: () => 'fr'
				}
			} as never,
			resolve: async (_event, options) => {
				const html =
					options?.transformPageChunk?.({
						html: '<html lang="%lang%"></html>',
						done: true
					}) ?? '';
				return new Response(html, { headers: new Headers() });
			}
		});

		expect(await response.text()).toBe('<html lang="en"></html>');
		expectSecurityHeaders(response.headers);
	});

	it('applies security headers to redirect responses without throwing', async () => {
		const redirect = Response.redirect('http://localhost/api/prices/', 308);

		const response = await handle({
			event: {
				cookies: {
					get: () => undefined
				}
			} as never,
			resolve: async () => redirect
		});

		expect(response.status).toBe(308);
		expect(response.headers.get('Location')).toBe('http://localhost/api/prices/');
		expectSecurityHeaders(response.headers);
	});
});
