import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

const mockFriendSuggestionsData = {
    success: true,
    message: null,
    data: [
        {
            profileId: 'profile-01',
            displayFullName: 'Иван Иванов',
            username: 'ivan_ivanov',
            authorAvatar: null,
            mutualFriendsCount: 3,
        },
        {
            profileId: 'profile-02',
            displayFullName: 'Мария Петрова',
            username: 'maria_p',
            authorAvatar: null,
            mutualFriendsCount: 0,
        },
    ],
    meta: { nextSkip: null, totalLoaded: 2 },
};

const mockEmptySuggestionsData = {
    success: true,
    message: null,
    data: [],
    meta: { nextSkip: null, totalLoaded: 0 },
};

test.describe('Friend Suggestions - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends/friend-suggestion');
        await expect(page.getByRole('heading', { name: 'Хора, които може би познавате' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Хора, които може би познавате' })).toBeVisible();
    });

    test('should display subtitle', async ({ page }) => {
        await expect(page.getByText('Разширете кръга си от приятели')).toBeVisible();
    });

    test('should display friends sidebar', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Приятели', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Предложения' })).toBeVisible();
    });
});

test.describe('Friend Suggestions - Empty State', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Friendship/suggestions**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockEmptySuggestionsData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/friends/friend-suggestion');
        await expect(page.getByRole('heading', { name: 'Хора, които може би познавате' })).toBeVisible({ timeout: 15_000 });
    });

    test('should show empty state when no suggestions', async ({ page }) => {
        await expect(page.getByText('Няма намерени предложения')).toBeVisible();
    });
});

test.describe('Friend Suggestions - Suggestion Cards (mocked)', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Friendship/suggestions**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockFriendSuggestionsData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/friends/friend-suggestion');
        await expect(page.getByRole('heading', { name: 'Хора, които може би познавате' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display suggestion cards with user names', async ({ page }) => {
        await expect(page.getByText('Иван Иванов')).toBeVisible();
        await expect(page.getByText('Мария Петрова')).toBeVisible();
    });

    test('should show mutual friends count on suggestion card', async ({ page }) => {
        await expect(page.getByText('3 общи приятели')).toBeVisible();
        await expect(page.getByText('Нов в TU Social')).toBeVisible();
    });

    test('should show "Добавяне" button on suggestion card', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Добавяне' }).first()).toBeVisible();
    });

    test('should show "Премахване" button on suggestion card', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Премахване' }).first()).toBeVisible();
    });
});

test.describe('Friend Suggestions - Navigation', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
        await loginAsTestUser(page);
        await page.evaluate(() => sessionStorage.removeItem('auth-storage'));
        await page.goto('/friends/friend-suggestion');
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    });

    test('should navigate to suggestions from sidebar', async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends');
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible({ timeout: 15_000 });

        await page.getByRole('link', { name: 'Предложения' }).click();

        await expect(page).toHaveURL(/\/friends\/friend-suggestion/, { timeout: 10_000 });
        await expect(page.getByRole('heading', { name: 'Хора, които може би познавате' })).toBeVisible();
    });
});
