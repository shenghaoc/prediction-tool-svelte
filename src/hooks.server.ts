import type { Handle } from '@sveltejs/kit';

import type { Language } from '$lib/i18n';

const supportedLanguages = new Set<Language>(['en', 'zh']);

export const handle: Handle = async ({ event, resolve }) => {
	const language = event.cookies.get('lang');
	const htmlLanguage: Language =
		language && supportedLanguages.has(language as Language) ? (language as Language) : 'en';

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', htmlLanguage)
	});

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), browsing-topics=()'
	);
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

	return response;
};
