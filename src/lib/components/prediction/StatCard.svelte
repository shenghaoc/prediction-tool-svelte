<script lang="ts">
	export let label: string;
	export let value: string;
	export let note = '';
	export let variant: 'figure' | 'metric' | 'summary' = 'metric';

	$: rootClass =
		variant === 'figure'
			? 'prediction-figure'
			: variant === 'summary'
				? 'prediction-chart-summary-card'
				: 'prediction-metric-card';
	$: labelClass = variant === 'figure' ? 'prediction-figure-label' : '';
	$: valueClass = variant === 'figure' ? 'prediction-figure-value' : '';
</script>

<div class={rootClass}>
	<span class={labelClass}>{label}</span>
	<strong class={valueClass}>{value}</strong>
	{#if note}
		<small>{note}</small>
	{/if}
</div>
