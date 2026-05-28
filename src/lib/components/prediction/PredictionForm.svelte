<script lang="ts">
	import { onMount } from 'svelte';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	import { getI18nContext } from '$lib/i18n.svelte';
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

	const i18n = getI18nContext();

	let isMac = $state(false);
	onMount(() => {
		const platform =
			'userAgentData' in navigator &&
			navigator.userAgentData &&
			typeof navigator.userAgentData.platform === 'string'
				? navigator.userAgentData.platform
				: navigator.platform;
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

	function handleChange<K extends keyof FieldType>(key: K, value: FieldType[K]) {
		onchange?.({ [key]: value } as Partial<FieldType>);
	}

	function submitForm(event: SubmitEvent) {
		event.preventDefault();
		onsubmit?.();
	}

	const townComboboxOptions: ComboboxOption[] = $derived(
		TOWNS.map((town) => ({ value: town, label: i18n.t(`towns.${town}`) }))
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
			<Field.Label for="input-ml_model">{i18n.t('ml_model')}</Field.Label>
			<Field.Content>
				<FormSelect
					id="input-ml_model"
					value={form.ml_model}
					options={labeledOptions(ML_MODELS, 'ml_models')}
					placeholder={i18n.t('select_ml_model')}
					onchange={(value) => handleChange('ml_model', value as FieldType['ml_model'])}
				/>
			</Field.Content>
			<Field.Error errors={errorFor(fieldErrors.ml_model)} />
		</Field.Field>

		<div class="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
			<Field.Field>
				<Field.Label for="input-town">{i18n.t('town')}</Field.Label>
				<Field.Content>
					<Combobox
						id="input-town"
						value={form.town}
						options={townComboboxOptions}
						placeholder={i18n.t('select_town')}
						ariaLabel={i18n.t('town')}
						onchange={(value) => handleChange('town', value as FieldType['town'])}
					/>
				</Field.Content>
				<Field.Error errors={errorFor(fieldErrors.town)} />
			</Field.Field>

			<Field.Field>
				<Field.Label for="input-storey_range">{i18n.t('storey_range')}</Field.Label>
				<Field.Content>
					<FormSelect
						id="input-storey_range"
						value={form.storey_range}
						options={labeledOptions(STOREY_RANGES, 'storey_ranges')}
						placeholder={i18n.t('select_storey_range')}
						onchange={(value) => handleChange('storey_range', value as FieldType['storey_range'])}
					/>
				</Field.Content>
				<Field.Error errors={errorFor(fieldErrors.storey_range)} />
			</Field.Field>

			<Field.Field>
				<Field.Label for="input-flat_model">{i18n.t('flat_model')}</Field.Label>
				<Field.Content>
					<FormSelect
						id="input-flat_model"
						value={form.flat_model}
						options={labeledOptions(FLAT_MODELS, 'flat_models')}
						placeholder={i18n.t('select_flat_model')}
						onchange={(value) => handleChange('flat_model', value as FieldType['flat_model'])}
					/>
				</Field.Content>
				<Field.Error errors={errorFor(fieldErrors.flat_model)} />
			</Field.Field>

			<Field.Field>
				<Field.Label for="input-floor_area">{i18n.t('floor_area')}</Field.Label>
				<Field.Content>
					<NumberField
						id="input-floor_area"
						value={Number.isFinite(form.floor_area_sqm) ? form.floor_area_sqm : ''}
						onchange={(v) => handleChange('floor_area_sqm', v === '' ? Number.NaN : v)}
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
					value={String(form.lease_commence_date)}
					options={leaseYearOptions}
					placeholder={i18n.t('select_year')}
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
					{i18n.t('predicting')}
				{:else}
					<span class="flex items-center gap-2">
						{i18n.t('get_prediction')}
						<kbd
							class="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-primary-foreground/20 bg-primary-foreground/10 px-1.5 font-sans text-[10px] font-medium opacity-80 sm:flex"
							aria-hidden="true">{isMac ? '⌘' : 'Ctrl'} ↵</kbd
						>
					</span>
				{/if}
			</Button>
			<Button
				type="button"
				variant="outline"
				size="lg"
				class="w-full tracking-normal normal-case transition-all duration-200 hover:bg-muted/80"
				onclick={() => onreset?.()}
			>
				<span class="flex items-center gap-2">
					{i18n.t('reset_form')}
					<kbd
						class="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted/50 px-1.5 font-sans text-[10px] font-medium text-muted-foreground sm:flex"
						aria-hidden="true">Esc</kbd
					>
				</span>
			</Button>
		</div>
	</Field.Group>
</form>
