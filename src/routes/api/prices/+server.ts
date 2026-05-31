import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { predictionSchema } from '$lib/prediction-schema';
import { queryPredictions } from '$lib/server/prediction-query';

// Simple in-memory rate limiter per-isolate for basic DoS protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS = 50;
const WINDOW_MS = 60 * 1000;
const MAX_MAP_SIZE = 10000;

type RateLimitResult = { limited: false } | { limited: true; retryAfterSecs: number };

function evictRateLimitEntries(): void {
	if (rateLimitMap.size <= MAX_MAP_SIZE) {
		return;
	}

	const now = Date.now();
	for (const [key, record] of rateLimitMap.entries()) {
		if (now > record.resetTime) {
			rateLimitMap.delete(key);
		}
	}

	if (rateLimitMap.size <= MAX_MAP_SIZE) {
		return;
	}

	const targetSize = Math.floor(MAX_MAP_SIZE / 2);
	for (const key of rateLimitMap.keys()) {
		if (rateLimitMap.size <= targetSize) {
			break;
		}
		rateLimitMap.delete(key);
	}
}

function checkRateLimit(ip: string): RateLimitResult {
	const now = Date.now();
	evictRateLimitEntries();

	const record = rateLimitMap.get(ip);

	if (!record || now > record.resetTime) {
		rateLimitMap.delete(ip);
		rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
		return { limited: false };
	}

	rateLimitMap.delete(ip);

	if (record.count >= MAX_REQUESTS) {
		rateLimitMap.set(ip, record);
		return {
			limited: true,
			retryAfterSecs: Math.max(1, Math.ceil((record.resetTime - now) / 1000))
		};
	}

	record.count++;
	rateLimitMap.set(ip, record);
	return { limited: false };
}

function resolveClientIp(request: Request, getClientAddress: unknown): string | null {
	if (typeof getClientAddress === 'function') {
		try {
			const ip = getClientAddress();
			if (ip) return ip;
		} catch {
			// Fall through to header-based resolution
		}
	}
	return request.headers.get('cf-connecting-ip');
}

export const POST: RequestHandler = async (event) => {
	const { request, platform } = event;
	const ip = resolveClientIp(request, () => event.getClientAddress()) || 'unknown';
	const rateLimit = checkRateLimit(ip);
	if (rateLimit.limited) {
		return json(
			{ error: 'Too many requests. Please try again later.' },
			{
				status: 429,
				headers: { 'Retry-After': String(rateLimit.retryAfterSecs) }
			}
		);
	}

	let requestBody: unknown;
	try {
		requestBody = await request.json();
	} catch (parseError) {
		console.warn('Invalid JSON body received on /api/prices', parseError);
		return json({ error: 'Invalid JSON body.' }, { status: 400 });
	}

	if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const body = requestBody as Record<string, unknown>;
	const parsed = predictionSchema.safeParse({
		ml_model: body.mlModel,
		town: body.town,
		storey_range: body.storeyRange,
		flat_model: body.flatModel,
		floor_area_sqm: body.floorAreaSqm,
		lease_commence_date: body.leaseCommenceYear
	});

	if (!parsed.success) {
		return json({ error: 'Missing or invalid request fields.' }, { status: 400 });
	}

	const db = platform?.env?.DB;
	if (!db) {
		console.error('D1 database binding "DB" not available in platform.env');
		return json({ error: 'Prediction service unavailable.' }, { status: 500 });
	}

	try {
		const { predictions } = await queryPredictions(db, parsed.data);
		return json({ predictions });
	} catch (error: unknown) {
		console.error({
			message: 'Price prediction query failed',
			queryParams: parsed.data,
			error: error instanceof Error ? { message: error.message, name: error.name } : error
		});

		if (error instanceof Error && error.message.includes('No prediction data')) {
			return json({ error: error.message }, { status: 404 });
		}

		return json({ error: 'Prediction service unavailable.' }, { status: 500 });
	}
};
