<script lang="ts">
	import { onMount } from 'svelte';

	import { lang, t, type Language } from '$lib/i18n';
	import { getPredictionTheme, type FieldType } from '$lib/prediction';
	import PredictionForm from '$lib/components/prediction/PredictionForm.svelte';
	import PredictionResults from '$lib/components/prediction/PredictionResults.svelte';
	import { prediction } from '$lib/stores/prediction';
	import '$lib/components/prediction/prediction.css';

	type FieldName = keyof FieldType;
	let currentLang: Language = 'en';

	$: currentLang = $lang;
	$: theme = getPredictionTheme($prediction.darkMode);
	$: pageStyle = `
		--page-bg:${theme.pageBg};
		--text-color:${theme.text};
		--text-muted:${theme.textMuted};
		--primary-color:${theme.primary};
		--accent-color:${theme.accent};
		--line-soft:${theme.lineSoft};
		--panel-bg:${theme.panelBg};
		--panel-strong:${theme.panelStrong};
		--results-bg:${theme.resultsBg};
		--results-bg-2:${theme.resultsBg2};
		--price-panel-bg:${theme.pricePanelBg};
		--field-bg:${theme.fieldBg};
		--pill-bg:${theme.pillBg};
		--focus-ring:${theme.focusRing};
		--panel-shadow:${theme.shadow};
		--accent-shadow:${theme.accentShadow};
		--mesh-line:${theme.meshLine};
		--orb-color:${theme.orbColor};
		background:${theme.background};
	`;
	function tr(key: string) {
		return t(key, currentLang);
	}

	function toggleTheme() {
		prediction.toggleTheme();
	}

	function toggleLang() {
		const next = currentLang === 'en' ? 'zh' : 'en';
		lang.set(next);
		if (typeof window !== 'undefined') {
			localStorage.setItem('lang', next);
		}
	}

	function updateField<K extends FieldName>(key: K, value: FieldType[K]) {
		prediction.updateField(key, value);
	}

	async function handleSubmit() {
		await prediction.submit();
	}

	onMount(() => {
		return prediction.init();
	});
</script>

<svelte:head>
	<title>{tr('price_prediction')}</title>
</svelte:head>

<main class="prediction-shell" style={pageStyle}>
	<div class="prediction-surface">
		<div class="prediction-topbar">
			<div class="prediction-pill">{tr('intro_eyebrow')}</div>
			<div class="prediction-actions">
				<button class="prediction-ghost-button" type="button" onclick={toggleTheme}>
					{$prediction.darkMode ? 'Light' : 'Dark'}
				</button>
				<button class="prediction-ghost-button" type="button" onclick={toggleLang}>
					{tr('switch_language')}
				</button>
			</div>
		</div>

		<div class="prediction-layout">
			<PredictionForm
				form={$prediction.form}
				fieldErrors={$prediction.fieldErrors}
				loading={$prediction.loading}
				on:submit={handleSubmit}
				on:reset={() => prediction.reset()}
				on:update={(event) =>
					updateField(
						event.detail.key as FieldName,
						event.detail.value as FieldType[FieldName]
					)}
			/>

			<div>
				<PredictionResults
					output={$prediction.output}
					loading={$prediction.loading}
					summaryValues={$prediction.summaryValues}
					trendData={$prediction.trendData}
					{theme}
					isMobile={$prediction.isMobile}
				/>

				{#if $prediction.errorMessage}
					<p class="prediction-error" style="margin-top: 12px;">{$prediction.errorMessage}</p>
				{/if}
			</div>
		</div>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		background: var(--page-bg, #f5eee5);
		color: var(--text-color, #1f2328);
		font-family: 'Avenir Next', Avenir, 'Segoe UI', sans-serif;
		transition:
			background 180ms ease,
			color 180ms ease;
	}
</style>
