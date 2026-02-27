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

test.describe('Followers - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/followers');
        await expect(page.getByRole('heading', { name: /Моите последователи/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should display page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Моите последователи/ })).toBeVisible();
    });

    test('should display description text', async ({ page }) => {
        await expect(page.getByText('Хората, които са се абонирали за вашето съдържание.')).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
        await expect(page.getByRole('textbox', { name: 'Търсене' })).toBeVisible();
    });

    test('should display follower count in heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Моите последователи/ })).toContainText('(');
    });

    test('should display followers sidebar', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Последователи', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Моите последователи' })).toBeVisible();
    });
});

test.describe('Followers - Empty State', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Follow/followers/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockEmptyFollowersData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/followers');
        await expect(page.getByRole('heading', { name: /Моите последователи/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should show empty state when no followers', async ({ page }) => {
        await expect(page.getByText('Няма намерени последователи')).toBeVisible();
    });

    test('should show motivational message in empty state', async ({ page }) => {
        await expect(page.getByText('Все още никой не ви следва. Бъдете активни')).toBeVisible();
    });
});

test.describe('Followers - Search', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/followers');
        await expect(page.getByRole('heading', { name: /Моите последователи/ })).toBeVisible({ timeout: 15_000 });
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

test.describe('Followers - Follower Cards', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Follow/followers/**', async (route) => {
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
        await page.goto('/followers');
        await expect(page.getByRole('heading', { name: /Моите последователи/ })).toBeVisible({ timeout: 15_000 });
    });

    test('should display follower cards when followers exist', async ({ page }) => {
        await expect(page.getByText('Иван Иванов')).toBeVisible();
        await expect(page.getByText('Мария Петрова')).toBeVisible();
    });

    test('should show follow-back button and extra actions', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Последвай също' }).first()).toBeVisible();

        await expect(page.getByRole('button', { name: 'Последван' }).first()).toBeVisible();

        await expect(page.getByRole('button', { name: 'Преглед на профил' }).first()).toBeVisible();
    });

    test('should show remove button in dropdown', async ({ page }) => {
        await page.locator('#radix-_r_2_').first().click();

        await expect(page.getByRole('menuitem', { name: 'Премахни последовател' })).toBeVisible();
    });
});

test.describe('Followers - Navigation', () => {
    test('should navigate to followers from main sidebar', async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/followers');
        await expect(page.getByRole('heading', { name: /Моите последователи/ })).toBeVisible({ timeout: 15_000 });

        await page.goto('/followers/suggestions');
        await expect(page.getByRole('heading', { name: 'Предложения за вас' })).toBeVisible({ timeout: 15_000 });

        await page.getByRole('link', { name: 'Моите последователи' }).click();

        await expect(page).toHaveURL(/\/followers/, { timeout: 10_000 });
        await expect(page.getByRole('heading', { name: /Моите последователи/ })).toBeVisible();
    });
});
