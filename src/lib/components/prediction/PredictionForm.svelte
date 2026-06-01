<script lang="ts">
	import { onMount } from 'svelte';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import type { SuperForm } from 'sveltekit-superforms';

	import { getI18nContext } from '$lib/i18n.svelte';
	import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS } from '$lib/lists';
	import { fieldErrorsFromSuperforms } from '$lib/prediction-errors';
	import {
		MAX_FLOOR_AREA_SQM,
		MAX_LEASE_COMMENCE_YEAR,
		MIN_FLOOR_AREA_SQM,
		MIN_LEASE_COMMENCE_YEAR
	} from '$lib/prediction';
	import type { PredictionFormData } from '$lib/prediction-schema';
	import FormSelect, { type FormSelectOption } from '$lib/components/ui/form-select.svelte';
	import NumberField from '$lib/components/ui/number-field.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Field from '$lib/components/ui/field/index.js';

	type Props = {
		superform: SuperForm<PredictionFormData>;
		loading: boolean;
		onreset?: () => void;
	};

	let { superform, loading, onreset }: Props = $props();

	const i18n = getI18nContext();

	let isMac = $state(false);
	let mounted = $state(false);

	const { form, errors, enhance } = superform;

	const fieldErrors = $derived(fieldErrorsFromSuperforms($errors, (key) => i18n.t(key)));

	onMount(() => {
		mounted = true;
		const uaData =
			'userAgentData' in navigator
				? (navigator.userAgentData as { platform?: string } | null | undefined)
				: undefined;
		const platform =
			typeof uaData?.platform === 'string' ? uaData.platform : navigator.platform || '';
		isMac = platform.startsWith('Mac');
	});

	function errorFor(message: string) {
		return message ? [{ message }] : undefined;
	}

	function labeledOptions<T extends string>(
		values: readonly T[],
		group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models'
	): FormSelectOption<T>[] {
		return values.map((value) => ({
			value,
			label: i18n.t(`${group}.${value}`)
		}));
	}

	const mlModelsOptions = $derived(labeledOptions(ML_MODELS, 'ml_models'));
	const townOptions = $derived(labeledOptions(TOWNS, 'towns'));
	const storeyRangesOptions = $derived(labeledOptions(STOREY_RANGES, 'storey_ranges'));
	const flatModelsOptions = $derived(labeledOptions(FLAT_MODELS, 'flat_models'));

	const leaseYearOptions = Array.from(
		{ length: MAX_LEASE_COMMENCE_YEAR - MIN_LEASE_COMMENCE_YEAR + 1 },
		(_, index) => {
			const year = MIN_LEASE_COMMENCE_YEAR + index;
			return { value: String(year), label: String(year) };
		}
	);
</script>

<form id="prediction-form" method="POST" action="?/predict" use:enhance>
	{#if !mounted}
		<noscript>
			<Field.Group class="gap-4">
				<label>
					{i18n.t('ml_model')}
					<select name="ml_model" class="mt-1 w-full rounded-lg border px-3 py-2">
						{#each ML_MODELS as model (model)}
							<option value={model} selected={$form.ml_model === model}>{model}</option>
						{/each}
					</select>
				</label>
				<label>
					{i18n.t('town')}
					<select name="town" class="mt-1 w-full rounded-lg border px-3 py-2">
						{#each TOWNS as town (town)}
							<option value={town} selected={$form.town === town}>{town}</option>
						{/each}
					</select>
				</label>
				<label>
					{i18n.t('storey_range')}
					<select name="storey_range" class="mt-1 w-full rounded-lg border px-3 py-2">
						{#each STOREY_RANGES as range (range)}
							<option value={range} selected={$form.storey_range === range}>{range}</option>
						{/each}
					</select>
				</label>
				<label>
					{i18n.t('flat_model')}
					<select name="flat_model" class="mt-1 w-full rounded-lg border px-3 py-2">
						{#each FLAT_MODELS as flatModel (flatModel)}
							<option value={flatModel} selected={$form.flat_model === flatModel}
								>{flatModel}</option
							>
						{/each}
					</select>
				</label>
				<label>
					{i18n.t('floor_area')}
					<input
						name="floor_area_sqm"
						type="number"
						min={MIN_FLOOR_AREA_SQM}
						max={MAX_FLOOR_AREA_SQM}
						value={$form.floor_area_sqm}
						class="mt-1 w-full rounded-lg border px-3 py-2"
					/>
				</label>
				<label>
					{i18n.t('lease_commence_date')}
					<select name="lease_commence_date" class="mt-1 w-full rounded-lg border px-3 py-2">
						{#each leaseYearOptions as year (year.value)}
							<option
								value={year.value}
								selected={String($form.lease_commence_date) === year.value}
							>
								{year.label}
							</option>
						{/each}
					</select>
				</label>
			</Field.Group>
		</noscript>
	{/if}

	{#if mounted}
		<input type="hidden" name="ml_model" value={$form.ml_model} />
		<input type="hidden" name="town" value={$form.town} />
		<input type="hidden" name="storey_range" value={$form.storey_range} />
		<input type="hidden" name="flat_model" value={$form.flat_model} />
		<input type="hidden" name="floor_area_sqm" value={$form.floor_area_sqm} />
		<input type="hidden" name="lease_commence_date" value={$form.lease_commence_date} />
	{/if}

	<Field.Group class="gap-6">
		{#if mounted}
			<Field.Field>
				<Field.Label for="input-ml_model">{i18n.t('ml_model')}</Field.Label>
				<Field.Content>
					<FormSelect
						id="input-ml_model"
						value={$form.ml_model}
						options={mlModelsOptions}
						placeholder={i18n.t('select_ml_model')}
						onchange={(value) => {
							$form.ml_model = value as PredictionFormData['ml_model'];
						}}
					/>
				</Field.Content>
				<Field.Error errors={errorFor(fieldErrors.ml_model)} />
			</Field.Field>

			<div class="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
				<Field.Field>
					<Field.Label for="input-town">{i18n.t('town')}</Field.Label>
					<Field.Content>
						<FormSelect
							id="input-town"
							value={$form.town}
							options={townOptions}
							placeholder={i18n.t('select_town')}
							onchange={(value) => {
								$form.town = value as PredictionFormData['town'];
							}}
						/>
					</Field.Content>
					<Field.Error errors={errorFor(fieldErrors.town)} />
				</Field.Field>

				<Field.Field>
					<Field.Label for="input-storey_range">{i18n.t('storey_range')}</Field.Label>
					<Field.Content>
						<FormSelect
							id="input-storey_range"
							value={$form.storey_range}
							options={storeyRangesOptions}
							placeholder={i18n.t('select_storey_range')}
							onchange={(value) => {
								$form.storey_range = value as PredictionFormData['storey_range'];
							}}
						/>
					</Field.Content>
					<Field.Error errors={errorFor(fieldErrors.storey_range)} />
				</Field.Field>

				<Field.Field>
					<Field.Label for="input-flat_model">{i18n.t('flat_model')}</Field.Label>
					<Field.Content>
						<FormSelect
							id="input-flat_model"
							value={$form.flat_model}
							options={flatModelsOptions}
							placeholder={i18n.t('select_flat_model')}
							onchange={(value) => {
								$form.flat_model = value as PredictionFormData['flat_model'];
							}}
						/>
					</Field.Content>
					<Field.Error errors={errorFor(fieldErrors.flat_model)} />
				</Field.Field>

				<Field.Field>
					<Field.Label for="input-floor_area">{i18n.t('floor_area')}</Field.Label>
					<Field.Content>
						<NumberField
							id="input-floor_area"
							value={$form.floor_area_sqm}
							onchange={(v) => {
								$form.floor_area_sqm = v === '' ? Number.NaN : v;
							}}
							min={MIN_FLOOR_AREA_SQM}
							max={MAX_FLOOR_AREA_SQM}
							step={5}
							placeholder={i18n.t('enter_floor_area')}
							unit="m²"
							ariaLabel={i18n.t('floor_area')}
							required
						/>
					</Field.Content>
					<Field.Error errors={errorFor(fieldErrors.floor_area_sqm)} />
				</Field.Field>
			</div>

			<Field.Field>
				<Field.Label for="input-lease_commence_date">{i18n.t('lease_commence_date')}</Field.Label>
				<Field.Content>
					<FormSelect
						id="input-lease_commence_date"
						value={String($form.lease_commence_date)}
						options={leaseYearOptions}
						placeholder={i18n.t('select_year')}
						onchange={(year) => {
							$form.lease_commence_date = Number(year);
						}}
					/>
				</Field.Content>
				<Field.Error errors={errorFor(fieldErrors.lease_commence_date)} />
			</Field.Field>
		{/if}

		<div class="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
			<Button
				type="submit"
				size="lg"
				class="w-full tracking-normal normal-case shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:brightness-110"
				disabled={loading}
			>
				{#if loading}
					<Loader2 class="size-4 animate-spin" aria-hidden="true" />
					{i18n.t('predicting')}
				{:else}
					<span class="flex items-center gap-2">
						{i18n.t('get_prediction')}
						{#if mounted}
							<kbd
								class="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-primary-foreground/20 bg-primary-foreground/10 px-1.5 font-sans text-[10px] font-medium opacity-80 sm:flex"
								aria-hidden="true">{isMac ? '⌘' : 'Ctrl'} ↵</kbd
							>
						{/if}
					</span>
				{/if}
			</Button>
			<Button
				type="button"
				variant="outline"
				size="lg"
				class="w-full tracking-normal normal-case transition-all duration-200 hover:bg-muted/80"
				disabled={loading}
				onclick={() => onreset?.()}
			>
				<span class="flex items-center gap-2">
					{i18n.t('reset_form')}
					{#if mounted}
						<kbd
							class="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted/50 px-1.5 font-sans text-[10px] font-medium text-muted-foreground sm:flex"
							aria-hidden="true">Esc</kbd
						>
					{/if}
				</span>
			</Button>
		</div>
	</Field.Group>
</form>
