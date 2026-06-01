<script lang="ts" module>
	export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

	const VARIANT_CLASS: Record<BadgeVariant, string> = {
		default: 'badge-primary',
		secondary: 'badge-secondary',
		destructive: 'badge-error',
		outline: 'badge-outline',
		ghost: 'badge-ghost',
		link: 'badge-ghost underline'
	};

	export function badgeVariants({ variant = 'default' }: { variant?: BadgeVariant } = {}) {
		return `badge ${VARIANT_CLASS[variant] ?? VARIANT_CLASS.default}`;
	}
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
