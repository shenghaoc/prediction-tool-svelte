<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';

	import { cn } from '$lib/utils.js';

	type Props = {
		id: string;
		value: number | '';
		onchange: (_value: number | '') => void;
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

	$effect(() => {
		return () => stopHold();
	});

	const numValue = $derived(typeof value === 'number' ? value : NaN);
	const atMin = $derived(!Number.isNaN(numValue) && numValue <= min);
	const atMax = $derived(!Number.isNaN(numValue) && numValue >= max);

	function clamp(v: number) {
		return Math.max(min, Math.min(max, Math.round(v)));
	}

	function increment() {
		const current = Number.isNaN(numValue) ? min : numValue;
		const next = clamp(current + step);
		onchange(next);
		if (next >= max) stopHold();
	}

	function decrement() {
		const current = Number.isNaN(numValue) ? min : numValue;
		const next = clamp(current - step);
		onchange(next);
		if (next <= min) stopHold();
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
		if (typeof value === 'number' && !Number.isNaN(value)) {
			onchange(clamp(value));
		}
	}

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const sanitized = input.value.replace(/\D/g, '');
		if (input.value !== sanitized) {
			input.value = sanitized;
		}
		if (sanitized === '') {
			onchange('');
			return;
		}
		const n = parseInt(sanitized, 10);
		if (!Number.isNaN(n)) onchange(n);
	}

	const gridCols = $derived(unit ? 'grid-cols-[40px_1fr_auto_40px]' : 'grid-cols-[40px_1fr_40px]');
</script>

<div
	role="group"
	aria-label={ariaLabel}
	class={cn(
		'join grid overflow-hidden rounded-lg border border-base-300 bg-base-100 transition-all duration-200',
		focused && 'border-primary/50 ring-2 ring-primary/18',
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
			if (!atMin) {
				e.preventDefault();
				startHold(decrement);
			}
		}}
		onpointerup={stopHold}
		onpointerleave={stopHold}
		onpointercancel={stopHold}
		class={cn(
			'join-item flex items-center justify-center border-none bg-base-200 text-base-content transition-colors duration-150 hover:bg-base-300 hover:text-primary',
			atMin && 'cursor-not-allowed opacity-35'
		)}
	>
		<Minus class="size-3.5" />
	</button>

	<input
		{id}
		type="text"
		inputmode="numeric"
		role="spinbutton"
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={Number.isNaN(numValue) ? undefined : numValue}
		aria-label={ariaLabel}
		value={Number.isNaN(numValue) ? '' : value}
		{placeholder}
		{required}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		onfocus={() => (focused = true)}
		onblur={handleBlur}
		autocomplete="off"
		data-no-spinner="true"
		class="join-item h-10 w-full border-x border-base-300 bg-base-100 px-3 text-center text-sm font-medium text-base-content tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
	/>

	{#if unit}
		<span
			class="join-item flex items-center border-l border-base-300 bg-base-200 px-3.5 text-xs font-bold whitespace-nowrap text-base-content/70"
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
			if (!atMax) {
				e.preventDefault();
				startHold(increment);
			}
		}}
		onpointerup={stopHold}
		onpointerleave={stopHold}
		onpointercancel={stopHold}
		class={cn(
			'join-item flex items-center justify-center border-none bg-base-200 text-base-content transition-colors duration-150 hover:bg-base-300 hover:text-primary',
			atMax && 'cursor-not-allowed opacity-35'
		)}
	>
		<Plus class="size-3.5" />
	</button>
</div>
