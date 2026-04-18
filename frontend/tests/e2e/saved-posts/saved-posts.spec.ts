import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

const mockCollectionsData = {
    success: true,
    data: [
        { name: 'SYSTEM_DEFAULT_GENERAL', count: 3, coverImageUrl: null },
        { name: 'Любими рецепти', count: 1, coverImageUrl: 'https://example.com/food.jpg' },
        { name: 'Учебни материали', count: 5, coverImageUrl: null }
    ]
};

const mockPostsData = {
    success: true,
    data: [
        { 
            id: 'post-1', 
            content: 'Тестов запазен пост 1', 
            createdAt: new Date().toISOString(), 
            author: { 
                displayName: 'John Doe',
                username: 'johndoe',
                avatarUrl: null
            },
            reactionsCount: 0,
            commentsCount: 0
        },
        { 
            id: 'post-2', 
            content: 'Тестов запазен пост 2', 
            createdAt: new Date(Date.now() - 86400000).toISOString(), 
            author: { 
                displayName: 'Jane Doe',
                username: 'janedoe',
                avatarUrl: null
            },
            reactionsCount: 5,
            commentsCount: 2
        }
    ]
};

test.describe('Saved Posts Page', () => {

    test.describe('Page Layout & Collections Rendering', () => {
        test.beforeEach(async ({ page }) => {
            await loginAsTestUser(page);
            await page.route('**/api/SavedPosts/collections*', async route => route.fulfill({ json: mockCollectionsData }));
            await page.route('**/api/SavedPosts*', async route => route.fulfill({ json: mockPostsData }));
            
            await page.goto('/saved-posts');
            await expect(page.getByRole('heading', { name: /Запазени публикации/ })).toBeVisible({ timeout: 15_000 });
        });

        test('should display page header and description', async ({ page }) => {
            await expect(page.getByRole('heading', { name: /Запазени публикации/ })).toBeVisible();
            await expect(page.getByText('Всички ваши колекции и запазени моменти')).toBeVisible();
        });

        test('should render SYSTEM_DEFAULT_GENERAL as Основна collection', async ({ page }) => {
            await expect(page.getByText('Основна')).toBeVisible();
            await expect(page.getByText('3 публикации')).toBeVisible();
        });

        test('should render custom collections from mock data', async ({ page }) => {
            await expect(page.getByText('Любими рецепти')).toBeVisible();
            await expect(page.getByText('1 публикация').first()).toBeVisible();
            
            await expect(page.getByText('Учебни материали')).toBeVisible();
            await expect(page.getByText('5 публикации')).toBeVisible();
        });

        test('should display posts feed for the active collection', async ({ page }) => {
            const postCard = page.getByTestId('post-card').first();
            await expect(postCard).toBeVisible({ timeout: 10_000 });
        });
    });

    test.describe('Navigation & Filtering', () => {
        test.beforeEach(async ({ page }) => {
            await loginAsTestUser(page);
            await page.route('**/api/SavedPosts/collections*', async route => route.fulfill({ json: mockCollectionsData }));
            await page.route('**/api/SavedPosts*', async route => route.fulfill({ json: mockPostsData }));
            
            await page.goto('/saved-posts');
            await expect(page.getByRole('heading', { name: /Запазени публикации/ })).toBeVisible({ timeout: 15_000 });
        });

        test('should switch active collection when clicking a custom collection card', async ({ page }) => {
            await page.getByText('Любими рецепти').click();

            await expect(page.getByRole('heading', { name: 'Публикации в "Любими рецепти"' })).toBeVisible();
            await expect(page.getByText('Преглеждате колекция: Любими рецепти')).toBeVisible();
        });

        test('should show "Виж всички (Общи)" button when in custom collection and allow returning', async ({ page }) => {
            await page.getByText('Учебни материали').click();
            
            const backButton = page.getByRole('button', { name: 'Виж всички (Общи)' });
            await expect(backButton).toBeVisible();

            await backButton.click();
            await expect(page.getByText('Всички ваши колекции и запазени моменти')).toBeVisible();
            await expect(backButton).toBeHidden();
        });
    });

    test.describe('Empty States & Dynamic Behaviors', () => {
        test('should display empty state ONLY for General collection when no posts exist', async ({ page }) => {
            await loginAsTestUser(page);
            await page.route('**/api/SavedPosts/collections*', async route => route.fulfill({ 
                json: { success: true, data: [] } 
            }));
            await page.route('**/api/SavedPosts*', async route => route.fulfill({ 
                json: { success: true, data: [] } 
            }));

            await page.goto('/saved-posts');
            await expect(page.getByRole('heading', { name: 'Колекцията е празна' })).toBeVisible({ timeout: 15_000 });
            await expect(page.getByRole('link', { name: 'Към фийда' })).toBeVisible();
            await expect(page.getByText('Все още не сте запазили постове.')).toBeVisible();
        });

        test('should redirect to General collection if custom collection disappears (useEffect test)', async ({ page }) => {
            await loginAsTestUser(page);
            
            let collectionsResponse = mockCollectionsData;
            await page.route('**/api/SavedPosts/collections*', async route => route.fulfill({ json: collectionsResponse }));
            await page.route('**/api/SavedPosts*', async route => route.fulfill({ json: mockPostsData }));

            await page.goto('/saved-posts');
            await page.getByText('Любими рецепти').click();
            await expect(page.getByRole('heading', { name: 'Публикации в "Любими рецепти"' })).toBeVisible();

            collectionsResponse = {
                success: true,
                data: [{ name: 'SYSTEM_DEFAULT_GENERAL', count: 3, coverImageUrl: null }]
            };

            await page.reload(); 

            await expect(page.getByText('Всички ваши колекции и запазени моменти')).toBeVisible({ timeout: 10_000 });
            await expect(page.getByRole('heading', { name: 'Всички запазени' })).toBeVisible();
        });
    });

    test.describe('Save Post Dialog', () => {
        test.beforeEach(async ({ page }) => {
            await loginAsTestUser(page);
            await page.route('**/api/SavedPosts/collections*', async route => route.fulfill({ json: mockCollectionsData }));
            
            await page.goto('/');
            
            const firstPost = page.getByTestId('post-card').first();
            await expect(firstPost).toBeVisible({ timeout: 15_000 });
            
            await page.getByTestId('post-options-btn').first().click();
            await page.getByRole('menuitem', { name: 'Запази' }).click();
            
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
        });

        test('should display save dialog with mocked collections', async ({ page }) => {
            const dialog = page.getByRole('dialog');
            await expect(dialog.getByText('Запазване в колекция')).toBeVisible();
            await expect(dialog.getByText('Всички (Общи)')).toBeVisible();
            await expect(dialog.getByText('Любими рецепти')).toBeVisible();
            await expect(dialog.getByText('Учебни материали')).toBeVisible();
        });

        test('should allow toggling "Create new collection" input', async ({ page }) => {
            const dialog = page.getByRole('dialog');
            await dialog.getByRole('button', { name: 'Създай нова колекция' }).click();

            await expect(dialog.getByLabel('Име на новата колекция')).toBeVisible();
            await expect(dialog.getByPlaceholder('напр. Любими рецепти...')).toBeVisible();
            
            await dialog.getByRole('button', { name: 'Назад към списъка' }).click();
            await expect(dialog.getByRole('button', { name: 'Създай нова колекция' })).toBeVisible();
        });

        test('should validate empty custom collection name', async ({ page }) => {
            const dialog = page.getByRole('dialog');
            await dialog.getByRole('button', { name: 'Създай нова колекция' }).click();

            const saveButton = dialog.getByRole('button', { name: 'Запази' });
            await expect(saveButton).toBeDisabled();
        });

        test('should show error if collection name is SYSTEM_DEFAULT_GENERAL', async ({ page }) => {
            const dialog = page.getByRole('dialog');
            await dialog.getByRole('button', { name: 'Създай нова колекция' }).click();

            await dialog.getByLabel('Име на новата колекция').fill('SYSTEM_DEFAULT_GENERAL');
            await dialog.getByRole('button', { name: 'Запази' }).click();

            await expect(dialog.getByText('Това име е запазено за системни цели.')).toBeVisible();
        });

        test('should show error when collection name exceeds 50 characters', async ({ page }) => {
            const dialog = page.getByRole('dialog');
            await dialog.getByRole('button', { name: 'Създай нова колекция' }).click();

            const longName = 'A'.repeat(51);
            await dialog.getByLabel('Име на новата колекция').fill(longName);
            await dialog.getByRole('button', { name: 'Запази' }).click();

            await expect(dialog.getByText('Името не може да надвишава 50 символа')).toBeVisible();
        });

        test('should submit successfully with existing collection', async ({ page }) => {
            await page.route('**/api/SavedPosts/toggle*', async route => {
                await route.fulfill({ status: 200, json: { success: true } });
            });

            const dialog = page.getByRole('dialog');
            await dialog.getByText('Любими рецепти').click();
            await dialog.getByRole('button', { name: 'Запази' }).click();

            await expect(dialog).toBeHidden({ timeout: 5_000 });
        });
    });

    test.describe('Protected Route', () => {
        test('should redirect to login if not authenticated', async ({ browser }) => {
            const freshContext = await browser.newContext();
            const freshPage = await freshContext.newPage();
            await freshPage.goto('/saved-posts');
            await expect(freshPage).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
            await freshContext.close();
        });
    });
});