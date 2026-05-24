import { get, writable } from 'svelte/store';

import { lang, t } from '$lib/i18n';
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
	type SummaryValues
} from '$lib/prediction';

type FieldName = keyof FieldType;

export type PredictionState = {
	form: FieldType;
	summaryValues: SummaryValues;
	trendData: ReturnType<typeof defaultTrendData>;
	output: number;
	loading: boolean;
	darkMode: boolean;
	errorMessage: string;
	isMobile: boolean;
	hasPrediction: boolean;
	fieldErrors: Record<FieldName, string>;
};

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
	if (typeof window === 'undefined') return;
	localStorage.setItem('form', JSON.stringify(form));
}

function applyTheme(darkMode: boolean) {
	if (typeof window === 'undefined') return;
	localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	document.documentElement.classList.toggle('dark', darkMode);
	document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}

function validateForm(form: FieldType) {
	const currentLang = get(lang);
	const fieldErrors = blankFieldErrors();

	if (!form.ml_model) fieldErrors.ml_model = t('choose_ml_model', currentLang);
	if (!form.town) fieldErrors.town = t('missing_town', currentLang);
	if (!form.storey_range) fieldErrors.storey_range = t('missing_storey_range', currentLang);
	if (!form.flat_model) fieldErrors.flat_model = t('missing_flat_model', currentLang);
	if (!Number.isFinite(form.floor_area_sqm)) {
		fieldErrors.floor_area_sqm = t('missing_floor_area', currentLang);
	} else if (form.floor_area_sqm < MIN_FLOOR_AREA_SQM || form.floor_area_sqm > MAX_FLOOR_AREA_SQM) {
		fieldErrors.floor_area_sqm = t('floor_area_range', currentLang);
	}

	if (!Number.isFinite(form.lease_commence_date)) {
		fieldErrors.lease_commence_date = t('missing_lease_commence_date', currentLang);
	} else if (
		form.lease_commence_date < MIN_LEASE_COMMENCE_YEAR ||
		form.lease_commence_date > MAX_LEASE_COMMENCE_YEAR
	) {
		fieldErrors.lease_commence_date = t('missing_lease_commence_date', currentLang);
	}

	return {
		fieldErrors,
		valid: !Object.values(fieldErrors).some(Boolean)
	};
}

function readInitialDarkMode() {
	if (typeof window === 'undefined') return false;
	return localStorage.getItem('theme') === 'dark';
}

const initialState: PredictionState = {
	form: { ...initialFormValues },
	summaryValues: createSummary(initialFormValues),
	trendData: defaultTrendData(),
	output: 0,
	loading: false,
	darkMode: false,
	errorMessage: '',
	isMobile: false,
	hasPrediction: false,
	fieldErrors: blankFieldErrors()
};

function createPredictionStore() {
	const { subscribe, set, update } = writable<PredictionState>({
		...initialState,
		darkMode: readInitialDarkMode()
	});

	if (typeof window !== 'undefined') {
		applyTheme(readInitialDarkMode());
	}

	function setViewportFlags() {
		if (typeof window === 'undefined') return;
		update((state) => ({ ...state, isMobile: window.innerWidth < 900 }));
	}

	return {
		subscribe,
		init() {
			if (typeof window === 'undefined') {
				return () => {};
			}

			setViewportFlags();

			const savedTheme = localStorage.getItem('theme') === 'dark';
			applyTheme(savedTheme);

			const savedLang = localStorage.getItem('lang');
			if (savedLang === 'en' || savedLang === 'zh') {
				lang.set(savedLang);
			}

			let nextForm = { ...initialFormValues };
			const savedForm = localStorage.getItem('form');
			if (savedForm) {
				try {
					const parsed = JSON.parse(savedForm) as Partial<FieldType>;
					nextForm = {
						...initialFormValues,
						...parsed,
						floor_area_sqm: Number(parsed.floor_area_sqm ?? initialFormValues.floor_area_sqm),
						lease_commence_date: Number(
							parsed.lease_commence_date ?? initialFormValues.lease_commence_date
						)
					};
				} catch {
					nextForm = { ...initialFormValues };
				}
			}

			set({
				...initialState,
				form: nextForm,
				summaryValues: createSummary(nextForm),
				darkMode: savedTheme,
				isMobile: window.innerWidth < 900
			});

			window.addEventListener('resize', setViewportFlags);
			return () => window.removeEventListener('resize', setViewportFlags);
		},
		toggleTheme() {
			update((state) => {
				const darkMode = !state.darkMode;
				applyTheme(darkMode);
				return { ...state, darkMode };
			});
		},
		reset() {
			if (typeof window !== 'undefined') {
				localStorage.removeItem('form');
			}

			update((state) => ({
				...state,
				form: { ...initialFormValues },
				summaryValues: createSummary(initialFormValues),
				trendData: defaultTrendData(),
				output: 0,
				hasPrediction: false,
				errorMessage: '',
				fieldErrors: blankFieldErrors()
			}));
		},
		updateField<K extends FieldName>(key: K, value: FieldType[K]) {
			update((state) => {
				const form = { ...state.form, [key]: value };
				persistForm(form);
				return {
					...state,
					form,
					summaryValues: createSummary(form),
					errorMessage: '',
					fieldErrors: {
						...state.fieldErrors,
						[key]: ''
					}
				};
			});
		},
		async submit() {
			const currentLang = get(lang);
			const state = get({ subscribe });
			persistForm(state.form);

			const validation = validateForm(state.form);
			if (!validation.valid) {
				update((current) => ({
					...current,
					errorMessage: '',
					fieldErrors: validation.fieldErrors,
					summaryValues: createSummary(current.form)
				}));
				return;
			}

			update((current) => ({
				...current,
				loading: true,
				errorMessage: '',
				fieldErrors: blankFieldErrors(),
				summaryValues: createSummary(current.form),
				output: 0,
				hasPrediction: false,
				trendData: defaultTrendData()
			}));

			try {
				const latest = get({ subscribe });
				const floorArea = Math.max(
					MIN_FLOOR_AREA_SQM,
					Math.min(MAX_FLOOR_AREA_SQM, Math.round(latest.form.floor_area_sqm))
				);

				const response = await fetch('/api/prices', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						mlModel: latest.form.ml_model,
						town: latest.form.town,
						storeyRange: latest.form.storey_range,
						flatModel: latest.form.flat_model,
						floorAreaSqm: floorArea,
						leaseCommenceYear: latest.form.lease_commence_date
					})
				});

				if (!response.ok) {
					throw new Error(await getApiErrorMessage(response, currentLang));
				}

				const serverData = await response.json();
				const trendData = normalizeTrendData(serverData);

				if (trendData.length === 0 || !trendData.some((point) => point.value > 0)) {
					throw new Error(t('error_invalid_prediction', currentLang));
				}

				update((current) => ({
					...current,
					trendData,
					output: normalizePrice(trendData[trendData.length - 1]?.value ?? 0),
					hasPrediction: true,
					loading: false,
					errorMessage: ''
				}));
			} catch (error) {
				console.error('Price prediction fetch failed', {
					url: '/api/prices',
					error: error instanceof Error ? error.message : error
				});
				update((current) => ({
					...current,
					loading: false,
					output: 0,
					hasPrediction: false,
					trendData: defaultTrendData(),
					errorMessage:
						error instanceof Error && error.message ? error.message : t('error_fetch', currentLang)
				}));
			}
		}
	};
}

export const prediction = createPredictionStore();

async function getApiErrorMessage(response: Response, currentLang: 'en' | 'zh') {
	const text = await response.text();
	if (!text) {
		return t('error_fetch', currentLang);
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
