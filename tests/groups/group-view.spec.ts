import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

const mockPublicGroup = {
    success: true,
    message: null,
    data: {
        id: 'group-view-01',
        name: 'Тестова Група',
        description: 'Описание на тестовата група.',
        isPrivate: false,
        isMember: true,
        isAdmin: false,
        isOwner: false,
        hasRequestedJoin: false,
        membersCount: 42,
        mutualFriends: [],
        mutualFriendsCount: 0,
        canViewPosts: true,
        canCreatePost: true,
    },
};

const mockPublicGroupNonMember = {
    success: true,
    message: null,
    data: {
        ...mockPublicGroup.data,
        isMember: false,
        isAdmin: false,
        isOwner: false,
        canCreatePost: false,
    },
};

const mockPrivateGroupNonMember = {
    success: true,
    message: null,
    data: {
        ...mockPublicGroup.data,
        isPrivate: true,
        isMember: false,
        isAdmin: false,
        isOwner: false,
        hasRequestedJoin: false,
        canViewPosts: false,
        canCreatePost: false,
    },
};

const mockPrivateGroupPending = {
    success: true,
    message: null,
    data: {
        ...mockPrivateGroupNonMember.data,
        hasRequestedJoin: true,
    },
};

const mockOwnerGroup = {
    success: true,
    message: null,
    data: {
        ...mockPublicGroup.data,
        isOwner: true,
        isAdmin: false,
    },
};

const mockGroupPosts = {
    success: true,
    message: null,
    data: [],
    meta: { lastPostId: null },
};

const mockMembers = {
    success: true,
    message: null,
    data: [],
    meta: { totalCount: 0, lastMemberId: null },
};

const GROUP_NAME = 'Тестова Група';
const GROUP_URL = `/groups/${encodeURIComponent(GROUP_NAME)}`;

async function setupGroupPage(page: any, groupMock = mockPublicGroup) {
    await page.route(`**/api/Group/${encodeURIComponent(GROUP_NAME)}`, async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(groupMock),
        });
    });

    await page.route(`**/api/Group/${groupMock.data.id}/posts*`, async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockGroupPosts),
        });
    });

    await page.route(`**/api/GroupMembership/${groupMock.data.id}/members*`, async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockMembers),
        });
    });

    await page.route(`**/api/GroupMembership/${groupMock.data.id}/admins*`, async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: null, data: [] }),
        });
    });

    await page.route(`**/api/GroupMembership/${groupMock.data.id}/friends*`, async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: null, data: [] }),
        });
    });

    await page.route(`**/api/GroupMembership/${groupMock.data.id}/mutual-friends*`, async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: null, data: [] }),
        });
    });

    await loginAsTestUser(page);
    await page.goto(GROUP_URL);
    await expect(page.getByRole('heading', { name: GROUP_NAME })).toBeVisible({ timeout: 15_000 });
}

test.describe('Group View Page - Layout', () => {
    test.beforeEach(async ({ page }) => {
        await setupGroupPage(page);
    });

    test('should display the group name as heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: GROUP_NAME })).toBeVisible();
    });

    test('should display member count', async ({ page }) => {
        await expect(page.getByText(/42 член/)).toBeVisible();
    });

    test('should display public group badge', async ({ page }) => {
        await expect(page.getByText('Публична група')).toBeVisible();
    });

    test('should display group description', async ({ page }) => {
        await expect(page.getByText('Описание на тестовата група.').first()).toBeVisible();
    });

    test('should display Информация sidebar section', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await expect(page.getByRole('heading', { name: 'Информация' })).toBeVisible();
    });

    test('should display Членове sidebar section when member', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await expect(page.getByRole('heading', { name: 'Членове' })).toBeVisible();
    });
});

test.describe('Group View Page - Tabs (member of public group)', () => {
    test.beforeEach(async ({ page }) => {
        await setupGroupPage(page);
    });

    test('should default to Публикации tab', async ({ page }) => {
        const tab = page.getByRole('button', { name: 'Публикации' });
        await expect(tab).toBeVisible();
        await expect(tab).toHaveClass(/border-blue-600/);
    });

    test('should display all base tabs', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Публикации' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Хора' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Медия' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Документи' })).toBeVisible();
    });

    test('should NOT display Чакащи tab for regular member', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Чакащи' })).not.toBeVisible();
    });

    test('should switch to Хора tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Хора' }).click();
        await expect(page.getByRole('button', { name: 'Хора' })).toHaveClass(/border-blue-600/, { timeout: 10_000 });
        await expect(page).toHaveURL(/tab=people/, { timeout: 5_000 });
    });

    test('should switch to Медия tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Медия' }).click();
        await expect(page.getByRole('button', { name: 'Медия' })).toHaveClass(/border-blue-600/, { timeout: 10_000 });
        await expect(page).toHaveURL(/tab=media/, { timeout: 5_000 });
    });

    test('should switch to Документи tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Документи' }).click();
        await expect(page.getByRole('button', { name: 'Документи' })).toHaveClass(/border-blue-600/, { timeout: 10_000 });
        await expect(page).toHaveURL(/tab=files/, { timeout: 5_000 });
    });
});

test.describe('Group View Page - Member Actions', () => {
    test.beforeEach(async ({ page }) => {
        await setupGroupPage(page);
    });

    test('should display Присъединил се dropdown button when member', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Присъединил се/ })).toBeVisible({ timeout: 10_000 });
    });

    test('should display Чат button when member', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Чат' })).toBeVisible({ timeout: 10_000 });
    });

    test('should open leave dialog from dropdown', async ({ page }) => {
        await page.getByRole('button', { name: /Присъединил се/ }).click();
        await page.getByText('Напусни групата').click();
        await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('Напускане на групата?')).toBeVisible();
    });

    test('should close leave dialog on Отказ', async ({ page }) => {
        await page.getByRole('button', { name: /Присъединил се/ }).click();
        await page.getByText('Напусни групата').click();
        await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
        await page.getByRole('button', { name: 'Отказ' }).click();
        await expect(page.getByRole('alertdialog')).toBeHidden({ timeout: 10_000 });
    });
});

test.describe('Group View Page - Non-member of Public Group', () => {
    test.beforeEach(async ({ page }) => {
        await setupGroupPage(page, mockPublicGroupNonMember);
    });

    test('should display Присъедини се button for non-member', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Присъедини се' }).first()).toBeVisible({ timeout: 10_000 });
    });

    test('should NOT display Чат button for non-member', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Чат' })).not.toBeVisible();
    });

    test('should display group description for public non-member', async ({ page }) => {
        await expect(page.getByText('Описание на тестовата група.').first()).toBeVisible();
    });
});

test.describe('Group View Page - Private Group (non-member)', () => {
    test.beforeEach(async ({ page }) => {
        await setupGroupPage(page, mockPrivateGroupNonMember);
    });

    test('should display private group badge', async ({ page }) => {
        await expect(page.getByText('Частна група')).toBeVisible();
    });

    test('should display locked content message for private non-member', async ({ page }) => {
        await expect(page.getByText('Тази група е частна')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByRole('button', { name: 'Присъедини се към групата' })).toBeVisible();
    });

    test('should display Частна in sidebar info section', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await expect(page.getByText('Частна').first()).toBeVisible();
    });
});

test.describe('Group View Page - Private Group (pending request)', () => {
    test.beforeEach(async ({ page }) => {
        await setupGroupPage(page, mockPrivateGroupPending);
    });

    test('should display Заявката е изпратена button when pending', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Заявката е изпратена' })).toBeVisible({ timeout: 10_000 });
    });

    test('should display pending message in private content area', async ({ page }) => {
        await expect(page.getByText('Вашата заявка за присъединяване се разглежда')).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Group View Page - Owner Actions', () => {
    test.beforeEach(async ({ page }) => {
        await setupGroupPage(page, mockOwnerGroup);
    });

    test('should display Собственик dropdown button for owner', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Собственик/ })).toBeVisible({ timeout: 10_000 });
    });

    test('should display Настройки на групата option in dropdown', async ({ page }) => {
        await page.getByRole('button', { name: /Собственик/ }).click();
        await expect(page.getByText('Настройки на групата')).toBeVisible({ timeout: 10_000 });
    });

    test('should show delete group option for owner', async ({ page }) => {
        await page.getByRole('button', { name: /Собственик/ }).click();
        await expect(page.getByText('Изтрий групата')).toBeVisible({ timeout: 10_000 });
    });

    test('should open delete group dialog', async ({ page }) => {
        await page.getByRole('button', { name: /Собственик/ }).click();
        await page.getByText('Изтрий групата').click();
        await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('Изтриване на групата?')).toBeVisible();
    });

    test('should close delete group dialog on Отказ', async ({ page }) => {
        await page.getByRole('button', { name: /Собственик/ }).click();
        await page.getByText('Изтрий групата').click();
        await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
        await page.getByRole('button', { name: 'Отказ' }).click();
        await expect(page.getByRole('alertdialog')).toBeHidden({ timeout: 10_000 });
    });

    test('should show Чакащи tab for owner of private group', async ({ page }) => {
        await page.route(`**/api/Group/${encodeURIComponent(GROUP_NAME)}`, async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ...mockOwnerGroup,
                    data: { ...mockOwnerGroup.data, isPrivate: true },
                }),
            });
        });
        await page.route(`**/api/GroupMembership/${mockOwnerGroup.data.id}/requests*`, async (route: any) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data: [] }) });
        });
        await page.reload();
        await expect(page.getByRole('heading', { name: GROUP_NAME })).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('button', { name: 'Чакащи' })).toBeVisible({ timeout: 10_000 });
    });

    test('should show warning dialog when owner tries to leave', async ({ page }) => {
        await page.getByRole('button', { name: /Собственик/ }).click();
        await page.getByText('Напусни групата').click();
        await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('Не можете да напуснете групата')).toBeVisible();
        await page.getByRole('button', { name: 'Разбрах' }).click();
        await expect(page.getByRole('alertdialog')).toBeHidden({ timeout: 10_000 });
    });
});

test.describe('Group View Page - Posts Tab', () => {
    test('should display empty posts state when no posts', async ({ page }) => {
        await setupGroupPage(page);
        await expect(page.getByText('Все още няма публикации.')).toBeVisible({ timeout: 15_000 });
    });

    test('should display post cards when posts exist', async ({ page }) => {
        await page.route(`**/api/Group/${encodeURIComponent(GROUP_NAME)}`, async (route: any) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPublicGroup) });
        });
        await page.route(`**/api/Group/${mockPublicGroup.data.id}/posts*`, async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: null,
                    data: [
                        { id: 'post-01', content: 'Тестова публикация в група!', authorId: 'user-01', authorName: 'Тест Потребител', authorAvatar: null, authorUsername: 'test_user', createdAt: new Date().toISOString(), likesCount: 0, commentsCount: 0, isLiked: false, mediaFiles: [], groupId: mockPublicGroup.data.id, groupName: GROUP_NAME }
                    ],
                    meta: { lastPostId: null },
                }),
            });
        });
        await page.route(`**/api/GroupMembership/${mockPublicGroup.data.id}/members*`, async (route: any) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockMembers) });
        });

        await loginAsTestUser(page);
        await page.goto(GROUP_URL);
        await expect(page.getByRole('heading', { name: GROUP_NAME })).toBeVisible({ timeout: 15_000 });

        const postCard = page.getByTestId('post-card').first();
        await expect(postCard).toBeVisible({ timeout: 15_000 });
    });
});

test.describe('Group View Page - Navigation', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
        await loginAsTestUser(page);
        await page.evaluate(() => sessionStorage.removeItem('auth-storage'));
        await page.goto(GROUP_URL);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    });

    test('should navigate to Хора tab via sidebar Виж всички button', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await setupGroupPage(page);
        await page.getByRole('button', { name: 'Виж всички' }).click();
        await expect(page.getByRole('button', { name: 'Хора' })).toHaveClass(/border-blue-600/, { timeout: 10_000 });
    });
});
