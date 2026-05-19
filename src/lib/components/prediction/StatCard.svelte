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
</script>

<div class={rootClass}>
	<span class={variant === 'figure' ? 'prediction-figure-label' : ''}>{label}</span>
	<strong class={variant === 'figure' ? 'prediction-figure-value' : ''}>{value}</strong>
	{#if note}
		<small>{note}</small>
	{/if}
</div>
