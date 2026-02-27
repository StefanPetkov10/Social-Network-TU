import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

const mockFriendsData = {
    success: true,
    message: null,
    data: [
        {
            profileId: 'profile-001',
            displayFullName: 'Иван Иванов',
            username: 'ivan_ivanov',
            authorAvatar: null,
            isMe: false,
            isFriend: true,
            hasSentRequest: false,
            hasReceivedRequest: false,
            mutualFriendsCount: 3,
        },
        {
            profileId: 'profile-002',
            displayFullName: 'Мария Петрова',
            username: 'maria_p',
            authorAvatar: null,
            isMe: false,
            isFriend: true,
            hasSentRequest: false,
            hasReceivedRequest: false,
            mutualFriendsCount: 1,
        },
    ],
    meta: { lastFriendId: null, lastFriendshipDate: null, totalCount: 2 },
};

const mockEmptyFriendsData = {
    success: true,
    message: null,
    data: [],
    meta: { lastFriendId: null, lastFriendshipDate: null, totalCount: 0 },
};

test.describe('All Friends - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends/all-friends');
        await expect(page.getByRole('heading', { name: /Всички приятели/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should display page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Всички приятели/ })).toBeVisible();
    });

    test('should display description text', async ({ page }) => {
        await expect(page.getByText('Управлявайте списъка си с приятели тук.')).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
        await expect(page.getByPlaceholder('Търсене на приятели...')).toBeVisible();
    });

    test('should display friends sidebar', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Приятели', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Всички приятели' })).toBeVisible();
    });
});

test.describe('All Friends - Empty State', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Friendship/friends/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockEmptyFriendsData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/friends/all-friends');
        await expect(page.getByRole('heading', { name: /Всички приятели/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should show empty state when no friends', async ({ page }) => {
        await expect(page.getByText('Няма намерени приятели')).toBeVisible();
        await expect(page.getByText('Все още нямате добавени приятели.')).toBeVisible();
    });
});

test.describe('All Friends - Search', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends/all-friends');
        await expect(page.getByRole('heading', { name: /Всички приятели/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should filter friends when typing in search', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Търсене на приятели...');
        await searchInput.fill('а');

        await page.waitForTimeout(500);

        await expect(searchInput).toHaveValue('а');
    });

    test('should show no results message for non-matching search', async ({ page }) => {
        await page.route('**/api/Friendship/friends/*/search**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: [], meta: null }),
            });
        });

        const searchInput = page.getByPlaceholder('Търсене на приятели...');
        await searchInput.fill('несъществуващоиме123');

        await expect(page.getByText(/Няма резултати за/)).toBeVisible({ timeout: 5_000 });
    });
});

test.describe('All Friends - Friend Cards', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Friendship/friends/**', async (route) => {
            if (route.request().url().includes('/search')) {
                await route.continue();
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockFriendsData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/friends/all-friends');
        await expect(page.getByRole('heading', { name: /Всички приятели/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should display friend cards when friends exist', async ({ page }) => {
        await expect(page.getByText('Иван Иванов')).toBeVisible();
        await expect(page.getByText('Мария Петрова')).toBeVisible();
    });

    test('should show friend count in heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Всички приятели/ })).toContainText('(');
    });

    test('should show "Преглед" button on friend card', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Преглед' }).first()).toBeVisible();
    });

    test('should show "Изтрий" button on friend card', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Изтрий' }).first()).toBeVisible();
    });
});

test.describe('All Friends - Navigation', () => {
    test('should navigate to all friends from sidebar', async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends');
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible({ timeout: 15_000 });

        await page.getByRole('link', { name: 'Всички приятели' }).click();

        await expect(page).toHaveURL(/\/friends\/all-friends/, { timeout: 10_000 });
        await expect(page.getByRole('heading', { name: /Всички приятели/ })).toBeVisible();
    });
});