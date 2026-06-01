<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getTooltipState, type TooltipSide } from './tooltip.svelte';

	type Props = {
		children?: Snippet;
		side?: TooltipSide;
		class?: string;
		sideOffset?: number;
	};

	let { children, side = 'top', class: className = '' }: Props = $props();

	const tipState = getTooltipState();
	let hidden: HTMLSpanElement | null = $state(null);

	$effect(() => {
		if (!tipState) return;
		tipState.side = side;
		tipState.extraClass = className;
	});

	$effect(() => {
		if (!tipState || !hidden) return;
		// Re-run on children change by referencing the snippet identity.
		void children;
		const text = hidden.textContent?.trim() ?? '';
		if (tipState.text !== text) tipState.text = text;
	});
</script>

<span bind:this={hidden} hidden aria-hidden="true" data-slot="tooltip-content-source">
	{@render children?.()}
</span>
