<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import DollarSign from '@lucide/svelte/icons/dollar-sign';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	import { getI18nContext } from '$lib/i18n.svelte';
	import type { SummaryValues, TrendPoint } from '$lib/prediction';
	import PriceTrendChart from './PriceTrendChart.svelte';
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

	const deltaPositive = $derived(chartStats.deltaValue >= 0);
</script>

<section aria-labelledby="prediction-results-heading" aria-busy={loading}>
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body gap-5">
			<h2 id="prediction-results-heading" class="card-title text-2xl">
				{i18n.t('predicted_price')}
			</h2>

			<div class="stats bg-base-200 shadow w-full">
				<div class="stat">
					<div class="stat-figure text-primary/40">
						<DollarSign class="size-8" aria-hidden="true" />
					</div>
					<div class="stat-title">{i18n.t('prediction')}</div>
					{#if showSkeleton}
						<div class="skeleton h-10 w-40 mt-1"></div>
					{:else if hasPrediction}
						<div class="stat-value text-primary text-2xl tabular-nums sm:text-3xl lg:text-4xl">
							{fmt(Math.round(output))}
						</div>
						<div class="stat-desc">{i18n.t(`ml_models.${summaryValues.ml_model}`)}</div>
					{:else}
						<div class="stat-value text-xl text-base-content/40 sm:text-2xl">
							{i18n.t('awaiting')}
						</div>
					{/if}
				</div>
			</div>

			<div class="stats stats-vertical sm:stats-horizontal bg-base-200 shadow w-full">
				<div class="stat">
					<div class="stat-title">{i18n.t('ml_model')}</div>
					<div class="stat-value break-words text-sm font-semibold">
						{i18n.t(`ml_models.${summaryValues.ml_model}`)}
					</div>
				</div>
				<div class="stat">
					<div class="stat-title">{i18n.t('town')}</div>
					<div class="stat-value break-words text-sm font-semibold">
						{i18n.t(`towns.${summaryValues.town}`)}
					</div>
				</div>
				<div class="stat">
					<div class="stat-title">{i18n.t('lease_commence_date')}</div>
					<div class="stat-value text-sm font-semibold tabular-nums">
						{summaryValues.lease_commence_date}
					</div>
				</div>
			</div>

			{#if hasPrediction}
				<div class="divider my-0"></div>
				<div in:fly={{ y: 12, duration: 280 }}>
					<h3 class="mb-3 text-sm font-semibold">{i18n.t('chart_story_title')}</h3>

					<div class="stats stats-vertical sm:stats-horizontal bg-base-200 shadow w-full mb-4">
						<div class="stat">
							<div class="stat-title">{i18n.t('chart_latest')}</div>
							<div class="stat-value text-base tabular-nums">
								{fmt(Math.round(chartStats.latestValue))}
							</div>
						</div>
						<div class="stat">
							<div class="stat-title">{i18n.t('chart_range')}</div>
							<div class="stat-value flex flex-col gap-0.5 text-base tabular-nums">
								<span>{fmt(Math.round(chartStats.lowValue))}</span>
								<span class="text-base-content/50">–</span>
								<span>{fmt(Math.round(chartStats.peakValue))}</span>
							</div>
						</div>
						<div class="stat">
							<div class="stat-title">{i18n.t('chart_delta')}</div>
							<div
								class="stat-value text-base tabular-nums {deltaPositive
									? 'text-success'
									: 'text-warning'}"
							>
								{deltaPositive ? '+' : '-'}{fmt(Math.abs(chartStats.deltaValue))}
							</div>
							<div class="stat-desc">{i18n.t('vs_12m_ago')}</div>
						</div>
					</div>

					<div class="rounded-box bg-base-200 p-3">
						{#if loading}
							<div class="skeleton w-full" style="min-height: 260px"></div>
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
				<div class="hero bg-base-200 rounded-box py-12">
					<div class="hero-content text-center">
						<div class="max-w-md">
							<Sparkles class="size-10 text-primary/70 mx-auto mb-3" aria-hidden="true" />
							<h3 class="text-base font-semibold">{i18n.t('placeholder_title')}</h3>
							<p class="text-sm text-base-content/70 mt-2">{i18n.t('placeholder_body')}</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
