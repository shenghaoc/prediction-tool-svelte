<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-5" aria-hidden="true">
	<div class="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
		{#each Array.from({ length: 3 }) as _, index (index)}
			<Skeleton class="animate-shimmer h-[72px] rounded-xl" />
		{/each}
	</div>
	<Skeleton class="animate-shimmer h-px w-full" />
	<div class="space-y-3">
		<Skeleton class="animate-shimmer h-3 w-32 rounded-md" />
		<Skeleton class="animate-shimmer h-4 w-48 rounded-md" />
		<div class="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
			{#each Array.from({ length: 3 }) as _, index (index)}
				<Skeleton class="animate-shimmer h-16 rounded-xl" />
			{/each}
		</div>
		<Skeleton class="animate-shimmer h-[260px] w-full rounded-xl" />
	</div>
</div>
