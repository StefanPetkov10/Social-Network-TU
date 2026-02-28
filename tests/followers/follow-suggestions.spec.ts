import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

const mockSuggestionsData = {
    success: true,
    message: null,
    data: [
        {
            profileId: 'profile-01',
            displayFullName: 'Иван Иванов',
            username: 'ivan_ivanov',
            authorAvatar: null,
            isFollowing: false,
            isFollower: false,
            isFriend: false,
            reason: 'Популярен потребител',
            mutualFollowersCount: 3,
        },
        {
            profileId: 'profile-02',
            displayFullName: 'Мария Петрова',
            username: 'maria_p',
            authorAvatar: null,
            isFollowing: false,
            isFollower: false,
            isFriend: false,
            reason: 'Популярен потребител',
            mutualFollowersCount: 0,
        },
    ],
    meta: { nextCursor: null },
};

const mockEmptySuggestionsData = {
    success: true,
    message: null,
    data: [],
    meta: { nextCursor: null },
};

test.describe('Follow Suggestions - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/followers/suggestions');
        await expect(page.getByRole('heading', { name: 'Предложения за вас' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Предложения за вас' })).toBeVisible();
    });

    test('should display subtitle', async ({ page }) => {
        await expect(page.getByText('Открийте интересни профили в TU Social')).toBeVisible();
    });

    test('should display friends sidebar', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Последователи', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Предложения' })).toBeVisible();
    });
});

test.describe('Follow Suggestions - Empty State', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Follow/suggestions**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockEmptySuggestionsData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/followers/suggestions');
        await expect(page.getByRole('heading', { name: 'Предложения за вас' })).toBeVisible({ timeout: 15_000 });
    });

    test('should show empty state when no suggestions', async ({ page }) => {
        await expect(page.getByText('Няма нови предложения')).toBeVisible();
    });
});

test.describe('Follow Suggestions - Suggestion Cards (mocked)', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Follow/suggestions**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockSuggestionsData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/followers/suggestions');
        await expect(page.getByRole('heading', { name: 'Предложения за вас' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display suggestion cards with user names', async ({ page }) => {
        await expect(page.getByText('Иван Иванов')).toBeVisible();
        await expect(page.getByText('Мария Петрова')).toBeVisible();
    });

    test('should show mutual followers count or reason', async ({ page }) => {
        await expect(page.getByText('3 общи последователи')).toBeVisible();
        await expect(page.getByText('Популярен потребител')).toBeVisible();
    });

    test('should show "Последвай" button on suggestion card', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Последвай' }).first()).toBeVisible();
    });
});

test.describe('Follow Suggestions - Navigation', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
        await loginAsTestUser(page);
        await page.evaluate(() => sessionStorage.removeItem('auth-storage'));
        await page.goto('/followers/suggestions');
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    });

    test('should navigate to suggestions from sidebar', async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/followers');
        await expect(page.getByRole('heading', { name: 'Моите последователи' })).toBeVisible({ timeout: 15_000 });

        await page.getByRole('link', { name: 'Предложения' }).click();

        await expect(page).toHaveURL(/\/followers\/suggestions/, { timeout: 10_000 });
        await expect(page.getByRole('heading', { name: 'Предложения за вас' })).toBeVisible();
    });
});
