export function formatCurrency(n: number, locale: string = 'en-SG') {
	try {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: 'SGD',
			maximumFractionDigits: 0
		}).format(n);
	} catch {
		return `$${Math.round(n)}`;
	}
}
