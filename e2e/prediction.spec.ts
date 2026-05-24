import { expect, test } from '@playwright/test';

const mockTrendData = {
	predictions: [
		{ month: '2021-02', predictedPrice: 580000 },
		{ month: '2021-03', predictedPrice: 586000 },
		{ month: '2021-04', predictedPrice: 592000 },
		{ month: '2021-05', predictedPrice: 599000 },
		{ month: '2021-06', predictedPrice: 603000 },
		{ month: '2021-07', predictedPrice: 610000 },
		{ month: '2021-08', predictedPrice: 616000 },
		{ month: '2021-09', predictedPrice: 621000 },
		{ month: '2021-10', predictedPrice: 628000 },
		{ month: '2021-11', predictedPrice: 634000 },
		{ month: '2021-12', predictedPrice: 641000 },
		{ month: '2022-01', predictedPrice: 647000 },
		{ month: '2022-02', predictedPrice: 654321 }
	]
};

test.describe('happy path', () => {
	test.beforeEach(async ({ page }) => {
		await page.route('**/api/prices', async (route) => {
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

		await expect(
			page.getByRole('heading', { level: 1, name: /Price\s*Prediction/i })
		).toBeVisible();
		await Promise.all([
			page.waitForResponse('**/api/prices'),
			page.getByRole('button', { name: 'Get prediction' }).click()
		]);

		await expect(page.getByText('$654,321').first()).toBeVisible();
		await expect(page.getByText('12M Range')).toBeVisible();
	});

	test('switches the page copy to chinese', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('body[data-theme]');

		const englishHeading = page.getByRole('heading', { level: 1, name: /Price\s*Prediction/i });
		const chineseHeading = page.getByRole('heading', { level: 1, name: /价格\s*预测/ });

		if (await englishHeading.isVisible()) {
			await page.getByRole('button', { name: '中文/English' }).click();
		}

		await expect(chineseHeading).toBeVisible();
		await expect(page.getByText('组屋转售估算')).toBeVisible();
	});
});

test.describe('error handling', () => {
	test('shows error message when server returns 500', async ({ page }) => {
		await page.route('**/api/prices', async (route) => {
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Prediction service unavailable.' })
			});
		});

		await page.goto('/');
		await page.waitForSelector('body[data-theme]');
		await page.getByRole('button', { name: 'Get prediction' }).click();

		await expect(page.getByRole('alert')).toBeVisible();
	});

	test('shows error when server returns malformed JSON', async ({ page }) => {
		await page.route('**/api/prices', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: '{bad json'
			});
		});

		await page.goto('/');
		await page.waitForSelector('body[data-theme]');
		await page.getByRole('button', { name: 'Get prediction' }).click();

		await expect(page.getByRole('alert')).toBeVisible();
	});

	test('shows error when request fails with non-JSON body', async ({ page }) => {
		await page.route('**/api/prices', async (route) => {
			await route.fulfill({
				status: 502,
				contentType: 'text/html',
				body: '<html>Bad Gateway</html>'
			});
		});

		await page.goto('/');
		await page.waitForSelector('body[data-theme]');
		await page.getByRole('button', { name: 'Get prediction' }).click();

		await expect(page.getByRole('alert')).toBeVisible();
	});
});
