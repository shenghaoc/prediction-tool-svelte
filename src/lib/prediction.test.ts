import { describe, expect, it } from 'vitest';

import {
	defaultTrendData,
	formatCurrencyTick,
	formatMonthLabel,
	normalizePrice,
	normalizeTrendData
} from '$lib/prediction';

describe('prediction helpers', () => {
	it('builds a 13-point default trend ending at the base prediction month', () => {
		const trend = defaultTrendData();

		expect(trend).toHaveLength(13);
		expect(trend[0]).toEqual({ label: '2021-02', value: 0 });
		expect(trend[12]).toEqual({ label: '2022-02', value: 0 });
	});

	it('normalizes prices by clamping negatives and rounding', () => {
		expect(normalizePrice(123456.7)).toBe(123457);
		expect(normalizePrice(-10)).toBe(0);
		expect(normalizePrice(Number.NaN)).toBe(0);
	});

	it('normalizes trend payloads from the API', () => {
		expect(
			normalizeTrendData({
				predictions: [
					{ month: '2022-01', predictedPrice: 101_234.9 },
					{ month: '2022-02', predictedPrice: -50 }
				]
			})
		).toEqual([
			{ label: '2022-01', value: 101_235 },
			{ label: '2022-02', value: 0 }
		]);
	});

	it('formats raw YYYY-MM labels into localized month names', () => {
		expect(formatMonthLabel('2025-03', 'en-SG')).toBe('Mar 2025');
		expect(formatMonthLabel('2022-02', 'en-SG')).toBe('Feb 2022');
		// zh-SG localizes the month name (year年month月).
		expect(formatMonthLabel('2025-03', 'zh-SG')).toContain('2025');
		expect(formatMonthLabel('2025-03', 'zh-SG')).toContain('3月');
	});

	it('returns unparseable labels verbatim', () => {
		expect(formatMonthLabel('not-a-month')).toBe('not-a-month');
		expect(formatMonthLabel('2025-13')).toBe('2025-13');
	});

	it('formats chart ticks compactly', () => {
		expect(formatCurrencyTick(950)).toBe('$950');
		expect(formatCurrencyTick(125_000)).toBe('$125k');
		expect(formatCurrencyTick(1_250_000)).toBe('$1.3M');
	});
});
