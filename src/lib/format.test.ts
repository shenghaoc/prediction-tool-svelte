import { describe, expect, it, vi } from 'vitest';

import { formatCurrency } from './format';

describe('formatCurrency', () => {
	it('produces identical output for case-variant locale strings', () => {
		expect(formatCurrency(1000, 'en-SG')).toBe(formatCurrency(1000, 'en-sg'));
	});

	it('falls back to a rounded dollar string when formatting throws', () => {
		const numberFormat = vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
			throw new Error('invalid locale');
		});

		expect(formatCurrency(1234.6, 'xx-XX')).toBe('$1235');

		numberFormat.mockRestore();
	});
});
