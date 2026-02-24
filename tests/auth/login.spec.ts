import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {

       test.beforeEach(async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    });

    test('should display the login form with all elements', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

        await expect(page.getByRole('textbox', { name: 'Username or Email' })).toBeVisible();

        await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();

        await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();

        await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

        await expect(page.getByRole('button', { name: 'Forgot your password?' })).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.getByRole('textbox', { name: 'Username or Email' }).fill(process.env.TEST_USER_EMAIL!);
        await page.getByRole('textbox', { name: 'Password' }).fill(process.env.TEST_USER_PASSWORD!);

        await page.getByRole('button', { name: 'Login', exact: true }).click();

        await page.waitForURL('/', { timeout: 15_000 });

        await expect(page).toHaveURL(/\/$/);
    });


    test('should show error message on invalid credentials', async ({ page }) => {
        await page.getByRole('textbox', { name: 'Username or Email' }).fill('wrong@user.com');
        await page.getByRole('textbox', { name: 'Password' }).fill('WrongPassword123!');

        await page.getByRole('button', { name: 'Login', exact: true }).click();

        const errorMessage = page.locator('p.text-red-600');
        await expect(errorMessage).toBeVisible({ timeout: 10_000 });
    });


    test('should not submit with empty fields (HTML5 validation)', async ({ page }) => {
        await page.getByRole('button', { name: 'Login', exact: true }).click();

        await page.waitForTimeout(500);

        await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('should navigate to signup page via link', async ({ page }) => {
        await page.getByRole('link', { name: 'Sign up' }).click();

        await expect(page).toHaveURL(/\/auth\/signup/);
    });

    test('should show error when clicking forgot password without email', async ({ page }) => {
        await page.getByRole('button', { name: 'Forgot your password?' }).click();

        const errorMessage = page.locator('p.text-red-600');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('Please enter your email');
    });

    test('should show error when clicking forgot password with invalid email', async ({ page }) => {
        await page.getByRole('textbox', { name: 'Username or Email' }).fill('notanemail');

        await page.getByRole('button', { name: 'Forgot your password?' }).click();

        const errorMessage = page.locator('p.text-red-600');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('valid email');
    });

    test('should show loading state on login button during submission', async ({ page }) => {
        await page.route('**/api/Auth/**', async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 2_000));
            await route.continue();
        });

        await page.getByRole('textbox', { name: 'Username or Email' }).fill('test@example.com');
        await page.getByRole('textbox', { name: 'Password' }).fill('SomePassword123!');

        await page.getByRole('button', { name: 'Login', exact: true }).click();

        await expect(page.getByRole('button', { name: 'Logging in...' })).toBeVisible({ timeout: 5_000 });
    });
});
