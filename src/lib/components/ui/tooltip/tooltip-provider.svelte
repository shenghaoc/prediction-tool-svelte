<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		delayDuration?: number;
	};

	let { children }: Props = $props();
</script>

{@render children?.()}
