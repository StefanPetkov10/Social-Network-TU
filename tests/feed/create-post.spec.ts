import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('Create Post', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
    });

    test.describe('Dialog Opening', () => {

        test('should open dialog by clicking text trigger', async ({ page }) => {
            await page.getByText('За какво си мислите').click();
            await expect(page.getByText('Създаване на публикация')).toBeVisible();
        });

        test('should open dialog by clicking media button', async ({ page }) => {
            await page.getByRole('button', { name: /Снимка|Медия/ }).click();
            await expect(page.getByText('Създаване на публикация')).toBeVisible();
        });

        test('should open dialog by clicking document button', async ({ page }) => {
            await page.getByRole('button', { name: /Документ/ }).click();
            await expect(page.getByText('Създаване на публикация')).toBeVisible();
        });

        test('should close dialog with X button', async ({ page }) => {
            await page.getByText('За какво си мислите').click();
            await expect(page.getByText('Създаване на публикация')).toBeVisible();

            await page.getByRole('button', { name: 'Close' }).click();
            await expect(page.getByText('Създаване на публикация')).toBeHidden();
        });
    });

    test.describe('Dialog Elements', () => {

        test.beforeEach(async ({ page }) => {
            await page.getByText('За какво си мислите').click();
            await expect(page.getByText('Създаване на публикация')).toBeVisible();
        });

        test('should display user info and visibility selector', async ({ page }) => {
            await expect(page.getByText('Публично').first()).toBeVisible();
        });

        test('should display textarea placeholder', async ({ page }) => {
            const textarea = page.getByRole('textbox');
            await expect(textarea).toBeVisible();
        });

        test('should display publish button', async ({ page }) => {
            await expect(page.getByRole('button', { name: 'Публикуване' })).toBeVisible();
        });

        test('should display attachment area', async ({ page }) => {
            await expect(page.getByText('Добавете към публикацията')).toBeVisible();
        });

        test('should show GIF button with coming soon message', async ({ page }) => {
            const gifButton = page.locator('button:has-text("GIF")');
            await gifButton.click();

            await expect(page.getByText('GIPHY интеграция - скоро...')).toBeVisible();
        });
    });

    test.describe('Visibility Options', () => {

        test.beforeEach(async ({ page }) => {
            await page.getByText('За какво си мислите').click();
            await expect(page.getByText('Създаване на публикация')).toBeVisible();
        });

        test('should default to Public visibility', async ({ page }) => {
            await expect(page.getByText('Публично').first()).toBeVisible();
        });

        test('should allow changing to Friends visibility', async ({ page }) => {
            await page.getByText('Публично').first().click();
            await page.getByRole('option', { name: 'Приятели' }).click();
            await expect(page.getByText('Приятели').first()).toBeVisible();
        });

        test('should allow changing to Only me visibility', async ({ page }) => {
            await page.getByText('Публично').first().click();
            await page.getByRole('option', { name: 'Само аз' }).click();
            await expect(page.getByText('Само аз').first()).toBeVisible();
        });
    });

    test.describe('Validation', () => {

        test.beforeEach(async ({ page }) => {
            await page.getByText('За какво си мислите').click();
            await expect(page.getByText('Създаване на публикация')).toBeVisible();
        });

        test('should show error when submitting empty post', async ({ page }) => {
            await page.getByRole('button', { name: 'Публикуване' }).click();
            await expect(page.getByText('Моля, напишете нещо.')).toBeVisible();
        });

        test('should show error when content exceeds 500 characters', async ({ page }) => {
            const longText = 'A'.repeat(501);
            await page.getByRole('textbox').fill(longText);
            await page.getByRole('button', { name: 'Публикуване' }).click();

            await expect(page.getByText('Текстът не може да надвишава 500 символа.')).toBeVisible();
        });
    });

    test.describe('Successful Post Creation', () => {

        test('should create text post and close dialog', async ({ page }) => {
            const uniqueText = `Тестов пост ${Date.now()}`;

            await page.getByText('За какво си мислите').click();
            await page.getByRole('textbox').fill(uniqueText);
            await page.getByRole('button', { name: 'Публикуване' }).click();

            await expect(page.getByText('Създаване на публикация')).toBeHidden({ timeout: 15_000 });
            await expect(page.getByText(uniqueText)).toBeVisible({ timeout: 10_000 });
        });

        test('should show loading state during submission', async ({ page }) => {
            await page.route('**/api/Posts', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 2_000));
                await route.continue();
            });

            await page.getByText('За какво си мислите').click();
            await page.getByRole('textbox').fill('Тестов пост за loading state');
            await page.getByRole('button', { name: 'Публикуване' }).click();

            await expect(page.getByText('Публикуване...')).toBeVisible({ timeout: 5_000 });
        });

        test('should create post with Friends visibility', async ({ page }) => {
            const uniqueText = `Приятелски пост ${Date.now()}`;

            await page.getByText('За какво си мислите').click();
            await page.getByText('Публично').first().click();
            await page.getByRole('option', { name: 'Приятели' }).click();
            await expect(page.getByText('Приятели').first()).toBeVisible();

            await page.getByRole('textbox').fill(uniqueText);
            await page.getByRole('button', { name: 'Публикуване' }).click();

            await expect(page.getByText('Създаване на публикация')).toBeHidden({ timeout: 15_000 });
        });
    });
});
