<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		orientation?: 'horizontal' | 'vertical';
		'data-slot'?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		orientation = 'horizontal',
		'data-slot': dataSlot = 'separator',
		...restProps
	}: Props = $props();
</script>

<div
	bind:this={ref}
	role="separator"
	aria-orientation={orientation}
	data-slot={dataSlot}
	data-orientation={orientation}
	class={cn(
		'bg-base-300 shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:h-full',
		className
	)}
	{...restProps}
></div>
