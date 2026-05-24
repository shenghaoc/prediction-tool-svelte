<script lang="ts">
	import { browser } from '$app/environment';
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { prediction } from '$lib/stores/prediction';

	let { children } = $props();

	function readStoredTheme(): 'light' | 'dark' {
		if (!browser) return 'light';
		return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
	}

	let toasterTheme = $state<'light' | 'dark'>(readStoredTheme());

	$effect(() => {
		toasterTheme = $prediction.darkMode ? 'dark' : 'light';
	});
</script>

{@render children()}

<Toaster theme={toasterTheme} richColors closeButton />
