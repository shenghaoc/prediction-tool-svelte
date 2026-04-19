<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import { lang, t, type Language } from '$lib/i18n';
	import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS } from '$lib/lists';
	import { MAX_LEASE_COMMENCE_YEAR, type FieldType } from '$lib/prediction';
	import FormField from './FormField.svelte';
	import Listbox from './Listbox.svelte';
	import StatCard from './StatCard.svelte';

	type ListboxOption = {
		value: string;
		label: string;
	};

	export let form: FieldType;
	export let fieldErrors: Record<keyof FieldType, string>;
	export let loading: boolean;
	const dispatch = createEventDispatcher<{
		submit: undefined;
		reset: undefined;
		update: {
			key: keyof FieldType;
			value: FieldType[keyof FieldType];
		};
	}>();

	function optionLabel(
		group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models',
		value: string,
		language: Language
	) {
		return t(`${group}.${value}`, language);
	}

	function toOptions(
		values: readonly string[],
		group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models',
		language: Language
	): ListboxOption[] {
		return values.map((entry) => ({
			value: entry,
			label: optionLabel(group, entry, language)
		}));
	}

	function submitForm(event: SubmitEvent) {
		event.preventDefault();
		dispatch('submit');
	}

	function resetForm() {
		dispatch('reset');
	}

	function updateField<K extends keyof FieldType>(key: K, value: FieldType[K]) {
		dispatch('update', { key, value });
	}

	const leaseYearMin = 1960;
	const leaseYearMax = MAX_LEASE_COMMENCE_YEAR;
	$: modelOptions = toOptions(ML_MODELS, 'ml_models', $lang);
	$: townOptions = toOptions(TOWNS, 'towns', $lang);
	$: storeyOptions = toOptions(STOREY_RANGES, 'storey_ranges', $lang);
	$: flatModelOptions = toOptions(FLAT_MODELS, 'flat_models', $lang);
</script>

<section class="prediction-card">
	<div class="prediction-card-inner">
		<div class="prediction-intro-block">
			<h1 class={`prediction-headline ${$lang === 'zh' ? 'prediction-headline-cjk' : ''}`}>
				{t('price_prediction', $lang)}
			</h1>
			<p class="prediction-lead">{t('intro_blurb', $lang)}</p>

			<div class="prediction-figure-row">
				<StatCard
					variant="figure"
					label={t('ml_model', $lang)}
					value={String(ML_MODELS.length).padStart(2, '0')}
				/>
				<StatCard
					variant="figure"
					label={t('town', $lang)}
					value={String(TOWNS.length).padStart(2, '0')}
				/>
				<StatCard
					variant="figure"
					label={t('storey_range', $lang)}
					value={String(STOREY_RANGES.length).padStart(2, '0')}
				/>
			</div>

			<p class="prediction-caption">{t('intro_caption', $lang)}</p>
		</div>

		<form class="prediction-form-shell" onsubmit={submitForm} novalidate>
			<h2 class="prediction-section-title">{t('prediction_form', $lang)}</h2>

			<div class="prediction-form-grid">
				<FormField forId="ml_model" label={t('ml_model', $lang)} error={fieldErrors.ml_model}>
					<Listbox
						id="ml_model"
						value={form.ml_model}
						options={modelOptions}
						placeholder={t('select_ml_model', $lang)}
						on:change={(event) =>
							updateField('ml_model', event.detail.value as FieldType['ml_model'])}
					/>
				</FormField>

				<FormField forId="town" label={t('town', $lang)} error={fieldErrors.town}>
					<Listbox
						id="town"
						value={form.town}
						options={townOptions}
						placeholder={t('select_town', $lang)}
						on:change={(event) => updateField('town', event.detail.value as FieldType['town'])}
					/>
				</FormField>

				<FormField
					forId="storey_range"
					label={t('storey_range', $lang)}
					error={fieldErrors.storey_range}
				>
					<Listbox
						id="storey_range"
						value={form.storey_range}
						options={storeyOptions}
						placeholder={t('select_storey_range', $lang)}
						on:change={(event) =>
							updateField('storey_range', event.detail.value as FieldType['storey_range'])}
					/>
				</FormField>

				<FormField forId="flat_model" label={t('flat_model', $lang)} error={fieldErrors.flat_model}>
					<Listbox
						id="flat_model"
						value={form.flat_model}
						options={flatModelOptions}
						placeholder={t('select_flat_model', $lang)}
						on:change={(event) =>
							updateField('flat_model', event.detail.value as FieldType['flat_model'])}
					/>
				</FormField>

				<FormField
					forId="floor_area_sqm"
					label={t('floor_area', $lang)}
					error={fieldErrors.floor_area_sqm}
					fullWidth
				>
					<div class="prediction-unit-wrap">
						<input
							id="floor_area_sqm"
							type="number"
							min="20"
							max="300"
							step="1"
							bind:value={form.floor_area_sqm}
							oninput={() => updateField('floor_area_sqm', Number(form.floor_area_sqm))}
							placeholder={t('enter_floor_area', $lang)}
						/>
						<div class="prediction-unit-tag">m²</div>
					</div>
				</FormField>

				<FormField
					forId="lease_commence_date"
					label={t('lease_commence_date', $lang)}
					error={fieldErrors.lease_commence_date}
					fullWidth
				>
					<div class="prediction-year-control">
						<div class="prediction-year-header">
							<strong>{form.lease_commence_date}</strong>
							<span>{leaseYearMin} - {leaseYearMax}</span>
						</div>
						<input
							id="lease_commence_date"
							class="prediction-year-slider"
							type="range"
							min={leaseYearMin}
							max={leaseYearMax}
							step="1"
							bind:value={form.lease_commence_date}
							oninput={() => updateField('lease_commence_date', Number(form.lease_commence_date))}
							aria-valuemin={leaseYearMin}
							aria-valuemax={leaseYearMax}
							aria-valuenow={form.lease_commence_date}
						/>
						<div class="prediction-year-markers" aria-hidden="true">
							<span>{leaseYearMin}</span>
							<span>1980</span>
							<span>2000</span>
							<span>{leaseYearMax}</span>
						</div>
					</div>
				</FormField>
			</div>

			<div class="prediction-button-row">
				<button class="prediction-primary-button" type="submit" disabled={loading}>
					{loading ? '...' : t('get_prediction', $lang)}
				</button>
				<button
					class="prediction-reset-button"
					type="button"
					onclick={resetForm}
					disabled={loading}
				>
					{t('reset_form', $lang)}
				</button>
			</div>
		</form>
	</div>
</section>
