import type { Handle } from '@sveltejs/kit';

import type { Language } from '$lib/i18n';

const supportedLanguages = new Set<Language>(['en', 'zh']);

export const handle: Handle = async ({ event, resolve }) => {
	const language = event.cookies.get('lang');
	const htmlLanguage: Language =
		language && supportedLanguages.has(language as Language) ? (language as Language) : 'en';

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', htmlLanguage)
	});
};
