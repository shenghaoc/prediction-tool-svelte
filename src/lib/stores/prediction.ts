import { get, writable } from 'svelte/store';

import { lang, t } from '$lib/i18n';
import {
	defaultTrendData,
	initialFormValues,
	normalizePrice,
	normalizeTrendData,
	predictionMonth,
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
	} else if (form.floor_area_sqm < 20 || form.floor_area_sqm > 300) {
		fieldErrors.floor_area_sqm = t('floor_area_range', currentLang);
	}

	if (!Number.isFinite(form.lease_commence_date)) {
		fieldErrors.lease_commence_date = t('missing_lease_commence_date', currentLang);
	} else if (form.lease_commence_date < 1960 || form.lease_commence_date > 2022) {
		fieldErrors.lease_commence_date = t('missing_lease_commence_date', currentLang);
	}

	return {
		fieldErrors,
		valid: !Object.values(fieldErrors).some(Boolean)
	};
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
	fieldErrors: blankFieldErrors()
};

function createPredictionStore() {
	const { subscribe, set, update } = writable<PredictionState>(initialState);

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
				summaryValues: createSummary(current.form)
			}));

			try {
				const latest = get({ subscribe });
				const selectedMonth = predictionMonth.year(latest.form.lease_commence_date);
				const floorArea = Math.max(20, Math.min(300, Math.round(latest.form.floor_area_sqm)));
				const formData = new FormData();
				formData.append('ml_model', latest.form.ml_model);
				formData.append('month_start', selectedMonth.subtract(12, 'month').format('YYYY-MM'));
				formData.append('month_end', selectedMonth.format('YYYY-MM'));
				formData.append('town', latest.form.town);
				formData.append('storey_range', latest.form.storey_range);
				formData.append('flat_model', latest.form.flat_model);
				formData.append('floor_area_sqm', String(floorArea));
				formData.append('lease_commence_date', String(latest.form.lease_commence_date));

				const response = await fetch('https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					throw new Error(await response.text());
				}

				const serverData: Array<{ labels: string; data: number }> = await response.json();
				const trendData = normalizeTrendData(serverData);

				update((current) => ({
					...current,
					trendData,
					output: normalizePrice(trendData[trendData.length - 1]?.value ?? 0),
					loading: false
				}));
			} catch (error) {
				const currentLang = get(lang);
				update((current) => ({
					...current,
					loading: false,
					errorMessage:
						error instanceof Error && error.message
							? error.message
							: t('error_fetch', currentLang)
				}));
			}
		}
	};
}

export const prediction = createPredictionStore();
