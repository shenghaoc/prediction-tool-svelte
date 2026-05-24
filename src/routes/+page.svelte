<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Home from '@lucide/svelte/icons/home';
	import Layers from '@lucide/svelte/icons/layers';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Moon from '@lucide/svelte/icons/moon';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Sun from '@lucide/svelte/icons/sun';

	import { applyDocumentLanguage, lang, persistLanguage, t, type Language } from '$lib/i18n';
	import { FLAT_MODELS, ML_MODELS, TOWNS } from '$lib/lists';
	import type { FieldType } from '$lib/prediction';
	import PredictionForm from '$lib/components/prediction/PredictionForm.svelte';
	import PredictionResults from '$lib/components/prediction/PredictionResults.svelte';
	import StatTile from '$lib/components/prediction/StatTile.svelte';
	import { prediction } from '$lib/stores/prediction';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';

	let mounted = $state(false);
	let resultsEl: HTMLDivElement | null = $state(null);

	const panelCard =
		'relative overflow-hidden border-border/60 shadow-sm ring-1 ring-foreground/5 transition-all duration-300 hover:shadow-md hover:shadow-primary/5';

	const figures = $derived([
		{
			label: t('stat_models', $lang),
			value: ML_MODELS.length.toString().padStart(2, '0'),
			icon: Layers,
			hint: t('stat_models_hint', $lang)
		},
		{
			label: t('stat_towns', $lang),
			value: TOWNS.length.toString().padStart(2, '0'),
			icon: MapPin,
			hint: t('stat_towns_hint', $lang)
		},
		{
			label: t('stat_types', $lang),
			value: FLAT_MODELS.length.toString().padStart(2, '0'),
			icon: Home,
			hint: t('stat_types_hint', $lang)
		}
	]);

	$effect(() => {
		applyDocumentLanguage($lang);
	});

	$effect(() => {
		if (!mounted) return;
		if ($prediction.output > 0) {
			resultsEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	});

	onMount(() => {
		const cleanup = prediction.init();
		mounted = true;
		document.documentElement.classList.add('theme-ready');
		return cleanup;
	});

	function toggleLang() {
		const next: Language = $lang === 'en' ? 'zh' : 'en';
		lang.set(next);
		persistLanguage(next);
	}

	function handleFormChange(patch: Partial<FieldType>) {
		for (const key of Object.keys(patch) as (keyof FieldType)[]) {
			const value = patch[key];
			if (value !== undefined) {
				prediction.updateField(key, value);
			}
		}
	}

	async function handleSubmit() {
		const hadPrediction = $prediction.hasPrediction;
		await prediction.submit();
		if ($prediction.hasPrediction && !$prediction.errorMessage && !hadPrediction) {
			toast.success(t('prediction_success', $lang), { id: 'prediction' });
		}
		if ($prediction.errorMessage) {
			toast.error($prediction.errorMessage);
		}
	}
</script>

<svelte:head>
	<title>{t('page_title', $lang)}</title>
	<meta name="description" content={t('page_description', $lang)} />
</svelte:head>

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
		<div class="mx-auto max-w-7xl">
			<header
				class="animate-fade-in-deep sticky top-0 z-20 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-border/50 bg-background/85 px-6 py-4 backdrop-blur-md max-sm:relative max-sm:mx-0 max-sm:flex-col max-sm:items-start max-sm:px-0"
			>
				<div class="flex items-center gap-2.5">
					<span class="font-heading text-base font-bold tracking-tight">{t('brand', $lang)}</span>
					<Badge variant="secondary" class="gap-1">
						<Sparkles class="size-3" aria-hidden="true" />
						{t('badge', $lang)}
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
						{t('switch_language', $lang)}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						aria-label={$prediction.darkMode
							? t('switch_to_light_mode', $lang)
							: t('switch_to_dark_mode', $lang)}
						onclick={() => prediction.toggleTheme()}
					>
						{#if $prediction.darkMode}
							<Sun class="size-4" />
						{:else}
							<Moon class="size-4" />
						{/if}
					</Button>
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
							class="pointer-events-none absolute -bottom-20 -left-16 size-48 rounded-full bg-chart-2/15 blur-3xl"
							aria-hidden="true"
						></div>
						<Card.Header class="relative px-6 pb-0">
							<Card.Title
								class={cn(
									'font-heading text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight whitespace-pre-line normal-case',
									$lang === 'zh' && 'font-cjk font-extrabold'
								)}
							>
								<h1>{t('price_prediction', $lang)}</h1>
							</Card.Title>
							<Card.Description class="max-w-prose text-base leading-relaxed">
								{t('intro_blurb', $lang)}
							</Card.Description>
						</Card.Header>
						<Card.Content class="relative px-6 pt-4">
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
						</Card.Content>
					</Card.Root>

					<Card.Root
						size="sm"
						class={cn(panelCard, 'animate-fade-in-deep border-l-4 border-l-primary/70 py-6')}
					>
						<Card.Header class="px-6 pb-2">
							<Card.Title class="text-primary normal-case">
								<h2>{t('prediction_form', $lang)}</h2>
							</Card.Title>
						</Card.Header>
						<Card.Content class="px-6">
							{#if $prediction.loading}
								<div
									class="progress-track mb-4"
									role="progressbar"
									aria-label={t('predicting', $lang)}
								>
									<div class="progress-bar" style="width: 60%"></div>
								</div>
							{/if}
							{#if $prediction.errorMessage && !$prediction.loading}
								<div
									class="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
									role="alert"
								>
									{$prediction.errorMessage}
								</div>
							{/if}
							<PredictionForm
								form={$prediction.form}
								loading={$prediction.loading}
								onsubmit={handleSubmit}
								onreset={() => prediction.reset()}
								onchange={handleFormChange}
							/>
						</Card.Content>
					</Card.Root>
				</div>

				<div bind:this={resultsEl}>
					<PredictionResults
						output={$prediction.output}
						summaryValues={$prediction.summaryValues}
						trendData={$prediction.trendData}
						loading={$prediction.loading}
					/>
				</div>
			</div>
		</div>
	</main>
{/if}
