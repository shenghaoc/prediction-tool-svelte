<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import { formatCurrencyTick, type TrendPoint } from '$lib/prediction';
	import type { Language } from '$lib/i18n';

	type Props = {
		data: TrendPoint[];
		ariaLabel: string;
		locale?: Language;
	};

	let { data, ariaLabel, locale = 'en' }: Props = $props();

	const currencyLocale = $derived(locale === 'zh' ? 'zh-SG' : 'en-SG');

	const width = 760;
	let svg: SVGSVGElement | null = $state(null);
	let activeIndex = $state(-1);
	let isMobile = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const update = () => {
			isMobile = window.innerWidth < 900;
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	});

	const height = $derived(isMobile ? 280 : 360);
	const margin = $derived({
		top: 24,
		right: isMobile ? 10 : 18,
		bottom: 34,
		left: isMobile ? 50 : 68
	});
	const innerWidth = $derived(width - margin.left - margin.right);
	const innerHeight = $derived(height - margin.top - margin.bottom);
	const values = $derived(data.map((entry) => entry.value));
	const maxValue = $derived(Math.max(...values, 0));
	const minPositiveValue = $derived(
		values.reduce(
			(lowest, value) => (value > 0 ? Math.min(lowest, value) : lowest),
			Number.POSITIVE_INFINITY
		)
	);
	const minValue = $derived(
		(Number.isFinite(minPositiveValue) ? Math.min(0, minPositiveValue) : 0) * 0.92
	);
	const range = $derived(Math.max(maxValue * 1.04 - minValue, 1));

	const yTicks = $derived(
		[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
			const value = Math.round(minValue + range * ratio);
			return {
				value,
				y: margin.top + innerHeight * (1 - ratio)
			};
		})
	);

	const points = $derived(
		data.map((entry, index) => {
			const x =
				margin.left +
				(data.length === 1 ? innerWidth / 2 : (innerWidth * index) / (data.length - 1));
			const y = margin.top + innerHeight - ((entry.value - minValue) / range) * innerHeight;
			return { ...entry, x, y };
		})
	);

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

	const linePath = $derived(catmullRom(points));
	const areaPath = $derived(
		points.length === 0
			? ''
			: `${linePath} L ${points[points.length - 1].x} ${margin.top + innerHeight} L ${points[0].x} ${margin.top + innerHeight} Z`
	);

	const activePoint = $derived(activeIndex >= 0 ? points[activeIndex] : null);
	const activeTooltipStyle = $derived(
		activePoint ? `left:${((activePoint.x / width) * 100).toFixed(2)}%;top:${activePoint.y}px;` : ''
	);

	const peakIdx = $derived(values.indexOf(maxValue));
	const lastIdx = $derived(values.length - 1);

	const visibleXAxisLabels = $derived(
		points.filter((_, index) => {
			if (points.length <= 6) return true;
			if (index === 0 || index === points.length - 1) return true;
			return isMobile ? index % 3 === 0 : index % 2 === 0;
		})
	);

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

<div class="relative w-full">
	<svg
		bind:this={svg}
		class="block h-auto w-full"
		viewBox={`0 0 ${width} ${height}`}
		role="img"
		aria-label={ariaLabel}
		onpointermove={setActiveIndexFromPointer}
		onpointerleave={clearActiveIndex}
		style="cursor: crosshair"
	>
		<defs>
			<linearGradient id={`prediction-area-gradient-${data.length}`} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--chart-fill)" stop-opacity="0.42" />
				<stop offset="55%" stop-color="var(--chart-fill)" stop-opacity="0.14" />
				<stop offset="100%" stop-color="var(--chart-fill)" stop-opacity="0" />
			</linearGradient>
			<linearGradient id={`prediction-line-gradient-${data.length}`} x1="0" y1="0" x2="1" y2="0">
				<stop offset="0%" stop-color="var(--chart-fill)" />
				<stop offset="100%" stop-color="var(--chart-2, var(--chart-fill))" />
			</linearGradient>
		</defs>

		{#each yTicks as tick, i (tick.value)}
			<line
				x1={margin.left}
				y1={tick.y}
				x2={width - margin.right}
				y2={tick.y}
				stroke="color-mix(in oklab, var(--border) 70%, transparent)"
				stroke-dasharray={i === 0 ? 'none' : '3 4'}
			/>
			<text
				x={margin.left - 12}
				y={tick.y + 4}
				text-anchor="end"
				fill="var(--muted-foreground)"
				font-size="11"
				font-family="var(--font-sans)"
				font-weight="600"
			>
				{formatCurrencyTick(tick.value)}
			</text>
		{/each}

		{#if areaPath}
			<path d={areaPath} fill={`url(#prediction-area-gradient-${data.length})`} />
			<path
				d={linePath}
				fill="none"
				stroke={`url(#prediction-line-gradient-${data.length})`}
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/if}

		{#if points.length > 0}
			<!-- Latest dot and glow first -->
			<circle
				cx={points[lastIdx].x}
				cy={points[lastIdx].y}
				r="7"
				fill="var(--primary)"
				fill-opacity="0.15"
				stroke="none"
			/>
			<circle
				cx={points[lastIdx].x}
				cy={points[lastIdx].y}
				r="5"
				fill="var(--primary)"
				stroke="var(--card)"
				stroke-width="2.5"
			/>
			<!-- Peak dot on top -->
			{#if peakIdx !== lastIdx}
				<circle
					cx={points[peakIdx].x}
					cy={points[peakIdx].y}
					r="4"
					fill="var(--chart-2, var(--primary))"
					stroke="var(--card)"
					stroke-width="2"
				/>
			{/if}
		{/if}

		{#if activePoint}
			<line
				x1={activePoint.x}
				y1={margin.top}
				x2={activePoint.x}
				y2={margin.top + innerHeight}
				stroke="var(--primary)"
				stroke-opacity="0.22"
				stroke-dasharray="4 8"
			/>
			<circle
				cx={activePoint.x}
				cy={activePoint.y}
				r="5"
				fill="var(--card)"
				stroke="var(--primary)"
				stroke-width="2"
			/>
		{/if}

		{#each visibleXAxisLabels as point (point.label)}
			<text
				x={point.x}
				y={height - 8}
				text-anchor="middle"
				fill="var(--muted-foreground)"
				font-size="11"
				font-family="var(--font-sans)"
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
		<div class="chart-tooltip visible" style={activeTooltipStyle}>
			<div class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
				{activePoint.label}
			</div>
			<div class="text-sm font-semibold text-foreground tabular-nums">
				{formatCurrency(activePoint.value, currencyLocale)}
			</div>
		</div>
	{/if}
</div>
