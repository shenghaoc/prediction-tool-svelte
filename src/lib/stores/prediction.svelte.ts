import { browser } from '$app/environment';
import { createContext } from 'svelte';

function applyTheme(darkMode: boolean) {
	if (!browser) return;
	try {
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	} catch {
		// Storage unavailable or blocked
	}
	document.documentElement.classList.toggle('dark', darkMode);
	document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
	document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}

function readInitialDarkMode(): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem('theme') === 'dark';
	} catch {
		return false;
	}
}

/** Theme preference only — prediction form/results use superforms + page action. */
export class PredictionStore {
	darkMode = $state(false);

	init() {
		if (!browser) return;
		this.darkMode = readInitialDarkMode();
		applyTheme(this.darkMode);
	}

	toggleTheme() {
		this.darkMode = !this.darkMode;
		applyTheme(this.darkMode);
	}
}

export const [getPredictionContext, setPredictionContext] = createContext<PredictionStore>();
