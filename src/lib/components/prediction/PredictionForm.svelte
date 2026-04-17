<script lang="ts">
	import {
		FLAT_MODELS,
		ML_MODELS,
		STOREY_RANGES,
		TOWNS
	} from '$lib/lists';
	import type { FieldType } from '$lib/prediction';

	export let form: FieldType;
	export let fieldErrors: Record<keyof FieldType, string>;
	export let loading: boolean;
	export let headlineClass: string;
	export let optionLabel: (
		group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models',
		value: string
	) => string;
	export let translate: (key: string) => string;
	export let onSubmit: (event: SubmitEvent) => Promise<void>;
	export let onReset: () => void;
	export let onUpdateField: <K extends keyof FieldType>(key: K, value: FieldType[K]) => void;
</script>

<section class="prediction-card">
	<div class="prediction-card-inner">
		<div class="prediction-intro-block">
			<h1 class={`prediction-headline ${headlineClass}`}>{translate('price_prediction')}</h1>
			<p class="prediction-lead">{translate('intro_blurb')}</p>

			<div class="prediction-figure-row">
				<div class="prediction-figure">
					<span class="prediction-figure-label">{translate('ml_model')}</span>
					<strong class="prediction-figure-value">{String(ML_MODELS.length).padStart(2, '0')}</strong>
				</div>
				<div class="prediction-figure">
					<span class="prediction-figure-label">{translate('town')}</span>
					<strong class="prediction-figure-value">{String(TOWNS.length).padStart(2, '0')}</strong>
				</div>
				<div class="prediction-figure">
					<span class="prediction-figure-label">{translate('storey_range')}</span>
					<strong class="prediction-figure-value">
						{String(STOREY_RANGES.length).padStart(2, '0')}
					</strong>
				</div>
			</div>

			<p class="prediction-caption">{translate('intro_caption')}</p>
		</div>

		<form class="prediction-form-shell" onsubmit={onSubmit} novalidate>
			<h2 class="prediction-section-title">{translate('prediction_form')}</h2>

			<div class="prediction-form-grid">
				<div class="prediction-field">
					<label for="ml_model">{translate('ml_model')}</label>
					<select
						id="ml_model"
						bind:value={form.ml_model}
						onchange={() => onUpdateField('ml_model', form.ml_model)}
					>
						{#each ML_MODELS as mlModel}
							<option value={mlModel}>{optionLabel('ml_models', mlModel)}</option>
						{/each}
					</select>
					{#if fieldErrors.ml_model}<p class="prediction-error">{fieldErrors.ml_model}</p>{/if}
				</div>

				<div class="prediction-field">
					<label for="town">{translate('town')}</label>
					<select id="town" bind:value={form.town} onchange={() => onUpdateField('town', form.town)}>
						{#each TOWNS as town}
							<option value={town}>{optionLabel('towns', town)}</option>
						{/each}
					</select>
					{#if fieldErrors.town}<p class="prediction-error">{fieldErrors.town}</p>{/if}
				</div>

				<div class="prediction-field">
					<label for="storey_range">{translate('storey_range')}</label>
					<select
						id="storey_range"
						bind:value={form.storey_range}
						onchange={() => onUpdateField('storey_range', form.storey_range)}
					>
						{#each STOREY_RANGES as storeyRange}
							<option value={storeyRange}>{optionLabel('storey_ranges', storeyRange)}</option>
						{/each}
					</select>
					{#if fieldErrors.storey_range}
						<p class="prediction-error">{fieldErrors.storey_range}</p>
					{/if}
				</div>

				<div class="prediction-field">
					<label for="flat_model">{translate('flat_model')}</label>
					<select
						id="flat_model"
						bind:value={form.flat_model}
						onchange={() => onUpdateField('flat_model', form.flat_model)}
					>
						{#each FLAT_MODELS as flatModel}
							<option value={flatModel}>{optionLabel('flat_models', flatModel)}</option>
						{/each}
					</select>
					{#if fieldErrors.flat_model}<p class="prediction-error">{fieldErrors.flat_model}</p>{/if}
				</div>

				<div class="prediction-field prediction-field-full">
					<label for="floor_area_sqm">{translate('floor_area')}</label>
					<div class="prediction-unit-wrap">
						<input
							id="floor_area_sqm"
							type="number"
							min="20"
							max="300"
							step="1"
							bind:value={form.floor_area_sqm}
							oninput={() => onUpdateField('floor_area_sqm', Number(form.floor_area_sqm))}
							placeholder={translate('enter_floor_area')}
						/>
						<div class="prediction-unit-tag">m²</div>
					</div>
					{#if fieldErrors.floor_area_sqm}
						<p class="prediction-error">{fieldErrors.floor_area_sqm}</p>
					{/if}
				</div>

				<div class="prediction-field prediction-field-full">
					<label for="lease_commence_date">{translate('lease_commence_date')}</label>
					<input
						id="lease_commence_date"
						type="number"
						min="1960"
						max="2022"
						step="1"
						bind:value={form.lease_commence_date}
						oninput={() =>
							onUpdateField('lease_commence_date', Number(form.lease_commence_date))}
						placeholder={translate('select_year')}
					/>
					{#if fieldErrors.lease_commence_date}
						<p class="prediction-error">{fieldErrors.lease_commence_date}</p>
					{/if}
				</div>
			</div>

			<div class="prediction-button-row">
				<button class="prediction-primary-button" type="submit" disabled={loading}>
					{loading ? '...' : translate('get_prediction')}
				</button>
				<button class="prediction-reset-button" type="button" onclick={onReset} disabled={loading}>
					{translate('reset_form')}
				</button>
			</div>
		</form>
	</div>
</section>
