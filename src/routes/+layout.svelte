<script lang="ts">
	import { browser } from '$app/environment';
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { getStoredLanguage } from '$lib/i18n';
	import { I18n, setI18nContext } from '$lib/i18n.svelte';
	import { PredictionStore, setPredictionContext } from '$lib/stores/prediction.svelte';

	let { children } = $props();

	const i18n = setI18nContext(new I18n(browser ? getStoredLanguage() : 'en'));
	const prediction = setPredictionContext(new PredictionStore(i18n));

	const toasterTheme = $derived(prediction.darkMode ? 'dark' : 'light');
</script>

{@render children()}

<Toaster theme={toasterTheme} richColors closeButton />
