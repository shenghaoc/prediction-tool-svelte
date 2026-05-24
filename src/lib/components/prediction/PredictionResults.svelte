<script lang="ts">
	import Home from '@lucide/svelte/icons/home';
	import Layers from '@lucide/svelte/icons/layers';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';

	import { lang, t, type Language } from '$lib/i18n';
	import { cn } from '$lib/utils.js';
	import type { SummaryValues, TrendPoint } from '$lib/prediction';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import PriceTrendChart from './PriceTrendChart.svelte';
	import ResultsSkeleton from './ResultsSkeleton.svelte';

	type Props = {
		output: number;
		summaryValues: SummaryValues;
		trendData: TrendPoint[];
		loading?: boolean;
	};

	let { output, summaryValues, trendData, loading = false }: Props = $props();

	const hasOutput = $derived(output > 0);
	const showSkeleton = $derived(loading && !hasOutput);

	const chartStats = $derived.by(() => {
		const latestValue = trendData[trendData.length - 1]?.value ?? 0;
		const firstValue = trendData[0]?.value ?? 0;
		const peakValue = Math.max(...trendData.map((point) => point.value), 0);
		const lowValue = trendData.reduce(
			(currentLowest, point) =>
				point.value > 0 ? Math.min(currentLowest, point.value) : currentLowest,
			Number.POSITIVE_INFINITY
		);
		return {
			latestValue,
			peakValue,
			lowValue: Number.isFinite(lowValue) ? lowValue : 0,
			deltaValue: latestValue - firstValue
		};
	});

	const fmt = $derived(
		new Intl.NumberFormat($lang === 'zh' ? 'zh-SG' : 'en-SG', {
			style: 'currency',
			currency: 'SGD',
			maximumFractionDigits: 0
		})
	);

	function optionLabel(
		group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models',
		value: string,
		language: Language
	) {
		return t(`${group}.${value}`, language);
	}

	const panelCard =
		'relative overflow-hidden border-border/60 shadow-sm ring-1 ring-foreground/5 transition-all duration-300 hover:shadow-md hover:shadow-primary/5';

	const summaryItems = $derived([
		{
			label: t('ml_model', $lang),
			value: optionLabel('ml_models', summaryValues.ml_model, $lang),
			icon: Layers
		},
		{
			label: t('town', $lang),
			value: optionLabel('towns', summaryValues.town, $lang),
			icon: MapPin
		},
		{
			label: t('lease_commence_date', $lang),
			value: String(summaryValues.lease_commence_date),
			icon: Home
		}
	]);

	const deltaPositive = $derived(chartStats.deltaValue >= 0);
</script>

<section aria-labelledby="prediction-results-heading" aria-busy={loading}>
	<Card.Root
		size="sm"
		class={cn(panelCard, 'animate-fade-in-deep border-l-4 border-l-primary/70 py-6')}
	>
		<div
			class="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl"
			aria-hidden="true"
		></div>
		<Card.Header
			class="relative flex flex-row items-start justify-between gap-4 px-6 pb-2 max-sm:flex-col"
		>
			<div>
				<Badge variant="secondary" class="mb-2">{t('predicted_trends', $lang)}</Badge>
				<Card.Title class="font-heading text-2xl tracking-tight normal-case">
					<h2 id="prediction-results-heading">{t('predicted_price', $lang)}</h2>
				</Card.Title>
			</div>
			<div
				class={cn(
					'relative min-w-[200px] overflow-hidden rounded-xl border px-5 py-4 transition-all duration-500 max-sm:w-full',
					hasOutput
						? 'animate-glow border-primary/25 bg-gradient-to-br from-primary/12 via-accent/60 to-card'
						: 'border-border/60 bg-gradient-to-br from-secondary/40 to-card',
					'shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--primary-foreground)_12%,transparent)]'
				)}
				aria-live="polite"
			>
				<div
					class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_55%)]"
					aria-hidden="true"
				></div>
				<p class="relative text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
					{t('prediction', $lang)}
				</p>
				{#if showSkeleton}
					<Skeleton class="animate-shimmer relative mt-2 h-9 w-36 rounded-lg" />
				{:else}
					<p
						class={cn(
							'relative mt-1 font-heading text-3xl font-extrabold tracking-tight tabular-nums transition-all duration-500',
							!hasOutput && 'text-base font-semibold text-muted-foreground',
							hasOutput && 'animate-settle text-primary'
						)}
					>
						{hasOutput ? fmt.format(Math.round(output)) : t('awaiting', $lang)}
					</p>
				{/if}
			</div>
		</Card.Header>

		<Card.Content class="relative flex flex-col gap-5 px-6">
			{#if showSkeleton}
				<ResultsSkeleton />
			{:else}
				<div class="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
					{#each summaryItems as item, index (item.label)}
						{@const Icon = item.icon}
						<div
							class="animate-fade-in flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 p-3 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-secondary/60 hover:shadow-sm"
							style={`animation-delay: ${index * 0.08}s; animation-fill-mode: both`}
						>
							<div
								class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15"
								aria-hidden="true"
							>
								<Icon class="size-4 text-primary" />
							</div>
							<div class="min-w-0">
								<p class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
									{item.label}
								</p>
								<p class="truncate text-sm font-semibold text-foreground">{item.value}</p>
							</div>
						</div>
					{/each}
				</div>

				{#if hasOutput}
					<Separator />
					<div class="animate-fade-in">
						<Card.Description class="mb-1 tracking-wider uppercase">
							{t('predicted_trends', $lang)}
						</Card.Description>
						<h3 class="mb-3 font-heading text-sm font-semibold normal-case">
							{t('chart_story_title', $lang)}
						</h3>
						<div class="mb-4 grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
							<div
								class="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 backdrop-blur-sm"
							>
								<p class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
									{t('chart_latest', $lang)}
								</p>
								<p class="mt-1 text-sm font-semibold tabular-nums">
									{fmt.format(Math.round(chartStats.latestValue))}
								</p>
							</div>
							<div
								class="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 backdrop-blur-sm"
							>
								<p class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
									{t('chart_range', $lang)}
								</p>
								<p class="mt-1 text-sm font-semibold tabular-nums">
									{fmt.format(Math.round(chartStats.lowValue))} – {fmt.format(
										Math.round(chartStats.peakValue)
									)}
								</p>
							</div>
							<div
								class="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 backdrop-blur-sm"
							>
								<p class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
									{t('chart_delta', $lang)}
								</p>
								<p
									class={cn(
										'mt-1 flex items-center gap-1 text-sm font-semibold tabular-nums',
										deltaPositive
											? 'text-emerald-600 dark:text-emerald-400'
											: 'text-amber-700 dark:text-amber-400'
									)}
								>
									{#if deltaPositive}
										<TrendingUp class="size-3.5 shrink-0" aria-hidden="true" />
									{:else}
										<TrendingDown class="size-3.5 shrink-0" aria-hidden="true" />
									{/if}
									{deltaPositive ? '+' : '-'}{fmt.format(Math.abs(chartStats.deltaValue))}
								</p>
								<p
									class="mt-0.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase"
								>
									{t('vs_12m_ago', $lang)}
								</p>
							</div>
						</div>
						<div
							class="relative min-h-[260px] overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-secondary/20 to-secondary/5 p-2"
						>
							{#if loading}
								<Skeleton class="animate-shimmer min-h-[260px] w-full rounded-xl" />
							{:else}
								<PriceTrendChart
									data={trendData}
									ariaLabel={`${t('predicted_trends', $lang)}: ${t('chart_story_title', $lang)}`}
									locale={$lang}
								/>
							{/if}
						</div>
					</div>
				{:else}
					<div
						class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/70 bg-gradient-to-b from-muted/30 to-transparent px-4 py-12 text-center"
					>
						<div class="empty-float flex items-end gap-1.5 opacity-40" aria-hidden="true">
							{#each [0.35, 0.55, 0.85, 0.45, 0.7, 0.3] as height, index (index)}
								<div
									class="w-2.5 rounded-sm bg-primary"
									style={`height: ${height * 48}px; opacity: ${1 - index * 0.08}`}
								></div>
							{/each}
						</div>
						<h3 class="animate-fade-in font-heading text-base font-semibold text-foreground">
							{t('placeholder_title', $lang)}
						</h3>
						<p
							class="animate-fade-in mx-auto max-w-[32ch] text-sm leading-relaxed text-muted-foreground"
							style="animation-delay: 0.08s; animation-fill-mode: both"
						>
							{t('placeholder_body', $lang)}
						</p>
					</div>
				{/if}
			{/if}
		</Card.Content>
	</Card.Root>
</section>
