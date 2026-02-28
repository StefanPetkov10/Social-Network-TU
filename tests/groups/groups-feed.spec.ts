import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('Groups Feed Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/groups');
        await expect(page.getByRole('heading', { name: 'Скорошна дейност' })).toBeVisible({ timeout: 15_000 });
    });

    test.describe('Page Layout', () => {

        test('should display page heading', async ({ page }) => {
            await expect(page.getByRole('heading', { name: 'Скорошна дейност' })).toBeVisible();
        });

        test('should display description text', async ({ page }) => {
            await expect(page.getByText('Публикации от групите, в които членувате')).toBeVisible();
        });

        test('should display my groups and navigation in sidebar with mocked data', async ({ page }) => {
            await page.route('**/api/Group/my-groups', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: null,
                        data: [
                            { id: 'group-01', name: 'Група 1', description: '', bannerUrl: null, avatarUrl: null, privacy: 0, requireApproval: false, membersCount: 1, isMember: true }
                        ]
                    }),
                });
            });

            await page.reload();

            await expect(page.getByRole('link', { name: 'Вашият канал' })).toBeVisible();
            await expect(page.getByRole('link', { name: 'Откриване' })).toBeVisible();
            await expect(page.getByRole('link', { name: 'Вашите групи' })).toBeVisible();

            const groupsHeading = page.getByRole('heading', { name: 'Групи, в които участвате' });
            await expect(groupsHeading).toBeVisible();

            const groupLinks = page.getByRole('link', { name: 'Група 1' });
            const count = await groupLinks.count();
            expect(count).toBeLessThanOrEqual(5);

            await expect(groupLinks).toHaveAttribute('href', /.*\/groups\/.*/);
        });
    });

    test.describe('Groups Feed', () => {
        test('should display groups feed', async ({ page }) => {
            const postCard = page.getByTestId('post-card').first();
            const emptyMessage = page.getByText('Няма нови публикации.');

            await expect(postCard.or(emptyMessage)).toBeVisible({ timeout: 15_000 });
        });

        test('should display post content and author', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const hasPost = await firstPost.isVisible().catch(() => false);
            if (!hasPost) { test.skip(); return; }

            await expect(firstPost.locator('h4').first()).toBeVisible();
            await expect(firstPost.locator('p.whitespace-pre-wrap').first()).toBeVisible();
        });

        test('should display action buttons on posts', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const hasPost = await firstPost.isVisible().catch(() => false);
            if (!hasPost) { test.skip(); return; }

            await expect(firstPost.getByRole('button', { name: 'Коментар' })).toBeVisible();
            await expect(firstPost.getByRole('button', { name: 'Споделяне' })).toBeVisible();
        });

        test('should display relative time on posts', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const hasPost = await firstPost.isVisible().catch(() => false);
            if (!hasPost) { test.skip(); return; }

            const timeText = firstPost.locator('.text-muted-foreground').first();
            await expect(timeText).toBeVisible();
        });
    });

    test.describe('Navigation', () => {
        test('should have search input in header', async ({ page }) => {
            await page.setViewportSize({ width: 1400, height: 900 });
            await expect(page.getByPlaceholder('Търсене...')).toBeVisible();
        });

        test('should redirect to login if not authenticated', async ({ page }) => {
            await page.evaluate(() => sessionStorage.removeItem('auth-storage'));
            await page.goto('/groups');
            await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        });

        test('should navigate to my groups feed from sidebar', async ({ page }) => {
            await page.goto('/groups');
            await expect(page.getByRole('heading', { name: 'Скорошна дейност' })).toBeVisible({ timeout: 15_000 });

            await page.getByRole('link', { name: 'Вашият канал' }).click();

            await expect(page).toHaveURL(/\/groups/, { timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Скорошна дейност' })).toBeVisible();
        });

        test('should navigate to suggestion from sidebar', async ({ page }) => {
            await page.goto('/groups');
            await expect(page.getByRole('heading', { name: 'Скорошна дейност' })).toBeVisible({ timeout: 15_000 });

            await page.getByRole('link', { name: 'Откриване' }).click();

            await expect(page).toHaveURL(/\/groups\/discover/, { timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Намерете своята общност' })).toBeVisible();
        });

        test('should navigate to my groups from sidebar', async ({ page }) => {
            await page.goto('/groups');
            await expect(page.getByRole('heading', { name: 'Скорошна дейност' })).toBeVisible({ timeout: 15_000 });

            await page.getByRole('link', { name: 'Вашите групи' }).click();

            await expect(page).toHaveURL(/\/groups\/my-groups/, { timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Вашите групи' })).toBeVisible();
        });
    });
});