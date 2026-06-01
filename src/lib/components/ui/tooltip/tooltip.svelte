<script lang="ts" module>
	import { getContext, setContext } from 'svelte';

	const TOOLTIP_CTX = Symbol('tooltip');

	export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

	export type TooltipState = {
		text: string;
		side: TooltipSide;
		extraClass: string;
	};

	export function getTooltipState(): TooltipState | undefined {
		return getContext<TooltipState | undefined>(TOOLTIP_CTX);
	}

	export function setTooltipState(state: TooltipState) {
		setContext(TOOLTIP_CTX, state);
		return state;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	type Props = {
		children?: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();

	const tipState = $state<TooltipState>({ text: '', side: 'top', extraClass: '' });
	setTooltipState(tipState);

	const sideClass = $derived(
		tipState.side === 'bottom'
			? 'tooltip-bottom'
			: tipState.side === 'left'
				? 'tooltip-left'
				: tipState.side === 'right'
					? 'tooltip-right'
					: 'tooltip-top'
	);
</script>

<span
	class={cn('tooltip', sideClass, tipState.extraClass, className)}
	data-slot="tooltip"
	data-tip={tipState.text || undefined}
>
	{@render children?.()}
</span>
