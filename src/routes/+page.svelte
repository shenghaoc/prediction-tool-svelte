<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, untrack } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import Moon from '@lucide/svelte/icons/moon';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Sun from '@lucide/svelte/icons/sun';

	import { applyDocumentLanguage, type Language } from '$lib/i18n';
	import { getI18nContext } from '$lib/i18n.svelte';
	import PredictionForm from '$lib/components/prediction/PredictionForm.svelte';
	import PredictionResults from '$lib/components/prediction/PredictionResults.svelte';
	import { getPredictionContext } from '$lib/stores/prediction.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
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
			<div class="skeleton h-10 w-full max-w-md"></div>
			<div class="grid grid-cols-2 gap-5 max-[860px]:grid-cols-1">
				<div class="skeleton h-64"></div>
				<div class="skeleton h-96"></div>
			</div>
		</div>
	</main>
{:else}
	<main class="min-h-screen pb-12 max-sm:pb-8">
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

		<div class="navbar bg-base-100 shadow-sm sticky top-0 z-20 min-h-0 px-2 sm:px-4">
			<div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-2">
				<div class="flex min-w-0 items-center gap-2">
					<span class="truncate text-sm font-bold tracking-tight sm:text-base">
						{i18n.t('brand')}
					</span>
					<span class="badge badge-secondary badge-sm gap-1 max-[420px]:hidden">
						<Sparkles class="size-3" aria-hidden="true" />
						{i18n.t('badge')}
					</span>
				</div>
				<div class="flex shrink-0 items-center gap-1">
					<button
						type="button"
						class="btn btn-ghost btn-sm max-sm:btn-xs normal-case"
						onclick={toggleLang}
						aria-label={i18n.t('switch_language')}
					>
						<span class="max-sm:hidden">{i18n.t('switch_language')}</span>
						<span class="sm:hidden">{i18n.lang === 'en' ? '中' : 'EN'}</span>
					</button>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<label
									{...props}
									class="swap swap-rotate btn btn-ghost btn-sm max-sm:btn-xs btn-square"
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
							{prediction.darkMode ? i18n.t('switch_to_light_mode') : i18n.t('switch_to_dark_mode')}
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
			</div>
		</div>

		<div class="mx-auto max-w-7xl px-3 pt-4 sm:px-6 sm:pt-6">
			<div
				class="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-start gap-5 max-[860px]:grid-cols-1"
			>
				<div class="flex flex-col gap-5">
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h1
								class="card-title text-2xl tracking-tight whitespace-pre-line sm:text-3xl"
								class:font-serif={i18n.lang === 'zh'}
							>
								{i18n.t('price_prediction')}
							</h1>
							<p class="text-base-content/70">{i18n.t('intro_blurb')}</p>
							<p class="text-sm text-base-content/60">{i18n.t('intro_caption')}</p>
						</div>
					</div>

					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="card-title">{i18n.t('prediction_form')}</h2>
							{#if errorMessage && !loading}
								<div
									role="alert"
									class="alert alert-error alert-soft"
									transition:fade={{ duration: 200 }}
								>
									{errorMessage}
								</div>
							{/if}
							<PredictionForm {superform} {loading} onreset={resetForm} />
							{#if loading}
								<progress
									class="progress progress-primary w-full"
									aria-label={i18n.t('predicting')}
									transition:fade
								></progress>
							{/if}
						</div>
					</div>
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
