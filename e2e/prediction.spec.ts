import { expect, test } from '@playwright/test';

async function routeE2eMock(
	page: import('@playwright/test').Page,
	mode: 'success' | 'error_500' | 'error_invalid' | 'error_text'
) {
	await page.route('**/*', async (route) => {
		const request = route.request();
		if (request.method() !== 'POST') {
			await route.continue();
			return;
		}

		const headers = {
			...request.headers(),
			'x-e2e-mock': mode
		};
		await route.continue({ headers });
	});
}

test.describe('happy path', () => {
	test.beforeEach(async ({ page }) => {
		await routeE2eMock(page, 'success');
	});

	test('renders the prediction flow and updates the chart summary', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('html[data-theme]');

		await expect(page.getByRole('heading', { level: 1, name: /Price\s*Prediction/i })).toBeVisible({
			timeout: 15_000
		});
		await page.getByRole('button', { name: 'Get prediction' }).click();

		await expect(page.getByText('$654,321').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText('12M Range')).toBeVisible({ timeout: 15_000 });
	});

	test('switches the page copy to chinese', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('html[data-theme]');
		await expect(page.getByRole('button', { name: 'Get prediction' })).toBeVisible({
			timeout: 15_000
		});

		const englishHeading = page.getByRole('heading', { level: 1, name: /Price/i });
		const chineseHeading = page.getByRole('heading', { level: 1, name: /价格/ });

		if (await englishHeading.isVisible()) {
			await page.getByRole('button', { name: '中文/English' }).click();
		}

		await expect(chineseHeading).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText('组屋转售估算')).toBeVisible({ timeout: 15_000 });
	});
});

test.describe('error handling', () => {
	test('shows error message when server returns 500', async ({ page }) => {
		await routeE2eMock(page, 'error_500');
		await page.goto('/');
		await page.waitForSelector('html[data-theme]');
		await page.getByRole('button', { name: 'Get prediction' }).click();

		await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 });
	});

	test('shows error when server returns malformed JSON', async ({ page }) => {
		await routeE2eMock(page, 'error_invalid');
		await page.goto('/');
		await page.waitForSelector('html[data-theme]');
		await page.getByRole('button', { name: 'Get prediction' }).click();

		await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 });
	});

	test('shows error when request fails with non-JSON body', async ({ page }) => {
		await routeE2eMock(page, 'error_text');
		await page.goto('/');
		await page.waitForSelector('html[data-theme]');
		await page.getByRole('button', { name: 'Get prediction' }).click();

		await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 });
	});
});
