import { test, expect } from '@playwright/test';

test.describe('Transfer transaction flow', () => {
  test('shows transfer vault pickers and submits a transfer payload', async ({ page }) => {
    const transactionPayloads: unknown[] = [];

    await page.addInitScript(() => {
      window.localStorage.setItem('auth_token', 'fake-token');
      window.localStorage.setItem('pocket_pixel_profile', JSON.stringify({ id: 'user-1', name: 'Hero', email: 'hero@example.com' }));
    });

    await page.route('**/api/users/user-1**', async (route) => {
      const url = route.request().url();
      if (url.includes('/users/user-1') && url.includes('/transactions') && route.request().method() === 'POST') {
        transactionPayloads.push(route.request().postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'txn-1' }),
        });
        return;
      }

      if (url.includes('/users/user-1/profile') || url.includes('/users/user-1') && url.includes('/transactions') && route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (url.includes('/users/user-1/vaults')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'vault-1', name: 'Cash', icon: 'Wallet', backgroundColor: '#f59e0b', description: '', isDefault: true, monthlyBudget: null },
            { id: 'vault-2', name: 'Savings', icon: 'PiggyBank', backgroundColor: '#10b981', description: '', isDefault: false, monthlyBudget: null },
          ]),
        });
        return;
      }

      if (url.includes('/users/user-1/tags')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (url.includes('/users/user-1/recurring/occurrences')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (url.includes('/users/user-1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'user-1', name: 'Hero', email: 'hero@example.com', avatar: '' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/');

    await page.locator('button:has(svg.lucide-plus)').click();
    await page.getByRole('button', { name: /manual entry/i }).click();
    await page.getByRole('button', { name: /transfer/i }).click();

    await expect(page.getByRole('button', { name: /select source vault/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /select target vault/i })).toBeVisible();

    await page.getByPlaceholder('0.00').fill('35.5');
    await page.getByRole('button', { name: /select source vault/i }).click();
    await page.getByRole('button', { name: 'Cash' }).last().click();
    await page.getByRole('button', { name: /select target vault/i }).click();
    await expect(page.getByRole('button', { name: 'Cash' }).last()).toBeDisabled();
    await page.getByRole('button', { name: 'Savings' }).last().click();

    await page.getByRole('button', { name: /record/i }).click();

    await expect.poll(() => transactionPayloads.length).toBe(1);
    expect(transactionPayloads[0]).toMatchObject({
      amount: 35.5,
      type: 'transfer',
      sourceVaultId: 'vault-1',
      targetVaultId: 'vault-2',
    });
  });
});
