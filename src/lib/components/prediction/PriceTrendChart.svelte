<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import type { Chart as ChartInstance } from 'chart.js';

	import { formatCurrency } from '$lib/format';
	import {
		formatCurrencyTick,
		normalizePrice,
		type PredictionTheme,
		type TrendPoint
	} from '$lib/prediction';

	export let data: TrendPoint[];
	export let theme: PredictionTheme;
	export let isMobile: boolean;

	let canvas: HTMLCanvasElement | null = null;
	let chart: ChartInstance<'line'> | null = null;
	let ChartCtor: (typeof import('chart.js/auto'))['default'] | null = null;

	$: labels = data.map((entry) => entry.label);
	$: values = data.map((entry) => entry.value);

	function buildGradient() {
		if (!chart) return undefined;
		const { ctx, chartArea } = chart;
		if (!chartArea) return undefined;

		const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
		gradient.addColorStop(0, `${theme.chartLine}66`);
		gradient.addColorStop(0.65, `${theme.chartLine}1f`);
		gradient.addColorStop(1, `${theme.chartLine}00`);
		return gradient;
	}

	function syncChart() {
		if (!chart) return;

		chart.data.labels = labels;
		chart.data.datasets[0].data = values;
		chart.data.datasets[0].borderColor = theme.chartLine;
		chart.data.datasets[0].backgroundColor = buildGradient() ?? `${theme.chartLine}26`;
		chart.options.scales = {
			x: {
				grid: { display: false },
				border: { display: false },
				ticks: {
					color: theme.textMuted,
					maxRotation: 0,
					autoSkipPadding: 18,
					font: {
						family: '"Avenir Next", "Segoe UI", sans-serif',
						size: isMobile ? 11 : 12
					}
				}
			},
			y: {
				grid: {
					color: theme.chartGrid,
					tickBorderDash: [3, 10]
				},
				border: { display: false },
				ticks: {
					color: theme.textMuted,
					callback: (value) => formatCurrencyTick(Number(value)),
					font: {
						family: '"Avenir Next", "Segoe UI", sans-serif',
						size: isMobile ? 11 : 12
					}
				}
			}
		};
		chart.options.plugins = {
			legend: { display: false },
			tooltip: {
				displayColors: false,
				backgroundColor: theme.panelStrong,
				borderColor: theme.lineSoft,
				borderWidth: 1,
				padding: 12,
				titleColor: theme.textMuted,
				bodyColor: theme.text,
				titleFont: { size: 11, weight: 'bold' },
				bodyFont: { size: 13, weight: 'bold' },
				callbacks: {
					label: (context) =>
						`Estimated Price: ${formatCurrency(normalizePrice(Number(context.raw)))}`
				}
			}
		};
		chart.update();
	}

	async function initChart() {
		if (!canvas || typeof window === 'undefined') return;

		if (!ChartCtor) {
			const chartModule = await import('chart.js/auto');
			ChartCtor = chartModule.default;
		}

		chart?.destroy();

		if (!ChartCtor || !canvas) return;

		chart = new ChartCtor(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						data: values,
						fill: true,
						tension: 0.32,
						borderWidth: 2.75,
						pointRadius: 0,
						pointHoverRadius: 4,
						pointHoverBorderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				animation: {
					duration: 600
				}
			}
		});
		syncChart();
	}

	onMount(() => {
		let disposed = false;

		async function setup() {
			await tick();

			if (!disposed) {
				await initChart();
			}
		}

		setup();

		return () => {
			disposed = true;
		};
	});

	onDestroy(() => {
		chart?.destroy();
	});

	$: if (chart) {
		labels;
		values;
		theme;
		isMobile;
		syncChart();
	}
</script>

<div class="prediction-chart-frame">
	<canvas bind:this={canvas}></canvas>
</div>
