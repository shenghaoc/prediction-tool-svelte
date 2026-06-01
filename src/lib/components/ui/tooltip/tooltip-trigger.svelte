<script lang="ts">
	import type { Snippet } from 'svelte';

	type TriggerProps = {
		'data-slot'?: string;
		'aria-describedby'?: string;
	};

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
