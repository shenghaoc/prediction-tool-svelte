import type { D1Database } from '@cloudflare/workers-types';
import { DEFAULT_PREDICTION_MONTH_END, DEFAULT_PREDICTION_MONTH_START } from '$lib/prediction';
import type { PredictionFormData } from '$lib/prediction-schema';

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

export type PredictionQueryResult = {
	predictions: Array<{
		month: string;
		predictedPrice: number;
	}>;
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

export async function queryPredictions(
	db: D1Database,
	input: PredictionFormData
): Promise<PredictionQueryResult> {
	const floorAreaSqm = Math.round(input.floor_area_sqm);
	const leaseCommenceYear = input.lease_commence_date;

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
			input.ml_model,
			input.town,
			input.flat_model,
			DEFAULT_PREDICTION_MONTH_START,
			DEFAULT_PREDICTION_MONTH_END,
			input.storey_range
		)
		.all<PriceQueryRow>();

	if (!queryResult || !Array.isArray(queryResult.results)) {
		throw new Error('D1 query returned unexpected result shape');
	}

	const { results } = queryResult;
	const [first] = results;
	if (!first) {
		throw new Error('No prediction data found for the given parameters.');
	}

	const baseValue =
		readNumericField(first.intercept_map, 'intercept_map') +
		readNumericField(first.town_map, 'town_map') +
		readNumericField(first.storey_range_multiplier, 'storey_range_multiplier') *
			readNumericField(first.storey_range_map, 'storey_range_map') +
		floorAreaSqm * readNumericField(first.floor_area_sqm_map, 'floor_area_sqm_map') +
		readNumericField(first.flat_model_map, 'flat_model_map') +
		leaseCommenceYear * readNumericField(first.lease_commence_date_map, 'lease_commence_date_map');
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

	return { predictions };
}
