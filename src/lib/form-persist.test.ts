import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { predictionDefaults } from '$lib/prediction-schema';

const storage = new Map<string, string>();
const windowListeners = new Map<string, (event: Event) => void>();

vi.mock('$app/environment', () => ({ browser: true }));

function createLocalStorage() {
	return {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => {
			storage.set(key, value);
		},
		removeItem: (key: string) => {
			storage.delete(key);
		},
		clear: () => {
			storage.clear();
		}
	};
}

describe('form-persist', () => {
	beforeEach(() => {
		vi.resetModules();
		storage.clear();
		windowListeners.clear();
		vi.stubGlobal('localStorage', createLocalStorage());
		vi.stubGlobal('window', {
			addEventListener: (type: string, listener: (event: Event) => void) => {
				windowListeners.set(type, listener);
			},
			dispatchEvent: (event: Event) => {
				windowListeners.get(event.type)?.(event);
				return true;
			}
		});
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('returns null for non-object persisted JSON', async () => {
		const { readPersistedForm } = await import('$lib/form-persist');
		localStorage.setItem('prediction-form', JSON.stringify(['not', 'an', 'object']));
		expect(readPersistedForm()).toBeNull();
	});

	it('debounces writes to localStorage', async () => {
		const { persistForm } = await import('$lib/form-persist');
		const custom = { ...predictionDefaults, floor_area_sqm: 42 };
		persistForm(custom);
		expect(localStorage.getItem('prediction-form')).toBeNull();
		await vi.advanceTimersByTimeAsync(300);
		expect(JSON.parse(localStorage.getItem('prediction-form') ?? '')).toMatchObject({
			floor_area_sqm: 42
		});
	});

	it('flushes a pending write on beforeunload', async () => {
		const { persistForm } = await import('$lib/form-persist');
		const custom = { ...predictionDefaults, town: 'BEDOK' as const };
		persistForm(custom);
		window.dispatchEvent(new Event('beforeunload'));
		expect(JSON.parse(localStorage.getItem('prediction-form') ?? '')).toMatchObject({
			town: 'BEDOK'
		});
	});

	it('clears persisted form data', async () => {
		const { persistForm, clearPersistedForm } = await import('$lib/form-persist');
		persistForm(predictionDefaults);
		await vi.advanceTimersByTimeAsync(300);
		clearPersistedForm();
		expect(localStorage.getItem('prediction-form')).toBeNull();
	});
});
