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

export function formatCurrencyTick(value: number) {
	if (value >= 1_000_000) {
		return `$${(value / 1_000_000).toFixed(1)}M`;
	}

	if (value >= 1_000) {
		return `$${Math.round(value / 1_000)}k`;
	}

	return `$${Math.round(value)}`;
}
