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
			'group/tile flex items-center gap-3 rounded-xl border border-base-300/60 bg-base-100/90 p-4 shadow-sm transition-all duration-300',
			'hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5',
			hint && 'cursor-help',
			className
		)
	);
</script>

{#snippet tile()}
	<div class={tileClass}>
		<div
			class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15 transition-all duration-300 group-hover/tile:bg-primary/15 group-hover/tile:ring-primary/25"
			aria-hidden="true"
		>
			<Icon class="size-5 text-primary" />
		</div>
		<div class="flex min-w-0 flex-col gap-0.5">
			<span class="text-[10px] font-bold tracking-wider text-base-content/70 uppercase">
				{label}
			</span>
			<strong class="font-heading text-xl font-extrabold tracking-tight text-primary tabular-nums">
				{value}
			</strong>
		</div>
	</div>
{/snippet}

{#if hint}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{@render tile()}
		</Tooltip.Trigger>
		<Tooltip.Content side="top" class="max-w-[220px] text-center leading-relaxed">
			{hint}
		</Tooltip.Content>
	</Tooltip.Root>
{:else}
	{@render tile()}
{/if}
