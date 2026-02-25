import { test, expect } from '@playwright/test';
import { setResetPasswordSessionToken, getErrorAlert } from '../helpers';

test.describe('Reset Password Page', () => {

    test.describe('Without session token (direct access)', () => {

        test('should redirect to login when accessed without session token', async ({ page }) => {
            await page.goto('/auth/reset-password');

            await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        });
    });

    test.describe('With session token', () => {

        test.beforeEach(async ({ page }) => {
            await setResetPasswordSessionToken(page);
            await page.goto('/auth/reset-password');
            await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
        });

        test('should display all reset password form elements', async ({ page }) => {
            await expect(page.getByText('Enter your new password below')).toBeVisible();
            await expect(page.locator('#new-password')).toBeVisible();
            await expect(page.locator('#confirm-password')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Reset Password' })).toBeEnabled();
            await expect(page.getByRole('link', { name: 'Back to Login' })).toBeVisible();
        });

        test('should not submit with empty fields', async ({ page }) => {
            await page.getByRole('button', { name: 'Reset Password' }).click();

            await page.waitForTimeout(500);

            await expect(page).toHaveURL(/\/auth\/reset-password/);
        });

        test('should show error when passwords do not match', async ({ page }) => {
            await page.locator('#new-password').fill('ValidPass123!');
            await page.locator('#confirm-password').fill('DifferentPass456!');

            await page.getByRole('button', { name: 'Reset Password' }).click();

            const errorMessage = page.locator('p[role="alert"]');
            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toHaveText('Passwords do not match.');
        });

        test('should show error when password is too short', async ({ page }) => {
            await page.locator('#new-password').fill('short');
            await page.locator('#confirm-password').fill('short');

            await page.getByRole('button', { name: 'Reset Password' }).click();

            const errorMessage = page.locator('p[role="alert"]');
            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toHaveText('Password must be at least 8 characters long.');
        });

        test('should show error for expired/invalid session on submit', async ({ page }) => {
            await page.locator('#new-password').fill('ValidPass123!');
            await page.locator('#confirm-password').fill('ValidPass123!');

            await page.getByRole('button', { name: 'Reset Password' }).click();

            const errorMessage = page.locator('p[role="alert"]');
            await expect(errorMessage).toBeVisible({ timeout: 10_000 });
        });

        test('should show loading state during password reset', async ({ page }) => {
            await page.route('**/api/Auth/reset-password', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 2_000));
                await route.continue();
            });

            await page.locator('#new-password').fill('ValidPass123!');
            await page.locator('#confirm-password').fill('ValidPass123!');

            await page.getByRole('button', { name: 'Reset Password' }).click();

            await expect(page.getByRole('button', { name: 'Resetting...' })).toBeVisible({ timeout: 5_000 });
        });

        test('should navigate to login via Back to Login link', async ({ page }) => {
            await page.getByRole('link', { name: 'Back to Login' }).click();

            await expect(page).toHaveURL(/\/auth\/login/);
        });
    });
});