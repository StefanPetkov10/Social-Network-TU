import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('Post Comments', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        const firstPost = page.getByTestId('post-card').first();
        await expect(firstPost).toBeVisible({ timeout: 15_000 });
    });

    test.describe('Comment Dialog', () => {

        test('should open comment dialog when clicking Comment button', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            await firstPost.getByRole('button', { name: 'Коментар' }).click();

            const dialog = page.getByTestId('comment-dialog');
            await expect(dialog).toBeVisible({ timeout: 5_000 });
            await expect(dialog.getByText(/Публикацията на/)).toBeVisible();
        });

        test('should display post content in comment dialog', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const postHasText = await firstPost.getByTestId('post-content').first().isVisible().catch(() => false);
            
            await firstPost.getByRole('button', { name: 'Коментар' }).click();

            const dialog = page.getByTestId('comment-dialog');
            await expect(dialog).toBeVisible({ timeout: 5_000 });

            if (postHasText) {
                const postContent = dialog.getByTestId('post-content').first();
                await expect(postContent).toBeVisible();
            }
        });

        test('should display comment input area', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            await firstPost.getByRole('button', { name: 'Коментар' }).click();

            const dialog = page.getByTestId('comment-dialog');
            await expect(dialog).toBeVisible({ timeout: 5_000 });

            await expect(dialog.getByPlaceholder('Напишете коментар...')).toBeVisible();
        });

        test('should display empty comments message or existing comments', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            await firstPost.getByRole('button', { name: 'Коментар' }).click();

            const dialog = page.getByTestId('comment-dialog');
            await expect(dialog).toBeVisible({ timeout: 5_000 });

            const emptyMessage = dialog.getByText('Все още няма коментари.');
            const commentsHeader = dialog.getByText('Коментари');

            await expect(emptyMessage.or(commentsHeader)).toBeVisible({ timeout: 10_000 });
        });

        test('should close comment dialog', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            await firstPost.getByRole('button', { name: 'Коментар' }).click();

            const dialog = page.getByTestId('comment-dialog');
            await expect(dialog).toBeVisible({ timeout: 5_000 });

            await dialog.getByRole('button', { name: 'Затвори' }).click();
            await expect(dialog).toBeHidden();
        });

        test('should display action buttons in dialog', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            await firstPost.getByRole('button', { name: 'Коментар' }).click();

            const dialog = page.getByTestId('comment-dialog');
            await expect(dialog).toBeVisible({ timeout: 5_000 });

            await expect(dialog.getByRole('button', { name: 'Коментар' })).toBeVisible();
            await expect(dialog.getByRole('button', { name: 'Споделяне' })).toBeVisible();
        });
    });

    test.describe('Adding Comments', () => {

        test.beforeEach(async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            await firstPost.getByRole('button', { name: 'Коментар' }).click();

            const dialog = page.getByTestId('comment-dialog');
            await expect(dialog).toBeVisible({ timeout: 5_000 });
        });

        test('should have send button disabled when input is empty', async ({ page }) => {
            const dialog = page.getByTestId('comment-dialog');
            const sendButton = dialog.getByTestId('send-comment-btn');

            await expect(sendButton).toBeDisabled();
        });

        test('should enable send button when typing text', async ({ page }) => {
            const dialog = page.getByTestId('comment-dialog');
            await dialog.getByPlaceholder('Напишете коментар...').fill('Тест коментар');

            const sendButton = dialog.getByTestId('send-comment-btn');
            await expect(sendButton).toBeEnabled();
        });

        test('should submit comment and show it in the list', async ({ page }) => {
            const dialog = page.getByTestId('comment-dialog');
            const uniqueComment = `Тест коментар ${Date.now()}`;

            await dialog.getByPlaceholder('Напишете коментар...').fill(uniqueComment);

            const sendButton = dialog.getByTestId('send-comment-btn');
            await sendButton.click();

            await expect(dialog.getByText(uniqueComment)).toBeVisible({ timeout: 10_000 });
        });

        test('should clear input after successful comment', async ({ page }) => {
            const dialog = page.getByTestId('comment-dialog');
            const uniqueComment = `Коментар за изчистване ${Date.now()}`;

            await dialog.getByPlaceholder('Напишете коментар...').fill(uniqueComment);

            const sendButton = dialog.getByTestId('send-comment-btn');
            await sendButton.click();

            await expect(dialog.getByText(uniqueComment)).toBeVisible({ timeout: 10_000 });
            await expect(dialog.getByPlaceholder('Напишете коментар...')).toHaveValue('');
        });

        test('should display image attachment button', async ({ page }) => {
            const dialog = page.getByTestId('comment-dialog');
            const imageButton = dialog.getByTestId('attach-image-btn');
            await expect(imageButton).toBeVisible();
        });

        test('should display document attachment button', async ({ page }) => {
            const dialog = page.getByTestId('comment-dialog');
            const docButton = dialog.getByTestId('attach-doc-btn');
            await expect(docButton).toBeVisible();
        });
    });

    test.describe('Comment Count', () => {

        test('should display comment count on post if has comments', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const countText = firstPost.getByText(/\d+ коментара/);

            const hasComments = await countText.isVisible().catch(() => false);
            if (!hasComments) { test.skip(); return; }

            await expect(countText).toBeVisible();
        });
    });
});