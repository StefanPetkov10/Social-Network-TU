import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

const mockFollowersData = {
    success: true,
    message: null,
    data: [
        {
            profileId: 'profile-user1',
            displayFullName: 'Иван Иванов',
            username: 'ivan_ivanov',
            authorAvatar: null,
            isFollowing: false,
            isFollower: true,
            isFriend: false,
        },
        {
            profileId: 'profile-user2',
            displayFullName: 'Мария Петрова',
            username: 'maria_p',
            authorAvatar: null,
            isFollowing: true,
            isFollower: true,
            isFriend: false,
        },
    ],
    meta: { nextCursor: null, totalCount: 2 },
};

const mockEmptyFollowersData = {
    success: true,
    message: null,
    data: [],
    meta: { nextCursor: null, totalCount: 0 },
};

test.describe('Following - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/followers/following');
        await expect(page.getByRole('heading', { name: /Последвани/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should display page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Последвани/ })).toBeVisible();
    });

    test('should display description text', async ({ page }) => {
        await expect(page.getByText('Хората, чието съдържание виждате във вашия фийд.')).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
        await expect(page.getByRole('textbox', { name: 'Търсене' })).toBeVisible();
    });

    test('should display following count in heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Последвани/ })).toContainText('(');
    });

    test('should display followers sidebar', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Последователи', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Последвани' })).toBeVisible();
    });
});

test.describe('Following - Empty State', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Follow/following**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockEmptyFollowersData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/followers/following');
        await expect(page.getByRole('heading', { name: /Последвани/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should show empty state when no following', async ({ page }) => {
        await expect(page.getByText('Не следвате никого')).toBeVisible();
    });

    test('should show description when no following', async ({ page }) => {
        await expect(page.getByText('Използвайте страницата с предложения, за да намерите интересни хора.')).toBeVisible();
    });
});

test.describe('Following - Search', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/followers/following');
        await expect(page.getByRole('heading', { name: /Последвани/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should filter followers when typing in search', async ({ page }) => {
        const searchInput = page.getByRole('textbox', { name: 'Търсене' });
        await searchInput.fill('иван');

        await page.waitForTimeout(500);

        await expect(searchInput).toHaveValue('иван');
    });

    test('should show no results for non-matching search', async ({ page }) => {
        await page.route('**/api/Follow/*/followers/search**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: [], meta: null }),
            });
        });

        const searchInput = page.getByRole('textbox', { name: 'Търсене' });
        await searchInput.fill('несъществуващоиме123');

        await expect(page.getByText(/Няма резултати за/)).toBeVisible({ timeout: 5_000 });
    });
});

test.describe('Following - Following Cards', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Follow/following**', async (route) => {
            if (route.request().url().includes('/search')) {
                await route.continue();
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockFollowersData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/followers/following');
        await expect(page.getByRole('heading', { name: /Последвани/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should display followed users', async ({ page }) => {
        await expect(page.getByText('Иван Иванов')).toBeVisible();
        await expect(page.getByText('Мария Петрова')).toBeVisible();
    });

    test('should show buttons', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Преглед' }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Следваш' }).first()).toBeVisible();
    });
});

test.describe('Followers - Navigation', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
        await loginAsTestUser(page);
        await page.evaluate(() => sessionStorage.removeItem('auth-storage'));
        await page.goto('/followers/following');
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    });

    test('should navigate to followers from main sidebar', async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/followers');
        await expect(page.getByRole('heading', { name: /Моите последователи/ })).toBeVisible({ timeout: 15_000 });

        await page.goto('/followers/following');
        await expect(page.getByRole('heading', { name: 'Последвани' })).toBeVisible({ timeout: 15_000 });

        await page.getByRole('link', { name: 'Последвани' }).click();

        await expect(page).toHaveURL(/\/following/, { timeout: 10_000 });
        await expect(page.getByRole('heading', { name: /Последвани/ })).toBeVisible();
    });
});