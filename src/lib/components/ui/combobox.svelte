<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	import { cn } from '$lib/utils.js';

	export type ComboboxOption = {
		value: string;
		label: string;
	};

	type Props = {
		id: string;
		options: ComboboxOption[];
		value: string;
		onchange: (value: string) => void;
		placeholder?: string;
		ariaLabel: string;
		class?: string;
	};

	let {
		id,
		options,
		onchange,
		placeholder = 'Search…',
		ariaLabel,
		value,
		class: className
	}: Props = $props();

	let listboxId = $derived(`${id}-listbox`);

	let query = $state('');
	let isOpen = $state(false);
	let activeIndex = $state(-1);
	let focused = $state(false);
	let inputEl: HTMLInputElement | null = $state(null);
	let listEl: HTMLUListElement | null = $state(null);
	let containerEl: HTMLDivElement | null = $state(null);
	let suppressFocusOpen = false;

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

	const filtered = $derived.by(() => {
		if (!query.trim()) return options;
		const q = query.toLowerCase();
		return options.filter((o) => o.label.toLowerCase().includes(q));
	});

	$effect(() => {
		if (!isOpen || activeIndex < 0 || !listEl) return;
		const items = listEl.querySelectorAll('[role="option"]');
		items[activeIndex]?.scrollIntoView({ block: 'nearest' });
	});

	function handleSelect(optValue: string) {
		onchange(optValue);
		query = '';
		isOpen = false;
		activeIndex = -1;
		suppressFocusOpen = true;
		inputEl?.focus();
	}

	function handleKeyDown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (!isOpen) {
					isOpen = true;
					activeIndex = 0;
				} else {
					activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
				}
				break;
			case 'ArrowUp':
				e.preventDefault();
				if (isOpen) activeIndex = Math.max(activeIndex - 1, 0);
				break;
			case 'Enter':
				if (isOpen && activeIndex >= 0 && filtered[activeIndex]) {
					e.preventDefault();
					handleSelect(filtered[activeIndex].value);
				}
				break;
			case 'Escape':
				e.preventDefault();
				e.stopPropagation();
				isOpen = false;
				query = '';
				break;
			case 'Home':
				if (isOpen) {
					e.preventDefault();
					activeIndex = 0;
				}
				break;
			case 'End':
				if (isOpen) {
					e.preventDefault();
					activeIndex = filtered.length - 1;
				}
				break;
		}
	}

	const activeOptionId = $derived(activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined);
</script>

<div
	bind:this={containerEl}
	class={cn('relative', className)}
	onfocusout={(e) => {
		if (containerEl && !containerEl.contains(e.relatedTarget as Node)) {
			isOpen = false;
			query = '';
		}
	}}
>
	<div class="relative flex">
		<input
			bind:this={inputEl}
			{id}
			type="text"
			role="combobox"
			aria-expanded={isOpen}
			aria-controls={listboxId}
			aria-activedescendant={activeOptionId}
			aria-autocomplete="list"
			aria-haspopup="listbox"
			aria-label={ariaLabel}
			value={isOpen ? query : selectedLabel}
			{placeholder}
			oninput={(e) => {
				query = e.currentTarget.value;
				isOpen = true;
				activeIndex = -1;
			}}
			onkeydown={handleKeyDown}
			onfocus={() => {
				focused = true;
				if (suppressFocusOpen) {
					suppressFocusOpen = false;
				} else {
					isOpen = true;
					query = '';
				}
			}}
			onblur={() => (focused = false)}
			autocomplete="off"
			spellcheck="false"
			class={cn(
				'h-10 w-full rounded-[var(--radius-sm,3px)] border border-border bg-card pr-9 pl-3 text-sm font-medium text-foreground outline-none transition-all duration-200',
				focused && 'border-primary/50 ring-2 ring-ring/18'
			)}
		/>
		<button
			type="button"
			tabindex={-1}
			aria-label="Toggle options"
			onclick={() => {
				isOpen = !isOpen;
				if (!isOpen) return;
				inputEl?.focus();
			}}
			class="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-transform duration-200"
			style:transform={isOpen ? 'rotate(180deg)' : 'none'}
		>
			<ChevronDown class="size-3.5" />
		</button>
	</div>

	{#if isOpen}
		<ul
			bind:this={listEl}
			id={listboxId}
			role="listbox"
			aria-label={ariaLabel}
			class="absolute top-[calc(100%+6px)] right-0 left-0 z-50 max-h-60 overflow-y-auto rounded-[var(--radius-sm,3px)] border border-border bg-card p-1 shadow-md"
		>
			{#if filtered.length === 0}
				<li class="px-3.5 py-3 text-center text-sm italic text-muted-foreground">No matches</li>
			{:else}
				{#each filtered as opt, i (opt.value)}
					{@const isActive = i === activeIndex}
					{@const isSelected = opt.value === value}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id={`${id}-opt-${i}`}
						role="option"
						aria-selected={isSelected}
						onclick={() => handleSelect(opt.value)}
						onmouseenter={() => (activeIndex = i)}
						class={cn(
							'flex cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm,3px)] px-2.5 py-1.5 text-[0.8125rem] transition-colors duration-100',
							isActive && 'bg-primary/10',
							isSelected ? 'font-bold text-primary' : 'font-semibold text-foreground'
						)}
					>
						<span class="truncate">{opt.label}</span>
						{#if isSelected}
							<Check class="size-3.5 shrink-0 text-primary" />
						{/if}
					</li>
				{/each}
			{/if}
			{#if query && filtered.length > 0}
				<li
					class="mt-0.5 border-t border-border/40 px-3 pt-2 pb-1 text-center text-[0.72rem] text-muted-foreground/70"
				>
					{filtered.length} of {options.length} options
				</li>
			{/if}
		</ul>
	{/if}
</div>
