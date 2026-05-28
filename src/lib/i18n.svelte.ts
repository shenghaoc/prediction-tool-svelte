import { createContext } from 'svelte';

import { getValue, persistLanguage, type Language } from './i18n';

export class I18n {
	lang = $state<Language>('en');

	constructor(initial: Language = 'en') {
		this.lang = initial;
	}

	t = (key: string): string => getValue(this.lang, key) ?? getValue('en', key) ?? key;

	setLanguage(next: Language) {
		this.lang = next;
		persistLanguage(next);
	}
}

export const [getI18nContext, setI18nContext] = createContext<I18n>();
