<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { scale } from 'svelte/transition';
	import { tick } from 'svelte';

	type ListboxOption = {
		value: string;
		label: string;
	};

	export let id: string;
	export let value: string;
	export let options: ListboxOption[];
	export let placeholder = '';
	export let disabled = false;

	const dispatch = createEventDispatcher<{
		change: { value: string };
	}>();

	let open = false;
	let root: HTMLDivElement | null = null;
	let panel: HTMLDivElement | null = null;
	let activeIndex = -1;
	let optionRefs: Array<HTMLButtonElement | null> = [];

	$: selectedOption = options.find((option) => option.value === value) ?? null;
	$: if (!open) activeIndex = options.findIndex((option) => option.value === value);
	$: if (open && activeIndex >= 0) {
		optionRefs[activeIndex]?.scrollIntoView({ block: 'nearest' });
	}

	function clickOutside(node: HTMLElement) {
		function handlePointer(event: MouseEvent) {
			if (!node.contains(event.target as Node)) {
				open = false;
			}
		}

		document.addEventListener('mousedown', handlePointer, true);

		return {
			destroy() {
				document.removeEventListener('mousedown', handlePointer, true);
			}
		};
	}

	function selectOption(nextValue: string) {
		open = false;
		dispatch('change', { value: nextValue });
	}

	async function openListbox() {
		if (disabled) return;
		open = true;
		activeIndex = Math.max(
			options.findIndex((option) => option.value === value),
			0
		);
		await tick();
		panel?.focus();
	}

	function closeListbox() {
		open = false;
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (disabled) return;

		if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openListbox();
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			openListbox();
			return;
		}

		if (event.key === 'Home' && options[0]) {
			event.preventDefault();
			selectOption(options[0].value);
			return;
		}

		if (event.key === 'End' && options[options.length - 1]) {
			event.preventDefault();
			selectOption(options[options.length - 1].value);
		}
	}

	function handleListKeydown(event: KeyboardEvent) {
		if (!open) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			closeListbox();
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, options.length - 1);
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
			return;
		}

		if (event.key === 'Home') {
			event.preventDefault();
			activeIndex = 0;
			return;
		}

		if (event.key === 'End') {
			event.preventDefault();
			activeIndex = options.length - 1;
			return;
		}

		if (event.key === 'Tab') {
			closeListbox();
			return;
		}

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			const next = options[activeIndex];
			if (next) selectOption(next.value);
		}
	}
</script>

<div bind:this={root} class="prediction-listbox" use:clickOutside>
	<button
		{id}
		type="button"
		class:prediction-listbox-open={open}
		class="prediction-listbox-trigger"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls={`${id}-options`}
		{disabled}
		onclick={() => (open ? closeListbox() : openListbox())}
		onkeydown={handleTriggerKeydown}
	>
		<span class:selected={selectedOption} class="prediction-listbox-value">
			{selectedOption?.label ?? placeholder}
		</span>
		<span class="prediction-listbox-chevron" aria-hidden="true">▾</span>
	</button>

	{#if open}
		<div
			bind:this={panel}
			id={`${id}-options`}
			class="prediction-listbox-panel"
			role="listbox"
			tabindex="-1"
			aria-labelledby={id}
			transition:scale={{ duration: 140, start: 0.96 }}
			onkeydown={handleListKeydown}
		>
			{#each options as option, index}
				<button
					bind:this={optionRefs[index]}
					id={`${id}-option-${index}`}
					type="button"
					role="option"
					class:selected={option.value === value}
					class:active={index === activeIndex}
					class="prediction-listbox-option"
					aria-selected={option.value === value}
					onmouseenter={() => (activeIndex = index)}
					onclick={() => selectOption(option.value)}
				>
					<span>{option.label}</span>
					{#if option.value === value}
						<span class="prediction-listbox-check" aria-hidden="true">●</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
