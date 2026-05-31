import { browser } from '$app/environment';

import type { PredictionFormData } from '$lib/prediction-schema';
import { predictionDefaults } from '$lib/prediction-schema';

const STORAGE_KEY = 'form';

let persistTimeout: ReturnType<typeof setTimeout> | undefined;

export function readPersistedForm(): PredictionFormData | null {
	if (!browser) return null;

	try {
		const savedForm = localStorage.getItem(STORAGE_KEY);
		if (!savedForm) return null;

		const parsed = JSON.parse(savedForm) as Partial<PredictionFormData>;
		return {
			...predictionDefaults,
			...parsed,
			floor_area_sqm: Number(parsed.floor_area_sqm ?? predictionDefaults.floor_area_sqm),
			lease_commence_date: Number(
				parsed.lease_commence_date ?? predictionDefaults.lease_commence_date
			)
		};
	} catch {
		return null;
	}
}

export function persistForm(form: PredictionFormData) {
	if (!browser) return;

	clearTimeout(persistTimeout);
	persistTimeout = setTimeout(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
		} catch {
			// Storage unavailable or blocked
		}
	}, 300);
}

export function clearPersistedForm() {
	if (!browser) return;
	clearTimeout(persistTimeout);
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Storage unavailable or blocked
	}
}

if (browser) {
	window.addEventListener('beforeunload', () => {
		if (persistTimeout) {
			clearTimeout(persistTimeout);
		}
	});
}
