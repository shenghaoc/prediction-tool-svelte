<script lang="ts">
	import { onMount } from 'svelte';

	import { lang, t, type Language } from '$lib/i18n';
	import {
		defaultTrendData,
		getPredictionTheme,
		initialFormValues,
		normalizePrice,
		normalizeTrendData,
		predictionMonth,
		type FieldType,
		type SummaryValues
	} from '$lib/prediction';
	import PredictionForm from '$lib/components/prediction/PredictionForm.svelte';
	import PredictionResults from '$lib/components/prediction/PredictionResults.svelte';
	import '$lib/components/prediction/prediction.css';

	type FieldName = keyof FieldType;

	let form: FieldType = { ...initialFormValues };
	let summaryValues: SummaryValues = {
		ml_model: initialFormValues.ml_model,
		town: initialFormValues.town,
		lease_commence_date: initialFormValues.lease_commence_date
	};
	let trendData = defaultTrendData();
	let output = 0;
	let loading = false;
	let darkMode = false;
	let errorMessage = '';
	let isMobile = false;
	let currentLang: Language = 'en';

	const fieldErrors: Record<FieldName, string> = {
		ml_model: '',
		town: '',
		storey_range: '',
		flat_model: '',
		floor_area_sqm: '',
		lease_commence_date: ''
	};

	$: currentLang = $lang;
	$: theme = getPredictionTheme(darkMode);
	$: pageStyle = `
		--page-bg:${theme.pageBg};
		--text-color:${theme.text};
		--text-muted:${theme.textMuted};
		--primary-color:${theme.primary};
		--accent-color:${theme.accent};
		--line-soft:${theme.lineSoft};
		--panel-bg:${theme.panelBg};
		--panel-strong:${theme.panelStrong};
		--results-bg:${theme.resultsBg};
		--results-bg-2:${theme.resultsBg2};
		--price-panel-bg:${theme.pricePanelBg};
		--field-bg:${theme.fieldBg};
		--pill-bg:${theme.pillBg};
		--focus-ring:${theme.focusRing};
		--panel-shadow:${theme.shadow};
		--accent-shadow:${theme.accentShadow};
		--mesh-line:${theme.meshLine};
		--orb-color:${theme.orbColor};
		background:${theme.background};
	`;
	$: headlineClass = currentLang === 'zh' ? 'prediction-headline-cjk' : '';

	function tr(key: string) {
		return t(key, currentLang);
	}

	function clearErrors() {
		for (const key of Object.keys(fieldErrors) as FieldName[]) {
			fieldErrors[key] = '';
		}
	}

	function validateForm() {
		clearErrors();

		if (!form.ml_model) fieldErrors.ml_model = tr('choose_ml_model');
		if (!form.town) fieldErrors.town = tr('missing_town');
		if (!form.storey_range) fieldErrors.storey_range = tr('missing_storey_range');
		if (!form.flat_model) fieldErrors.flat_model = tr('missing_flat_model');
		if (!Number.isFinite(form.floor_area_sqm)) {
			fieldErrors.floor_area_sqm = tr('missing_floor_area');
		} else if (form.floor_area_sqm < 20 || form.floor_area_sqm > 300) {
			fieldErrors.floor_area_sqm = tr('floor_area_range');
		}

		if (!Number.isFinite(form.lease_commence_date)) {
			fieldErrors.lease_commence_date = tr('missing_lease_commence_date');
		} else if (form.lease_commence_date < 1960 || form.lease_commence_date > 2022) {
			fieldErrors.lease_commence_date = tr('missing_lease_commence_date');
		}

		return !Object.values(fieldErrors).some(Boolean);
	}

	function syncSummary() {
		summaryValues = {
			ml_model: form.ml_model,
			town: form.town,
			lease_commence_date: form.lease_commence_date
		};
	}

	function persistForm() {
		if (typeof window === 'undefined') return;
		localStorage.setItem('form', JSON.stringify(form));
	}

	function setViewportFlags() {
		if (typeof window === 'undefined') return;
		isMobile = window.innerWidth < 900;
	}

	function toggleTheme() {
		darkMode = !darkMode;
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', darkMode ? 'dark' : 'light');
			document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
		}
	}

	function toggleLang() {
		const next = currentLang === 'en' ? 'zh' : 'en';
		lang.set(next);
		if (typeof window !== 'undefined') {
			localStorage.setItem('lang', next);
		}
	}

	function resetForm() {
		form = { ...initialFormValues };
		trendData = defaultTrendData();
		output = 0;
		errorMessage = '';
		clearErrors();
		syncSummary();

		if (typeof window !== 'undefined') {
			localStorage.removeItem('form');
		}
	}

	function updateField<K extends FieldName>(key: K, value: FieldType[K]) {
		form = { ...form, [key]: value };
		fieldErrors[key] = '';
		errorMessage = '';
		syncSummary();
		persistForm();
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';
		syncSummary();
		persistForm();

		if (!validateForm()) {
			return;
		}

		loading = true;
		try {
			const selectedMonth = predictionMonth.year(form.lease_commence_date);
			const floorArea = Math.max(20, Math.min(300, Math.round(form.floor_area_sqm)));
			const formData = new FormData();
			formData.append('ml_model', form.ml_model);
			formData.append('month_start', selectedMonth.subtract(12, 'month').format('YYYY-MM'));
			formData.append('month_end', selectedMonth.format('YYYY-MM'));
			formData.append('town', form.town);
			formData.append('storey_range', form.storey_range);
			formData.append('flat_model', form.flat_model);
			formData.append('floor_area_sqm', String(floorArea));
			formData.append('lease_commence_date', String(form.lease_commence_date));

			const response = await fetch('https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			const serverData: Array<{ labels: string; data: number }> = await response.json();
			trendData = normalizeTrendData(serverData);
			output = normalizePrice(trendData[trendData.length - 1]?.value ?? 0);
		} catch (error) {
			console.error(error);
			errorMessage = error instanceof Error && error.message ? error.message : tr('error_fetch');
		} finally {
			loading = false;
		}
	}

	function optionLabel(group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models', value: string) {
		return t(`${group}.${value}`, currentLang);
	}

	onMount(() => {
		setViewportFlags();

		const savedTheme = localStorage.getItem('theme');
		darkMode = savedTheme === 'dark';
		document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');

		const savedLang = localStorage.getItem('lang');
		if (savedLang === 'en' || savedLang === 'zh') {
			lang.set(savedLang);
		}

		const savedForm = localStorage.getItem('form');
		if (savedForm) {
			try {
				const parsed = JSON.parse(savedForm) as Partial<FieldType>;
				form = {
					...initialFormValues,
					...parsed,
					floor_area_sqm: Number(parsed.floor_area_sqm ?? initialFormValues.floor_area_sqm),
					lease_commence_date: Number(
						parsed.lease_commence_date ?? initialFormValues.lease_commence_date
					)
				};
			} catch {
				form = { ...initialFormValues };
			}
		}

		syncSummary();
		window.addEventListener('resize', setViewportFlags);
		return () => window.removeEventListener('resize', setViewportFlags);
	});
</script>

<svelte:head>
	<title>{tr('price_prediction')}</title>
</svelte:head>

<main class="prediction-shell" style={pageStyle}>
	<div class="prediction-surface">
		<div class="prediction-topbar">
			<div class="prediction-pill">{tr('intro_eyebrow')}</div>
			<div class="prediction-actions">
				<button class="prediction-ghost-button" type="button" onclick={toggleTheme}>
					{darkMode ? 'Light' : 'Dark'}
				</button>
				<button class="prediction-ghost-button" type="button" onclick={toggleLang}>
					{tr('switch_language')}
				</button>
			</div>
		</div>

		<div class="prediction-layout">
			<PredictionForm
				{form}
				{fieldErrors}
				{loading}
				{headlineClass}
				{optionLabel}
				translate={tr}
				onSubmit={handleSubmit}
				onReset={resetForm}
				onUpdateField={updateField}
			/>

			<div>
				<PredictionResults
					{output}
					{loading}
					{summaryValues}
					{trendData}
					{theme}
					{isMobile}
					{optionLabel}
					translate={tr}
				/>

				{#if errorMessage}
					<p class="prediction-error" style="margin-top: 12px;">{errorMessage}</p>
				{/if}
			</div>
		</div>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		background: var(--page-bg, #f5eee5);
		color: var(--text-color, #1f2328);
		font-family: 'Avenir Next', Avenir, 'Segoe UI', sans-serif;
		transition:
			background 180ms ease,
			color 180ms ease;
	}
</style>
