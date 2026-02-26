import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('Change Password - Page Layout', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/profile/change-password');
        await expect(page.locator('[data-slot="card-title"]', { hasText: 'Смяна на парола' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display title', async ({ page }) => {
        await expect(page.locator('[data-slot="card-title"]', { hasText: 'Смяна на парола' })).toBeVisible();
    });

    test('should display all 3 password fields', async ({ page }) => {
        await expect(page.getByPlaceholder('Въведете текущата парола')).toBeVisible();
        await expect(page.getByPlaceholder('Въведете новата парола')).toBeVisible();
        await expect(page.getByPlaceholder('Повторете новата парола')).toBeVisible();
    });

    test('should display submit button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Промени паролата' })).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Обратно към профила/ })).toBeVisible();
    });
});

test.describe('Change Password - Validation', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/profile/change-password');
        await expect(page.locator('[data-slot="card-title"]', { hasText: 'Смяна на парола' })).toBeVisible({ timeout: 15_000 });
    });

    test('should show error on empty fields', async ({ page }) => {
        await page.getByRole('button', { name: 'Промени паролата' }).click();
        await expect(page.getByText('Моля, въведете текущата парола.')).toBeVisible();
    });

    test('should show error when password is too short', async ({ page }) => {
        await page.getByPlaceholder('Въведете текущата парола').fill(process.env.TEST_USER_PASSWORD!);
        await page.getByPlaceholder('Въведете новата парола').fill('Abc!1');
        await page.getByPlaceholder('Повторете новата парола').fill('Abc!1');
        await page.getByRole('button', { name: 'Промени паролата' }).click();

        await expect(page.getByText('Минимум 8 символа.')).toBeVisible();
    });

    test('should show error when no uppercase letter', async ({ page }) => {
        await page.getByPlaceholder('Въведете текущата парола').fill(process.env.TEST_USER_PASSWORD!);
        await page.getByPlaceholder('Въведете новата парола').fill('abcdefg!1');
        await page.getByPlaceholder('Повторете новата парола').fill('abcdefg!1');
        await page.getByRole('button', { name: 'Промени паролата' }).click();

        await expect(page.getByText('Трябва да съдържа главна буква.')).toBeVisible();
    });

    test('should show error when no special character', async ({ page }) => {
        await page.getByPlaceholder('Въведете текущата парола').fill(process.env.TEST_USER_PASSWORD!);
        await page.getByPlaceholder('Въведете новата парола').fill('Abcdefg1');
        await page.getByPlaceholder('Повторете новата парола').fill('Abcdefg1');
        await page.getByRole('button', { name: 'Промени паролата' }).click();

        await expect(page.getByText('Трябва да съдържа специален символ.')).toBeVisible();
    });

    test('should show error when passwords do not match', async ({ page }) => {
        await page.getByPlaceholder('Въведете текущата парола').fill(process.env.TEST_USER_PASSWORD!);
        await page.getByPlaceholder('Въведете новата парола').fill('NewPass123!');
        await page.getByPlaceholder('Повторете новата парола').fill('DifferentPass!');
        await page.getByRole('button', { name: 'Промени паролата' }).click();

        await expect(page.getByText('Паролите не съвпадат.')).toBeVisible();
    });

    test('should show error when new password equals current', async ({ page }) => {
        await page.getByPlaceholder('Въведете текущата парола').fill(process.env.TEST_USER_PASSWORD!);
        await page.getByPlaceholder('Въведете новата парола').fill(process.env.TEST_USER_PASSWORD!);
        await page.getByPlaceholder('Повторете новата парола').fill(process.env.TEST_USER_PASSWORD!);
        await page.getByRole('button', { name: 'Промени паролата' }).click();

        await expect(page.getByText('Новата парола трябва да е различна от текущата.')).toBeVisible();
    });
});

test.describe('Change Password - Forgot Password', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/profile/change-password');
        await expect(page.locator('[data-slot="card-title"]', { hasText: 'Смяна на парола' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display forgot password section', async ({ page }) => {
        await expect(page.getByText('Не помните текущата си парола?')).toBeVisible();
        await expect(page.getByText('Забравена парола?')).toBeVisible();
    });

    test('should show user email in forgot password button', async ({ page }) => {
        await expect(page.getByText(/Получете код на/)).toBeVisible();
    });

    test('should navigate back to profile', async ({ page }) => {
        await page.getByRole('button', { name: /Обратно към профила/ }).click();
        await expect(page).toHaveURL(/\/profile/, { timeout: 10_000 });
    });
});

test.describe('Change Password - Navigation', () => {

    test('should navigate to change password from header dropdown', async ({ page }) => {
        await loginAsTestUser(page);

        await page.getByRole('button', { name: 'S', exact: true }).click();
        await page.getByRole('menuitem', { name: 'Смяна на парола' }).click();

        await expect(page).toHaveURL(/\/profile\/change-password/, { timeout: 10_000 });
    });
});
