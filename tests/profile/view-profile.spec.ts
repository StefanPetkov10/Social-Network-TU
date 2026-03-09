import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

const mockFriendInList = {
    success: true,
    message: null,
    data: [
        {
            profileId: 'profile-view-01',
            displayFullName: 'Георги Димитров',
            username: 'georgi_d',
            authorAvatar: null,
            isMe: false,
            isFriend: true,
            hasSentRequest: false,
            hasReceivedRequest: false,
            pendingRequestId: null,
            mutualFriendsCount: 2,
        },
    ],
    meta: { lastFriendId: null, lastFriendshipDate: null, totalCount: 1 },
};

const mockProfileById = {
    success: true,
    message: null,
    data: {
        id: 'profile-view-01',
        firstName: 'Георги',
        lastName: 'Димитров',
        fullName: 'Георги Димитров',
        username: 'georgi_d',
        authorAvatar: null,
        dateOfBirth: '2000-01-01T00:00:00Z',
        sex: 0,
        bio: 'Тестово bio на Георги.',
        friendsCount: 10,
        followersCount: 25,
        followingCount: 8,
        isFollowed: true,
        friendshipStatus: 1,      
        isFriendRequestSender: false,
        friendshipRequestId: null,
    },
};

const mockMyProfile = {
    success: true,
    message: null,
    data: {
        id: 'my-profile-id',
        firstName: 'Тест',
        lastName: 'Потребител',
        fullName: 'Тест Потребител',
        username: process.env.TEST_USER_USERNAME || 'test_user',
        authorAvatar: null,
        dateOfBirth: '1999-05-15T00:00:00Z',
        sex: 0,
        bio: '',
        friendsCount: 5,
        followersCount: 3,
        followingCount: 7,
        isFollowed: false,
        friendshipStatus: -1,
        isFriendRequestSender: false,
        friendshipRequestId: null,
    },
};

async function setupAndOpenFriendProfile(page: any) {
    await page.route('**/api/Friendship/friends/**', async (route: any) => {
        if (route.request().url().includes('/search')) {
            await route.continue();
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockFriendInList),
        });
    });

    await page.route('**/api/Profile/georgi_d', async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockProfileById),
        });
    });

    await page.route('**/api/Profile/profile-view-01', async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockProfileById),
        });
    });

    await loginAsTestUser(page);
    await page.goto('/friends/all-friends');
    await expect(page.getByRole('heading', { name: /Всички приятели/ })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Преглед' }).first().click();
    await expect(page.getByRole('heading', { name: 'Георги Димитров' })).toBeVisible({ timeout: 10_000 });
}


test.describe('View Profile - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await setupAndOpenFriendProfile(page);
    });

    test('should render display name as heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Георги Димитров' })).toBeVisible();
    });

    test('should render username', async ({ page }) => {
        await expect(page.getByText('@georgi_d')).toBeVisible({ timeout: 10_000 });
    });

    test('should render bio when present', async ({ page }) => {
        await expect(page.getByText('Тестово bio на Георги.')).toBeVisible({ timeout: 10_000 });
    });

    test('should render friends count stat', async ({ page }) => {
        await expect(page.getByText(/\d+ Приятели/)).toBeVisible({ timeout: 10_000 });
    });

    test('should render Последователи count', async ({ page }) => {
        await expect(page.getByText(/\d+ Последователи/)).toBeVisible({ timeout: 10_000 });
    });

    test('should render Последвани count', async ({ page }) => {
        await expect(page.getByText(/\d+ Последвани/)).toBeVisible({ timeout: 10_000 });
    });

    test('should render avatar fallback with initials', async ({ page }) => {
        const avatar = page.locator('span').filter({ hasText: /^ГД$/ }).first();
        await expect(avatar).toBeVisible({ timeout: 10_000 });
    });

    test('should render Назад back button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Назад/ })).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('View Profile - Tabs', () => {
    test.beforeEach(async ({ page }) => {
        await setupAndOpenFriendProfile(page);
    });

    test('should default to Публикации tab', async ({ page }) => {
        const pubTab = page.getByRole('button', { name: 'Публикации' });
        await expect(pubTab).toBeVisible({ timeout: 10_000 });
        await expect(pubTab).toHaveClass(/border-primary/);
    });

    test('should switch to Приятели tab', async ({ page }) => {
        const friendsTab = page.locator('div.border-t button', { hasText: 'Приятели' });
        await friendsTab.click();
        await expect(friendsTab).toHaveClass(/border-primary/, { timeout: 10_000 });
    });

    test('should switch to Медия tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Медия' }).click();
        await expect(page.getByRole('button', { name: 'Медия' })).toHaveClass(/border-primary/, { timeout: 10_000 });
    });

    test('should switch to Документи tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Документи' }).click();
        await expect(page.getByRole('button', { name: 'Документи' })).toHaveClass(/border-primary/, { timeout: 10_000 });
    });

    test('clicking Приятели stat switches to Приятели tab', async ({ page }) => {
        await page.locator('span.cursor-pointer', { has: page.locator('svg') }).filter({ hasText: 'Приятели' }).click();
        const friendsTab = page.locator('div.border-t button', { hasText: 'Приятели' });
        await expect(friendsTab).toHaveClass(/border-primary/, { timeout: 10_000 });
    });
});

test.describe('View Profile - Action Buttons (friend status)', () => {
    test.beforeEach(async ({ page }) => {
        await setupAndOpenFriendProfile(page);
    });

    test('should show "Приятели" green button when already friends', async ({ page }) => {
        await expect(page.getByTestId('friends-dropdown-btn')).toBeVisible({ timeout: 10_000 });
    });

    test('should show "Последван" button when already following', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Последван/ })).toBeVisible({ timeout: 10_000 });
    });

    test('should show message icon button', async ({ page }) => {
        const msgBtn = page.getByRole('button', { name: 'Съобщение' })
        await expect(msgBtn).toBeVisible({ timeout: 10_000 });
    });

    test('should open unfriend confirmation dialog', async ({ page }) => {
        await page.getByTestId('friends-dropdown-btn').click();
        await page.getByText('Премахни приятел').click();
        await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('Премахване на приятел?')).toBeVisible();
    });

    test('should close unfriend dialog on Отказ', async ({ page }) => {
        await page.getByTestId('friends-dropdown-btn').click();
        await page.getByText('Премахни приятел').click();
        await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
        await page.getByRole('button', { name: 'Отказ' }).click();
        await expect(page.getByRole('alertdialog')).toBeHidden({ timeout: 10_000 });
    });

    test('should open unfollow confirmation dialog', async ({ page }) => {
        await page.getByRole('button', { name: /Последван/ }).click();
        await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('Спиране на следването?')).toBeVisible();
    });

    test('should close unfollow dialog on Отказ', async ({ page }) => {
        await page.getByRole('button', { name: /Последван/ }).click();
        await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
        await page.getByRole('button', { name: 'Отказ' }).click();
        await expect(page.getByRole('alertdialog')).toBeHidden({ timeout: 10_000 });
    });
});

test.describe('View Profile - Followers/Following Dialogs', () => {
    test.beforeEach(async ({ page }) => {
        await setupAndOpenFriendProfile(page);
    });

    test('should open followers dialog when clicking Последователи stat', async ({ page }) => {
        await page.getByText(/\d+ Последователи/).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    });

    test('should open following dialog when clicking Последвани stat', async ({ page }) => {
        await page.getByText(/\d+ Последвани/).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('View Profile - Back Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await setupAndOpenFriendProfile(page);
    });

    test('should navigate back when clicking Назад', async ({ page }) => {
        await page.getByRole('button', { name: /Назад/ }).click();
        await expect(page.getByRole('heading', { name: /Всички приятели/ })).toBeVisible({ timeout: 10_000 });
    });
});
