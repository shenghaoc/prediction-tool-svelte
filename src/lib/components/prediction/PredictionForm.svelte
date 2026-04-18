<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import { lang, t, type Language } from '$lib/i18n';
	import {
		FLAT_MODELS,
		ML_MODELS,
		STOREY_RANGES,
		TOWNS
	} from '$lib/lists';
	import type { FieldType } from '$lib/prediction';
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

	$: currentLang = $lang;
	$: headlineClass = currentLang === 'zh' ? 'prediction-headline-cjk' : '';

	function tr(key: string) {
		return t(key, currentLang);
	}

	function optionLabel(group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models', value: string) {
		return t(`${group}.${value}`, currentLang as Language);
	}

	function toOptions(
		values: readonly string[],
		group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models'
	): ListboxOption[] {
		return values.map((entry) => ({
			value: entry,
			label: optionLabel(group, entry)
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
	const leaseYearMax = 2022;
	$: modelOptions = toOptions(ML_MODELS, 'ml_models');
	$: townOptions = toOptions(TOWNS, 'towns');
	$: storeyOptions = toOptions(STOREY_RANGES, 'storey_ranges');
	$: flatModelOptions = toOptions(FLAT_MODELS, 'flat_models');
</script>

<section class="prediction-card">
	<div class="prediction-card-inner">
		<div class="prediction-intro-block">
			<h1 class={`prediction-headline ${headlineClass}`}>{tr('price_prediction')}</h1>
			<p class="prediction-lead">{tr('intro_blurb')}</p>

			<div class="prediction-figure-row">
				<StatCard variant="figure" label={tr('ml_model')} value={String(ML_MODELS.length).padStart(2, '0')} />
				<StatCard variant="figure" label={tr('town')} value={String(TOWNS.length).padStart(2, '0')} />
				<StatCard
					variant="figure"
					label={tr('storey_range')}
					value={String(STOREY_RANGES.length).padStart(2, '0')}
				/>
			</div>

			<p class="prediction-caption">{tr('intro_caption')}</p>
		</div>

		<form class="prediction-form-shell" onsubmit={submitForm} novalidate>
			<h2 class="prediction-section-title">{tr('prediction_form')}</h2>

			<div class="prediction-form-grid">
				<FormField forId="ml_model" label={tr('ml_model')} error={fieldErrors.ml_model}>
					<Listbox
						id="ml_model"
						value={form.ml_model}
						options={modelOptions}
						placeholder={tr('select_ml_model')}
						on:change={(event) =>
							updateField('ml_model', event.detail.value as FieldType['ml_model'])}
					/>
				</FormField>

				<FormField forId="town" label={tr('town')} error={fieldErrors.town}>
					<Listbox
						id="town"
						value={form.town}
						options={townOptions}
						placeholder={tr('select_town')}
						on:change={(event) => updateField('town', event.detail.value as FieldType['town'])}
					/>
				</FormField>

				<FormField
					forId="storey_range"
					label={tr('storey_range')}
					error={fieldErrors.storey_range}
				>
					<Listbox
						id="storey_range"
						value={form.storey_range}
						options={storeyOptions}
						placeholder={tr('select_storey_range')}
						on:change={(event) =>
							updateField('storey_range', event.detail.value as FieldType['storey_range'])}
					/>
				</FormField>

				<FormField forId="flat_model" label={tr('flat_model')} error={fieldErrors.flat_model}>
					<Listbox
						id="flat_model"
						value={form.flat_model}
						options={flatModelOptions}
						placeholder={tr('select_flat_model')}
						on:change={(event) =>
							updateField('flat_model', event.detail.value as FieldType['flat_model'])}
					/>
				</FormField>

				<FormField
					forId="floor_area_sqm"
					label={tr('floor_area')}
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
							placeholder={tr('enter_floor_area')}
						/>
						<div class="prediction-unit-tag">m²</div>
					</div>
				</FormField>

				<FormField
					forId="lease_commence_date"
					label={tr('lease_commence_date')}
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
					{loading ? '...' : tr('get_prediction')}
				</button>
				<button class="prediction-reset-button" type="button" onclick={resetForm} disabled={loading}>
					{tr('reset_form')}
				</button>
			</div>
		</form>
	</div>
</section>
