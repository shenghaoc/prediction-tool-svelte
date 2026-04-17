<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import {
		predictionMonth,
		type PredictionTheme,
		type SummaryValues,
		type TrendPoint
	} from '$lib/prediction';
	import PriceTrendChart from './PriceTrendChart.svelte';

	export let output: number;
	export let loading: boolean;
	export let summaryValues: SummaryValues;
	export let trendData: TrendPoint[];
	export let theme: PredictionTheme;
	export let isMobile: boolean;
	export let optionLabel: (
		group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models',
		value: string
	) => string;
	export let translate: (key: string) => string;

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
</script>

<section class="prediction-results-card">
	<div class="prediction-results-header">
		<div>
			<span class="prediction-results-label">{translate('predicted_trends')}</span>
			<h2 class="prediction-results-title">{translate('predicted_price')}</h2>
		</div>
		<div class:prediction-pulse={loading} class="prediction-price-panel">
			<span class="prediction-results-label">{translate('prediction')}</span>
			<strong>{formatCurrency(output)}</strong>
		</div>
	</div>

	<div class="prediction-results-grid">
		<div class="prediction-metric-card">
			<span>{translate('ml_model')}</span>
			<strong>{optionLabel('ml_models', summaryValues.ml_model)}</strong>
		</div>
		<div class="prediction-metric-card">
			<span>{translate('town')}</span>
			<strong>{optionLabel('towns', summaryValues.town)}</strong>
		</div>
		<div class="prediction-metric-card">
			<span>{translate('lease_commence_date')}</span>
			<strong>{summaryValues.lease_commence_date}</strong>
		</div>
	</div>

	<div class="prediction-chart-shell">
		<div class="prediction-chart-header">
			<div class="prediction-chart-copy">
				<span class="prediction-chart-kicker">{translate('predicted_trends')}</span>
				<h3 class="prediction-chart-title">{translate('chart_story_title')}</h3>
			</div>

			<div class="prediction-chart-summary-grid">
				<div class="prediction-chart-summary-card">
					<span>{translate('chart_latest')}</span>
					<strong>{`$${latestValue.toLocaleString()}`}</strong>
				</div>
				<div class="prediction-chart-summary-card">
					<span>{translate('chart_range')}</span>
					<strong>{`$${normalizedLowValue.toLocaleString()} - $${peakValue.toLocaleString()}`}</strong>
				</div>
				<div class="prediction-chart-summary-card">
					<span>{translate('chart_delta')}</span>
					<strong>{`${deltaValue >= 0 ? '+' : '-'}$${Math.abs(deltaValue).toLocaleString()}`}</strong>
					<small>{translate('vs_12m_ago')}</small>
				</div>
			</div>
		</div>

		<PriceTrendChart data={trendData} {theme} {isMobile} />
	</div>
</section>
