import { browser } from '$app/environment';
import { createContext } from 'svelte';

import type { I18n } from '$lib/i18n.svelte';
import {
	defaultTrendData,
	initialFormValues,
	MAX_FLOOR_AREA_SQM,
	MAX_LEASE_COMMENCE_YEAR,
	MIN_FLOOR_AREA_SQM,
	MIN_LEASE_COMMENCE_YEAR,
	normalizePrice,
	normalizeTrendData,
	type FieldType,
	type SummaryValues,
	type TrendPoint
} from '$lib/prediction';

type FieldName = keyof FieldType;

function blankFieldErrors(): Record<FieldName, string> {
	return {
		ml_model: '',
		town: '',
		storey_range: '',
		flat_model: '',
		floor_area_sqm: '',
		lease_commence_date: ''
	};
}

function createSummary(form: FieldType): SummaryValues {
	return {
		ml_model: form.ml_model,
		town: form.town,
		lease_commence_date: form.lease_commence_date
	};
}

function persistForm(form: FieldType) {
	if (!browser) return;
	localStorage.setItem('form', JSON.stringify(form));
}

function applyTheme(darkMode: boolean) {
	if (!browser) return;
	localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	document.documentElement.classList.toggle('dark', darkMode);
	document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}

function readInitialDarkMode(): boolean {
	return browser && localStorage.getItem('theme') === 'dark';
}

function validateForm(form: FieldType, i18n: I18n) {
	const fieldErrors = blankFieldErrors();

	if (!form.ml_model) fieldErrors.ml_model = i18n.t('choose_ml_model');
	if (!form.town) fieldErrors.town = i18n.t('missing_town');
	if (!form.storey_range) fieldErrors.storey_range = i18n.t('missing_storey_range');
	if (!form.flat_model) fieldErrors.flat_model = i18n.t('missing_flat_model');
	if (!Number.isFinite(form.floor_area_sqm)) {
		fieldErrors.floor_area_sqm = i18n.t('missing_floor_area');
	} else if (form.floor_area_sqm < MIN_FLOOR_AREA_SQM || form.floor_area_sqm > MAX_FLOOR_AREA_SQM) {
		fieldErrors.floor_area_sqm = i18n.t('floor_area_range');
	}

	if (!Number.isFinite(form.lease_commence_date)) {
		fieldErrors.lease_commence_date = i18n.t('missing_lease_commence_date');
	} else if (
		form.lease_commence_date < MIN_LEASE_COMMENCE_YEAR ||
		form.lease_commence_date > MAX_LEASE_COMMENCE_YEAR
	) {
		fieldErrors.lease_commence_date = i18n.t('missing_lease_commence_date');
	}

	return {
		fieldErrors,
		valid: !Object.values(fieldErrors).some(Boolean)
	};
}

async function getApiErrorMessage(response: Response, i18n: I18n) {
	const text = await response.text();
	if (!text) {
		return i18n.t('error_fetch');
	}

	try {
		const parsed = JSON.parse(text) as {
			error?: string | { message?: string };
			statusMessage?: string;
			message?: string;
		};

		if (typeof parsed.statusMessage === 'string' && parsed.statusMessage.trim()) {
			return parsed.statusMessage;
		}

		if (typeof parsed.message === 'string' && parsed.message.trim()) {
			return parsed.message;
		}

		if (typeof parsed.error === 'string' && parsed.error.trim()) {
			return parsed.error;
		}

		if (
			parsed.error &&
			typeof parsed.error === 'object' &&
			'message' in parsed.error &&
			typeof parsed.error.message === 'string'
		) {
			return parsed.error.message;
		}
	} catch (parseError) {
		console.warn('Failed to parse error response body as JSON', {
			status: response.status,
			contentType: response.headers.get('content-type'),
			bodyPreview: text.slice(0, 200),
			parseError
		});
	}

	return text;
}

export class PredictionStore {
	readonly #i18n: I18n;

	form = $state<FieldType>({ ...initialFormValues });
	trendData = $state<TrendPoint[]>(defaultTrendData());
	output = $state(0);
	loading = $state(false);
	darkMode = $state(readInitialDarkMode());
	errorMessage = $state('');
	hasPrediction = $state(false);
	fieldErrors = $state<Record<FieldName, string>>(blankFieldErrors());
	summaryValues = $derived<SummaryValues>(createSummary(this.form));

	constructor(i18n: I18n) {
		this.#i18n = i18n;
		applyTheme(this.darkMode);
	}

	init() {
		if (!browser) return;

		const savedTheme = localStorage.getItem('theme') === 'dark';
		this.darkMode = savedTheme;
		applyTheme(savedTheme);

		const savedForm = localStorage.getItem('form');
		if (savedForm) {
			try {
				const parsed = JSON.parse(savedForm) as Partial<FieldType>;
				this.form = {
					...initialFormValues,
					...parsed,
					floor_area_sqm: Number(parsed.floor_area_sqm ?? initialFormValues.floor_area_sqm),
					lease_commence_date: Number(
						parsed.lease_commence_date ?? initialFormValues.lease_commence_date
					)
				};
			} catch {
				this.form = { ...initialFormValues };
			}
		}
	}

	toggleTheme() {
		this.darkMode = !this.darkMode;
		applyTheme(this.darkMode);
	}

	reset() {
		if (browser) {
			localStorage.removeItem('form');
		}

		this.form = { ...initialFormValues };
		this.trendData = defaultTrendData();
		this.output = 0;
		this.hasPrediction = false;
		this.errorMessage = '';
		this.fieldErrors = blankFieldErrors();
	}

	updateField<K extends FieldName>(key: K, value: FieldType[K]) {
		this.form = { ...this.form, [key]: value };
		persistForm(this.form);
		this.errorMessage = '';
		this.fieldErrors = { ...this.fieldErrors, [key]: '' };
	}

	async submit() {
		persistForm(this.form);

		const validation = validateForm(this.form, this.#i18n);
		if (!validation.valid) {
			this.errorMessage = '';
			this.fieldErrors = validation.fieldErrors;
			return;
		}

		this.loading = true;
		this.errorMessage = '';
		this.fieldErrors = blankFieldErrors();
		this.output = 0;
		this.hasPrediction = false;
		this.trendData = defaultTrendData();

		try {
			const floorArea = Math.max(
				MIN_FLOOR_AREA_SQM,
				Math.min(MAX_FLOOR_AREA_SQM, Math.round(this.form.floor_area_sqm))
			);

			const response = await fetch('/api/prices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mlModel: this.form.ml_model,
					town: this.form.town,
					storeyRange: this.form.storey_range,
					flatModel: this.form.flat_model,
					floorAreaSqm: floorArea,
					leaseCommenceYear: this.form.lease_commence_date
				})
			});

			if (!response.ok) {
				throw new Error(await getApiErrorMessage(response, this.#i18n));
			}

			const serverData = await response.json();
			const trendData = normalizeTrendData(serverData);

			if (trendData.length === 0 || !trendData.some((point) => point.value > 0)) {
				throw new Error(this.#i18n.t('error_invalid_prediction'));
			}

			this.trendData = trendData;
			this.output = normalizePrice(trendData[trendData.length - 1]?.value ?? 0);
			this.hasPrediction = true;
			this.loading = false;
			this.errorMessage = '';
		} catch (error) {
			console.error('Price prediction fetch failed', {
				url: '/api/prices',
				error: error instanceof Error ? error.message : error
			});
			this.loading = false;
			this.output = 0;
			this.hasPrediction = false;
			this.trendData = defaultTrendData();
			this.errorMessage =
				error instanceof Error && error.message ? error.message : this.#i18n.t('error_fetch');
		}
	}
}

export const [getPredictionContext, setPredictionContext] = createContext<PredictionStore>();
