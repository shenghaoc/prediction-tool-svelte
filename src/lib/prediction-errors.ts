import type { PredictionFormData } from '$lib/prediction-schema';

type FieldName = keyof PredictionFormData;

const REQUIRED_FIELD_KEYS: Partial<Record<FieldName, string>> = {
	ml_model: 'choose_ml_model',
	town: 'missing_town',
	storey_range: 'missing_storey_range',
	flat_model: 'missing_flat_model',
	floor_area_sqm: 'missing_floor_area',
	lease_commence_date: 'missing_lease_commence_date'
};

const KNOWN_MESSAGE_KEYS = new Set([
	'floor_area_range',
	'lease_year_range',
	'missing_floor_area',
	'missing_lease_commence_date',
	'choose_ml_model',
	'missing_town',
	'missing_storey_range',
	'missing_flat_model'
]);

export function blankPredictionFieldErrors(): Record<FieldName, string> {
	return {
		ml_model: '',
		town: '',
		storey_range: '',
		flat_model: '',
		floor_area_sqm: '',
		lease_commence_date: ''
	};
}

export function messageKeyForFieldIssue(field: FieldName, message: string | undefined): string {
	if (message && KNOWN_MESSAGE_KEYS.has(message)) {
		return message;
	}

	return REQUIRED_FIELD_KEYS[field] ?? 'error_fetch';
}

export function fieldErrorsFromSuperforms(
	errors: Partial<Record<FieldName, string[]>> | undefined,
	translate: (key: string) => string
): Record<FieldName, string> {
	const result = blankPredictionFieldErrors();
	if (!errors) return result;

	for (const field of Object.keys(result) as FieldName[]) {
		const messages = errors[field];
		if (!messages?.length) continue;
		result[field] = translate(messageKeyForFieldIssue(field, messages[0]));
	}

	return result;
}
