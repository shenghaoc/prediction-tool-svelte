import { z } from 'zod';

import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS } from '$lib/lists';

export const MIN_FLOOR_AREA_SQM = 20;
export const MAX_FLOOR_AREA_SQM = 300;
export const MIN_LEASE_COMMENCE_YEAR = 1960;
export const MAX_LEASE_COMMENCE_YEAR = 2022;

export const predictionSchema = z.object({
	ml_model: z.enum(ML_MODELS),
	town: z.enum(TOWNS),
	storey_range: z.enum(STOREY_RANGES),
	flat_model: z.enum(FLAT_MODELS),
	floor_area_sqm: z.coerce
		.number({ error: 'missing_floor_area' })
		.int()
		.min(MIN_FLOOR_AREA_SQM, { error: 'floor_area_range' })
		.max(MAX_FLOOR_AREA_SQM, { error: 'floor_area_range' }),
	lease_commence_date: z.coerce
		.number({ error: 'missing_lease_commence_date' })
		.int()
		.min(MIN_LEASE_COMMENCE_YEAR, { error: 'missing_lease_commence_date' })
		.max(MAX_LEASE_COMMENCE_YEAR, { error: 'missing_lease_commence_date' })
});

export type PredictionFormData = z.infer<typeof predictionSchema>;

export const predictionDefaults: PredictionFormData = {
	ml_model: ML_MODELS[0],
	town: TOWNS[0],
	storey_range: STOREY_RANGES[0],
	flat_model: FLAT_MODELS[0],
	floor_area_sqm: MIN_FLOOR_AREA_SQM,
	lease_commence_date: MAX_LEASE_COMMENCE_YEAR
};
