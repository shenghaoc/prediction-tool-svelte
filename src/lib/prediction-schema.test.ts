import { describe, expect, it } from 'vitest';

import { predictionDefaults, predictionSchema } from '$lib/prediction-schema';

describe('predictionSchema', () => {
	it('accepts default form values', () => {
		expect(predictionSchema.safeParse(predictionDefaults).success).toBe(true);
	});

	it('rejects floor area outside bounds', () => {
		const result = predictionSchema.safeParse({
			...predictionDefaults,
			floor_area_sqm: 19
		});
		expect(result.success).toBe(false);
	});

	it('rejects unknown towns', () => {
		const result = predictionSchema.safeParse({
			...predictionDefaults,
			town: 'NOT A TOWN'
		});
		expect(result.success).toBe(false);
	});

	it('coerces string numerics from form posts', () => {
		const result = predictionSchema.safeParse({
			...predictionDefaults,
			floor_area_sqm: '85',
			lease_commence_date: '2000'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.floor_area_sqm).toBe(85);
			expect(result.data.lease_commence_date).toBe(2000);
		}
	});
});
