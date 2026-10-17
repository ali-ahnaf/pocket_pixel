import { AppDataSource } from '../db/data-source';
import { initDatabase } from '../db/init';
import { Adventure } from '../entities/Adventure.entity';
import { AdventureItem } from '../entities/AdventureItem.entity';
import { AppError } from '../errors/app-error';
import { AdventuresRepository } from '../repositories/adventures.repository';
import { UsersRepository } from '../repositories/users.repository';
import { AdventuresService } from '../services/adventures.service';

jest.mock('../services', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const TODAY = new Date(2026, 9, 17);
const COMPLETE_MESSAGE = 'This quest is complete. Reopen it to change items.';

// Real SQL: the moduleNameMapper in jest.config.js points the data source at an in-memory SQLite DB.
describe('AdventuresService', () => {
  let service: AdventuresService;
  let userA: string;
  let userB: string;

  beforeAll(async () => {
    await initDatabase();
    const users = new UsersRepository();
    userA = (await users.createWithMainStash({ name: 'Ada', email: 'ada@example.com' })).id;
    userB = (await users.createWithMainStash({ name: 'Bob', email: 'bob@example.com' })).id;
    service = new AdventuresService(new AdventuresRepository());
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('counts only bought actual costs as spent, and defaults a bought item to its planned cost', async () => {
    const { id } = await service.create(userA, { name: 'Misty Peaks', fund: 100 });
    const boots = await service.addItem(userA, id, { name: 'Boots', plannedCost: 80 }, TODAY);
    const rope = await service.addItem(userA, id, { name: 'Rope', plannedCost: 30 }, TODAY);
    await service.addItem(userA, id, { name: 'Tent', plannedCost: 50 }, TODAY);

    await service.updateItem(userA, boots.id, { isBought: true, actualCost: 85 }, TODAY);
    await service.updateItem(userA, rope.id, { isBought: true }, TODAY);

    expect(await service.get(userA, id, TODAY)).toMatchObject({ name: 'Misty Peaks', fund: 100, plannedTotal: 160, spent: 115, itemCount: 3, boughtCount: 2, isComplete: false, completedAt: null });
    const items = await service.listItems(userA, id);
    expect(items.map((i) => [i.name, i.actualCost, i.isBought, i.sortOrder])).toEqual([
      ['Boots', 85, true, 0],
      ['Rope', 30, true, 1],
      ['Tent', null, false, 2],
    ]);

    await service.updateItem(userA, boots.id, { isBought: false }, TODAY);
    expect(await service.get(userA, id, TODAY)).toMatchObject({ spent: 30, boughtCount: 1 });
    expect((await service.listItems(userA, id))[0]).toMatchObject({ isBought: false, actualCost: null });
  });

  it('lists active adventures before manually completed and date-completed ones', async () => {
    const { id: byDate } = await service.create(userB, { name: 'Past trip', endDate: '2026-10-01' });
    const { id: byHand } = await service.create(userB, { name: 'Done by hand' });
    await service.complete(userB, byHand);
    const { id: active } = await service.create(userB, { name: 'Upcoming', endDate: '2026-12-01' });
    const { id: open } = await service.create(userB, { name: 'No dates' });

    const list = await service.list(userB, TODAY);

    expect(
      list
        .map((a) => a.id)
        .slice(0, 2)
        .sort(),
    ).toEqual([active, open].sort());
    expect(
      list
        .map((a) => a.id)
        .slice(2)
        .sort(),
    ).toEqual([byDate, byHand].sort());
    expect(list.map((a) => [a.name, a.isComplete]).sort()).toEqual([
      ['Done by hand', true],
      ['No dates', false],
      ['Past trip', true],
      ['Upcoming', false],
    ]);
  });

  it('completes by date without completedAt, keeps it complete on reopen, and reopens on a future end date', async () => {
    const { id } = await service.create(userA, { name: 'Weekend', endDate: '2026-10-01' });

    expect(await service.get(userA, id, TODAY)).toMatchObject({ isComplete: true, completedAt: null });
    await service.reopen(userA, id);
    expect(await service.get(userA, id, TODAY)).toMatchObject({ isComplete: true, completedAt: null });

    await service.update(userA, id, { endDate: '2026-11-01' });
    expect(await service.get(userA, id, TODAY)).toMatchObject({ isComplete: false, endDate: '2026-11-01' });

    await service.complete(userA, id);
    expect(await service.get(userA, id, TODAY)).toMatchObject({ isComplete: true });
    expect((await service.get(userA, id, TODAY)).completedAt).not.toBeNull();
    await service.reopen(userA, id);
    expect(await service.get(userA, id, TODAY)).toMatchObject({ isComplete: false, completedAt: null });
  });

  it('refuses item changes on a complete adventure with 409', async () => {
    const { id } = await service.create(userA, { name: 'Closed' });
    const item = await service.addItem(userA, id, { name: 'Map', plannedCost: 5 }, TODAY);
    await service.complete(userA, id);

    const conflict = { constructor: AppError, statusCode: 409, message: COMPLETE_MESSAGE };
    await expect(service.addItem(userA, id, { name: 'Flask', plannedCost: 4 }, TODAY)).rejects.toMatchObject(conflict);
    await expect(service.updateItem(userA, item.id, { name: 'Big map' }, TODAY)).rejects.toMatchObject(conflict);
    await expect(service.removeItem(userA, item.id, TODAY)).rejects.toMatchObject(conflict);
    // Editing the adventure itself stays allowed.
    await expect(service.update(userA, id, { name: 'Closed trip' })).resolves.toBeUndefined();
  });

  it('keeps an adventure active on its end date and completes it the day after', async () => {
    const { id } = await service.create(userA, { name: 'Last day', endDate: '2026-10-17' });

    expect(await service.get(userA, id, TODAY)).toMatchObject({ isComplete: false });
    expect(await service.get(userA, id, new Date(2026, 9, 18))).toMatchObject({ isComplete: true });
  });

  it('rejects an untrimmed-empty name with 400', async () => {
    const blank = { constructor: AppError, statusCode: 400, message: 'Name is required' };
    await expect(service.create(userA, { name: '   ' })).rejects.toMatchObject(blank);

    const { id } = await service.create(userA, { name: 'Named' });
    await expect(service.update(userA, id, { name: ' ' })).rejects.toMatchObject(blank);
    await expect(service.addItem(userA, id, { name: '', plannedCost: 1 }, TODAY)).rejects.toMatchObject(blank);
    const item = await service.addItem(userA, id, { name: 'Ok', plannedCost: 1 }, TODAY);
    await expect(service.updateItem(userA, item.id, { name: '  ' }, TODAY)).rejects.toMatchObject(blank);
  });

  it('stores an actual cost only on a bought item', async () => {
    const { id } = await service.create(userA, { name: 'Costs' });
    const item = await service.addItem(userA, id, { name: 'Flask', plannedCost: 10 }, TODAY);

    await service.updateItem(userA, item.id, { actualCost: 99 }, TODAY);
    expect((await service.listItems(userA, id))[0]).toMatchObject({ isBought: false, actualCost: null });

    await service.updateItem(userA, item.id, { isBought: true, actualCost: 12 }, TODAY);
    await service.updateItem(userA, item.id, { actualCost: 14 }, TODAY);
    expect((await service.listItems(userA, id))[0]).toMatchObject({ isBought: true, actualCost: 14 });

    await service.updateItem(userA, item.id, { actualCost: null }, TODAY);
    expect((await service.listItems(userA, id))[0]).toMatchObject({ isBought: true, actualCost: 10 });
  });

  it('rejects negative amounts with 400', async () => {
    const negative = { constructor: AppError, statusCode: 400, message: 'Amounts cannot be negative' };
    await expect(service.create(userA, { name: 'Bad', fund: -1 })).rejects.toMatchObject(negative);

    const { id } = await service.create(userA, { name: 'Fine' });
    await expect(service.update(userA, id, { fund: -5 })).rejects.toMatchObject(negative);
    await expect(service.addItem(userA, id, { name: 'Bad', plannedCost: -1 }, TODAY)).rejects.toMatchObject(negative);
    const item = await service.addItem(userA, id, { name: 'Ok', plannedCost: 1 }, TODAY);
    await expect(service.updateItem(userA, item.id, { actualCost: -2 }, TODAY)).rejects.toMatchObject(negative);
  });

  it('soft-deletes an adventure with its items', async () => {
    const { id } = await service.create(userA, { name: 'Gone' });
    await service.addItem(userA, id, { name: 'Boots', plannedCost: 10 }, TODAY);
    const item = await service.addItem(userA, id, { name: 'Rope', plannedCost: 5 }, TODAY);
    await service.removeItem(userA, item.id, TODAY);
    expect(await service.listItems(userA, id)).toHaveLength(1);

    await service.remove(userA, id);

    expect((await service.list(userA, TODAY)).map((a) => a.id)).not.toContain(id);
    await expect(service.get(userA, id, TODAY)).rejects.toMatchObject({ constructor: AppError, statusCode: 404 });
    expect(await AppDataSource.getRepository(Adventure).count({ where: { id }, withDeleted: true })).toBe(1);
    expect(await AppDataSource.getRepository(AdventureItem).count({ where: { adventureId: id }, withDeleted: true })).toBe(2);
    expect(await AppDataSource.getRepository(AdventureItem).count({ where: { adventureId: id } })).toBe(0);
  });

  it("returns 404 for another user's adventure", async () => {
    const { id } = await service.create(userA, { name: 'Private' });
    const item = await service.addItem(userA, id, { name: 'Secret', plannedCost: 1 }, TODAY);
    const notFound = { constructor: AppError, statusCode: 404 };

    await expect(service.get(userB, id, TODAY)).rejects.toMatchObject(notFound);
    await expect(service.update(userB, id, { name: 'Mine now' })).rejects.toMatchObject(notFound);
    await expect(service.remove(userB, id)).rejects.toMatchObject(notFound);
    await expect(service.addItem(userB, id, { name: 'x', plannedCost: 1 }, TODAY)).rejects.toMatchObject(notFound);
    await expect(service.updateItem(userB, item.id, { name: 'x' }, TODAY)).rejects.toMatchObject(notFound);
    expect((await service.list(userB, TODAY)).map((a) => a.id)).not.toContain(id);
  });
});
