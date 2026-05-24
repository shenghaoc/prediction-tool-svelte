import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {
	FLAT_MODELS,
	ML_MODELS,
	STOREY_RANGES,
	TOWNS,
	type FlatModel,
	type MLModel,
	type StoreyRange,
	type Town
} from '$lib/lists';

dayjs.extend(utc);

export type FieldType = {
	ml_model: MLModel;
	town: Town;
	storey_range: StoreyRange;
	flat_model: FlatModel;
	floor_area_sqm: number;
	lease_commence_date: number;
};

export type TrendPoint = {
	label: string;
	value: number;
};

export type SummaryValues = Pick<FieldType, 'ml_model' | 'town' | 'lease_commence_date'>;

export type PredictionApiResponse = {
	predictions: Array<{
		month: string;
		predictedPrice: number;
	}>;
};

export const DEFAULT_PREDICTION_MONTH_START = '2021-02';
export const DEFAULT_PREDICTION_MONTH_END = '2022-02';
export const MIN_FLOOR_AREA_SQM = 20;
export const MAX_FLOOR_AREA_SQM = 300;
export const MIN_LEASE_COMMENCE_YEAR = 1960;

export const predictionMonth = dayjs.utc('2022-02', 'YYYY-MM');
export const MAX_LEASE_COMMENCE_YEAR = predictionMonth.year();

export const initialFormValues: FieldType = {
	ml_model: ML_MODELS[0],
	town: TOWNS[0],
	storey_range: STOREY_RANGES[0],
	flat_model: FLAT_MODELS[0],
	floor_area_sqm: 20,
	lease_commence_date: MAX_LEASE_COMMENCE_YEAR
};

export function defaultTrendData(): TrendPoint[] {
	return [...Array(13).keys()].reverse().map((monthOffset) => ({
		label: predictionMonth.subtract(monthOffset, 'month').format('YYYY-MM'),
		value: 0
	}));
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
