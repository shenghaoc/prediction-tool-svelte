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

export type PredictionTheme = ReturnType<typeof getPredictionTheme>;
export type PredictionApiResponse = {
	predictions: Array<{
		month: string;
		predictedPrice: number;
	}>;
};

export const predictionMonth = dayjs.utc('2022-02', 'YYYY-MM');
export const MAX_LEASE_COMMENCE_YEAR = new Date().getUTCFullYear();

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

export function normalizeTrendData(data: PredictionApiResponse): TrendPoint[] {
	return data.predictions.map((entry) => ({
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

export function getPredictionTheme(darkMode: boolean) {
	if (darkMode) {
		return {
			text: '#f2ede6',
			textMuted: '#9e998f',
			primary: '#8daec1',
			accent: '#cf8b60',
			lineSoft: 'rgba(141, 174, 193, 0.16)',
			panelBg: 'rgba(16, 23, 31, 0.78)',
			panelStrong: 'rgba(18, 27, 37, 0.88)',
			resultsBg: 'rgba(18, 26, 35, 0.92)',
			resultsBg2: 'rgba(15, 22, 30, 0.86)',
			pricePanelBg: 'rgba(255, 255, 255, 0.04)',
			fieldBg: 'rgba(255, 255, 255, 0.04)',
			focusRing: 'rgba(141, 174, 193, 0.14)',
			shadow: 'rgba(0, 0, 0, 0.32)',
			accentShadow: 'rgba(207, 139, 96, 0.26)',
			meshLine: 'rgba(255, 255, 255, 0.06)',
			orbColor: 'rgba(207, 139, 96, 0.18)',
			chartGrid: 'rgba(255,255,255,0.08)',
			chartLine: '#cf8b60',
			background: 'linear-gradient(155deg, #091017 0%, #101821 52%, #1a2430 100%)',
			pageBg: '#091017',
			pillBg: 'rgba(255, 255, 255, 0.04)'
		};
	}

	return {
		text: '#1f2328',
		textMuted: '#74685b',
		primary: '#234b61',
		accent: '#af6542',
		lineSoft: 'rgba(116, 92, 68, 0.14)',
		panelBg: 'rgba(255, 250, 244, 0.72)',
		panelStrong: 'rgba(255, 253, 250, 0.82)',
		resultsBg: 'rgba(255, 252, 248, 0.9)',
		resultsBg2: 'rgba(249, 243, 236, 0.84)',
		pricePanelBg: 'rgba(255, 255, 255, 0.46)',
		fieldBg: 'rgba(255, 255, 255, 0.54)',
		focusRing: 'rgba(35, 75, 97, 0.12)',
		shadow: 'rgba(110, 84, 63, 0.12)',
		accentShadow: 'rgba(175, 101, 66, 0.24)',
		meshLine: 'rgba(31, 35, 40, 0.04)',
		orbColor: 'rgba(175, 101, 66, 0.14)',
		chartGrid: 'rgba(31, 35, 40, 0.08)',
		chartLine: '#af6542',
		background: 'linear-gradient(155deg, #f5eee5 0%, #eee4d8 50%, #ece6de 100%)',
		pageBg: '#f5eee5',
		pillBg: 'rgba(255, 251, 246, 0.56)'
	};
}
