<script lang="ts">
	import { cn } from '$lib/utils.js';

	export type FormSelectOption<T extends string = string> = {
		value: T;
		label: string;
	};

	type Props<T extends string = string> = {
		id?: string;
		value: T;
		options: readonly FormSelectOption<T>[];
		placeholder?: string;
		disabled?: boolean;
		onchange?: (_value: T) => void;
	};

	let { id, value, options, placeholder = '', disabled = false, onchange }: Props = $props();

	function handleChange(event: Event) {
		const target = event.currentTarget as HTMLSelectElement;
		const next = target.value;
		if (!next) return;
		onchange?.(next as typeof value);
	}

	const baseClass = cn(
		'select w-full bg-card border border-border/60 shadow-sm transition-all duration-200',
		'hover:border-primary/30 hover:shadow-md hover:shadow-primary/5',
		'focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15'
	);
</script>

<select
	{id}
	{disabled}
	class={baseClass}
	value={value ?? ''}
	onchange={handleChange}
	data-slot="form-select"
>
	{#if placeholder}
		<option value="" disabled hidden={!!value}>{placeholder}</option>
	{/if}
	{#each options as option (option.value)}
		<option value={option.value} selected={option.value === value}>{option.label}</option>
	{/each}
</select>
