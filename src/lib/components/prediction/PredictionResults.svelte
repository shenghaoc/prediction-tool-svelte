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

	$: currentLang = $lang;
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

	function tr(key: string) {
		return t(key, currentLang as Language);
	}

	function optionLabel(group: 'ml_models' | 'towns' | 'storey_ranges' | 'flat_models', value: string) {
		return t(`${group}.${value}`, currentLang as Language);
	}
</script>

<section class="prediction-results-card">
	<div class="prediction-results-header">
		<div>
			<span class="prediction-results-label">{tr('predicted_trends')}</span>
			<h2 class="prediction-results-title">{tr('predicted_price')}</h2>
		</div>
		<div class:prediction-pulse={loading} class="prediction-price-panel">
			<span class="prediction-results-label">{tr('prediction')}</span>
			{#key output}
				<strong transition:scale={{ duration: 180, start: 0.92 }}>{formatCurrency(output)}</strong>
			{/key}
		</div>
	</div>

	<div class="prediction-results-grid">
		<StatCard variant="metric" label={tr('ml_model')} value={optionLabel('ml_models', summaryValues.ml_model)} />
		<StatCard variant="metric" label={tr('town')} value={optionLabel('towns', summaryValues.town)} />
		<StatCard variant="metric" label={tr('lease_commence_date')} value={String(summaryValues.lease_commence_date)} />
	</div>

	<div class="prediction-chart-shell">
		<div class="prediction-chart-header">
			<div class="prediction-chart-copy">
				<span class="prediction-chart-kicker">{tr('predicted_trends')}</span>
				<h3 class="prediction-chart-title">{tr('chart_story_title')}</h3>
			</div>

			<div class="prediction-chart-summary-grid">
				<StatCard variant="summary" label={tr('chart_latest')} value={`$${latestValue.toLocaleString()}`} />
				<StatCard
					variant="summary"
					label={tr('chart_range')}
					value={`$${normalizedLowValue.toLocaleString()} - $${peakValue.toLocaleString()}`}
				/>
				<StatCard
					variant="summary"
					label={tr('chart_delta')}
					value={`${deltaValue >= 0 ? '+' : '-'}$${Math.abs(deltaValue).toLocaleString()}`}
					note={tr('vs_12m_ago')}
				/>
			</div>
		</div>

		<PriceTrendChart data={trendData} {theme} {isMobile} />
	</div>
</section>
