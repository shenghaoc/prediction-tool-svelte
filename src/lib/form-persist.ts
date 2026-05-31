import { browser } from '$app/environment';

import type { PredictionFormData } from '$lib/prediction-schema';
import { predictionSchema } from '$lib/prediction-schema';

const STORAGE_KEY = 'prediction-form';

let persistTimeout: ReturnType<typeof setTimeout> | undefined;
let latestForm: PredictionFormData | undefined;

export function readPersistedForm(): PredictionFormData | null {
	if (!browser) return null;

	try {
		const savedForm = localStorage.getItem(STORAGE_KEY);
		if (!savedForm) return null;

		const parsed: unknown = JSON.parse(savedForm);
		const result = predictionSchema.safeParse(parsed);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

export function persistForm(form: PredictionFormData) {
	if (!browser) return;

	latestForm = form;
	clearTimeout(persistTimeout);
	persistTimeout = setTimeout(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
			persistTimeout = undefined;
		} catch {
			// Storage unavailable or blocked
		}
	}, 300);
}

export function clearPersistedForm() {
	if (!browser) return;
	clearTimeout(persistTimeout);
	persistTimeout = undefined;
	latestForm = undefined;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Storage unavailable or blocked
	}
}

if (browser) {
	window.addEventListener('beforeunload', () => {
		if (!persistTimeout || !latestForm) return;
		clearTimeout(persistTimeout);
		persistTimeout = undefined;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(latestForm));
		} catch {
			// Storage unavailable or blocked
		}
	});
}
