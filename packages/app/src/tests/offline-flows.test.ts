import { AppDataSource } from '../db/data-source';
import { initDatabase } from '../db/init';
import { User } from '../entities/User.entity';
import { AppError } from '../errors/app-error';
import { analyticsService, debtsService, preferencesService, recurringService, tagsService, transactionsService, vaultsService } from '../services';

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
    ({ userId } = await initDatabase());
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('creates the local user and Main Stash on first launch, and nothing more on the next', async () => {
    const yearly = await analyticsService.yearly(userId);
    expect(yearly.reduce((sum, r) => sum + Number(r.count), 0)).toBe(0);

    const vaults = await vaultsService.list(userId);
    expect(vaults).toHaveLength(1);
    expect(vaults[0]).toMatchObject({ name: 'Main Stash', isDefault: true });

    const again = await initDatabase();
    expect(again.userId).toBe(userId);
    expect(await AppDataSource.getRepository(User).count()).toBe(1);
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

    it('catches up when the app reopens', async () => {
      await recurringService.create(userId, { title: 'Coffee', amount: 3, type: 'expense', interval: 'daily', startDate: today });

      await initDatabase();
      await initDatabase();

      const coffee = (await transactionsService.list(userId, { period: 'all' })).filter((tx) => tx.title === 'Coffee');
      expect(coffee.map((tx) => tx.date)).toEqual([today]);
    });
  });
});
