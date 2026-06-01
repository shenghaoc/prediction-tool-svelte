<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, untrack } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import Home from '@lucide/svelte/icons/home';
	import Layers from '@lucide/svelte/icons/layers';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Moon from '@lucide/svelte/icons/moon';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Sun from '@lucide/svelte/icons/sun';

	import { applyDocumentLanguage, type Language } from '$lib/i18n';
	import { getI18nContext } from '$lib/i18n.svelte';
	import { FLAT_MODELS, ML_MODELS, TOWNS } from '$lib/lists';
	import PredictionForm from '$lib/components/prediction/PredictionForm.svelte';
	import PredictionResults from '$lib/components/prediction/PredictionResults.svelte';
	import StatTile from '$lib/components/prediction/StatTile.svelte';
	import { getPredictionContext } from '$lib/stores/prediction.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';
	import { clearPersistedForm, persistForm, readPersistedForm } from '$lib/form-persist';
	import { defaultTrendData } from '$lib/prediction';
	import {
		predictionDefaults,
		predictionSchema,
		type PredictionFormData
	} from '$lib/prediction-schema';
	import type { PredictionActionMessage } from '$lib/prediction-action';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const i18n = getI18nContext();
	const prediction = getPredictionContext();

	const superform = superForm<PredictionFormData>(
		untrack(() => data.form),
		{
			validators: zod4Client(predictionSchema),
			resetForm: false,
			onUpdated({ form }) {
				const actionMessage = form.message as PredictionActionMessage | undefined;
				if (!actionMessage) return;

				if (actionMessage.type === 'success') {
					toast.success(i18n.t('prediction_success'), { id: 'prediction' });
					const price = `$${Math.round(actionMessage.output).toLocaleString()}`;
					announce(`${i18n.t('prediction_complete')}${price}`, 'assertive');
					return;
				}

				toast.error(resolveActionError(actionMessage.text));
			}
		}
	);

	const { form, message, submitting, reset } = superform;

	let mounted = $state(false);
	let resultsEl: HTMLDivElement | null = $state(null);
	let liveMessage = $state('');
	let livePriority = $state<'polite' | 'assertive'>('polite');
	let announceTimer: ReturnType<typeof setTimeout> | null = null;

	const actionMessage = $derived($message as PredictionActionMessage | undefined);
	const hasPrediction = $derived(actionMessage?.type === 'success');
	const trendData = $derived(
		actionMessage?.type === 'success' ? actionMessage.trendData : defaultTrendData()
	);
	const output = $derived(actionMessage?.type === 'success' ? actionMessage.output : 0);
	const summaryValues = $derived<import('$lib/prediction').SummaryValues>({
		ml_model: $form.ml_model,
		town: $form.town,
		lease_commence_date: $form.lease_commence_date
	});
	const errorMessage = $derived(
		actionMessage?.type === 'error' ? resolveActionError(actionMessage.text) : ''
	);
	const loading = $derived($submitting);

	function resolveActionError(text: string) {
		const translated = i18n.t(text);
		if (translated !== text) return translated;
		return text;
	}

	function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
		if (announceTimer) clearTimeout(announceTimer);
		livePriority = priority;
		liveMessage = '';
		announceTimer = setTimeout(() => {
			liveMessage = message;
			announceTimer = null;
		}, 50);
	}

	const panelCard =
		'relative overflow-hidden border-base-300/60 shadow-sm ring-1 ring-base-content/5 transition-all duration-300 hover:shadow-md hover:shadow-primary/5';

	const figures = $derived([
		{
			label: i18n.t('stat_models'),
			value: ML_MODELS.length.toString().padStart(2, '0'),
			icon: Layers,
			hint: i18n.t('stat_models_hint')
		},
		{
			label: i18n.t('stat_towns'),
			value: TOWNS.length.toString().padStart(2, '0'),
			icon: MapPin,
			hint: i18n.t('stat_towns_hint')
		},
		{
			label: i18n.t('stat_types'),
			value: FLAT_MODELS.length.toString().padStart(2, '0'),
			icon: Home,
			hint: i18n.t('stat_types_hint')
		}
	]);

	$effect(() => {
		applyDocumentLanguage(i18n.lang);
	});

	$effect(() => {
		if (!mounted || !browser) return;
		persistForm($form);
	});

	$effect(() => {
		if (!mounted) return;
		if (hasPrediction) {
			resultsEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			setTimeout(() => {
				resultsEl?.focus({ preventScroll: true });
			}, 100);
		}
	});

	onMount(() => {
		prediction.init();
		const saved = readPersistedForm();
		if (saved) {
			$form = saved;
		}
		mounted = true;
		document.documentElement.classList.add('theme-ready');

		return () => {
			if (announceTimer) clearTimeout(announceTimer);
		};
	});

	function resetForm() {
		if (loading) return;
		reset({ data: { ...predictionDefaults } });
		clearPersistedForm();
		toast.success(i18n.t('form_reset'), { id: 'prediction-reset' });
		announce(i18n.t('form_reset'));
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			if (!loading) {
				announce(i18n.t('predicting'), 'assertive');
				(document.getElementById('prediction-form') as HTMLFormElement | null)?.requestSubmit();
			}
		}
		if (e.key === 'Escape' && document.activeElement?.closest?.('form')) {
			resetForm();
		}
	}

	function toggleLang() {
		const next: Language = i18n.lang === 'en' ? 'zh' : 'en';
		i18n.setLanguage(next);
	}
</script>

<svelte:head>
	<title>{i18n.t('page_title')}</title>
	<meta name="description" content={i18n.t('page_description')} />
</svelte:head>

<svelte:document onkeydown={handleKeydown} />

{#if !mounted}
	<main class="min-h-screen px-6 pt-5 pb-12" aria-busy="true">
		<div class="mx-auto max-w-7xl space-y-5">
			<Skeleton class="animate-shimmer h-10 w-full max-w-md rounded-xl" />
			<div class="grid grid-cols-2 gap-5 max-[860px]:grid-cols-1">
				<Skeleton class="animate-shimmer h-64 rounded-xl" />
				<Skeleton class="animate-shimmer h-96 rounded-xl" />
			</div>
		</div>
	</main>
{:else}
	<main class="min-h-screen px-6 pt-5 pb-12 max-sm:px-3 max-sm:pb-8">
		<a
			href="#input-ml_model"
			class="fixed -left-[9999px] top-auto z-[100] h-px w-px overflow-hidden focus:fixed focus:left-4 focus:top-4 focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-primary-content focus:no-underline focus:shadow-lg"
		>
			Skip to form
		</a>

		<div
			role="status"
			aria-live={livePriority}
			aria-atomic="true"
			class="absolute size-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]"
		>
			{liveMessage}
		</div>

		<div class="mx-auto max-w-7xl">
			<header
				class="animate-fade-in-deep sticky top-0 z-20 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-base-300/50 bg-base-100/85 px-6 py-4 backdrop-blur-md max-sm:relative max-sm:mx-0 max-sm:flex-col max-sm:items-start max-sm:px-0"
			>
				<div class="flex items-center gap-2.5">
					<span class="font-heading text-base font-bold tracking-tight">{i18n.t('brand')}</span>
					<Badge variant="secondary" class="gap-1">
						<Sparkles class="size-3" aria-hidden="true" />
						{i18n.t('badge')}
					</Badge>
				</div>

				<div class="flex items-center gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
					<Button
						type="button"
						variant="outline"
						size="sm"
						class="tracking-normal normal-case max-sm:flex-1"
						onclick={toggleLang}
					>
						{i18n.t('switch_language')}
					</Button>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<label
										{...props}
										class="swap swap-rotate btn btn-outline btn-sm btn-square"
										aria-label={prediction.darkMode
											? i18n.t('switch_to_light_mode')
											: i18n.t('switch_to_dark_mode')}
									>
										<input
											type="checkbox"
											class="theme-controller"
											value="dark"
											checked={prediction.darkMode}
											onchange={() => prediction.toggleTheme()}
										/>
										<Sun class="swap-on size-4" />
										<Moon class="swap-off size-4" />
									</label>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content side="bottom" class="text-xs">
								{prediction.darkMode
									? i18n.t('switch_to_light_mode')
									: i18n.t('switch_to_dark_mode')}
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
			</header>

			<div
				class="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-start gap-5 max-[860px]:grid-cols-1"
			>
				<div class="flex flex-col gap-5">
					<Card.Root
						size="sm"
						class={cn(panelCard, 'animate-fade-in-deep border-l-4 border-l-primary/70 py-6')}
					>
						<div
							class="pointer-events-none absolute -top-16 -right-20 size-56 rounded-full bg-primary/15 blur-3xl"
							aria-hidden="true"
						></div>
						<div
							class="pointer-events-none absolute -bottom-20 -left-16 size-48 rounded-full bg-accent/15 blur-3xl"
							aria-hidden="true"
						></div>
						<Card.Header class="relative px-6 pb-0">
							<Card.Title
								class={cn(
									'font-heading text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight whitespace-pre-line normal-case',
									i18n.lang === 'zh' && 'font-cjk font-extrabold'
								)}
							>
								<h1>{i18n.t('price_prediction')}</h1>
							</Card.Title>
							<Card.Description class="max-w-prose text-base leading-relaxed">
								{i18n.t('intro_blurb')}
							</Card.Description>
						</Card.Header>
						<Card.Content class="relative px-6 pt-4">
							<Tooltip.Provider>
								<div class="animate-stagger grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
									{#each figures as figure (figure.label)}
										<StatTile
											icon={figure.icon}
											label={figure.label}
											value={figure.value}
											hint={figure.hint}
										/>
									{/each}
								</div>
							</Tooltip.Provider>
							<p class="mt-3.5 text-[0.82rem] leading-relaxed text-base-content/70">
								{i18n.t('intro_caption')}
							</p>
						</Card.Content>
					</Card.Root>

					<Card.Root
						size="sm"
						class={cn(panelCard, 'animate-fade-in-deep border-l-4 border-l-primary/70 py-6')}
					>
						<Card.Header class="px-6 pb-2">
							<Card.Title class="text-primary normal-case">
								<h2>{i18n.t('prediction_form')}</h2>
							</Card.Title>
						</Card.Header>
						<Card.Content class="px-6">
							{#if errorMessage && !loading}
								<div
									role="alert"
									class="alert alert-error alert-soft mb-4"
									transition:fade={{ duration: 200 }}
								>
									{errorMessage}
								</div>
							{/if}
							<PredictionForm {superform} {loading} onreset={resetForm} />
							{#if loading}
								<progress
									class="progress progress-primary mt-4 w-full"
									aria-label={i18n.t('predicting')}
									transition:fade
								></progress>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>

				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					bind:this={resultsEl}
					tabindex={-1}
					class="outline-none"
					aria-label={i18n.t('predicted_price')}
				>
					{#if hasPrediction}
						<div in:fly={{ y: 16, duration: 320 }}>
							<PredictionResults {output} {hasPrediction} {summaryValues} {trendData} {loading} />
						</div>
					{:else}
						<div in:fade={{ duration: 200 }}>
							<PredictionResults {output} {hasPrediction} {summaryValues} {trendData} {loading} />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</main>
{/if}
