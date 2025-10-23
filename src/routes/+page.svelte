<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import dayjs, { type Dayjs } from 'dayjs';
	import customParseFormat from 'dayjs/plugin/customParseFormat';
	import utc from 'dayjs/plugin/utc';
		import { ML_MODELS, TOWNS, STOREY_RANGES, FLAT_MODELS } from '$lib/lists';
		import { lang, t } from '$lib/i18n';
		import { formatCurrency } from '$lib/format';
	dayjs.extend(customParseFormat);
	dayjs.extend(utc);

	type FieldType = {
		ml_model: string;
		town: string;
		storey_range: string;
		flat_model: string;
		floor_area_sqm: number;
		lease_commence_date: number;
	};

	let curr = dayjs.utc('2022-02', 'YYYY-MM');

	const initialFormValues: FieldType = {
		ml_model: ML_MODELS[0],
		town: TOWNS[0],
		storey_range: STOREY_RANGES[0],
		flat_model: FLAT_MODELS[0],
		floor_area_sqm: 20,
		lease_commence_date: curr.year()
	};

	let form: FieldType = $state({ ...initialFormValues });

		// persistence + theme + lang
		let darkMode = $state(false);

	onMount(() => {
			try {
				const saved = typeof window !== 'undefined' && localStorage.getItem('form');
				if (saved) {
					const parsed = JSON.parse(saved);
					form = { ...form, ...parsed };
				}
			const savedTheme = typeof window !== 'undefined' && localStorage.getItem('theme');
			if (savedTheme) {
				darkMode = savedTheme === 'dark';
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

	function toggleTheme() {
		darkMode = !darkMode;
		const theme = darkMode ? 'dark' : 'light';
		document.body.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}

		// language helpers (use $lang auto-subscription)
		let currentLang = $derived($lang || 'en');
	function toggleLang() {
		const next = currentLang === 'en' ? 'zh' : 'en';
		lang.set(next);
		localStorage.setItem('lang', next);
	}

		function tr(k: Parameters<typeof t>[0]) {
			return t(k, currentLang as 'en' | 'zh');
		}

	// chart
	let canvas: HTMLCanvasElement | null = $state(null);
	let chart: Chart | null = null;

	function defaultLabels() {
		const end = dayjs().utc();
		return [...Array(13).keys()].reverse().map((i) => end.subtract(i, 'month').format('YYYY-MM'));
	}

	let labels: string[] = defaultLabels();

	function initChart() {
		if (!canvas) return;
		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Trends',
						data: labels.map(() => 0),
						borderColor: 'rgb(53, 162, 235)',
						backgroundColor: 'rgba(53, 162, 235, 0.2)',
						tension: 0.3
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'top' }
				},
				scales: {
					x: { grid: { display: false } }
				}
			}
		});
	}

	function updateChart(data: number[]) {
		if (!chart) return;
		chart.data.labels = labels;
		chart.data.datasets![0].data = data;
		chart.update();
	}

	onMount(() => initChart());
	onDestroy(() => { if (chart) chart.destroy(); });

	let loading = $state(false);
	let output = $state(0);

	async function handleSubmit(e?: Event) {
		e?.preventDefault();
		persist();
		loading = true;
		try {
			const formData = new FormData();
			formData.append('ml_model', form.ml_model);
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
			updateChart(data);
		} catch (err) {
			console.error('fetch error', err);
			updateChart(labels.map(() => 0));
		} finally {
			loading = false;
		}
	}

	function handleReset() {
		form = { ...initialFormValues };
		output = 0;
		labels = defaultLabels();
		updateChart(labels.map(() => 0));
		persist();
	}
</script>

<style>
	:root{
		--bg-light: linear-gradient(135deg,#e0e7ff 0%,#f5f7fa 100%);
		--bg-dark: linear-gradient(135deg,#232946 0%,#16161a 100%);
		--card-light: rgba(255,255,255,0.9);
		--card-dark: rgba(24,25,32,0.9);
		--accent: #6366f1;
	}
	:global(body){
		font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
		margin:0; padding:0;
	}
	:global(body[data-theme='dark']){ background: var(--bg-dark); color: #fff }
	:global(body[data-theme='light']){ background: var(--bg-light); color: #0f172a }

	.container { max-width: 1080px; margin: 28px auto; padding: 20px; }
	.top { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:18px }
	h2 { margin:0; font-size:1.6rem }
	.card { padding:18px; border-radius:14px; box-shadow: 0 8px 30px rgba(15,23,42,0.06); background:var(--card-light) }
	:global(body[data-theme='dark']) .card { background: var(--card-dark); box-shadow: 0 8px 30px rgba(0,0,0,0.6) }

	label { display:block; font-size:0.9rem; margin-bottom:6px; color:inherit }
	select, input[type=number] { width:100%; padding:10px 12px; border-radius:8px; border:1px solid rgba(15,23,42,0.06); background:transparent }
	button { padding:10px 14px; border-radius:10px; border:none; cursor:pointer }
	button.primary { background:linear-gradient(90deg,var(--accent),#60a5fa); color:#fff; font-weight:700 }
	button.ghost { background:transparent; border:1.2px solid rgba(15,23,42,0.08) }

	.value { font-weight:800; font-size:1.4rem }
	.chart-wrap{ height:320px; }
</style>

<main class="container">
		<div class="top">
			<div>
				<button class="ghost" onclick={toggleTheme} aria-label="toggle theme">{darkMode ? '🌙' : '🔆'}</button>
				<button class="ghost" onclick={toggleLang} style="margin-left:8px">{currentLang === 'en' ? '中文' : 'EN'}</button>
			</div>
			<h2>{t('price_prediction', currentLang)}</h2>
		</div>

	<section class="card" style="margin-bottom:18px">
		<h3>{t('prediction_form', currentLang)}</h3>
		<form onsubmit={preventDefault(handleSubmit)}>
					<div class="row">
						<div style="flex:1;min-width:200px">
							<label for="ml_model">{t('ml_model', currentLang)}</label>
							<select id="ml_model" bind:value={form.ml_model} onchange={persist}>
								{#each ML_MODELS as m}
									<option value={m}>{m}</option>
								{/each}
							</select>
						</div>
						<div style="flex:1;min-width:200px">
							<label for="town">{t('town', currentLang)}</label>
							<select id="town" bind:value={form.town} onchange={persist}>
								{#each TOWNS as twn}
									<option value={twn}>{twn}</option>
								{/each}
							</select>
						</div>
					</div>

			<div class="row" style="margin-top:12px">
						<div style="flex:1;min-width:200px">
							<label for="storey_range">{t('storey_range', currentLang)}</label>
							<select id="storey_range" bind:value={form.storey_range} onchange={persist}>
								{#each STOREY_RANGES as s}
									<option value={s}>{s}</option>
								{/each}
							</select>
						</div>
						<div style="flex:1;min-width:200px">
							<label for="flat_model">{t('flat_model', currentLang)}</label>
							<select id="flat_model" bind:value={form.flat_model} onchange={persist}>
								{#each FLAT_MODELS as f}
									<option value={f}>{f}</option>
								{/each}
							</select>
						</div>
			</div>

			<div class="row" style="margin-top:12px">
						<div style="flex:1;min-width:200px">
							<label for="floor_area">{t('floor_area', currentLang)}</label>
							<input id="floor_area" type="number" min="20" max="300" bind:value={form.floor_area_sqm} oninput={persist} />
						</div>
						<div style="flex:1;min-width:200px">
							<label for="lease_commence_date">{t('lease_commence_date', currentLang)}</label>
							<input id="lease_commence_date" type="number" min={ 1960 } max={ 2022 } bind:value={form.lease_commence_date} oninput={persist} />
						</div>
			</div>

					<div style="display:flex;gap:12px;margin-top:16px">
						<button class="primary" type="submit" disabled={loading}>{loading ? '...' : t('get_prediction', currentLang)}</button>
						<button class="ghost" type="button" onclick={handleReset}>{t('reset_form', currentLang)}</button>
					</div>
		</form>
	</section>

	<section class="card">
		<div style="display:flex;justify-content:space-between;align-items:center">
					<h3>{t('predicted_price', currentLang)}</h3>
					<div class="value">{formatCurrency(output)}</div>
		</div>
		<div style="margin-top:12px">
					<div class="chart-wrap">
						<canvas bind:this={canvas}></canvas>
					</div>
		</div>
	</section>
</main>
