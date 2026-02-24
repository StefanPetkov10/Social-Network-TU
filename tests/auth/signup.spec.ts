import { test, expect } from '@playwright/test';

test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/signup');
        await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    });

    test('should display the signup form with all elements', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
        await expect(page.getByText('Enter your details below to create your account')).toBeVisible();

        await expect(page.getByRole('textbox', { name: 'First Name' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Last Name' })).toBeVisible();
        await expect(page.getByRole('group').filter({ hasText: 'Username' }).getByRole('textbox')).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();

        await expect(page.getByRole('group').filter({ hasText: 'Date of' })).toBeVisible();

        await expect(page.getByText('GenderFemaleMaleOther')).toBeVisible();

        await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Confirm Password' })).toBeVisible();

        await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

        await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    });

    test('should not submit with empty fields', async ({ page }) => {
        await page.getByRole('button', { name: 'Create Account' }).click();

        await page.waitForTimeout(500);

        await expect(page).toHaveURL(/\/auth\/signup/);
    });

    test('should show error when password is too short', async ({ page }) => {
        await page.getByRole('textbox', { name: 'First Name' }).fill('John');
        await page.getByRole('textbox', { name: 'Last Name' }).fill('Doe');
        await page.getByRole('group').filter({ hasText: 'Username' }).getByRole('textbox').fill('johndoe');
        await page.getByRole('textbox', { name: 'Email' }).fill('john@example.com');
        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('short');
        await page.getByRole('textbox', { name: 'Confirm Password' }).fill('short');

        await page.getByRole('button', { name: 'Create Account' }).click();

        const errorMessage = page.locator('p[role="alert"]');
        await expect(errorMessage).toHaveText('Password must be at least 8 characters long.');
    });

    test('should show error when passwords do not match', async ({ page }) => {
        await page.getByRole('textbox', { name: 'First Name' }).fill('John');
        await page.getByRole('textbox', { name: 'Last Name' }).fill('Doe');
        await page.getByRole('group').filter({ hasText: 'Username' }).getByRole('textbox').fill('johndoe');
        await page.getByRole('textbox', { name: 'Email' }).fill('john@example.com');
        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('ValidPass123!');
        await page.getByRole('textbox', { name: 'Confirm Password' }).fill('DifferentPass456!');

        await page.getByRole('button', { name: 'Create Account' }).click();

        const errorMessage = page.locator('p[role="alert"]');
        await expect(errorMessage).toHaveText('Passwords do not match.');
    });

    test('should show error when user is under 14 years old', async ({ page }) => {
        const currentYear = new Date().getFullYear();

        await page.getByRole('textbox', { name: 'First Name' }).fill('John');
        await page.getByRole('textbox', { name: 'Last Name' }).fill('Doe');
        await page.getByRole('group').filter({ hasText: 'Username' }).getByRole('textbox').fill('johndoe');
        await page.getByRole('textbox', { name: 'Email' }).fill('john@example.com');

        const underageYear = currentYear - 10;
        const dobField = page.getByRole('group').filter({ hasText: 'Date of' });
        const selects = dobField.locator('select');
        await selects.nth(2).selectOption(String(underageYear));

        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('ValidPass123!');
        await page.getByRole('textbox', { name: 'Confirm Password' }).fill('ValidPass123!');

        await page.getByRole('button', { name: 'Create Account' }).click();

        const errorMessage = page.locator('p[role="alert"]');
        await expect(errorMessage).toHaveText('You must be at least 14 years old.');
    });

    test('should show error for duplicate email', async ({ page }) => {
        await page.getByRole('textbox', { name: 'First Name' }).fill('Test');
        await page.getByRole('textbox', { name: 'Last Name' }).fill('User');
        await page.getByRole('group').filter({ hasText: 'Username' }).getByRole('textbox').fill('uniqueuser_' + Date.now());
        await page.getByRole('textbox', { name: 'Email' }).fill(process.env.TEST_USER_EMAIL!);

        const dobField = page.getByRole('group').filter({ hasText: 'Date of' });
        const selects = dobField.locator('select');
        await selects.nth(0).selectOption('15');
        await selects.nth(1).selectOption('6');
        await selects.nth(2).selectOption('2000');

        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('ValidPass123!');
        await page.getByRole('textbox', { name: 'Confirm Password' }).fill('ValidPass123!');

        await page.getByRole('button', { name: 'Create Account' }).click();

        const errorMessage = page.locator('p[role="alert"]');
        await expect(errorMessage).toBeVisible({ timeout: 10_000 });
        await expect(errorMessage).toContainText(/email/i);
    });

    test('should show error for duplicate username', async ({ page }) => {
        await page.getByRole('textbox', { name: 'First Name' }).fill('Test');
        await page.getByRole('textbox', { name: 'Last Name' }).fill('User');
        await page.getByRole('group').filter({ hasText: 'Username' }).getByRole('textbox').fill(process.env.TEST_USER_USERNAME!);
        await page.getByRole('textbox', { name: 'Email' }).fill('unique_' + Date.now() + '@test.com');

        const dobField = page.getByRole('group').filter({ hasText: 'Date of' });
        const selects = dobField.locator('select');
        await selects.nth(0).selectOption('15');
        await selects.nth(1).selectOption('6');
        await selects.nth(2).selectOption('2000');

        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('ValidPass123!');
        await page.getByRole('textbox', { name: 'Confirm Password' }).fill('ValidPass123!');

        await page.getByRole('button', { name: 'Create Account' }).click();

        const errorMessage = page.locator('p[role="alert"]');
        await expect(errorMessage).toBeVisible({ timeout: 10_000 });
        await expect(errorMessage).toContainText(/username/i);
    });

    test('should show loading state during submission', async ({ page }) => {
        await page.route('**/api/Auth/register', async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 2_000));
            await route.continue();
        });

        await page.getByRole('textbox', { name: 'First Name' }).fill('John');
        await page.getByRole('textbox', { name: 'Last Name' }).fill('Doe');
        await page.getByRole('group').filter({ hasText: 'Username' }).getByRole('textbox').fill('johndoe');
        await page.getByRole('textbox', { name: 'Email' }).fill('john@example.com');
        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('ValidPass123!');
        await page.getByRole('textbox', { name: 'Confirm Password' }).fill('ValidPass123!');

        await page.getByRole('button', { name: 'Create Account' }).click();

        await expect(page.getByRole('button', { name: 'Creating...' })).toBeVisible({ timeout: 5_000 });
    });

    test('should navigate to login page via link', async ({ page }) => {
        await page.getByRole('link', { name: 'Login' }).click();

        await expect(page).toHaveURL(/\/auth\/login/);
    });
});