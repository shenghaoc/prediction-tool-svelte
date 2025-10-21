<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import dayjs from 'dayjs';
	import utc from 'dayjs/plugin/utc';
	import { ML_MODELS, TOWNS, STOREY_RANGES, FLAT_MODELS } from '$lib/lists';
	import { lang, t } from '$lib/i18n';
	import { get } from 'svelte/store';

	dayjs.extend(utc);

	type FieldType = {
		ml_model: string;
		town: string;
		storey_range: string;
		flat_model: string;
		floor_area_sqm: number;
		lease_commence_date: number; // year
	};

	const initialFormValues: FieldType = {
		ml_model: ML_MODELS[0],
		town: TOWNS[0],
		storey_range: STOREY_RANGES[0],
		flat_model: FLAT_MODELS[0],
		floor_area_sqm: 50,
		lease_commence_date: dayjs().year()
	};

	let form: FieldType = { ...initialFormValues };

	// persistence
	onMount(() => {
		try {
			const saved = typeof window !== 'undefined' && localStorage.getItem('form');
			if (saved) {
				const parsed = JSON.parse(saved);
				form = { ...form, ...parsed };
			}
			const savedTheme = typeof window !== 'undefined' && localStorage.getItem('theme');
			if (savedTheme) {
				document.body.setAttribute('data-theme', savedTheme);
			}
		} catch (e) {
			// ignore
		}
	});

	function persist() {
		try {
			localStorage.setItem('form', JSON.stringify(form));
		} catch {}
	}

	// theme
	let darkMode = false;
	function toggleTheme() {
		darkMode = !darkMode;
		document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	}

	// language
	$: currentLang = get(lang) || 'en';
	function toggleLang() {
		const next = currentLang === 'en' ? 'zh' : 'en';
		lang.set(next);
		localStorage.setItem('lang', next);
	}

	// chart
	let canvas: HTMLCanvasElement | null = null;
	let chart: Chart | null = null;

	function defaultLabels(startYear = form.lease_commence_date) {
		const end = dayjs().utc();
		return [...Array(13).keys()].reverse().map((i) => end.subtract(i, 'month').format('YYYY-MM'));
	}

	let labels = defaultLabels();

	function buildChart(data: number[] = []) {
		if (!canvas) return;
		if (chart) chart.destroy();
		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Trends',
						data: data.length ? data : labels.map(() => 0),
						borderColor: 'rgb(53, 162, 235)',
						backgroundColor: 'rgba(53, 162, 235, 0.5)'
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					legend: { position: 'top' }
				}
			}
		});
	}

	onMount(() => {
		buildChart();
	});

	onDestroy(() => {
		if (chart) chart.destroy();
	});

	let loading = false;
	let output = 0;

	async function handleSubmit(e?: Event) {
		e?.preventDefault();
		persist();
		loading = true;
		// mirror the original app's API shape
		try {
			const formData = new FormData();
			formData.append('ml_model', form.ml_model);
			const curr = dayjs();
			formData.append('month_start', curr.subtract(12, 'month').format('YYYY-MM'));
			formData.append('month_end', curr.format('YYYY-MM'));
			formData.append('town', form.town);
			formData.append('storey_range', form.storey_range);
			formData.append('flat_model', form.flat_model);
			formData.append('floor_area_sqm', String(form.floor_area_sqm));
			formData.append('lease_commence_date', String(form.lease_commence_date));

			const res = await fetch('https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices', {
				method: 'POST',
				body: formData
			});
			if (!res.ok) throw new Error(await res.text());
			const server_data: Array<{ labels: string; data: number }> = await res.json();
			labels = server_data.map((s) => s.labels);
			const data = server_data.map((s) => s.data);
			output = data[data.length - 1] ?? 0;
			buildChart(data);
		} catch (err) {
			console.error('fetch error', err);
			// fallback: show zeros
			buildChart();
		} finally {
			loading = false;
		}
	}

	function handleReset() {
		form = { ...initialFormValues };
		output = 0;
		labels = defaultLabels();
		buildChart();
		persist();
	}
</script>

<style>
	:global(body[data-theme='dark']) {
		background: linear-gradient(135deg,#232946 0%,#16161a 100%);
		color: #fff;
	}
	:global(body[data-theme='light']) {
		background: linear-gradient(135deg,#e0e7ff 0%,#f5f7fa 100%);
		color: #0f172a;
	}
	.container { max-width: 980px; margin: 24px auto; padding: 16px; }
	.card { background: rgba(255,255,255,0.85); padding: 16px; border-radius: 12px; }
	:global(body[data-theme='dark']) .card { background: rgba(36,37,46,0.9); }
	.row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
</style>

<main class="container">
	<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
		<div>
			<button on:click={toggleTheme} aria-label="toggle theme">{darkMode ? '🌙' : '🔆'}</button>
			<button on:click={toggleLang} style="margin-left:8px">{currentLang === 'en' ? '中文' : 'EN'}</button>
		</div>
		<h2>{t('price_prediction', currentLang)}</h2>
	</div>

	<section class="card" style="margin-bottom:18px">
		<h3>{t('prediction_form', currentLang)}</h3>
		<form on:submit|preventDefault={handleSubmit}>
			<div class="row">
				<div style="flex:1;min-width:200px">
					<label>{t('ml_model', currentLang)}</label>
					<select bind:value={form.ml_model} on:change={persist}>
						{#each ML_MODELS as m}
							<option value={m}>{m}</option>
						{/each}
					</select>
				</div>
				<div style="flex:1;min-width:200px">
					<label>{t('town', currentLang)}</label>
					<select bind:value={form.town} on:change={persist}>
						{#each TOWNS as twn}
							<option value={twn}>{twn}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="row" style="margin-top:12px">
				<div style="flex:1;min-width:200px">
					<label>{t('storey_range', currentLang)}</label>
					<select bind:value={form.storey_range} on:change={persist}>
						{#each STOREY_RANGES as s}
							<option value={s}>{s}</option>
						{/each}
					</select>
				</div>
				<div style="flex:1;min-width:200px">
					<label>{t('flat_model', currentLang)}</label>
					<select bind:value={form.flat_model} on:change={persist}>
						{#each FLAT_MODELS as f}
							<option value={f}>{f}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="row" style="margin-top:12px">
				<div style="flex:1;min-width:200px">
					<label>{t('floor_area', currentLang)}</label>
					<input type="number" min="20" max="300" bind:value={form.floor_area_sqm} on:input={persist} />
				</div>
				<div style="flex:1;min-width:200px">
					<label>{t('lease_commence_date', currentLang)}</label>
					<input type="number" min="1960" max={new Date().getFullYear()} bind:value={form.lease_commence_date} on:input={persist} />
				</div>
			</div>

			<div style="display:flex;gap:12px;margin-top:16px">
				<button type="submit" disabled={loading}>{loading ? '...' : t('get_prediction', currentLang)}</button>
				<button type="button" on:click={handleReset}>{t('reset_form', currentLang)}</button>
			</div>
		</form>
	</section>

	<section class="card">
		<div style="display:flex;justify-content:space-between;align-items:center">
			<h3>{t('predicted_price', currentLang)}</h3>
			<div style="font-weight:800;font-size:20px">${output}</div>
		</div>
		<div style="margin-top:12px">
			<canvas bind:this={canvas}></canvas>
		</div>
	</section>
</main>
