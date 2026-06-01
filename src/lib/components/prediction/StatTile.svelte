<script lang="ts">
	import type { Component } from 'svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';

	type Props = {
		icon: Component<{ class?: string }>;
		label: string;
		value: string;
		hint?: string;
		class?: string;
	};

	let { icon: Icon, label, value, hint, class: className }: Props = $props();

	const tileClass = $derived(
		cn(
			'stat group/tile rounded-xl border border-base-300/60 bg-base-100/90 shadow-sm transition-all duration-300',
			'hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5',
			hint && 'cursor-help',
			className
		)
	);
</script>

{#snippet tile(triggerProps: Record<string, unknown> = {})}
	<div {...triggerProps} class={tileClass}>
		<div class="stat-figure text-primary">
			<div
				class="flex size-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15 transition-all duration-300 group-hover/tile:bg-primary/15 group-hover/tile:ring-primary/25"
				aria-hidden="true"
			>
				<Icon class="size-5" />
			</div>
		</div>
		<div class="stat-title text-[10px] font-bold tracking-wider text-base-content/70 uppercase">
			{label}
		</div>
		<div
			class="stat-value font-heading text-xl font-extrabold tracking-tight text-primary tabular-nums"
		>
			{value}
		</div>
	</div>
{/snippet}

{#if hint}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				{@render tile(props)}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="top" class="max-w-[220px] text-center leading-relaxed">
			{hint}
		</Tooltip.Content>
	</Tooltip.Root>
{:else}
	{@render tile()}
{/if}
