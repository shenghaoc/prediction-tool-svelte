import { Temporal } from '$lib/temporal';

export type { PredictionFormData as FieldType } from '$lib/prediction-schema';
import type { PredictionFormData } from '$lib/prediction-schema';

export type TrendPoint = {
	label: string;
	value: number;
};

export type SummaryValues = Pick<PredictionFormData, 'ml_model' | 'town' | 'lease_commence_date'>;

type PredictionApiResponse = {
	predictions: Array<{
		month: string;
		predictedPrice: number;
	}>;
};

export const DEFAULT_PREDICTION_MONTH_START = '2021-02';
export const DEFAULT_PREDICTION_MONTH_END = '2022-02';
/** The fixed reference month used for predictions (YYYY-MM). */
const PREDICTION_MONTH = Temporal.PlainYearMonth.from(DEFAULT_PREDICTION_MONTH_END);
export { predictionDefaults as initialFormValues } from '$lib/prediction-schema';
export {
	MIN_FLOOR_AREA_SQM,
	MAX_FLOOR_AREA_SQM,
	MIN_LEASE_COMMENCE_YEAR,
	MAX_LEASE_COMMENCE_YEAR
} from '$lib/prediction-schema';

// PREDICTION_MONTH is constant, so these labels are safe to cache on first use.
let cachedDefaultTrendData: TrendPoint[] | null = null;

export function defaultTrendData(): TrendPoint[] {
	if (!cachedDefaultTrendData) {
		cachedDefaultTrendData = [...Array(13).keys()].reverse().map((monthOffset) => ({
			label: PREDICTION_MONTH.subtract({ months: monthOffset }).toString(),
			value: 0
		}));
	}
	return cachedDefaultTrendData.map((point) => ({ ...point }));
}

export function normalizePrice(value: number) {
	if (!Number.isFinite(value)) {
		return 0;
	}

	return Math.max(0, Math.round(value));
}

export function normalizeTrendData(data: unknown): TrendPoint[] {
	if (
		!data ||
		typeof data !== 'object' ||
		!Array.isArray((data as Record<string, unknown>).predictions)
	) {
		console.error('normalizeTrendData received unexpected data shape', data);
		return [];
	}
	return (data as PredictionApiResponse).predictions.map((entry) => ({
		label: entry.month,
		value: normalizePrice(entry.predictedPrice)
	}));
}

// Intl.DateTimeFormat is just as expensive to construct as Intl.NumberFormat,
// so reuse one formatter per locale (mirrors the cache in $lib/format).
const monthFormatCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Format a raw `"YYYY-MM"` trend label into a localized, human-readable month
 * (e.g. `"2025-03"` → `"Mar 2025"` in en-SG, `"2025年3月"` in zh-SG).
 *
 * This is a display-only transform: it never mutates the `TrendPoint.label`
 * data contract. Unparseable labels are returned verbatim so the chart still
 * renders something sensible.
 */
export function formatMonthLabel(label: string, locale: string = 'en-SG') {
	const match = /^(\d{4})-(\d{2})$/.exec(label);
	if (!match) {
		return label;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	if (month < 1 || month > 12) {
		return label;
	}

	try {
		const cacheKey = locale.toLowerCase();
		let formatter = monthFormatCache.get(cacheKey);
		if (!formatter) {
			formatter = new Intl.DateTimeFormat(locale, {
				month: 'short',
				year: 'numeric',
				timeZone: 'UTC'
			});
			monthFormatCache.set(cacheKey, formatter);
		}
		// Day 1 at UTC avoids any timezone rollover into an adjacent month.
		return formatter.format(new Date(Date.UTC(year, month - 1, 1)));
	} catch {
		return label;
	}
}

export function formatCurrencyTick(value: number) {
	if (value >= 1_000_000) {
		return `$${(value / 1_000_000).toFixed(1)}M`;
	}

	if (value >= 1_000) {
		return `$${Math.round(value / 1_000)}k`;
	}

	return `$${Math.round(value)}`;
}
