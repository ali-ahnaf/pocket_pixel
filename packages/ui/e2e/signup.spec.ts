// Rafin034 - Playwright E2E tests for the sign-up page
import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end coverage for the sign-up page (`/signup`).
 *
 * The API is stubbed via `page.route` so the tests are deterministic and do not
 * require a running backend. We assert on user-visible, accessible behaviour
 * (roles, labels, text) rather than implementation details such as CSS classes.
 */

// Rafin034 - API endpoint configuration
const SIGN_UP_URL = '**/auth/sign-up';

// Rafin034 - Mock payloads
const VALID_PAYLOAD = {
  name: 'Sir Budgetalot',
  email: 'hero@guild.com',
  password: 'super-secret',
};

const AUTH_RESPONSE = {
  token: 'fake-jwt-token',
  id: 'user-1',
  name: VALID_PAYLOAD.name,
  email: VALID_PAYLOAD.email,
  avatar: '/avatars/avatar-1.png',
};

/** Stub the sign-up endpoint with the given status/body. */
// Rafin034 - Helper to mock the sign-up API route
const mockSignUp = async (page: Page, status: number, body: unknown): Promise<void> => {
  await page.route(SIGN_UP_URL, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
};

// Rafin034 - Sign-up test suite
test.describe('Sign-up page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  // Rafin034 - Test rendering of form elements
  test('renders the signup form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create hero/i })).toBeVisible();
    await expect(page.getByText('Choose Avatar')).toBeVisible();
    await expect(page.getByLabel('Hero Name')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /begin adventure/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  // Rafin034 - Test empty form validation
  test('shows validation errors when submitting an empty form', async ({ page }) => {
    await page.getByRole('button', { name: /begin adventure/i }).click();

    // The name, email and password fields are required.
    await expect(page.getByText('Required')).toHaveCount(3);
  });

  // Rafin034 - Test native validation for malformed email
  test('blocks submission of a malformed email', async ({ page }) => {
    await page.getByLabel('Hero Name').fill(VALID_PAYLOAD.name);
    await page.getByLabel('Email Address').fill('not-an-email');
    await page.getByLabel('Password').fill(VALID_PAYLOAD.password);
    await page.getByRole('button', { name: /begin adventure/i }).click();

    // The `type="email"` input fails native constraint validation, so the form
    // never submits and the user remains on the sign-up page.
    const emailInput = page.getByLabel('Email Address');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
    await expect(page).toHaveURL(/\/signup/);
  });

  // Rafin034 - Test password length JS validation
  test('shows validation error for a password that is less than 8 characters', async ({ page }) => {
    await page.getByLabel('Hero Name').fill(VALID_PAYLOAD.name);
    await page.getByLabel('Email Address').fill(VALID_PAYLOAD.email);
    await page.getByLabel('Password').fill('1234567');
    await page.getByRole('button', { name: /begin adventure/i }).click();

    await expect(page.getByText('Min 8 characters')).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  // Rafin034 - Test backend error presentation
  test('surfaces the API error message on failed sign-up', async ({ page }) => {
    await mockSignUp(page, 400, { message: 'Email already in use' });

    await page.getByLabel('Hero Name').fill(VALID_PAYLOAD.name);
    await page.getByLabel('Email Address').fill(VALID_PAYLOAD.email);
    await page.getByLabel('Password').fill(VALID_PAYLOAD.password);
    await page.getByRole('button', { name: /begin adventure/i }).click();

    await expect(page.getByText('Email already in use')).toBeVisible();
    // The user stays on the sign-up page.
    await expect(page).toHaveURL(/\/signup/);
  });

  // Rafin034 - Test successful registration flow
  test('signs up successfully and redirects to the dashboard', async ({ page }) => {
    await mockSignUp(page, 200, AUTH_RESPONSE);

    await page.getByLabel('Hero Name').fill(VALID_PAYLOAD.name);
    await page.getByLabel('Email Address').fill(VALID_PAYLOAD.email);
    await page.getByLabel('Password').fill(VALID_PAYLOAD.password);
    await page.getByRole('button', { name: /begin adventure/i }).click();

    // The dashboard lives at the app root.
    await expect(page).toHaveURL(/\/$/);

    // The session is persisted (profile in localStorage; the session token itself
    // now lives in an httpOnly cookie, which is not readable from JS).
    const profile = await page.evaluate(() => window.localStorage.getItem('pocket_pixel_profile'));
    expect(profile).not.toBeNull();
    expect(JSON.parse(profile as string).id).toBe(AUTH_RESPONSE.id);
  });

  // Rafin034 - Test navigation back to login page
  test('navigates to the sign-in page', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/signin/);
  });
});
