import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('My Groups Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/groups/my-groups');
        await expect(page.getByRole('heading', { name: 'Вашите групи', exact: true })).toBeVisible({ timeout: 15_000 });
    });

    test.describe('Page Layout', () => {

        test('should display page heading and description', async ({ page }) => {
            await expect(page.getByRole('heading', { name: 'Вашите групи', exact: true })).toBeVisible();
            await expect(page.getByText('Управлявайте групите, в които членувате или притежавате.')).toBeVisible();
            await expect(page.getByRole('main').getByRole('button', { name: 'Създаване на нова група' })).toBeVisible();
        });

        test('should display groups in the main area with mocked data', async ({ page }) => {
            await page.route('**/api/Group/my-groups', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: null,
                        data: [
                            { id: 'group-01', name: 'Моята Група 1', description: 'Описание', bannerUrl: null, avatarUrl: null, privacy: 0, requireApproval: false, membersCount: 10, isMember: true },
                            { id: 'group-02', name: 'Моята Група 2', description: 'Описание 2', bannerUrl: null, avatarUrl: null, privacy: 1, requireApproval: true, membersCount: 5, isMember: true }
                        ]
                    }),
                });
            });

            await page.reload();
            await expect(page.getByRole('heading', { name: 'Вашите групи', exact: true })).toBeVisible({ timeout: 15_000 });

            await expect(page.getByRole('link', { name: 'Моята Група 1' }).first()).toBeVisible();
            await expect(page.getByRole('link', { name: 'Моята Група 2' }).first()).toBeVisible();

            await expect(page.getByRole('button', { name: 'Към групата' }).first()).toBeVisible();
        });

        test('should display empty state when no groups exist', async ({ page }) => {
            await page.route('**/api/Group/my-groups', async (route) => {
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
            await expect(page.getByRole('heading', { name: 'Все още нямате групи' })).toBeVisible();
            await expect(page.getByText('Когато се присъедините към група или създадете нова, тя ще се появи тук.')).toBeVisible();
        });
    });

    test.describe('Navigation', () => {
        test('should redirect to login if not authenticated', async ({ page }) => {
            await page.evaluate(() => sessionStorage.removeItem('auth-storage'));
            await page.goto('/groups/my-groups');
            await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        });

        test('should have active link in sidebar', async ({ page }) => {
            await page.goto('/groups');
            await expect(page.getByRole('heading', { name: 'Скорошна дейност' })).toBeVisible({ timeout: 15_000 });

            await page.getByRole('link', { name: 'Вашите групи' }).click();

            await expect(page).toHaveURL(/\/groups\/my-groups/, { timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Вашите групи' })).toBeVisible();
        });
    });
});
