 import { test, expect } from '@playwright/test';

test.describe('Auth Guard', () => {
  test('redirects unauthenticated users to the sign-in page', async ({ page }) => {
    await page.goto('/signin');

    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto('/profile');

    await expect(page).toHaveURL(/\/signin/);

    await expect(
      page.getByRole('heading', { name: /player login/i })
    ).toBeVisible();
  });
});