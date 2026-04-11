import { test as base, expect, Page } from '@playwright/test';

export async function loginAsTestUser(page: Page) {
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Username or Email' }).fill(process.env.TEST_USER_EMAIL!);
    await page.getByRole('textbox', { name: 'Password' }).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.waitForURL('/', { timeout: 15_000 });
}

export async function setResetPasswordSessionToken(page: Page, token = 'test-session-token') {
    await page.goto('/auth/login');
    await page.evaluate((t) => {
        sessionStorage.setItem('resetPasswordSessionToken', t);
    }, token);
}

export async function setRegistrationInProgress(page: Page, email = 'test@example.com') {
    await page.goto('/auth/login');
    await page.evaluate((e) => {
        const storeData = {
            state: {
                registrationInProgress: true,
                Email: e,
                FirstName: 'Test',
            },
            version: 0,
        };
        sessionStorage.setItem('signup-flow-store', JSON.stringify(storeData));
    }, email);
}

export function getErrorAlert(page: Page) {
    return page.locator('p[role="alert"]');
}
