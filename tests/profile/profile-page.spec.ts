import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers';

test.describe('Profile Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/profile');
        await page.waitForSelector('h1', { timeout: 15_000 });
    });

    test('should render profile page', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Редактирай профил/ })).toBeVisible({ timeout: 10_000 });
    });

    test('should render username', async ({ page }) => {
        await expect(page.getByText(`@${process.env.TEST_USER_USERNAME}`)).toBeVisible({ timeout: 10_000 });
    });

    test('should render bio or placeholder', async ({ page }) => {
        const bioSection = page.getByTestId('profile-bio');
        await expect(bioSection).toBeVisible({ timeout: 10_000 });

        const bioText = bioSection.locator('p').first();
        const placeholder = bioSection.getByText('Добавете кратко описание за себе си...');

        await expect(bioText.or(placeholder)).toBeVisible();
    });

    test('should render display stats', async ({ page }) => {
        await expect(page.getByText(/\d+ Приятели/)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(/\d+ Последователи/)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(/\d+ Последвани/)).toBeVisible({ timeout: 10_000 });
    });

    test('should open edit profile modal', async ({ page }) => {
        await page.getByRole('button', { name: /Редактирай профил/ }).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    });

    test('should switch to friends tab', async ({ page }) => {
        await page.getByText(/\d+ Приятели/).click();
        await expect(page.getByRole('heading', { name: 'Приятели' })).toBeVisible({ timeout: 10_000 });
    });

    test('should open followers dialog', async ({ page }) => {
        await page.getByText(/\d+ Последователи/).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    });

    test('should open following dialog', async ({ page }) => {
        await page.getByText(/\d+ Последвани/).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    });

    test('should default to Публикации tab', async ({ page }) => {
        const pubTab = page.getByRole('button', { name: 'Публикации' });
        await expect(pubTab).toBeVisible({ timeout: 10_000 });
        await expect(pubTab).toHaveClass(/border-blue-600/);
    });

    test('should switch to Приятели tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Приятели' }).click();
        await expect(page).toHaveURL(/tab=friends/);
        await expect(page.getByRole('button', { name: 'Приятели' })).toHaveClass(/border-blue-600/);
    });
});

test.describe('Profile Page - Tabs', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/profile');
        await page.waitForSelector('h1', { timeout: 15_000 });
    });

    test('should switch to Публикации tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Публикации' }).click();
        await expect(page).toHaveURL(/tab=posts/);
        await expect(page.getByRole('button', { name: 'Публикации' })).toHaveClass(/border-blue-600/);
    });

    test('should switch to Приятели tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Приятели' }).click();
        await expect(page).toHaveURL(/tab=friends/);
        await expect(page.getByRole('button', { name: 'Приятели' })).toHaveClass(/border-blue-600/);
    });

    test('should switch to Медия tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Медия' }).click();
        await expect(page).toHaveURL(/tab=media/);
        await expect(page.getByRole('button', { name: 'Медия' })).toHaveClass(/border-blue-600/);
    });

    test('should switch to Документи tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Документи' }).click();
        await expect(page).toHaveURL(/tab=documents/);
        await expect(page.getByRole('button', { name: 'Документи' })).toHaveClass(/border-blue-600/);
    });

    test('should activate correct tab from direct URL', async ({ page }) => {
        await page.goto('/profile?tab=media');
        await page.waitForSelector('h1', { timeout: 15_000 });
        const mediaTab = page.getByRole('button', { name: 'Медия' });
        await expect(mediaTab).toHaveClass(/border-blue-600/);
    });
});

test.describe('Profile Page - Edit Profile Modal', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
        await page.goto('/profile');
        await page.waitForSelector('h1', { timeout: 15_000 });
    });

    test('should open edit profile modal', async ({ page }) => {
        await page.getByRole('button', { name: 'Редактирай профил' }).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    });

    test('should close edit profile modal', async ({ page }) => {
        await page.getByRole('button', { name: 'Редактирай профил' }).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
        await page.getByTestId('cancel-button').click();
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
    });

    test('should have fields pre-filled with current data', async ({ page }) => {
        await page.getByRole('button', { name: 'Редактирай профил' }).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

        await expect(page.locator('#firstName')).not.toHaveValue('');
        await expect(page.locator('#lastName')).not.toHaveValue('');
        await expect(page.locator('#username')).not.toHaveValue('');
    });

    test('should display avatar upload button', async ({ page }) => {
        await page.getByRole('button', { name: 'Редактирай профил' }).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

        await expect(page.getByText('Качи нова снимка')).toBeVisible();
    });

    test('should display bio character counter', async ({ page }) => {
        await page.getByRole('button', { name: 'Редактирай профил' }).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

        await expect(page.getByText(/\/100/)).toBeVisible();
    });

    test('should show error when bio exceeds 100 characters', async ({ page }) => {
        await page.getByRole('button', { name: 'Редактирай профил' }).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

        await page.locator('#bio').fill('A'.repeat(101));
        await expect(page.getByText(/не може да надвишава 100/)).toBeVisible();
    });
});

test.describe('Profile Page - Protected Route', () => {

    test('should redirect to login if not authenticated', async ({ page }) => {
        await page.goto('/profile');
        await page.evaluate(() => sessionStorage.removeItem('auth-storage'));
        await page.goto('/profile');
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    });
});
