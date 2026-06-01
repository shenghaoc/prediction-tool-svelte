<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	export type ButtonVariant =
		| 'default'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'destructive'
		| 'link';
	export type ButtonSize =
		| 'default'
		| 'xs'
		| 'sm'
		| 'lg'
		| 'icon'
		| 'icon-xs'
		| 'icon-sm'
		| 'icon-lg';

	const VARIANT_CLASS: Record<ButtonVariant, string> = {
		default: 'btn-primary',
		outline: 'btn-outline',
		secondary: 'btn-secondary',
		ghost: 'btn-ghost',
		destructive: 'btn-error btn-outline',
		link: 'btn-link'
	};

	const SIZE_CLASS: Record<ButtonSize, string> = {
		default: '',
		xs: 'btn-xs',
		sm: 'btn-sm',
		lg: 'btn-lg',
		icon: 'btn-square',
		'icon-xs': 'btn-square btn-xs',
		'icon-sm': 'btn-square btn-sm',
		'icon-lg': 'btn-square btn-lg'
	};

	export function buttonVariants({
		variant = 'default',
		size = 'default'
	}: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
		return cn('btn', VARIANT_CLASS[variant] ?? VARIANT_CLASS.default, SIZE_CLASS[size] ?? '');
	}

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
