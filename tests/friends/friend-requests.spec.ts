import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

const mockRequestsData = {
    success: true,
    message: null,
    data: [
        {
            pendingRequestId: 'req-01',
            profileId: 'profile-01',
            displayFullName: 'Иван Иванов',
            username: 'ivan_ivanov',
            authorAvatar: null,
        },
        {
            pendingRequestId: 'req-02',
            profileId: 'profile-02',
            displayFullName: 'Мария Петрова',
            username: 'maria_p',
            authorAvatar: null,
        },
    ],
    meta: { nextCursor: null },
};

const mockEmptyRequestsData = {
    success: true,
    message: null,
    data: [],
    meta: { nextCursor: null },
};

test.describe('Friend Requests - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends/friend-request');
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible();
    });

    test('should display request count or management text', async ({ page }) => {
        const hasCount = page.getByText(/Имате \d+ чакащи заявки/);
        const hasManagement = page.getByText('Управлявайте вашите входящи покани.');

        const countVisible = await hasCount.isVisible().catch(() => false);
        const managementVisible = await hasManagement.isVisible().catch(() => false);

        expect(countVisible || managementVisible).toBeTruthy();
    });

    test('should display friends sidebar', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Приятели', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Покани за приятелство' })).toBeVisible();
    });
});

test.describe('Friend Requests - Empty State', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Friendship/pending-requests**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockEmptyRequestsData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/friends/friend-request');
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible({ timeout: 15_000 });
    });

    test('should show empty state when no requests', async ({ page }) => {
        await expect(page.getByText('Няма покани за сега!')).toBeVisible();
    });

    test('should show description in empty state', async ({ page }) => {
        await expect(page.getByText('Нямате нови покани за приятелство. Когато получите такива, те ще се появят тук.')).toBeVisible();
    });
});

test.describe('Friend Requests - Request Cards (mocked)', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Friendship/pending-requests**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockRequestsData),
            });
        });

        await loginAsTestUser(page);
        await page.goto('/friends/friend-request');
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible({ timeout: 15_000 });
    });

    test('should display confirm and delete buttons on request card', async ({ page }) => {
        await expect(page.getByText('Иван Иванов')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Потвърждаване' }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Изтриване' }).first()).toBeVisible();
    });

    test('should show notification badge with request count', async ({ page }) => {
        await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
    });
});

test.describe('Friend Requests - Navigation', () => {
    test('should navigate to friend requests from sidebar', async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/friends');
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible({ timeout: 15_000 });

        await page.getByRole('link', { name: 'Покани за приятелство' }).click();

        await expect(page).toHaveURL(/\/friends\/friend-request/, { timeout: 10_000 });
        await expect(page.getByRole('heading', { name: 'Покани за приятелство' })).toBeVisible();
    });
});
