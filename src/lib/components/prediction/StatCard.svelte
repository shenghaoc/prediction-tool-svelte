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
	$: labelClass =
		variant === 'figure'
			? 'prediction-figure-label'
			: variant === 'summary'
				? 'prediction-chart-summary-card span'
				: 'prediction-metric-card span';
	$: valueClass =
		variant === 'figure'
			? 'prediction-figure-value'
			: variant === 'summary'
				? 'prediction-chart-summary-card strong'
				: 'prediction-metric-card strong';
</script>

<div class={rootClass}>
	<span class={variant === 'figure' ? 'prediction-figure-label' : ''}>{label}</span>
	<strong class={variant === 'figure' ? 'prediction-figure-value' : ''}>{value}</strong>
	{#if note}
		<small>{note}</small>
	{/if}
</div>
