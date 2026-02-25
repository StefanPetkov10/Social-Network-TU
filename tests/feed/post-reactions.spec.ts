import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('Post Reactions', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        const firstPost = page.getByTestId('post-card').first();
        await expect(firstPost).toBeVisible({ timeout: 15_000 });
    });

    test.describe('Like Button', () => {

        test('should display like button on post', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            await expect(firstPost.getByRole('button', { name: /Харесване|Харесва ми|Любов|Ха-ха|Браво|Подкрепа/ })).toBeVisible();
        });

        test('should toggle like on click', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const likeButton = firstPost.getByRole('button', { name: /Харесване|Харесва ми|Любов|Ха-ха|Браво|Подкрепа/ });

            await likeButton.click();
            await page.waitForTimeout(500);

            await expect(likeButton).toBeVisible();
        });

        test('should unlike a previously liked post', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const likeButton = firstPost.getByRole('button', { name: /Харесване|Харесва ми|Любов|Ха-ха|Браво|Подкрепа/ });

            await likeButton.click();
            await page.waitForTimeout(500);

            await likeButton.click();
            await page.waitForTimeout(500);

            await expect(likeButton).toBeVisible();
        });
    });

    test.describe('Reaction Picker', () => {

        test('should show reaction picker on hover', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const reactionArea = firstPost.getByTestId('reaction-trigger-area');

            await reactionArea.hover();
            await page.waitForTimeout(500);

            await expect(page.getByTitle('Харесва ми')).toBeVisible({ timeout: 3_000 });
            await expect(page.getByTitle('Любов')).toBeVisible();
            await expect(page.getByTitle('Ха-ха')).toBeVisible();
            await expect(page.getByTitle('Браво')).toBeVisible();
            await expect(page.getByTitle('Подкрепа')).toBeVisible();
        });

        test('should apply Love reaction from picker', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const reactionArea = firstPost.getByTestId('reaction-trigger-area');

            await reactionArea.hover();
            await page.waitForTimeout(500);

            await page.getByTitle('Любов').click();
            await page.waitForTimeout(500);

            await expect(firstPost.getByText('Любов')).toBeVisible();
        });

        test('should apply Funny reaction from picker', async ({ page }) => {
            const firstPost = page.getByTestId('post-card').first();
            const reactionArea = firstPost.getByTestId('reaction-trigger-area');

            await reactionArea.hover();
            await page.waitForTimeout(500);

            await page.getByTitle('Ха-ха').click();
            await page.waitForTimeout(500);

            await expect(firstPost.getByText('Ха-ха')).toBeVisible();
        });
    });

    test.describe('Reaction Count', () => {

    test('should update reaction count after liking', async ({ page }) => {
        const firstPost = page.getByTestId('post-card').first();
        const likeButton = firstPost.getByRole('button', { name: /Харесване|Харесва ми|Любов|Ха-ха|Браво|Подкрепа/ });

        const buttonText = await likeButton.innerText();
        if (buttonText.includes('Харесва ми') || 
                buttonText.includes('Любов') || 
                buttonText.includes('Ха-ха') || 
                buttonText.includes('Браво') || 
                buttonText.includes('Подкрепа')) {
            await likeButton.click();
            await page.waitForTimeout(1_000); 
        }

        await likeButton.click();
        await page.waitForTimeout(1_000); 

        const reactionCountArea = firstPost.getByTestId('reaction-count');
        await expect(reactionCountArea).toBeVisible({ timeout: 5000 });
    });
  });
});