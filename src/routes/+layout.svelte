<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { prediction } from '$lib/stores/prediction';

	let { children } = $props();
</script>

{@render children()}

<Toaster theme={$prediction.darkMode ? 'dark' : 'light'} richColors closeButton />
