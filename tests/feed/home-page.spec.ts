import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('Home Page', () => {
    test.describe('Page Layout', () => {
        test.beforeEach(async ({ page }) => {
            await loginAsTestUser(page);
        });

        test('should display the header with logo', async ({ page }) => {
            const header = page.locator('header');
            await expect(header).toBeVisible();
            await expect(header.getByText('TU Social')).toBeVisible();
        });

        test('should display the create post area', async ({ page }) => {
            await expect(page.getByText('За какво си мислите')).toBeVisible();
            await expect(page.getByRole('button', { name: /Снимка|Медия/ })).toBeVisible();
            await expect(page.getByRole('button', { name: /Документ/ })).toBeVisible();
        });

        test('should display the sponsored sidebar on desktop', async ({ page }) => {
            await page.setViewportSize({ width: 1400, height: 900 });

            await expect(page.getByText('Спонсорирано')).toBeVisible();
            await expect(page.getByText('Tech University Ads')).toBeVisible();
            await expect(page.getByText('tu-sofia.bg')).toBeVisible();
        });

        test('should display footer copyright', async ({ page }) => {
            await page.setViewportSize({ width: 1400, height: 900 });

            await expect(page.getByText('© 2024 TU Social Inc.')).toBeVisible();
        });
    });

    test.describe('Feed Posts', () => {
        test.beforeEach(async ({ page }) => {
            await loginAsTestUser(page);
        });

        test('should display posts or empty state message', async ({ page }) => {
            const postCard = page.getByTestId('post-card').first();
            const emptyMessage = page.getByText('Все още няма публикации.');

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

    test.describe('Post Options (Three dots dropdown)', () => {
        const mockPostsWithOwnership = {
            success: true,
            data: [
                {
                    id: 'post-own',
                    content: 'Това е моя публикация',
                    media: [],
                    profileId: 'user-1',
                    authorName: 'Test User',
                    authorAvatar: null,
                    username: 'testuser',
                    visibility: 0,
                    likesCount: 0,
                    commentsCount: 0,
                    groupId: null,
                    groupName: null,
                    createdAt: new Date().toISOString(),
                    isOwner: true
                },
                {
                    id: 'post-other',
                    content: 'Това е чужда публикация',
                    media: [],
                    profileId: 'user-2',
                    authorName: 'Other User',
                    authorAvatar: null,
                    username: 'otheruser',
                    visibility: 0,
                    likesCount: 0,
                    commentsCount: 0,
                    groupId: null,
                    groupName: null,
                    createdAt: new Date().toISOString(),
                    isOwner: false 
                }
            ]
        };

        test.beforeEach(async ({ page }) => {
            await page.route(/\/api\/Posts/i, async route => {
                if (route.request().method() === 'GET') {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify(mockPostsWithOwnership)
                    });
                } else {
                    await route.continue();
                }
            });

            await loginAsTestUser(page);

            await expect(page.getByText('Това е моя публикация')).toBeVisible({ timeout: 15_000 });
        });

        test('should show common options (Save, Copy link, Report) for ANY post', async ({ page }) => {
            const otherPost = page.getByTestId('post-card').filter({ hasText: 'Това е чужда публикация' });
            await otherPost.getByTestId('post-options-btn').click();

            const dropdown = page.getByRole('menu');
            await expect(dropdown.getByRole('menuitem', { name: 'Запази' })).toBeVisible();
            await expect(dropdown.getByRole('menuitem', { name: 'Копирай линк' })).toBeVisible();
            await expect(dropdown.getByRole('menuitem', { name: 'Докладвай' })).toBeVisible();
        });

        test('should NOT show Edit and Delete for OTHER users post', async ({ page }) => {
            const otherPost = page.getByTestId('post-card').filter({ hasText: 'Това е чужда публикация' });
            await otherPost.getByTestId('post-options-btn').click();

            const dropdown = page.getByRole('menu');
            await expect(dropdown.getByRole('menuitem', { name: 'Редактиране' })).toBeHidden();
            await expect(dropdown.getByRole('menuitem', { name: 'Изтриване' })).toBeHidden();
        });

        test('should show Edit and Delete for OWN post', async ({ page }) => {
            const ownPost = page.getByTestId('post-card').filter({ hasText: 'Това е моя публикация' });
            await ownPost.getByTestId('post-options-btn').click();

            const dropdown = page.getByRole('menu');
            await expect(dropdown.getByRole('menuitem', { name: 'Редактиране' })).toBeVisible();
            await expect(dropdown.getByRole('menuitem', { name: 'Изтриване' })).toBeVisible();
        });

        test('should copy link to clipboard and show toast', async ({ page }) => {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

            const ownPost = page.getByTestId('post-card').filter({ hasText: 'Това е моя публикация' });
            await ownPost.getByTestId('post-options-btn').click();

            await page.getByRole('menuitem', { name: 'Копирай линк' }).click();

            await expect(page.getByText('Линкът е копиран!')).toBeVisible();
        });
    });

    test.describe('Navigation', () => {
        test.beforeEach(async ({ page }) => {
            await loginAsTestUser(page);
        });

        test('should have search input in header', async ({ page }) => {
            await page.setViewportSize({ width: 1400, height: 900 });
            await expect(page.getByPlaceholder('Търсене...')).toBeVisible();
        });

        test('should redirect to login if not authenticated', async ({ page }) => {
            await page.evaluate(() => sessionStorage.removeItem('auth-storage'));
            await page.goto('/');
            await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        });

        test('should navigate to messages from sidebar.', async ({ page }) => {
            await page.getByRole('link', { name: 'Съобщения' }).click();

            await expect(page).toHaveURL(/\/messages/, { timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Съобщения' })).toBeVisible();
        });

        test('should navigate to friends from sidebar.', async ({ page }) => {
            await page.getByRole('link', { name: 'Приятели' }).click();

            await expect(page).toHaveURL(/\/friends/, { timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible();
        });

        test('should navigate to followers from sidebar.', async ({ page }) => {
            await page.getByRole('link', { name: 'Последователи' }).click();

            await expect(page).toHaveURL(/\/followers/, { timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Моите последователи' })).toBeVisible();
        });

        test('should navigate to groups from sidebar.', async ({ page }) => {
            await page.getByRole('link', { name: 'Моите Групи' }).click();

            await expect(page).toHaveURL(/\/groups/, { timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Скорошна дейност' })).toBeVisible();
        });
    });
});