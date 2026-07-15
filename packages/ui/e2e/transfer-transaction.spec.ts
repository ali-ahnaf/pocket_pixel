import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end coverage for the "Transfer" flow in the new-transaction modal.
 *
 * The API is stubbed via `page.route` so the test is deterministic and needs no
 * running backend. We seed an authenticated session in localStorage, open the
 * "Log new resource" modal from the dashboard, switch to Transfer, and assert
 * the transfer request the UI sends on confirm.
 */

const USER = { id: 'user-1', name: 'Hero', email: 'hero@guild.com', avatar: '' };

const CASH_VAULT = { id: '11111111-1111-1111-1111-111111111111', name: 'Cash', icon: 'Wallet', isDefault: true };
const BANK_VAULT = { id: '22222222-2222-2222-2222-222222222222', name: 'Bank', icon: 'Landmark', isDefault: false };
const VAULTS = [CASH_VAULT, BANK_VAULT];

type TransferBody = {
  amount: number;
  vaultId: string;
  targetVaultId: string;
  tagIds?: string[];
  title?: string | null;
};

/** Stub every API call the dashboard + modal make. Returns a getter for the captured transfer body. */
const stubApi = async (page: Page): Promise<() => TransferBody | null> => {
  let transferBody: TransferBody | null = null;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const method = request.method();

    if (method === 'POST' && pathname.endsWith('/transactions/transfer')) {
      transferBody = request.postDataJSON() as TransferBody;
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'txn-transfer-1' }) });
    }

    let body: unknown = {};
    if (pathname.endsWith('/vaults')) body = VAULTS;
    else if (pathname.endsWith('/tags')) body = [];
    else if (pathname.includes('/transactions')) body = [];
    else if (pathname.includes('/recurring/occurrences')) body = [];
    else if (pathname.endsWith('/preferences')) body = { id: 'pref-1', showIncome: true, showExpense: true };
    else if (pathname.endsWith(`/users/${USER.id}`)) body = USER;

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  return () => transferBody;
};

/** Seed an authenticated session so the dashboard renders. */
const seedSession = async (page: Page): Promise<void> => {
  await page.addInitScript((user) => {
    window.localStorage.setItem('auth_token', 'fake-jwt-token');
    window.localStorage.setItem('pocket_pixel_profile', JSON.stringify(user));
  }, USER);
};

test.describe('Transfer transaction flow', () => {
  test('sends a transfer with source and target vaults on confirm', async ({ page }) => {
    const getTransfer = await stubApi(page);
    await seedSession(page);
    await page.goto('/');

    // Open the modal and reveal the manual-entry fields.
    await page.getByRole('button', { name: /log new resource/i }).click();
    await page.getByRole('button', { name: /manual entry/i }).click();

    // Three type options are available; switch to Transfer.
    await expect(page.getByRole('button', { name: /^expense$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^income$/i })).toBeVisible();
    await page.getByRole('button', { name: /^transfer$/i }).click();

    // Two vault pickers appear (single picker is hidden in transfer mode).
    await expect(page.getByText('From (source)')).toBeVisible();
    await expect(page.getByText('To (target)')).toBeVisible();

    // The source vault cannot be re-picked as the target (prevention feedback).
    await page.getByRole('button', { name: 'Target vault' }).click();
    await expect(page.getByText('IN USE')).toBeVisible();
    // Dismiss the dropdown by clicking its full-screen overlay.
    await page.mouse.click(5, 5);
    await expect(page.getByText('IN USE')).toBeHidden();

    await page.getByPlaceholder('0.00').fill('50');
    await page.getByRole('button', { name: /^record$/i }).click();

    await expect.poll(getTransfer).not.toBeNull();
    const body = getTransfer()!;
    expect(body.amount).toBe(50);
    expect(body.vaultId).toBe(CASH_VAULT.id);
    expect(body.targetVaultId).toBe(BANK_VAULT.id);
    expect(body.vaultId).not.toBe(body.targetVaultId);
  });

  test('keeps the expense flow posting to the plain transactions endpoint', async ({ page }) => {
    let plainCreateCalled = false;
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const { pathname } = new URL(request.url());
      const method = request.method();

      if (method === 'POST' && pathname.endsWith('/transactions')) {
        plainCreateCalled = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'txn-1' }) });
      }

      let body: unknown = {};
      if (pathname.endsWith('/vaults')) body = VAULTS;
      else if (pathname.endsWith('/tags')) body = [];
      else if (pathname.includes('/transactions')) body = [];
      else if (pathname.includes('/recurring/occurrences')) body = [];
      else if (pathname.endsWith('/preferences')) body = { id: 'pref-1', showIncome: true, showExpense: true };
      else if (pathname.endsWith(`/users/${USER.id}`)) body = USER;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    await seedSession(page);
    await page.goto('/');

    await page.getByRole('button', { name: /log new resource/i }).click();
    await page.getByRole('button', { name: /manual entry/i }).click();
    await page.getByPlaceholder('0.00').fill('12');
    await page.getByRole('button', { name: /^record$/i }).click();

    await expect.poll(() => plainCreateCalled).toBe(true);
  });
});
