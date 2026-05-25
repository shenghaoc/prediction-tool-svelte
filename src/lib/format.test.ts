import { describe, expect, it } from 'vitest';

import { formatCurrency } from './format';

describe('formatCurrency', () => {
	it('reuses cached formatters for case-insensitive locale keys', () => {
		expect(formatCurrency(1000, 'en-SG')).toBe(formatCurrency(1000, 'en-sg'));
	});
});
