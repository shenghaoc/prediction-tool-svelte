<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
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
		onchange?: (value: T) => void;
	};

	let { id, value, options, placeholder = '', disabled = false, onchange }: Props = $props();

	const triggerClassName =
		'h-10 w-full rounded-lg border border-border/60 bg-card px-3 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15 data-[placeholder]:text-muted-foreground';

	const selectedLabel = $derived(options.find((option) => option.value === value)?.label ?? '');
</script>

<Select.Root
	type="single"
	{value}
	onValueChange={(next) => {
		if (!next) return;
		onchange?.(next as typeof value);
	}}
	{disabled}
>
	<Select.Trigger {id} class={cn(triggerClassName)}>
		<span class="truncate" data-slot="select-value">
			{selectedLabel || placeholder}
		</span>
	</Select.Trigger>
	<Select.Content sideOffset={6}>
		{#each options as option (option.value)}
			<Select.Item value={option.value} label={option.label}>
				{option.label}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
