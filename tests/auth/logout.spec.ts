import { test, expect } from '@playwright/test';

test.describe('Logout', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/login');
        await page.getByRole('textbox', { name: 'Username or Email' }).fill(process.env.TEST_USER_EMAIL!);
        await page.getByRole('textbox', { name: 'Password' }).fill(process.env.TEST_USER_PASSWORD!);
        await page.getByRole('button', { name: 'Login', exact: true }).click();

        await page.waitForURL('/', { timeout: 15_000 });
        await expect(page).toHaveURL(/\/$/);
    });

    test('should display user dropdown menu with logout option', async ({ page }) => {
        await page.getByRole('button', { name: 'S', exact: true }).click();

        await expect(page.getByText('Изход')).toBeVisible();
        await expect(page.getByText('Настройки')).toBeVisible();
        await expect(page.getByText('Преглед на профила')).toBeVisible();
    });

    test('should logout and redirect to login page', async ({ page }) => {
        await page.getByRole('button', { name: 'S', exact: true }).click();

        await page.getByText('Изход').click();

        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    });

    test('should clear auth token from sessionStorage after logout', async ({ page }) => {
        await page.getByRole('button', { name: 'S', exact: true }).click();

        await page.getByText('Изход').click();

        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });

        const authStorage = await page.evaluate(() => sessionStorage.getItem('auth-storage'));
        const parsed = authStorage ? JSON.parse(authStorage) : null;
        expect(parsed?.state?.token).toBeNull();
    });

    test('should not be able to access home page after logout', async ({ page }) => {
        await page.getByRole('button', { name: 'S', exact: true }).click();

        await page.getByText('Изход').click();

        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });

        await page.goto('/');

        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    });
});
