<script lang="ts">
	import type { Snippet } from 'svelte';

	// daisyUI's tooltip is CSS-only (data-tip on the Root wrapper), so there's
	// no content element id to wire aria-describedby to. The trigger just
	// forwards its children — Root owns the visible tip via data-tip.
	type TriggerProps = { 'data-slot'?: string };

	type Props = {
		children?: Snippet;
		child?: Snippet<[{ props: TriggerProps }]>;
	};

	let { children, child }: Props = $props();

	const triggerProps: TriggerProps = { 'data-slot': 'tooltip-trigger' };
</script>

{#if child}
	{@render child({ props: triggerProps })}
{:else}
	{@render children?.()}
{/if}
