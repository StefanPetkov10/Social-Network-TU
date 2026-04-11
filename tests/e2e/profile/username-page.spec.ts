import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

const mockMyProfile = {
    success: true,
    message: null,
    data: {
        id: 'my-user-id',
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

const mockStrangerProfile = {
    success: true,
    message: null,
    data: {
        id: 'stranger-id-01',
        firstName: 'Петър',
        lastName: 'Стоянов',
        fullName: 'Петър Стоянов',
        username: 'petar_s',
        authorAvatar: null,
        dateOfBirth: '2001-03-20T00:00:00Z',
        sex: 0,
        bio: 'Студент в ТУ-София.',
        friendsCount: 12,
        followersCount: 40,
        followingCount: 18,
        isFollowed: false,
        friendshipStatus: -1,
        isFriendRequestSender: false,
        friendshipRequestId: null,
    },
};

const mockPendingSentProfile = {
    ...mockStrangerProfile,
    data: {
        ...mockStrangerProfile.data,
        friendshipStatus: 0,
        isFriendRequestSender: true,
        friendshipRequestId: 'req-id-01',
    },
};

const mockPendingReceivedProfile = {
    ...mockStrangerProfile,
    data: {
        ...mockStrangerProfile.data,
        friendshipStatus: 0,
        isFriendRequestSender: false,
        friendshipRequestId: 'req-id-02',
    },
};

const mockFriendProfile = {
    ...mockStrangerProfile,
    data: {
        ...mockStrangerProfile.data,
        friendshipStatus: 1,
        isFollowed: true,
        isFriendRequestSender: false,
        friendshipRequestId: null,
    },
};

async function setupProfilePage(
    page: any,
    profileMock: any,
    username = 'petar_s',
) {
    await page.route('**/api/Profile/me', async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockMyProfile),
        });
    });

    await page.route(`**/api/Profile/${username}`, async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(profileMock),
        });
    });

    await loginAsTestUser(page);
    await page.goto(`/@${username}`);
    await page.waitForSelector('h1', { timeout: 15_000 });
}

test.describe('Username Page - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await setupProfilePage(page, mockStrangerProfile);
    });

    test('should render display name as h1', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Петър Стоянов' })).toBeVisible({ timeout: 10_000 });
    });

    test('should render username with @ prefix', async ({ page }) => {
        await expect(page.getByText('@petar_s')).toBeVisible({ timeout: 10_000 });
    });

    test('should render bio when present', async ({ page }) => {
        await expect(page.getByText('Студент в ТУ-София.')).toBeVisible({ timeout: 10_000 });
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
        const avatar = page.locator('span').filter({ hasText: /^ПС$/ }).first();
        await expect(avatar).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Username Page - Tabs', () => {
    test.beforeEach(async ({ page }) => {
        await setupProfilePage(page, mockStrangerProfile);
    });

    test('should default to Публикации tab', async ({ page }) => {
        const pubTab = page.getByRole('button', { name: 'Публикации' });
        await expect(pubTab).toBeVisible({ timeout: 10_000 });
        await expect(pubTab).toHaveClass(/border-blue-600/);
    });

    test('should switch to Приятели tab and update URL', async ({ page }) => {
        await page.getByRole('button', { name: 'Приятели' }).click();
        await expect(page).toHaveURL(/tab=friends/, { timeout: 10_000 });
        await expect(page.getByRole('button', { name: 'Приятели' })).toHaveClass(/border-blue-600/);
    });

    test('should switch to Медия tab and update URL', async ({ page }) => {
        await page.getByRole('button', { name: 'Медия' }).click();
        await expect(page).toHaveURL(/tab=media/, { timeout: 10_000 });
        await expect(page.getByRole('button', { name: 'Медия' })).toHaveClass(/border-blue-600/);
    });

    test('should switch to Документи tab and update URL', async ({ page }) => {
        await page.getByRole('button', { name: 'Документи' }).click();
        await expect(page).toHaveURL(/tab=documents/, { timeout: 10_000 });
        await expect(page.getByRole('button', { name: 'Документи' })).toHaveClass(/border-blue-600/);
    });

    test('should activate correct tab from direct URL', async ({ page }) => {
        await page.goto('/@petar_s?tab=media');
        await page.waitForSelector('h1', { timeout: 15_000 });
        const mediaTab = page.getByRole('button', { name: 'Медия' });
        await expect(mediaTab).toHaveClass(/border-blue-600/);
    });

    test('clicking Приятели stat switches to Приятели tab', async ({ page }) => {
        await page.getByText(/\d+ Приятели/).click();
        await expect(page).toHaveURL(/tab=friends/, { timeout: 10_000 });
    });
});

test.describe('Username Page - Stranger Actions', () => {
    test.beforeEach(async ({ page }) => {
        await setupProfilePage(page, mockStrangerProfile);
    });

    test('should show "Добави" add friend button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Добави/ })).toBeVisible({ timeout: 10_000 });
    });

    test('should show "Последвай" follow button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Последвай' })).toBeVisible({ timeout: 10_000 });
    });

    test('should show message button', async ({ page }) => {
        const messageBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(2);
        await expect(messageBtn).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Username Page - Pending Sent Actions', () => {
    test.beforeEach(async ({ page }) => {
        await setupProfilePage(page, mockPendingSentProfile);
    });

    test('should show "Изпратена" pending button', async ({ page }) => {
        await expect(page.getByText('Изпратена')).toBeVisible({ timeout: 10_000 });
    });

    test('should show cancel option on hover (Откажи text present in DOM)', async ({ page }) => {
        await expect(page.getByText('Откажи').first()).toBeAttached({ timeout: 10_000 });
    });
});

test.describe('Username Page - Pending Received Actions', () => {
    test.beforeEach(async ({ page }) => {
        await setupProfilePage(page, mockPendingReceivedProfile);
    });

    test('should show "Потвърди" accept button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Потвърди' })).toBeVisible({ timeout: 10_000 });
    });

    test('should show "Откажи" decline button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Откажи' })).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Username Page - Friend State Actions', () => {
    test.beforeEach(async ({ page }) => {
        await setupProfilePage(page, mockFriendProfile);
    });

    test('should show green "Приятели" dropdown button', async ({ page }) => {
        await expect(page.getByTestId('friends-dropdown-btn')).toBeVisible({ timeout: 10_000 });
    });

    test('should show "Последван" button when following', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Последван/ })).toBeVisible({ timeout: 10_000 });
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

test.describe('Username Page - Followers/Following Dialogs', () => {
    test.beforeEach(async ({ page }) => {
        await setupProfilePage(page, mockStrangerProfile);
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

test.describe('Username Page - Own Profile Redirect', () => {
    test('should redirect to /profile when visiting own username', async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto(`/@${process.env.TEST_USER_USERNAME}`);
        await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });
    });
});

test.describe('Username Page - Protected Route', () => {
    test('should redirect to login when not authenticated', async ({ browser }) => {
        const freshContext = await browser.newContext();
        const freshPage = await freshContext.newPage();
        await freshPage.goto('/petar_s');
        await expect(freshPage).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        await freshContext.close();
    });
});

test.describe('Username Page - Not Found', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/Profile/nonexistent_user_xyz', async (route: any) => {
            await route.fulfill({ status: 404 });
        });
    });

    test('should render 404 page for non-existent username', async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/nonexistent_user_xyz');
        await expect(page.getByText(/404|не е намерен|not found/i)).toBeVisible({ timeout: 15_000 });
    });
});
