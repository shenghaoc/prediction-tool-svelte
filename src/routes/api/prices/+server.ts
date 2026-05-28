import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS } from '$lib/lists';
import {
	DEFAULT_PREDICTION_MONTH_END,
	DEFAULT_PREDICTION_MONTH_START,
	MAX_FLOOR_AREA_SQM,
	MAX_LEASE_COMMENCE_YEAR,
	MIN_FLOOR_AREA_SQM,
	MIN_LEASE_COMMENCE_YEAR
} from '$lib/prediction';

type PriceQueryRow = {
	intercept_map: number;
	month_map: number;
	storey_range_map: number;
	floor_area_sqm_map: number;
	lease_commence_date_map: number;
	month_name: string;
	month_multiplier: number;
	town_map: number;
	flat_model_map: number;
	storey_range_multiplier: number;
};

function readNumericField(value: unknown, fieldName: string): number {
	if (value === null || value === undefined) {
		throw new Error(`Database field ${fieldName} is null or undefined`);
	}
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue)) {
		throw new Error(`Database field ${fieldName} is not a finite number`);
	}
	return numericValue;
}

function roundToTwo(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Simple in-memory rate limiter per-isolate for basic DoS protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS = 50; // Maximum requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_MAP_SIZE = 10000; // Prevent memory leak

type RateLimitResult =
	| { limited: false }
	| { limited: true; retryAfterSecs: number };

function evictRateLimitEntries(now: number): void {
	if (rateLimitMap.size <= MAX_MAP_SIZE) {
		return;
	}

	for (const [key, record] of rateLimitMap) {
		if (now > record.resetTime) {
			rateLimitMap.delete(key);
		}
	}

	if (rateLimitMap.size > MAX_MAP_SIZE) {
		const targetSize = Math.floor(MAX_MAP_SIZE / 2);
		for (const key of rateLimitMap.keys()) {
			if (rateLimitMap.size <= targetSize) {
				break;
			}
			rateLimitMap.delete(key);
		}
	}
}

function checkRateLimit(ip: string): RateLimitResult {
	const now = Date.now();
	evictRateLimitEntries(now);

	const record = rateLimitMap.get(ip);

	if (!record || now > record.resetTime) {
		rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
		return { limited: false };
	}

	if (record.count >= MAX_REQUESTS) {
		return {
			limited: true,
			retryAfterSecs: Math.max(1, Math.ceil((record.resetTime - now) / 1000))
		};
	}

	record.count++;
	return { limited: false };
}

function resolveClientIp(
	request: Request,
	getClientAddress: () => string
): string | null {
	try {
		return getClientAddress();
	} catch {
		// Use Cloudflare connecting IP directly. Avoid x-forwarded-for which can be spoofed.
		return request.headers.get('cf-connecting-ip');
	}
}

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
	// Add basic rate limiting to protect the D1 database
	const ip = resolveClientIp(request, getClientAddress);
	if (ip) {
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
	const mlModel = body.mlModel;
	const town = body.town;
	const flatModel = body.flatModel;
	const storeyRange = body.storeyRange;
	const floorAreaSqm = body.floorAreaSqm;
	const leaseCommenceYear = body.leaseCommenceYear;

	if (
		typeof mlModel !== 'string' ||
		typeof town !== 'string' ||
		typeof flatModel !== 'string' ||
		typeof storeyRange !== 'string' ||
		typeof floorAreaSqm !== 'number' ||
		typeof leaseCommenceYear !== 'number' ||
		!Number.isFinite(floorAreaSqm) ||
		!Number.isFinite(leaseCommenceYear) ||
		floorAreaSqm < MIN_FLOOR_AREA_SQM ||
		floorAreaSqm > MAX_FLOOR_AREA_SQM ||
		leaseCommenceYear < MIN_LEASE_COMMENCE_YEAR ||
		leaseCommenceYear > MAX_LEASE_COMMENCE_YEAR
	) {
		return json({ error: 'Missing or invalid request fields.' }, { status: 400 });
	}

	if (
		!(ML_MODELS as readonly string[]).includes(mlModel) ||
		!(TOWNS as readonly string[]).includes(town) ||
		!(FLAT_MODELS as readonly string[]).includes(flatModel) ||
		!(STOREY_RANGES as readonly string[]).includes(storeyRange)
	) {
		return json({ error: 'Missing or invalid request fields.' }, { status: 400 });
	}

	const db = platform?.env?.DB;
	if (!db) {
		console.error('D1 database binding "DB" not available in platform.env');
		return json({ error: 'Prediction service unavailable.' }, { status: 500 });
	}

	try {
		const queryResult = await db
			.prepare(
				`SELECT
					ml_models.intercept_map,
					ml_models.month_map,
					ml_models.storey_range_map,
					ml_models.floor_area_sqm_map,
					ml_models.lease_commence_date_map,
					months_ordinal.name AS month_name,
					months_ordinal.value AS month_multiplier,
					towns_onehot.value AS town_map,
					flat_models_onehot.value AS flat_model_map,
					storey_ranges_ordinal.value AS storey_range_multiplier
				FROM ml_models
				JOIN towns_onehot ON ml_models.name = towns_onehot.ml_model
				JOIN flat_models_onehot ON ml_models.name = flat_models_onehot.ml_model
				JOIN storey_ranges_ordinal ON storey_ranges_ordinal.name = ?6
				JOIN months_ordinal ON months_ordinal.name BETWEEN ?4 AND ?5
				WHERE ml_models.name = ?1
					AND towns_onehot.name = ?2
					AND flat_models_onehot.name = ?3
				ORDER BY months_ordinal.value ASC;`
			)
			.bind(
				mlModel,
				town,
				flatModel,
				DEFAULT_PREDICTION_MONTH_START,
				DEFAULT_PREDICTION_MONTH_END,
				storeyRange
			)
			.all<PriceQueryRow>();

		if (!queryResult || !Array.isArray(queryResult.results)) {
			console.error('D1 query returned unexpected result shape', queryResult);
			return json({ error: 'Prediction service unavailable.' }, { status: 500 });
		}

		const { results } = queryResult;

		const [first] = results;
		if (!first) {
			return json({ error: 'No prediction data found for the given parameters.' }, { status: 404 });
		}

		const baseValue =
			readNumericField(first.intercept_map, 'intercept_map') +
			readNumericField(first.town_map, 'town_map') +
			readNumericField(first.storey_range_multiplier, 'storey_range_multiplier') *
				readNumericField(first.storey_range_map, 'storey_range_map') +
			floorAreaSqm * readNumericField(first.floor_area_sqm_map, 'floor_area_sqm_map') +
			readNumericField(first.flat_model_map, 'flat_model_map') +
			leaseCommenceYear *
				readNumericField(first.lease_commence_date_map, 'lease_commence_date_map');
		const monthCoefficient = readNumericField(first.month_map, 'month_map');

		const predictions = results.map((row: PriceQueryRow) => {
			const predictedRaw =
				baseValue + readNumericField(row.month_multiplier, 'month_multiplier') * monthCoefficient;

			if (!Number.isFinite(predictedRaw)) {
				throw new Error(
					`Prediction calculation produced non-finite value for month ${row.month_name}`
				);
			}

			return {
				month: row.month_name,
				predictedPrice: roundToTwo(Math.max(0, predictedRaw))
			};
		});

		return json({ predictions });
	} catch (error: unknown) {
		console.error({
			message: 'Price prediction query failed',
			queryParams: { mlModel, town, flatModel, storeyRange, floorAreaSqm, leaseCommenceYear },
			error: error instanceof Error ? { message: error.message, name: error.name } : error
		});
		return json({ error: 'Prediction service unavailable.' }, { status: 500 });
	}
};
