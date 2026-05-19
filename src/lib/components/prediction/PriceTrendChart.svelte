<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import { formatCurrencyTick, type PredictionTheme, type TrendPoint } from '$lib/prediction';

	export let data: TrendPoint[];
	export let ariaLabel: string;
	export let theme: PredictionTheme;
	export let isMobile: boolean;

	const width = 760;
	let svg: SVGSVGElement | null = null;
	let activeIndex = -1;

	$: height = isMobile ? 280 : 360;
	$: margin = {
		top: 18,
		right: isMobile ? 10 : 18,
		bottom: 34,
		left: isMobile ? 50 : 68
	};
	$: innerWidth = width - margin.left - margin.right;
	$: innerHeight = height - margin.top - margin.bottom;
	$: values = data.map((entry) => entry.value);
	$: maxValue = Math.max(...values, 0);
	$: minPositiveValue = values.reduce(
		(lowest, value) => (value > 0 ? Math.min(lowest, value) : lowest),
		Number.POSITIVE_INFINITY
	);
	$: minValue = Number.isFinite(minPositiveValue) ? Math.min(0, minPositiveValue) : 0;
	$: range = Math.max(maxValue - minValue, 1);
	$: yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
		const value = Math.round(maxValue - range * ratio);
		return {
			value,
			y: margin.top + innerHeight * ratio
		};
	});
	$: points = data.map((entry, index) => {
		const x =
			margin.left + (data.length === 1 ? innerWidth / 2 : (innerWidth * index) / (data.length - 1));
		const y = margin.top + innerHeight - ((entry.value - minValue) / range) * innerHeight;
		return {
			...entry,
			x,
			y
		};
	});
	$: linePath = points
		.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
		.join(' ');
	$: areaPath =
		points.length === 0
			? ''
			: `${linePath} L ${points[points.length - 1].x} ${margin.top + innerHeight} L ${points[0].x} ${margin.top + innerHeight} Z`;
	$: activePoint = activeIndex >= 0 ? points[activeIndex] : null;
	$: activeTooltipStyle = activePoint
		? `left:${((activePoint.x / width) * 100).toFixed(2)}%;top:${activePoint.y}px;`
		: '';
	$: visibleXAxisLabels = points.filter((_, index) => {
		if (points.length <= 6) return true;
		if (index === 0 || index === points.length - 1) return true;
		return isMobile ? index % 3 === 0 : index % 2 === 0;
	});

	function setActiveIndexFromPointer(event: PointerEvent) {
		if (!svg || points.length === 0) return;

		const rect = svg.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * width;

		let nearestIndex = 0;
		let nearestDistance = Number.POSITIVE_INFINITY;

		for (let index = 0; index < points.length; index += 1) {
			const distance = Math.abs(points[index].x - x);
			if (distance < nearestDistance) {
				nearestDistance = distance;
				nearestIndex = index;
			}
		}

		activeIndex = nearestIndex;
	}

	function clearActiveIndex() {
		activeIndex = -1;
	}
</script>

<div class="prediction-chart-frame">
	<svg
		bind:this={svg}
		class="prediction-chart-svg"
		viewBox={`0 0 ${width} ${height}`}
		role="img"
		aria-label={ariaLabel}
		on:pointermove={setActiveIndexFromPointer}
		on:pointerleave={clearActiveIndex}
	>
		<defs>
			<linearGradient id="prediction-area-gradient" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color={theme.chartLine} stop-opacity="0.38" />
				<stop offset="65%" stop-color={theme.chartLine} stop-opacity="0.12" />
				<stop offset="100%" stop-color={theme.chartLine} stop-opacity="0" />
			</linearGradient>
		</defs>

		{#each yTicks as tick}
			<line
				x1={margin.left}
				y1={tick.y}
				x2={width - margin.right}
				y2={tick.y}
				stroke={theme.chartGrid}
				stroke-dasharray="3 10"
			/>
			<text
				x={margin.left - 12}
				y={tick.y + 4}
				text-anchor="end"
				fill={theme.textMuted}
				font-size={isMobile ? 11 : 12}
				font-family={'"Avenir Next", "Segoe UI", sans-serif'}
			>
				{formatCurrencyTick(tick.value)}
			</text>
		{/each}

		{#if areaPath}
			<path d={areaPath} fill="url(#prediction-area-gradient)" />
			<path
				d={linePath}
				fill="none"
				stroke={theme.chartLine}
				stroke-width="2.75"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/if}

		{#if activePoint}
			<line
				x1={activePoint.x}
				y1={margin.top}
				x2={activePoint.x}
				y2={margin.top + innerHeight}
				stroke={theme.chartLine}
				stroke-opacity="0.22"
				stroke-dasharray="4 8"
			/>
			<circle
				cx={activePoint.x}
				cy={activePoint.y}
				r="4.5"
				fill={theme.panelStrong}
				stroke={theme.chartLine}
				stroke-width="2"
			/>
		{/if}

		{#each visibleXAxisLabels as point}
			<text
				x={point.x}
				y={height - 8}
				text-anchor="middle"
				fill={theme.textMuted}
				font-size={isMobile ? 11 : 12}
				font-family={'"Avenir Next", "Segoe UI", sans-serif'}
			>
				{point.label}
			</text>
		{/each}

		<rect
			x={margin.left}
			y={margin.top}
			width={innerWidth}
			height={innerHeight}
			fill="transparent"
		/>
	</svg>

	{#if activePoint}
		<div class="prediction-chart-tooltip" style={activeTooltipStyle}>
			<div class="prediction-chart-tooltip-label">{activePoint.label}</div>
			<div class="prediction-chart-tooltip-value">
				Estimated Price: {formatCurrency(activePoint.value)}
			</div>
		</div>
	{/if}
</div>
