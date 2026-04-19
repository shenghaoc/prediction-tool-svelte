import { expect, test } from '@playwright/test';

const mockTrendData = [
	{ labels: '2021-02', data: 580000 },
	{ labels: '2021-03', data: 586000 },
	{ labels: '2021-04', data: 592000 },
	{ labels: '2021-05', data: 599000 },
	{ labels: '2021-06', data: 603000 },
	{ labels: '2021-07', data: 610000 },
	{ labels: '2021-08', data: 616000 },
	{ labels: '2021-09', data: 621000 },
	{ labels: '2021-10', data: 628000 },
	{ labels: '2021-11', data: 634000 },
	{ labels: '2021-12', data: 641000 },
	{ labels: '2022-01', data: 647000 },
	{ labels: '2022-02', data: 654321 }
];

test.beforeEach(async ({ page }) => {
	await page.route('https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockTrendData)
		});
	});
});

test('renders the prediction flow and updates the chart summary', async ({ page }) => {
	await page.goto('/');
	await page.waitForSelector('body[data-theme]');

	await expect(page.getByRole('heading', { level: 1, name: 'Price Prediction' })).toBeVisible();
	await Promise.all([
		page.waitForResponse('https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices'),
		page.getByRole('button', { name: 'Get prediction' }).click()
	]);

	await expect(page.locator('.prediction-price-panel strong').last()).toContainText('654,321');
	await expect(page.locator('.prediction-chart-summary-grid')).toContainText('$654,321');
});

test('switches the page copy to chinese', async ({ page }) => {
	await page.goto('/');
	await page.waitForSelector('body[data-theme]');

	const englishHeading = page.getByRole('heading', { level: 1, name: 'Price Prediction' });
	const chineseHeading = page.getByText('价格预测');

	if (await englishHeading.isVisible()) {
		await page.getByRole('button', { name: '中文/English' }).click();
	}

	await expect(chineseHeading).toBeVisible();
	await expect(page.getByText('新加坡组屋转售价估算器')).toBeVisible();
});
