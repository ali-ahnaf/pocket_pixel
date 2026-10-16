import { AppDataSource } from '../db/data-source';
import { initDatabase } from '../db/init';
import { User } from '../entities/User.entity';
import { AppError } from '../errors/app-error';
import { runWizardTool } from '../lib/ai/wizard';
import { analyticsRepository } from '../repositories';
import { analyticsService, authService, debtsService, preferencesService, recurringService, tagsService, transactionsService, vaultsService } from '../services';

// ../services builds AiService, whose store imports expo-secure-store (a native module Jest cannot load).
jest.mock('../lib/ai/credential-store', () => ({ aiCredentialStore: {} }));
// MonthlyRecapService's default notifier loads expo-notifications.
jest.mock('../lib/notifications/recap-notifier', () => ({ recapNotifier: {} }));
// Same for AuthService's session store. An in-memory stand-in lets restoreSession run for real.
jest.mock('../lib/auth/session-store', () => {
  let stored: string | null = null;
  return { sessionStore: { get: async () => stored, set: async (id: string) => void (stored = id), clear: async () => void (stored = null) } };
});
// GmailService's defaults load Google Sign-In and expo-secure-store; these flows never connect Gmail.
jest.mock('../lib/gmail/google-auth', () => ({ googleAuth: {} }));
jest.mock('../lib/gmail/connection-store', () => ({ gmailConnectionStore: {} }));

const today = new Date().toISOString().slice(0, 10);
const [year, month] = today.split('-').map(Number);
const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Real SQL: the moduleNameMapper in jest.config.js points the data source at an in-memory SQLite DB.
describe('offline flows', () => {
  let userId: string;

  beforeAll(async () => {
    await initDatabase();
    userId = await authService.signUp({ name: 'Ada', email: 'ada@example.com', password: 's3cret-pass' });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('creates the user and Main Stash on sign-up, and nothing more on sign-in', async () => {
    const yearly = await analyticsService.yearly(userId);
    expect(yearly.reduce((sum, r) => sum + Number(r.count), 0)).toBe(0);

    const vaults = await vaultsService.list(userId);
    expect(vaults).toHaveLength(1);
    expect(vaults[0]).toMatchObject({ name: 'Main Stash', isDefault: true });

    expect(await authService.signIn({ email: ' ADA@example.com ', password: 's3cret-pass' })).toBe(userId);
    expect(await AppDataSource.getRepository(User).count()).toBe(1);
    expect(await vaultsService.list(userId)).toHaveLength(1);
  });

  it('rejects a duplicate sign-up and a wrong password, and restores the session of a signed-in user', async () => {
    await expect(authService.signUp({ name: 'Other', email: 'ada@example.com', password: 'another-pass' })).rejects.toMatchObject({ constructor: AppError, statusCode: 409 });
    await expect(authService.signIn({ email: 'ada@example.com', password: 'wrong' })).rejects.toMatchObject({ constructor: AppError, statusCode: 401 });

    expect(await authService.restoreSession()).toBe(userId);
    await authService.signOut();
    expect(await authService.restoreSession()).toBeNull();
    await authService.signIn({ email: 'ada@example.com', password: 's3cret-pass' });
  });

  it('runs a migration that matches the entities exactly', async () => {
    const diff = await AppDataSource.driver.createSchemaBuilder().log();
    expect(diff.upQueries.map((q) => q.query)).toEqual([]);
  });

  it('creates a transaction with a tag and lists it for its month', async () => {
    const tag = await tagsService.create(userId, { name: 'Food' });
    const created = await transactionsService.create(userId, { amount: 12.5, type: 'expense', title: 'Lunch', tagIds: [tag.id], date: today });

    const listed = await transactionsService.list(userId, { month, year });
    expect(listed).toEqual([expect.objectContaining({ id: created.id, amount: 12.5, type: 'expense', date: today, tags: [expect.objectContaining({ id: tag.id, name: 'Food' })] })]);
  });

  it('creates two rows for a transfer between two vaults and rejects a same-vault transfer', async () => {
    const [main] = await vaultsService.list(userId);
    const savings = await vaultsService.create(userId, { name: 'Savings' });
    const before = await transactionsService.list(userId, { month, year });

    await transactionsService.createTransferTransaction(userId, { amount: 40, vaultId: main.id, targetVaultId: savings.id, date: today });

    const after = await transactionsService.list(userId, { month, year });
    const added = after.filter((tx) => !before.some((b) => b.id === tx.id));
    expect(added.map((tx) => [tx.type, tx.vaultId, tx.amount]).sort()).toEqual([
      ['expense', main.id, 40],
      ['income', savings.id, 40],
    ]);
    await expect(transactionsService.createTransferTransaction(userId, { amount: 1, vaultId: main.id, targetVaultId: main.id })).rejects.toMatchObject({ constructor: AppError, statusCode: 400 });
  });

  it('creates, updates and removes a tag, and the cached list follows', async () => {
    const tag = await tagsService.create(userId, { name: 'Rent' });
    expect((await tagsService.listCached(userId)).map((t) => t.name)).toContain('Rent');

    await tagsService.update(userId, tag.id, { name: 'Housing' });
    expect((await tagsService.listCached(userId)).map((t) => t.name)).toEqual(expect.arrayContaining(['Housing']));
    expect((await tagsService.listCached(userId)).map((t) => t.name)).not.toContain('Rent');

    await tagsService.remove(userId, tag.id);
    expect((await tagsService.listCached(userId)).map((t) => t.id)).not.toContain(tag.id);
  });

  it('applies a debt into a transaction, or settles it without one', async () => {
    const [main] = await vaultsService.list(userId);
    const debt = await debtsService.create(userId, { title: 'Owe Sam', amount: 25, type: 'expense' });
    const applied = await debtsService.apply(userId, debt.id, { vaultId: main.id });

    const listed = await transactionsService.list(userId, { month, year });
    expect(listed).toEqual(expect.arrayContaining([expect.objectContaining({ id: applied.id, title: 'Owe Sam', amount: 25, vaultId: main.id })]));
    expect(await debtsService.list(userId, 'completed')).toEqual(expect.arrayContaining([expect.objectContaining({ id: debt.id, completed: true })]));

    const skipped = await debtsService.create(userId, { title: 'Lent Kim', amount: 10, type: 'income' });
    const countBefore = listed.length;
    await debtsService.apply(userId, skipped.id, { skipTransaction: true });
    expect(await transactionsService.list(userId, { month, year })).toHaveLength(countBefore);
  });

  it('creates preferences on first read and updates them', async () => {
    expect(await preferencesService.getOrCreate(userId)).toMatchObject({ userId, showIncome: false, showExpense: false });
    await preferencesService.update(userId, { showIncome: true });
    expect(await preferencesService.getOrCreate(userId)).toMatchObject({ showIncome: true, showExpense: false });
  });

  it('answers the wizard tools with aggregated rows scoped to the user', async () => {
    const wizUserId = await authService.signUp({ name: 'Wiz', email: 'wiz@example.com', password: 's3cret-pass' });
    const [main] = await vaultsService.list(wizUserId);
    const fun = await vaultsService.create(wizUserId, { name: 'Fun', monthlyBudget: 50 });
    const food = await tagsService.create(wizUserId, { name: 'Food' });
    const bills = await tagsService.create(wizUserId, { name: 'Bills' });
    await transactionsService.create(wizUserId, { amount: 20, type: 'expense', title: 'Lunch', tagIds: [food.id], vaultId: main.id, date: today });
    await transactionsService.create(wizUserId, { amount: 30, type: 'expense', title: 'Groceries', tagIds: [food.id, bills.id], vaultId: fun.id, date: today });
    await transactionsService.create(wizUserId, { amount: 100, type: 'income', title: 'Gift', tagIds: [], vaultId: main.id, date: today });
    await transactionsService.create(wizUserId, { amount: 999, type: 'expense', title: 'Old', tagIds: [food.id], vaultId: main.id, date: '2000-01-15' });

    const range = { from: `${today.slice(0, 7)}-01`, to: today };
    const tool = async (name: string, args: object): Promise<unknown> => JSON.parse(await runWizardTool(analyticsRepository, wizUserId, name, JSON.stringify(args)));

    expect(await tool('spending_by_tag', range)).toEqual([
      { tag: 'Food', total: 50, count: 2 },
      { tag: 'Bills', total: 30, count: 1 },
    ]);
    expect(await tool('totals_by_month', range)).toEqual([{ month: today.slice(0, 7), expense: 50, income: 100, count: 3 }]);
    expect(await tool('vault_budgets', range)).toEqual([
      { vault: 'Fun', monthlyBudget: 50, spent: 30 },
      { vault: 'Main Stash', monthlyBudget: null, spent: 20 },
    ]);
    const found = (await tool('find_transactions', { ...range, tag: 'food' })) as { title: string; tags: string }[];
    expect(found.map((row) => row.title)).toEqual(['Groceries', 'Lunch']);
    expect(found[0].tags.split(', ').sort()).toEqual(['Bills', 'Food']);
    expect(await tool('find_transactions', { from: '2000-01-01', to: '2000-12-31', search: 'ol', limit: 99 })).toEqual([
      { date: '2000-01-15', title: 'Old', amount: 999, type: 'expense', vault: 'Main Stash', tags: 'Food' },
    ]);
    const later = await debtsService.create(wizUserId, { title: 'Owe Sam', amount: 25, type: 'expense' });
    await debtsService.create(wizUserId, { title: 'Lent Kim', amount: 40, type: 'income', dueDate: '2030-01-01' });
    await debtsService.remove(wizUserId, (await debtsService.create(wizUserId, { title: 'Settled', amount: 5, type: 'expense' })).id);
    expect(await tool('open_debts', {})).toEqual([
      { title: 'Lent Kim', amount: 40, type: 'income', dueDate: '2030-01-01' },
      { title: later.title, amount: 25, type: 'expense', dueDate: null },
    ]);
    expect(await tool('drop_tables', {})).toEqual({ error: 'Unknown tool drop_tables.' });
    expect(JSON.parse(await runWizardTool(analyticsRepository, wizUserId, 'totals_by_month', 'not json'))).toEqual({ error: 'Arguments were not valid JSON.' });
  });

  it('keeps recurring templates out of monthly and yearly analytics, and groups tag analytics by tag', async () => {
    const travel = await tagsService.create(userId, { name: 'Travel' });
    await transactionsService.create(userId, { amount: 30, type: 'expense', title: 'Train', tagIds: [travel.id], date: today });
    // A template far in the future: it has no date, and catch-up never reaches it.
    await recurringService.create(userId, { title: 'Insurance', amount: 999, type: 'expense', interval: 'yearly', startDate: '2099-01-01', tagIds: [travel.id] });

    const real = await transactionsService.list(userId, { period: 'all' });
    const expected = (['expense', 'income'] as const)
      .map((type) => {
        const rows = real.filter((tx) => tx.type === type);
        return { type, total: rows.reduce((sum, tx) => sum + tx.amount, 0), count: rows.length };
      })
      .filter((r) => r.count > 0);
    const shape = (rows: { type: string; total: string; count: string }[]) =>
      rows.map((r) => ({ type: r.type, total: Number(r.total), count: Number(r.count) })).sort((a, b) => a.type.localeCompare(b.type));

    const yearly = await analyticsService.yearly(userId);
    expect(yearly.map((r) => r.year)).toEqual(expected.map(() => String(year)));
    expect(shape(yearly)).toEqual(expected);

    const monthly = await analyticsService.monthly(userId, year);
    expect(monthly.map((r) => r.month)).toEqual(expected.map(() => String(month).padStart(2, '0')));
    expect(shape(monthly)).toEqual(expected);

    const expectedTags = new Map<string, { tagId: string; tag: string; type: string; total: number; count: number }>();
    for (const tx of real) {
      for (const tag of tx.tags) {
        const row = expectedTags.get(`${tag.id}:${tx.type}`) ?? { tagId: tag.id, tag: tag.name, type: tx.type, total: 0, count: 0 };
        expectedTags.set(`${tag.id}:${tx.type}`, { ...row, total: row.total + tx.amount, count: row.count + 1 });
      }
    }
    const byKey = (a: { tagId: string; type: string }, b: { tagId: string; type: string }) => `${a.tagId}:${a.type}`.localeCompare(`${b.tagId}:${b.type}`);
    const tags = await analyticsService.tags(userId, year);
    expect(tags.map((r) => Object.keys(r).sort())).toEqual(tags.map(() => ['count', 'tag', 'tagId', 'total', 'type']));
    expect(tags.map((r) => ({ tagId: r.tagId, tag: r.tag, type: r.type, total: Number(r.total), count: Number(r.count) })).sort(byKey)).toEqual([...expectedTags.values()].sort(byKey));
    expect(tags).toEqual(expect.arrayContaining([expect.objectContaining({ tagId: travel.id, tag: 'Travel', type: 'expense' })]));
  });

  describe('Recurring', () => {
    it('catches up missed occurrences once, honouring skips, and never recreates a deleted one', async () => {
      const quest = (await recurringService.create(userId, { title: 'Gym', amount: 5, type: 'expense', interval: 'daily', startDate: today }))!;
      expect((await recurringService.occurrences(userId, year, month)).map((o) => o.date)).toContain(today);

      await recurringService.skip(userId, quest.id, addDays(today, 1));
      expect(await recurringService.catchUp(userId, addDays(today, 3))).toBe(3);
      expect(await recurringService.catchUp(userId, addDays(today, 3))).toBe(0);

      const generated = (await transactionsService.list(userId, { period: 'all' })).filter((tx) => tx.title === 'Gym');
      expect(generated.map((tx) => tx.date).sort()).toEqual([today, addDays(today, 2), addDays(today, 3)]);
      await expect(recurringService.apply(userId, quest.id, today)).rejects.toMatchObject({ constructor: AppError, statusCode: 409 });

      const deletedDate = addDays(today, 2);
      await transactionsService.remove(userId, generated.find((tx) => tx.date === deletedDate)!.id);
      expect(await recurringService.catchUp(userId, addDays(today, 3))).toBe(0);
      const [y, m] = deletedDate.split('-').map(Number);
      expect((await recurringService.occurrences(userId, y, m)).map((o) => o.date)).not.toContain(deletedDate);
    });

    // AuthProvider runs this catch-up for the restored user on launch and on every foreground.
    it('catches up for the restored session user when the app reopens', async () => {
      await recurringService.create(userId, { title: 'Coffee', amount: 3, type: 'expense', interval: 'daily', startDate: today });

      await authService.signIn({ email: 'ada@example.com', password: 's3cret-pass' });
      const restored = (await authService.restoreSession())!;
      await recurringService.catchUp(restored);
      await recurringService.catchUp(restored);

      const coffee = (await transactionsService.list(userId, { period: 'all' })).filter((tx) => tx.title === 'Coffee');
      expect(coffee.map((tx) => tx.date)).toEqual([today]);
    });
  });
});
