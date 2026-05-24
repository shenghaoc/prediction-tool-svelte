import { describe, expect, it } from 'vitest';

import { handle } from './hooks.server';

describe('hooks.server handle', () => {
	it('injects a supported language from cookies into the html element', async () => {
		const response = await handle({
			event: {
				cookies: {
					get: () => 'zh'
				}
			} as never,
			resolve: async (_event, options) => {
				const html = options?.transformPageChunk?.({
					html: '<html lang="%lang%"></html>',
					done: true
				});
				return {
					headers: new Headers(),
					text: async () => html
				} as never;
			}
		});

		expect(await response.text()).toBe('<html lang="zh"></html>');
	});

	it('falls back to english for unsupported languages', async () => {
		const response = await handle({
			event: {
				cookies: {
					get: () => 'fr'
				}
			} as never,
			resolve: async (_event, options) => {
				const html = options?.transformPageChunk?.({
					html: '<html lang="%lang%"></html>',
					done: true
				});
				return {
					headers: new Headers(),
					text: async () => html
				} as never;
			}
		});

		expect(await response.text()).toBe('<html lang="en"></html>');
	});
});
