import type { Handle } from '@sveltejs/kit';

import type { Language } from '$lib/i18n';

const supportedLanguages = new Set<Language>(['en', 'zh']);

export const SECURITY_HEADERS = {
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
} as const;

function applySecurityHeaders(response: Response): Response {
	const secured = new Response(response.body, response);

	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		secured.headers.set(name, value);
	}

	return secured;
}

export const handle: Handle = async ({ event, resolve }) => {
	const language = event.cookies.get('lang');
	const htmlLanguage: Language =
		language && supportedLanguages.has(language as Language) ? (language as Language) : 'en';

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', htmlLanguage)
	});

	return applySecurityHeaders(response);
};
