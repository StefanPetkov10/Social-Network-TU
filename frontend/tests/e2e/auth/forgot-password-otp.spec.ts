import { test, expect } from '@playwright/test';
import { setResetPasswordSessionToken, getErrorAlert } from '../helpers';

test.describe('Forgot Password OTP Page', () => {

    test.describe('Without session token (direct access)', () => {

        test('should redirect to login when accessed without session token', async ({ page }) => {
            await page.goto('/auth/forgot-password-otp');

            await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        });
    });

    test.describe('With session token', () => {

        test.beforeEach(async ({ page }) => {
            await setResetPasswordSessionToken(page);
            await page.goto('/auth/forgot-password-otp');
            await expect(page.getByRole('heading', { name: 'Enter Verification Code' })).toBeVisible();
        });

        test('should display all OTP form elements', async ({ page }) => {
            await expect(page.getByText('We sent a 6-digit code to your email')).toBeVisible();
            await expect(page.getByText('Enter the 6-digit code sent to your email.')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Verify' })).toBeEnabled();
            await expect(page.getByRole('button', { name: 'Resend' })).toBeVisible();
        });

        test('should show error when submitting without entering code', async ({ page }) => {
            await page.getByRole('button', { name: 'Verify' }).click();

            const errorMessage = page.locator('p[role="alert"]');
            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toHaveText('Please enter a 6-digit code.');
        });

        test('should show error when submitting incomplete code', async ({ page }) => {
            const otpInputs = page.locator('input[data-input-otp="true"]');
            await otpInputs.first().click();
            await page.keyboard.type('123');

            await page.getByRole('button', { name: 'Verify' }).click();

            const errorMessage = page.locator('p[role="alert"]');
            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toHaveText('Please enter a 6-digit code.');
        });

        test('should show error for invalid OTP code', async ({ page }) => {
            const otpInputs = page.locator('input[data-input-otp="true"]');
            await otpInputs.first().click();
            await page.keyboard.type('999999');

            await page.getByRole('button', { name: 'Verify' }).click();

            const errorMessage = page.locator('p[role="alert"]');
            await expect(errorMessage).toBeVisible({ timeout: 10_000 });
        });

        test('should show loading state during verification', async ({ page }) => {
            await page.route('**/api/Auth/verify-otp', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 2_000));
                await route.continue();
            });

            const otpInputs = page.locator('input[data-input-otp="true"]');
            await otpInputs.first().click();
            await page.keyboard.type('123456');

            await page.getByRole('button', { name: 'Verify' }).click();

            await expect(page.getByRole('button', { name: 'Verifying...' })).toBeVisible({ timeout: 5_000 });
        });

        test('should show loading state when resending code', async ({ page }) => {
            await page.route('**/api/Auth/resend-otp', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 2_000));
                await route.continue();
            });

            await page.getByRole('button', { name: 'Resend' }).click();

            await expect(page.getByRole('button', { name: 'Sending...' })).toBeVisible({ timeout: 5_000 });
        });
    });
});
