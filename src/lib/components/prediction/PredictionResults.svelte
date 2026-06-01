<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Home from '@lucide/svelte/icons/home';
	import Layers from '@lucide/svelte/icons/layers';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';

	import { getI18nContext } from '$lib/i18n.svelte';
	import { cn } from '$lib/utils.js';
	import type { SummaryValues, TrendPoint } from '$lib/prediction';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import PriceTrendChart from './PriceTrendChart.svelte';
	import ResultsSkeleton from './ResultsSkeleton.svelte';
	import { formatCurrency } from '$lib/format';

	type Props = {
		output: number;
		hasPrediction: boolean;
		summaryValues: SummaryValues;
		trendData: TrendPoint[];
		loading?: boolean;
	};

	let { output, hasPrediction, summaryValues, trendData, loading = false }: Props = $props();

	const i18n = getI18nContext();

	const showSkeleton = $derived(loading && !hasPrediction);

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

	function fmt(n: number) {
		return formatCurrency(n, i18n.lang === 'zh' ? 'zh-SG' : 'en-SG');
	}

	const panelCard =
		'relative overflow-hidden border-base-300/60 shadow-sm ring-1 ring-base-content/5 transition-all duration-300 hover:shadow-md hover:shadow-primary/5';

	const summaryItems = $derived([
		{
			label: i18n.t('ml_model'),
			value: i18n.t(`ml_models.${summaryValues.ml_model}`),
			icon: Layers
		},
		{
			label: i18n.t('town'),
			value: i18n.t(`towns.${summaryValues.town}`),
			icon: MapPin
		},
		{
			label: i18n.t('lease_commence_date'),
			value: String(summaryValues.lease_commence_date),
			icon: Home
		}
	]);

	const deltaPositive = $derived(chartStats.deltaValue >= 0);

	// Hoisted out of the reactive markup so the array isn't re-allocated each render.
	const skeletonHeights = [0.35, 0.55, 0.85, 0.45, 0.7, 0.3];
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
				<Badge variant="secondary" class="mb-2">{i18n.t('predicted_trends')}</Badge>
				<Card.Title class="font-heading text-2xl tracking-tight normal-case">
					<h2 id="prediction-results-heading">{i18n.t('predicted_price')}</h2>
				</Card.Title>
			</div>
			<div
				class={cn(
					'stats relative min-w-[200px] overflow-hidden rounded-xl border transition-all duration-500 max-sm:w-full',
					hasPrediction
						? 'animate-glow border-primary/25 bg-gradient-to-br from-primary/12 via-accent/60 to-base-100'
						: 'border-base-300/60 bg-gradient-to-br from-secondary/40 to-base-100',
					'shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--color-primary-content)_12%,transparent)]'
				)}
				aria-live="polite"
			>
				<div
					class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_55%)]"
					aria-hidden="true"
				></div>
				<div class="stat relative bg-transparent">
					<div
						class="stat-title text-[10px] font-bold tracking-wider text-base-content/70 uppercase"
					>
						{i18n.t('prediction')}
					</div>
					{#if showSkeleton}
						<Skeleton class="animate-shimmer relative mt-2 h-9 w-36 rounded-lg" />
					{:else}
						<div
							class={cn(
								'stat-value font-heading text-3xl font-extrabold tracking-tight tabular-nums transition-all duration-500',
								!hasPrediction && 'text-base font-semibold text-base-content/70',
								hasPrediction && 'animate-settle text-primary'
							)}
						>
							{hasPrediction ? fmt(Math.round(output)) : i18n.t('awaiting')}
						</div>
					{/if}
				</div>
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
							class="animate-fade-in flex items-center gap-3 rounded-xl border border-base-300/60 bg-secondary/40 p-3 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-secondary/60 hover:shadow-sm"
							style={`animation-delay: ${index * 0.08}s; animation-fill-mode: both`}
						>
							<div
								class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15"
								aria-hidden="true"
							>
								<Icon class="size-4 text-primary" />
							</div>
							<div class="min-w-0">
								<p class="text-[10px] font-bold tracking-wider text-base-content/70 uppercase">
									{item.label}
								</p>
								<p class="truncate text-sm font-semibold text-base-content">{item.value}</p>
							</div>
						</div>
					{/each}
				</div>

				{#if hasPrediction}
					<Separator />
					<div class="animate-fade-in" in:fly={{ y: 12, duration: 280 }}>
						<Card.Description class="mb-1 tracking-wider uppercase">
							{i18n.t('predicted_trends')}
						</Card.Description>
						<h3 class="mb-3 font-heading text-sm font-semibold normal-case">
							{i18n.t('chart_story_title')}
						</h3>
						<div class="mb-4 grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
							<div
								class="rounded-xl border border-base-300/60 bg-secondary/40 px-3 py-2.5 backdrop-blur-sm"
							>
								<p class="text-[10px] font-bold tracking-wider text-base-content/70 uppercase">
									{i18n.t('chart_latest')}
								</p>
								<p class="mt-1 text-sm font-semibold tabular-nums">
									{fmt(Math.round(chartStats.latestValue))}
								</p>
							</div>
							<div
								class="rounded-xl border border-base-300/60 bg-secondary/40 px-3 py-2.5 backdrop-blur-sm"
							>
								<p class="text-[10px] font-bold tracking-wider text-base-content/70 uppercase">
									{i18n.t('chart_range')}
								</p>
								<p class="mt-1 text-sm font-semibold tabular-nums">
									{fmt(Math.round(chartStats.lowValue))} – {fmt(Math.round(chartStats.peakValue))}
								</p>
							</div>
							<div
								class="rounded-xl border border-base-300/60 bg-secondary/40 px-3 py-2.5 backdrop-blur-sm"
							>
								<p class="text-[10px] font-bold tracking-wider text-base-content/70 uppercase">
									{i18n.t('chart_delta')}
								</p>
								<p
									class={cn(
										'mt-1 flex items-center gap-1 text-sm font-semibold tabular-nums',
										deltaPositive ? 'text-success' : 'text-warning'
									)}
								>
									{#if deltaPositive}
										<TrendingUp class="size-3.5 shrink-0" aria-hidden="true" />
									{:else}
										<TrendingDown class="size-3.5 shrink-0" aria-hidden="true" />
									{/if}
									{deltaPositive ? '+' : '-'}{fmt(Math.abs(chartStats.deltaValue))}
								</p>
								<p
									class="mt-0.5 text-[9px] font-bold tracking-wider text-base-content/70 uppercase"
								>
									{i18n.t('vs_12m_ago')}
								</p>
							</div>
						</div>
						<div
							class="relative min-h-[260px] overflow-hidden rounded-xl border border-base-300/40 bg-gradient-to-br from-secondary/20 to-secondary/5 p-2"
						>
							{#if loading}
								<Skeleton class="animate-shimmer min-h-[260px] w-full rounded-xl" />
							{:else}
								<div in:fade={{ duration: 240 }}>
									<PriceTrendChart
										data={trendData}
										ariaLabel={`${i18n.t('predicted_trends')}: ${i18n.t('chart_story_title')}`}
										locale={i18n.lang}
									/>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<div
						class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-base-300/70 bg-gradient-to-b from-base-200/30 to-transparent px-4 py-12 text-center"
					>
						<div class="empty-float flex items-end gap-1.5 opacity-40" aria-hidden="true">
							{#each skeletonHeights as height, index (index)}
								<div
									class="w-2.5 rounded-sm bg-primary"
									style={`height: ${height * 48}px; opacity: ${1 - index * 0.08}`}
								></div>
							{/each}
						</div>
						<h3 class="animate-fade-in font-heading text-base font-semibold text-base-content">
							{i18n.t('placeholder_title')}
						</h3>
						<p
							class="animate-fade-in mx-auto max-w-[32ch] text-sm leading-relaxed text-base-content/70"
							style="animation-delay: 0.08s; animation-fill-mode: both"
						>
							{i18n.t('placeholder_body')}
						</p>
					</div>
				{/if}
			{/if}
		</Card.Content>
	</Card.Root>
</section>
