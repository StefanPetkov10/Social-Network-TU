import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('Groups Discover Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/groups/discover');
        await expect(page.getByRole('heading', { name: 'Намерете своята общност' })).toBeVisible({ timeout: 15_000 });
    });

    test.describe('Page Layout', () => {

        test('should display page headings and descriptions', async ({ page }) => {
            await expect(page.getByRole('main').getByText('Откриване')).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Намерете своята общност' })).toBeVisible();
            await expect(page.getByText('Разгледайте групи, препоръчани специално за вас на базата на вашите приятели.')).toBeVisible();
        });

        test('should display recommended groups with mocked data', async ({ page }) => {
            await page.route('**/api/Group/discover*', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: null,
                        data: [
                            { id: 'group-03', name: 'Група 1', description: 'Интересна група', bannerUrl: null, avatarUrl: null, privacy: 0, requireApproval: false, membersCount: 100, isMember: false },
                            { id: 'group-04', name: 'Група 2', description: 'Друга група', bannerUrl: null, avatarUrl: null, privacy: 1, requireApproval: true, membersCount: 50, isMember: false }
                        ]
                    }),
                });
            });

            await page.reload();
            await expect(page.getByRole('heading', { name: 'Намерете своята общност' })).toBeVisible({ timeout: 15_000 });

            await expect(page.getByText('Група 1')).toBeVisible();
            await expect(page.getByText('Група 2')).toBeVisible();

            await expect(page.getByRole('button', { name: 'Присъедини се' }).first()).toBeVisible();
        });

        test('should display empty state when no suggestions exist', async ({ page }) => {
            await page.route('**/api/Group/discover*', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: null,
                        data: []
                    }),
                });
            });

            await page.reload();
            await expect(page.getByRole('heading', { name: 'Няма намерени предложения' })).toBeVisible();
            await expect(page.getByText('Опитайте да добавите още приятели, за да видите къде членуват те.')).toBeVisible();
        });
    });

    test.describe('Navigation', () => {
        test('should redirect to login if not authenticated', async ({ page }) => {
            await page.evaluate(() => sessionStorage.removeItem('auth-storage'));
            await page.goto('/groups/discover');
            await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        });

        test('should have active link in sidebar', async ({ page }) => {
            await page.goto('/groups');
            await expect(page.getByRole('heading', { name: 'Скорошна дейност' })).toBeVisible({ timeout: 15_000 });

            await page.getByRole('link', { name: 'Откриване' }).click();

            await expect(page).toHaveURL(/\/groups\/discover/, { timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Намерете своята общност' })).toBeVisible();
        });
    });
});
