import { test, expect } from '@playwright/test';

test.describe('Email Confirmed Page', () => {

    test.describe('Without query params (direct access)', () => {

        test('should redirect to login when accessed without userId and token', async ({ page }) => {
            await page.goto('/auth/email-confirmed');

            await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        });
    });

    test.describe('With invalid query params', () => {

        test('should show processing state then error for invalid token', async ({ page }) => {
            await page.goto('/auth/email-confirmed?userId=00000000-0000-0000-0000-000000000000&token=invalid-token');

            await expect(page.getByRole('heading', { name: 'Confirmation Failed' })).toBeVisible();
            await expect(page.getByText('No user with that ID.')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Get New Confirmation Link' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Go to Homepage' })).toBeVisible();
        });

        test('should navigate to resend page from error state', async ({ page }) => {
            await page.goto('/auth/email-confirmed?userId=00000000-0000-0000-0000-000000000000&token=invalid-token');

            await expect(page.getByRole('heading', { name: 'Confirmation Failed' })).toBeVisible({ timeout: 15_000 });

            await page.getByRole('button', { name: 'Get New Confirmation Link' }).click();

            await expect(page).toHaveURL(/\/auth\/confirmation-sent/, { timeout: 10_000 });
        });

        test('should navigate to homepage from error state', async ({ page }) => {
            await page.goto('/auth/email-confirmed?userId=00000000-0000-0000-0000-000000000000&token=invalid-token');

            await expect(page.getByRole('heading', { name: 'Confirmation Failed' })).toBeVisible({ timeout: 15_000 });

            await page.getByRole('button', { name: 'Go to Homepage' }).click();

            await expect(page).toHaveURL(/\/$/);
        });
    });

    test.describe('Successful confirmation (mocked)', () => {

        test('should show success state when email is confirmed', async ({ page }) => {
            await page.route('**/api/Auth/confirmemail**', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Email confirmed successfully.',
                        data: null,
                    }),
                });
            });

            await page.goto('/auth/email-confirmed?userId=test-user-id&token=valid-token');

            await expect(page.getByRole('heading', { name: 'Email Confirmed!' })).toBeVisible({ timeout: 15_000 });
            await expect(page.getByText('Your email has been successfully verified')).toBeVisible();
            await expect(page.getByText('Your account is now active.')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Continue to Login' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Go to Homepage' })).toBeVisible();
        });

        test('should navigate to login from success state', async ({ page }) => {
            await page.route('**/api/Auth/confirmemail**', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Email confirmed successfully.',
                        data: null,
                    }),
                });
            });

            await page.goto('/auth/email-confirmed?userId=test-user-id&token=valid-token');

            await expect(page.getByRole('heading', { name: 'Email Confirmed!' })).toBeVisible({ timeout: 15_000 });
            await page.getByRole('button', { name: 'Continue to Login' }).click();

            await expect(page).toHaveURL(/\/auth\/login/);
        });
    });
});
