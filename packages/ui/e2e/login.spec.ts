import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end coverage for the sign-in page (`/signin`).
 *
 * The API is stubbed via `page.route` so the tests are deterministic and do not
 * require a running backend. We assert on user-visible, accessible behaviour
 * (roles, labels, text) rather than implementation details such as CSS classes.
 */

const SIGN_IN_URL = '**/auth/sign-in';

const VALID_CREDENTIALS = {
  email: 'hero@guild.com',
  password: 'super-secret',
};

const AUTH_RESPONSE = {
  token: 'fake-jwt-token',
  id: 'user-1',
  name: 'Hero',
  email: VALID_CREDENTIALS.email,
  avatar: '',
};

/** Stub the sign-in endpoint with the given status/body. */
const mockSignIn = async (page: Page, status: number, body: unknown): Promise<void> => {
  await page.route(SIGN_IN_URL, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
};

test.describe('Sign-in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test('renders the login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /player login/i })).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /enter the world/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create account/i })).toBeVisible();
  });

  test('shows validation errors when submitting an empty form', async ({ page }) => {
    await page.getByRole('button', { name: /enter the world/i }).click();

    // Both the email and password fields are required.
    await expect(page.getByText('Required')).toHaveCount(2);
  });

  test('blocks submission of a malformed email', async ({ page }) => {
    await page.getByLabel('Email Address').fill('not-an-email');
    await page.getByLabel('Password').fill(VALID_CREDENTIALS.password);
    await page.getByRole('button', { name: /enter the world/i }).click();

    // The `type="email"` input fails native constraint validation, so the form
    // never submits and the user remains on the sign-in page.
    const emailInput = page.getByLabel('Email Address');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
    await expect(page).toHaveURL(/\/signin/);
  });

  test('surfaces the API error message on failed sign-in', async ({ page }) => {
    await mockSignIn(page, 401, { message: 'Invalid email or password' });

    await page.getByLabel('Email Address').fill(VALID_CREDENTIALS.email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: /enter the world/i }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    // The user stays on the sign-in page.
    await expect(page).toHaveURL(/\/signin/);
  });

  test('signs in successfully and redirects to the dashboard', async ({ page }) => {
    await mockSignIn(page, 200, AUTH_RESPONSE);

    await page.getByLabel('Email Address').fill(VALID_CREDENTIALS.email);
    await page.getByLabel('Password').fill(VALID_CREDENTIALS.password);
    await page.getByRole('button', { name: /enter the world/i }).click();

    // The dashboard lives at the app root.
    await expect(page).toHaveURL(/\/$/);

    // The session is persisted so the user stays authenticated on reload.
    const token = await page.evaluate(() => window.localStorage.getItem('auth_token'));
    expect(token).toBe(AUTH_RESPONSE.token);
  });

  test('navigates to the sign-up page', async ({ page }) => {
    await page.getByRole('link', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
