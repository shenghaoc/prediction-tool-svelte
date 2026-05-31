<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import { formatCurrencyTick, formatMonthLabel, type TrendPoint } from '$lib/prediction';
	import type { Language } from '$lib/i18n';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { draw, fade } from 'svelte/transition';
	import { untrack } from 'svelte';

	type Props = {
		data: TrendPoint[];
		ariaLabel: string;
		locale?: Language;
	};

	let { data, ariaLabel, locale = 'en' }: Props = $props();

	const currencyLocale = $derived(locale === 'zh' ? 'zh-SG' : 'en-SG');

	// Unique per-instance ID prevents SVG gradient collisions when multiple
	// charts appear on the same page. `$props.id()` is stable across SSR and
	// hydration, so it avoids hydration mismatches.
	const uid = $props.id();

	// `prefers-reduced-motion` gate (Gap 5). Defaults to `false` so SSR renders
	// the animated path; the real preference is read on mount and kept in sync.
	let reduceMotion = $state(
		typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
	$effect(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion = query.matches;
		const onChange = (event: MediaQueryListEvent) => {
			reduceMotion = event.matches;
		};
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	});

	const width = 760;
	let activeIndex = $state(-1);
	let windowWidth = $state(0);
	let containerWidth = $state(0);

	const isMobile = $derived(windowWidth > 0 && windowWidth < 900);
	const height = $derived(isMobile ? 280 : 360);
	const margin = $derived({
		top: 24,
		right: isMobile ? 10 : 18,
		bottom: 34,
		left: isMobile ? 50 : 68
	});
	const innerWidth = $derived(width - margin.left - margin.right);
	const innerHeight = $derived(height - margin.top - margin.bottom);

	// Raw target values straight from the data contract.
	const values = $derived(data.map((entry) => entry.value));

	// Tween the numeric values so a re-submit morphs the line/area/grid/dots
	// smoothly from the old prediction to the new one (Gap 2). The very first
	// render initializes `current` to the incoming values (no morph) — the
	// entry transition (Gap 1) handles that reveal instead.
	// `untrack` makes the deliberate "initialize from the current values once"
	// intent explicit — later updates flow through the effect below, not here.
	const tweenedValues = new Tween(
		untrack(() => values),
		{ duration: 600, easing: cubicOut }
	);

	// Track the array length without subscribing to `tweenedValues.current`,
	// so the effect below doesn't re-run on every animation frame.
	let lastLength = untrack(() => values.length);
	$effect(() => {
		const target = values;
		// Snap instantly when reduced motion is requested, or when the point
		// count changes (interpolating arrays of different lengths is invalid).
		const instant = reduceMotion || target.length !== lastLength;
		lastLength = target.length;
		tweenedValues.set(target, { duration: instant ? 0 : 600 });
	});

	// All geometry derives from the animating values so everything moves together.
	const displayValues = $derived(tweenedValues.current);

	const maxValue = $derived(Math.max(...displayValues, 0));
	const minPositiveValue = $derived(
		displayValues.reduce(
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
			const value = displayValues[index] ?? entry.value;
			const x =
				margin.left +
				(data.length === 1 ? innerWidth / 2 : (innerWidth * index) / (data.length - 1));
			const y = margin.top + innerHeight - ((value - minValue) / range) * innerHeight;
			// `value` is the (animating) plotted value; `rawValue` is the exact
			// target used for tooltips and accessible labels.
			return { label: entry.label, value, rawValue: entry.value, x, y };
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
		activePoint
			? `left:${((activePoint.x / width) * 100).toFixed(2)}%;top:${((activePoint.y / height) * 100).toFixed(2)}%;`
			: ''
	);

	// Peak/latest indices come from the raw values so the markers stay anchored
	// to the true data points instead of drifting during the morph animation.
	const peakValue = $derived(Math.max(...values, 0));
	const peakIdx = $derived(values.indexOf(peakValue));
	const lastIdx = $derived(values.length - 1);

	const visibleXAxisLabels = $derived(
		points.filter((_, index) => {
			if (points.length <= 6) return true;
			if (index === 0 || index === points.length - 1) return true;
			return isMobile ? index % 3 === 0 : index % 2 === 0;
		})
	);

	// Screen-reader summary placed in <desc> (Gap 4). Uses localized month names
	// and currency so it reads naturally in both en-SG and zh-SG.
	const chartDescription = $derived.by(() => {
		if (points.length === 0) return ariaLabel;
		const first = formatMonthLabel(points[0].label, currencyLocale);
		const last = formatMonthLabel(points[points.length - 1].label, currencyLocale);
		const latest = formatCurrency(points[lastIdx].rawValue, currencyLocale);
		return `${points.length}-month price trend from ${first} to ${last}. Predicted price ${latest}.`;
	});

	function setActiveIndexFromPointer(event: PointerEvent) {
		// containerWidth is 0 until the ResizeObserver behind bind:clientWidth fires.
		// Bail until then so we never compute a hit-test against a zero/stale width.
		if (points.length === 0 || !containerWidth) return;

		// ⚡ Bolt Optimization: Use offsetX to avoid layout thrashing and stale scroll
		// offsets that happen with getBoundingClientRect(). The container width is
		// tracked reactively via bind:clientWidth (ResizeObserver), so we never read
		// the DOM synchronously during this high-frequency pointer handler.
		const x = (event.offsetX / containerWidth) * width;

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

<svelte:window bind:innerWidth={windowWidth} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative w-full"
	bind:clientWidth={containerWidth}
	onpointermove={setActiveIndexFromPointer}
	onpointerleave={clearActiveIndex}
	style="cursor: crosshair"
>
	<svg
		class="pointer-events-none block h-auto w-full"
		viewBox={`0 0 ${width} ${height}`}
		role="img"
		aria-label={ariaLabel}
	>
		<title>{ariaLabel}</title>
		<desc>{chartDescription}</desc>

		<defs>
			<linearGradient id={`prediction-area-gradient-${uid}`} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--chart-fill)" stop-opacity="0.42" />
				<stop offset="55%" stop-color="var(--chart-fill)" stop-opacity="0.14" />
				<stop offset="100%" stop-color="var(--chart-fill)" stop-opacity="0" />
			</linearGradient>
			<linearGradient id={`prediction-line-gradient-${uid}`} x1="0" y1="0" x2="1" y2="0">
				<stop offset="0%" stop-color="var(--chart-fill)" />
				<stop offset="100%" stop-color="var(--chart-2, var(--chart-fill))" />
			</linearGradient>
		</defs>

		{#each yTicks as tick, i (i)}
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
			<!-- Area fades in first, then the line draws over it for a layered
			     reveal (Gap 1). Both collapse to an instant render when the user
			     prefers reduced motion (Gap 5). -->
			<path
				d={areaPath}
				fill={`url(#prediction-area-gradient-${uid})`}
				transition:fade={{ duration: reduceMotion ? 0 : 400 }}
			/>
			<path
				d={linePath}
				fill="none"
				stroke={`url(#prediction-line-gradient-${uid})`}
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				transition:draw={{ duration: reduceMotion ? 0 : 900, easing: cubicOut }}
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
				{formatMonthLabel(point.label, currencyLocale)}
			</text>
		{/each}

		<!-- Keyboard-navigable, screen-reader-announced data points (Gap 4).
		     Visually subtle until focused; each carries its own value label so
		     keyboard users can Tab through individual months. -->
		{#each points as point, index (point.label)}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<!-- Intentionally focusable: keyboard/screen-reader users can Tab
			     through each month's value (Gap 4) — this is the whole point of
			     hand-rolling the SVG instead of using a <canvas> chart library. -->
			<circle
				class="data-point"
				cx={point.x}
				cy={point.y}
				r="9"
				role="img"
				tabindex="0"
				aria-label={`${formatMonthLabel(point.label, currencyLocale)}: ${formatCurrency(point.rawValue, currencyLocale)}`}
				onfocus={() => (activeIndex = index)}
				onblur={clearActiveIndex}
			/>
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
		<div class="chart-tooltip visible pointer-events-none" style={activeTooltipStyle}>
			<div class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
				{formatMonthLabel(activePoint.label, currencyLocale)}
			</div>
			<div class="text-sm font-semibold text-foreground tabular-nums">
				{formatCurrency(activePoint.rawValue, currencyLocale)}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Subtle, focus-discoverable data points: invisible until a keyboard user
	   Tabs to one, at which point a clear focus ring appears. */
	.data-point {
		fill: transparent;
		stroke: transparent;
		cursor: pointer;
		transition: fill-opacity 150ms ease;
	}

	.data-point:focus-visible {
		outline: none;
		fill: var(--primary);
		fill-opacity: 0.9;
		stroke: var(--card);
		stroke-width: 2;
	}
</style>
