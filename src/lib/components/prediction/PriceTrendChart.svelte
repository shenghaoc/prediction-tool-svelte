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
		top: 24,
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
	$: minValue = (Number.isFinite(minPositiveValue) ? Math.min(0, minPositiveValue) : 0) * 0.92;
	$: range = Math.max(maxValue * 1.04 - minValue, 1);

	$: yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
		const value = Math.round(minValue + (maxValue * 1.04 - minValue) * ratio);
		return {
			value,
			y: margin.top + innerHeight * (1 - ratio)
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

	// Smooth curve via cardinal spline (Catmull-Rom)
	function catmullRom(p: typeof points, t = 0.35) {
		if (p.length < 2) return '';
		let d = `M${p[0].x},${p[0].y}`;
		for (let i = 0; i < p.length - 1; i++) {
			const p0 = p[Math.max(i - 1, 0)];
			const p1 = p[i];
			const p2 = p[i + 1];
			const p3 = p[Math.min(i + 2, p.length - 1)];
			const cp1x = p1.x + ((p2.x - p0.x) * t) / 3;
			const cp1y = p1.y + ((p2.y - p0.y) * t) / 3;
			const cp2x = p2.x - ((p3.x - p1.x) * t) / 3;
			const cp2y = p2.y - ((p3.y - p1.y) * t) / 3;
			d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
		}
		return d;
	}

	$: linePath = catmullRom(points);
	$: areaPath =
		points.length === 0
			? ''
			: `${linePath} L ${points[points.length - 1].x} ${margin.top + innerHeight} L ${points[0].x} ${margin.top + innerHeight} Z`;

	$: activePoint = activeIndex >= 0 ? points[activeIndex] : null;
	$: activeTooltipStyle = activePoint
		? `left:${((activePoint.x / width) * 100).toFixed(2)}%;top:${activePoint.y}px;`
		: '';

	$: peakIdx = values.indexOf(Math.max(...values));
	$: lastIdx = values.length - 1;

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
		style="cursor: crosshair"
	>
		<defs>
			<!-- `stop-color` from `--chart-fill` (opaque); alpha comes only from `stop-opacity`. -->
			<linearGradient id="prediction-area-gradient" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--chart-fill)" stop-opacity="0.42" />
				<stop offset="55%" stop-color="var(--chart-fill)" stop-opacity="0.14" />
				<stop offset="100%" stop-color="var(--chart-fill)" stop-opacity="0" />
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
				font-size={11}
				font-family="var(--font-body)"
				font-weight="600"
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
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/if}

		{#if points.length > 0}
			<!-- Peak dot -->
			<circle
				cx={points[peakIdx].x}
				cy={points[peakIdx].y}
				r="5"
				fill={theme.primary}
				stroke={theme.panelStrong}
				stroke-width="2"
			/>
			<!-- Latest dot -->
			<circle
				cx={points[lastIdx].x}
				cy={points[lastIdx].y}
				r="6"
				fill={theme.accent}
				stroke={theme.panelStrong}
				stroke-width="2.5"
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
				r="5"
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
				font-size={11}
				font-family="var(--font-body)"
				font-weight="600"
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
		<div class="prediction-chart-tooltip visible" style={activeTooltipStyle}>
			<div class="prediction-chart-tooltip-label">{activePoint.label}</div>
			<div class="prediction-chart-tooltip-value">
				{formatCurrency(activePoint.value)}
			</div>
		</div>
	{/if}
</div>
