import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('Friends Page - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends');
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display friend requests section heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible();
    });

    test('should display suggestions section heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Хора, които може би познавате' })).toBeVisible();
    });
});

test.describe('Friends Page - Empty Requests State', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends');
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible({ timeout: 15_000 });
    });

    test('should show empty message when no friend requests', async ({ page }) => {
        await expect(page.getByText('Нямате нови покани')).toBeVisible();
    });

    test('should not show "Виж всички" link when no requests', async ({ page }) => {
        await expect(page.getByRole('link', { name: /Виж всички/ })).not.toBeVisible();
    });
});

test.describe('Friends Page - Requests With Data (mocked)', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Friendship/pending-requests**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: null,
                    data: [
                        {
                            pendingRequestId: 'req-001',
                            profileId: 'profile-001',
                            displayFullName: 'Иван Иванов',
                            username: 'ivan_ivanov',
                            authorAvatar: null,
                            mutualFriendsCount: 3,
                        },
                        {
                            pendingRequestId: 'req-002',
                            profileId: 'profile-002',
                            displayFullName: 'Мария Петрова',
                            username: 'maria_p',
                            authorAvatar: null,
                            mutualFriendsCount: 0,
                        },
                    ],
                    meta: { nextCursor: null },
                }),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/friends');
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible({ timeout: 15_000 });
    });

    test('should show request cards with user names', async ({ page }) => {
        await expect(page.getByText('Иван Иванов')).toBeVisible();
        await expect(page.getByText('Мария Петрова')).toBeVisible();
    });

    test('should show "Покана от @username" on request card', async ({ page }) => {
        await expect(page.getByText('Покана от @ivan_ivanov')).toBeVisible();
    });

    test('should show "Потвърждаване" button on request card', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Потвърждаване' }).first()).toBeVisible();
    });

    test('should show "Изтриване" button on request card', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Изтриване' }).first()).toBeVisible();
    });

    test('should show "Виж всички" link to requests page', async ({ page }) => {
        await expect(page.getByRole('link', { name: /Виж всички/ })).toBeVisible();
    });
});

test.describe('Friends Page - Suggestions', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends');
        await expect(page.getByRole('heading', { name: 'Хора, които може би познавате' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display suggestion cards', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Добавяне' }).first()).toBeVisible();
    });

    test('should show "Добавяне" button on suggestion card', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Добавяне' }).first()).toBeVisible();
    });

    test('should show "Премахване" button on suggestion card', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Премахване' }).first()).toBeVisible();
    });

    test('should show mutual friends count or "Нов в TU Social"', async ({ page }) => {
        const hasMutual = page.getByText(/общи приятели/).first();
        const hasNew = page.getByText('Нов в TU Social').first();

        const mutualVisible = await hasMutual.isVisible().catch(() => false);
        const newVisible = await hasNew.isVisible().catch(() => false);

        expect(mutualVisible || newVisible).toBeTruthy();
    });
});
