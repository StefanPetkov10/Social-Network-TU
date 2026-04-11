import { test, expect } from '@playwright/test';
import { setRegistrationInProgress } from '../helpers';

test.describe('Confirmation Sent Page', () => {

    test.describe('Without registration flow (direct access)', () => {

        test('should redirect to login when accessed without registration in progress', async ({ page }) => {
            await page.goto('/auth/confirmation-sent');

            await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        });
    });

    test.describe('With registration flow active', () => {

        test.beforeEach(async ({ page }) => {
            await setRegistrationInProgress(page);
            await page.goto('/auth/confirmation-sent');
            await expect(page.getByRole('heading', { name: 'Check Your Email' })).toBeVisible();
        });

        test('should display all confirmation page elements', async ({ page }) => {
            await expect(page.getByRole('heading', { name: 'Check Your Email' })).toBeVisible();
            await expect(page.getByText('test@example.com')).toBeVisible();
            await expect(page.getByText('Click the confirmation link in the email to activate your account.')).toBeVisible();
            await expect(page.getByText('The link will expire in 24 hours.')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Resend Confirmation Email' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Back to Login' })).toBeVisible();
            await expect(page.getByText("Didn't receive the email?")).toBeVisible();
            await expect(page.getByText('Check your spam folder')).toBeVisible();
        });

        test('should show loading state when resending confirmation', async ({ page }) => {
            await page.route('**/api/Auth/resend-confirmation', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 2_000));
                await route.continue();
            });

            await page.getByRole('button', { name: 'Resend Confirmation Email' }).click();

            await expect(page.getByRole('button', { name: 'Sending...' })).toBeVisible({ timeout: 5_000 });
        });

        test('should navigate to login via Back to Login button', async ({ page }) => {
            await page.getByRole('button', { name: 'Back to Login' }).click();

            await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
        });
    });
});
