<script lang="ts">
	import Loader2 from '@lucide/svelte/icons/loader-2';

	import { lang, t, type Language } from '$lib/i18n';
	import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS } from '$lib/lists';
	import {
		MAX_FLOOR_AREA_SQM,
		MAX_LEASE_COMMENCE_YEAR,
		MIN_FLOOR_AREA_SQM,
		MIN_LEASE_COMMENCE_YEAR,
		type FieldType
	} from '$lib/prediction';

	type FieldName = keyof FieldType;
	import FormSelect, { type FormSelectOption } from '$lib/components/ui/form-select.svelte';
	import Combobox, { type ComboboxOption } from '$lib/components/ui/combobox.svelte';
	import NumberField from '$lib/components/ui/number-field.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Field from '$lib/components/ui/field/index.js';

	type Props = {
		form: FieldType;
		fieldErrors: Record<FieldName, string>;
		loading: boolean;
		onsubmit?: () => void;
		onreset?: () => void;
		onchange?: (patch: Partial<FieldType>) => void;
	};

	let { form, fieldErrors, loading, onsubmit, onreset, onchange }: Props = $props();

	function errorFor(message: string) {
		return message ? [{ message }] : undefined;
	}

	function labeledOptions<T extends string>(
		values: readonly T[],
		group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models',
		language: Language
	): FormSelectOption<T>[] {
		return values.map((value) => ({
			value,
			label: t(`${group}.${value}`, language)
		}));
	}

	function handleChange<K extends keyof FieldType>(key: K, value: FieldType[K]) {
		onchange?.({ [key]: value } as Partial<FieldType>);
	}

	function submitForm(event: SubmitEvent) {
		event.preventDefault();
		onsubmit?.();
	}

	const townComboboxOptions: ComboboxOption[] = $derived(
		TOWNS.map((town) => ({ value: town, label: t(`towns.${town}`, $lang) }))
	);

	const leaseYearOptions = $derived(
		Array.from({ length: MAX_LEASE_COMMENCE_YEAR - MIN_LEASE_COMMENCE_YEAR + 1 }, (_, index) => {
			const year = MIN_LEASE_COMMENCE_YEAR + index;
			return { value: String(year), label: String(year) };
		})
	);
</script>

<form onsubmit={submitForm}>
	<Field.Group class="gap-6">
		<Field.Field>
			<Field.Label for="input-ml_model">{t('ml_model', $lang)}</Field.Label>
			<Field.Content>
				<FormSelect
					id="input-ml_model"
					value={form.ml_model}
					options={labeledOptions(ML_MODELS, 'ml_models', $lang)}
					placeholder={t('select_ml_model', $lang)}
					onchange={(value) => handleChange('ml_model', value as FieldType['ml_model'])}
				/>
			</Field.Content>
			<Field.Error errors={errorFor(fieldErrors.ml_model)} />
		</Field.Field>

		<div class="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
			<Field.Field>
				<Field.Label for="input-town">{t('town', $lang)}</Field.Label>
				<Field.Content>
					<Combobox
						id="input-town"
						value={form.town}
						options={townComboboxOptions}
						placeholder={t('select_town', $lang)}
						ariaLabel={t('town', $lang)}
						onchange={(value) => handleChange('town', value as FieldType['town'])}
					/>
				</Field.Content>
				<Field.Error errors={errorFor(fieldErrors.town)} />
			</Field.Field>

			<Field.Field>
				<Field.Label for="input-storey_range">{t('storey_range', $lang)}</Field.Label>
				<Field.Content>
					<FormSelect
						id="input-storey_range"
						value={form.storey_range}
						options={labeledOptions(STOREY_RANGES, 'storey_ranges', $lang)}
						placeholder={t('select_storey_range', $lang)}
						onchange={(value) => handleChange('storey_range', value as FieldType['storey_range'])}
					/>
				</Field.Content>
				<Field.Error errors={errorFor(fieldErrors.storey_range)} />
			</Field.Field>

			<Field.Field>
				<Field.Label for="input-flat_model">{t('flat_model', $lang)}</Field.Label>
				<Field.Content>
					<FormSelect
						id="input-flat_model"
						value={form.flat_model}
						options={labeledOptions(FLAT_MODELS, 'flat_models', $lang)}
						placeholder={t('select_flat_model', $lang)}
						onchange={(value) => handleChange('flat_model', value as FieldType['flat_model'])}
					/>
				</Field.Content>
				<Field.Error errors={errorFor(fieldErrors.flat_model)} />
			</Field.Field>

			<Field.Field>
				<Field.Label for="input-floor_area">{t('floor_area', $lang)}</Field.Label>
				<Field.Content>
					<NumberField
						id="input-floor_area"
						value={Number.isFinite(form.floor_area_sqm) ? form.floor_area_sqm : ''}
						onchange={(v) => handleChange('floor_area_sqm', v === '' ? Number.NaN : v)}
						min={MIN_FLOOR_AREA_SQM}
						max={MAX_FLOOR_AREA_SQM}
						step={5}
						placeholder={t('enter_floor_area', $lang)}
						unit="m²"
						ariaLabel={t('floor_area', $lang)}
						required
					/>
				</Field.Content>
				<Field.Error errors={errorFor(fieldErrors.floor_area_sqm)} />
			</Field.Field>
		</div>

		<Field.Field>
			<Field.Label for="input-lease_commence_date">{t('lease_commence_date', $lang)}</Field.Label>
			<Field.Content>
				<FormSelect
					id="input-lease_commence_date"
					value={String(form.lease_commence_date)}
					options={leaseYearOptions}
					placeholder={t('select_year', $lang)}
					onchange={(year) => handleChange('lease_commence_date', Number(year))}
				/>
			</Field.Content>
			<Field.Error errors={errorFor(fieldErrors.lease_commence_date)} />
		</Field.Field>

		<div class="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
			<Button
				type="submit"
				size="lg"
				class="w-full tracking-normal normal-case shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:brightness-110"
				disabled={loading}
			>
				{#if loading}
					<Loader2 class="size-4 animate-spin" aria-hidden="true" />
					{t('predicting', $lang)}
				{:else}
					{t('get_prediction', $lang)}
				{/if}
			</Button>
			<Button
				type="button"
				variant="outline"
				size="lg"
				class="w-full tracking-normal normal-case transition-all duration-200 hover:bg-muted/80"
				onclick={() => onreset?.()}
			>
				{t('reset_form', $lang)}
			</Button>
		</div>
	</Field.Group>
</form>
