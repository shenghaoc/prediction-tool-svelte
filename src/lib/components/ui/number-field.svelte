<script lang="ts">
	import { onDestroy } from 'svelte';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';

	import { cn } from '$lib/utils.js';

	type Props = {
		id: string;
		value: number | '';
		onchange: (value: number | '') => void;
		min?: number;
		max?: number;
		step?: number;
		placeholder?: string;
		unit?: string;
		ariaLabel: string;
		required?: boolean;
		class?: string;
	};

	let {
		id,
		value,
		onchange,
		min = 0,
		max = 999,
		step = 1,
		placeholder,
		unit,
		ariaLabel,
		required = false,
		class: className
	}: Props = $props();

	let focused = $state(false);
	let holdInterval: ReturnType<typeof setTimeout> | null = null;

	const numValue = $derived(typeof value === 'number' ? value : NaN);
	const atMin = $derived(!isNaN(numValue) && numValue <= min);
	const atMax = $derived(!isNaN(numValue) && numValue >= max);

	function clamp(v: number) {
		const clamped = Math.max(min, Math.min(max, v));
		const stepDecimals = step.toString().split('.')[1]?.length ?? 0;
		return stepDecimals > 0 ? Number(clamped.toFixed(stepDecimals)) : Math.round(clamped);
	}

	function increment() {
		const current = isNaN(numValue) ? min : numValue;
		onchange(clamp(current + step));
	}

	function decrement() {
		const current = isNaN(numValue) ? min : numValue;
		onchange(clamp(current - step));
	}

	function startHold(fn: () => void) {
		fn();
		let count = 0;
		const repeat = () => {
			holdInterval = setTimeout(
				() => {
					count++;
					fn();
					repeat();
				},
				count < 5 ? 200 : 80
			);
		};
		repeat();
	}

	function stopHold() {
		if (holdInterval) {
			clearTimeout(holdInterval);
			holdInterval = null;
		}
	}

	onDestroy(stopHold);

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			increment();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			decrement();
		} else if (e.key === 'Home') {
			e.preventDefault();
			onchange(min);
		} else if (e.key === 'End') {
			e.preventDefault();
			onchange(max);
		}
	}

	function handleBlur() {
		focused = false;
		if (typeof value === 'number' && !isNaN(value)) {
			onchange(clamp(value));
		}
	}

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const hasDecimals = step % 1 !== 0;
		const allowNegative = min < 0;
		const regex = hasDecimals
			? allowNegative
				? /[^\d.-]/g
				: /[^\d.]/g
			: allowNegative
				? /[^\d-]/g
				: /[^\d]/g;
		const sanitized = input.value.replace(regex, '');
		if (input.value !== sanitized) {
			input.value = sanitized;
		}
		if (sanitized === '' || sanitized === '-') {
			onchange('');
			return;
		}
		const n = parseFloat(sanitized);
		if (!isNaN(n)) onchange(n);
	}

	const gridCols = $derived(unit ? 'grid-cols-[40px_1fr_auto_40px]' : 'grid-cols-[40px_1fr_40px]');
</script>

<div
	role="group"
	aria-label={ariaLabel}
	class={cn(
		'grid overflow-hidden rounded-[var(--radius-sm,3px)] border border-border transition-all duration-200',
		focused && 'border-primary/50 ring-2 ring-ring/18',
		gridCols,
		className
	)}
>
	<button
		type="button"
		tabindex={-1}
		disabled={atMin}
		aria-label="Decrease value"
		onpointerdown={(e) => {
			e.preventDefault();
			if (!atMin) startHold(decrement);
		}}
		onpointerup={stopHold}
		onpointerleave={stopHold}
		onpointercancel={stopHold}
		class={cn(
			'flex items-center justify-center border-none bg-secondary/60 text-secondary-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-primary',
			atMin && 'cursor-not-allowed opacity-35'
		)}
	>
		<Minus class="size-3.5" />
	</button>

	<input
		{id}
		type="text"
		inputmode={step % 1 !== 0 ? 'decimal' : 'numeric'}
		role="spinbutton"
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={isNaN(numValue) ? undefined : numValue}
		aria-label={ariaLabel}
		value={isNaN(numValue) ? '' : value}
		{placeholder}
		{required}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		onfocus={() => (focused = true)}
		onblur={handleBlur}
		autocomplete="off"
		class="h-10 w-full border-x border-border/40 bg-card px-3 text-center text-sm font-medium text-foreground tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
	/>

	{#if unit}
		<span
			class="flex items-center border-l border-border/40 bg-secondary/60 px-3.5 text-xs font-bold whitespace-nowrap text-muted-foreground"
			aria-hidden="true"
		>
			{unit}
		</span>
	{/if}

	<button
		type="button"
		tabindex={-1}
		disabled={atMax}
		aria-label="Increase value"
		onpointerdown={(e) => {
			e.preventDefault();
			if (!atMax) startHold(increment);
		}}
		onpointerup={stopHold}
		onpointerleave={stopHold}
		onpointercancel={stopHold}
		class={cn(
			'flex items-center justify-center border-none bg-secondary/60 text-secondary-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-primary',
			atMax && 'cursor-not-allowed opacity-35'
		)}
	>
		<Plus class="size-3.5" />
	</button>
</div>
