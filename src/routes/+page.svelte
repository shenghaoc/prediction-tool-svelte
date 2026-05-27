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
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';

	let mounted = $state(false);
	let resultsEl: HTMLDivElement | null = $state(null);
	let liveEl: HTMLDivElement | null = $state(null);
	let announceTimer: ReturnType<typeof setTimeout> | null = null;

	function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
		if (!liveEl) return;
		if (announceTimer) clearTimeout(announceTimer);
		liveEl.setAttribute('aria-live', priority);
		liveEl.textContent = '';
		announceTimer = setTimeout(() => {
			if (liveEl) liveEl.textContent = message;
			announceTimer = null;
		}, 50);
		}, 50);
	}

	const panelCard =
		'relative overflow-hidden border-border/60 shadow-sm ring-1 ring-foreground/5 transition-all duration-300 hover:shadow-md hover:shadow-primary/5';

	const figures = $derived([
		{
			label: $t('stat_models'),
			value: ML_MODELS.length.toString().padStart(2, '0'),
			icon: Layers,
			hint: $t('stat_models_hint')
		},
		{
			label: $t('stat_towns'),
			value: TOWNS.length.toString().padStart(2, '0'),
			icon: MapPin,
			hint: $t('stat_towns_hint')
		},
		{
			label: $t('stat_types'),
			value: FLAT_MODELS.length.toString().padStart(2, '0'),
			icon: Home,
			hint: $t('stat_types_hint')
		}
	]);

	$effect(() => {
		applyDocumentLanguage($lang);
	});

	$effect(() => {
		if (!mounted) return;
		if ($prediction.hasPrediction) {
			resultsEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			setTimeout(() => {
				resultsEl?.focus({ preventScroll: false });
			}, 100);
		}
	});

	onMount(() => {
		const cleanup = prediction.init();
		mounted = true;
		document.documentElement.classList.add('theme-ready');

		const keyHandler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault();
				if (!$prediction.loading) handleSubmit();
			}
			if (
				e.key === 'Escape' &&
				!document.querySelector('[role="listbox"]') &&
				document.activeElement?.closest('form')
			) {
				prediction.reset();
				announce($lang === 'zh' ? '表单已重置' : 'Form reset');
			}
		};
		document.addEventListener('keydown', keyHandler);

		return () => {
			cleanup();
			document.removeEventListener('keydown', keyHandler);
			if (announceTimer) clearTimeout(announceTimer);
		};
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
		announce($lang === 'zh' ? '正在预测…' : 'Loading prediction…', 'assertive');
		await prediction.submit();
		if ($prediction.hasPrediction && !$prediction.errorMessage) {
			toast.success(t('prediction_success', $lang), { id: 'prediction' });
			const price = `$${Math.round($prediction.output).toLocaleString()}`;
			announce(
				$lang === 'zh'
					? `预测完成。预估价格：${price}`
					: `Prediction complete. Estimated price: ${price}`,
				'assertive'
			);
		}
		if ($prediction.errorMessage) {
			toast.error($prediction.errorMessage);
		}
	}
</script>

<svelte:head>
	<title>{$t('page_title')}</title>
	<meta name="description" content={$t('page_description')} />
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
		<!-- Skip navigation -->
		<a
			href="#input-ml_model"
			class="fixed -left-[9999px] top-auto z-[100] h-px w-px overflow-hidden focus:fixed focus:left-4 focus:top-4 focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-primary-foreground focus:no-underline focus:shadow-lg"
		>
			Skip to form
		</a>

		<!-- Live region for screen reader announcements -->
		<div
			bind:this={liveEl}
			role="status"
			aria-live="polite"
			aria-atomic="true"
			class="absolute size-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]"
		></div>

		<div class="mx-auto max-w-7xl">
			<header
				class="animate-fade-in-deep sticky top-0 z-20 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-border/50 bg-background/85 px-6 py-4 backdrop-blur-md max-sm:relative max-sm:mx-0 max-sm:flex-col max-sm:items-start max-sm:px-0"
			>
				<div class="flex items-center gap-2.5">
					<span class="font-heading text-base font-bold tracking-tight">{$t('brand')}</span>
					<Badge variant="secondary" class="gap-1">
						<Sparkles class="size-3" aria-hidden="true" />
						{$t('badge')}
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
						{$t('switch_language')}
					</Button>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="outline"
										size="icon-sm"
										aria-label={$prediction.darkMode
											? $t('switch_to_light_mode')
											: $t('switch_to_dark_mode')}
										onclick={() => prediction.toggleTheme()}
									>
										{#if $prediction.darkMode}
											<Sun class="size-4" />
										{:else}
											<Moon class="size-4" />
										{/if}
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content side="bottom" class="text-xs">
								{$prediction.darkMode
									? $t('switch_to_light_mode')
									: $t('switch_to_dark_mode')}
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
								<h1>{$t('price_prediction')}</h1>
							</Card.Title>
							<Card.Description class="max-w-prose text-base leading-relaxed">
								{$t('intro_blurb')}
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
							<p class="mt-3.5 text-[0.82rem] leading-relaxed text-muted-foreground">
								{t('intro_caption', $lang)}
							</p>
						</Card.Content>
					</Card.Root>

					<Card.Root
						size="sm"
						class={cn(panelCard, 'animate-fade-in-deep border-l-4 border-l-primary/70 py-6')}
					>
						<Card.Header class="px-6 pb-2">
							<Card.Title class="text-primary normal-case">
								<h2>{$t('prediction_form')}</h2>
							</Card.Title>
						</Card.Header>
						<Card.Content class="px-6">
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
								fieldErrors={$prediction.fieldErrors}
								loading={$prediction.loading}
								onsubmit={handleSubmit}
								onreset={() => prediction.reset()}
								onchange={handleFormChange}
							/>
							{#if $prediction.loading}
								<div
									class="progress-track mt-4"
									role="progressbar"
									aria-label={t('predicting', $lang)}
								>
									<div class="progress-bar" style="width: 60%"></div>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>

				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div bind:this={resultsEl} tabindex={-1} class="outline-none" aria-label={t('predicted_price', $lang)}>
					<PredictionResults
						output={$prediction.output}
						hasPrediction={$prediction.hasPrediction}
						summaryValues={$prediction.summaryValues}
						trendData={$prediction.trendData}
						loading={$prediction.loading}
					/>
				</div>
			</div>
		</div>
	</main>
{/if}
