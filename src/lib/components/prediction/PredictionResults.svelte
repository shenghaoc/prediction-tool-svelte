<script lang="ts">
	import { scale } from 'svelte/transition';
	import { lang, t, type Language } from '$lib/i18n';
	import { formatCurrency } from '$lib/format';
	import { type PredictionTheme, type SummaryValues, type TrendPoint } from '$lib/prediction';
	import PriceTrendChart from './PriceTrendChart.svelte';
	import StatCard from './StatCard.svelte';

	export let output: number;
	export let loading: boolean;
	export let summaryValues: SummaryValues;
	export let trendData: TrendPoint[];
	export let theme: PredictionTheme;
	export let isMobile: boolean;

	$: latestValue = trendData[trendData.length - 1]?.value ?? 0;
	$: firstValue = trendData[0]?.value ?? 0;
	$: peakValue = Math.max(...trendData.map((point) => point.value), 0);
	$: lowValue = trendData.reduce(
		(currentLowest, point) =>
			point.value > 0 ? Math.min(currentLowest, point.value) : currentLowest,
		Number.POSITIVE_INFINITY
	);
	$: deltaValue = latestValue - firstValue;
	$: normalizedLowValue = Number.isFinite(lowValue) ? lowValue : 0;

	function optionLabel(
		group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models',
		value: string,
		language: Language
	) {
		return t(`${group}.${value}`, language);
	}
</script>

<section class="prediction-results-card">
	<div class="prediction-results-header">
		<div>
			<span class="prediction-results-label">{t('predicted_trends', $lang)}</span>
			<h2 class="prediction-results-title">{t('predicted_price', $lang)}</h2>
		</div>
		<div
			class:prediction-pulse={loading}
			class="prediction-price-panel"
			aria-live="polite"
			aria-busy={loading}
		>
			<span class="prediction-results-label">{t('prediction', $lang)}</span>
			{#key output}
				<strong transition:scale={{ duration: 180, start: 0.92 }}>{formatCurrency(output)}</strong>
			{/key}
		</div>
	</div>

	<div class="prediction-results-grid">
		<StatCard
			variant="metric"
			label={t('ml_model', $lang)}
			value={optionLabel('ml_models', summaryValues.ml_model, $lang)}
		/>
		<StatCard
			variant="metric"
			label={t('town', $lang)}
			value={optionLabel('towns', summaryValues.town, $lang)}
		/>
		<StatCard
			variant="metric"
			label={t('lease_commence_date', $lang)}
			value={String(summaryValues.lease_commence_date)}
		/>
	</div>

	<div class="prediction-chart-shell">
		<div class="prediction-chart-header">
			<div class="prediction-chart-copy">
				<span class="prediction-chart-kicker">{t('predicted_trends', $lang)}</span>
				<h3 class="prediction-chart-title">{t('chart_story_title', $lang)}</h3>
			</div>

			<div class="prediction-chart-summary-grid">
				<StatCard
					variant="summary"
					label={t('chart_latest', $lang)}
					value={`$${latestValue.toLocaleString()}`}
				/>
				<StatCard
					variant="summary"
					label={t('chart_range', $lang)}
					value={`$${normalizedLowValue.toLocaleString()} - $${peakValue.toLocaleString()}`}
				/>
				<StatCard
					variant="summary"
					label={t('chart_delta', $lang)}
					value={`${deltaValue >= 0 ? '+' : '-'}$${Math.abs(deltaValue).toLocaleString()}`}
					note={t('vs_12m_ago', $lang)}
				/>
			</div>
		</div>

		<PriceTrendChart
			data={trendData}
			ariaLabel={`${t('predicted_trends', $lang)}: ${t('chart_story_title', $lang)}`}
			{theme}
			{isMobile}
		/>
	</div>
</section>
