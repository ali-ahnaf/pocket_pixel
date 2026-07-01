import { Expense, RecurrenceInterval, TransactionType } from '../entities/Expense.entity';
import type { Tag } from '../entities/Tag.entity';
import type { TransactionTag } from '../entities/TransactionTag.entity';
import type { Vault } from '../entities/Vault.entity';
import { AppError } from '../errors/app-error';
import type { RecurringRepository } from '../repositories/recurring.repository';
import { cancelRecurring, scheduleRecurring } from '../scheduler/recurring-scheduler';
import { tagsService } from '../services';
import { RecurringService } from '../services/recurring.service';

jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  tagsService: { ensureUserTagsExist: jest.fn() },
}));

jest.mock('../scheduler/recurring-scheduler', () => ({
  scheduleRecurring: jest.fn(),
  cancelRecurring: jest.fn(),
}));

type ExpenseWithRelations = Expense & {
  transactionTags?: TransactionTag[];
  vault?: Vault | null;
};

type RecurringRepositoryMock = jest.Mocked<
  Pick<
    RecurringRepository,
    | 'findManyForUser'
    | 'findOneForUser'
    | 'findActiveForUser'
    | 'findAppliedOccurrence'
    | 'findAppliedOccurrences'
    | 'findOneWithRelations'
    | 'createEntity'
    | 'addTags'
    | 'findSkip'
    | 'findSkips'
    | 'remove'
    | 'replaceTags'
    | 'save'
    | 'saveSkip'
  >
>;

const buildTag = (overrides: Partial<Tag> = {}): Tag =>
  ({
    id: 'tag-1',
    name: 'Housing',
    ...overrides,
  }) as Tag;

const buildTransactionTag = (overrides: Partial<TransactionTag> = {}): TransactionTag =>
  ({
    transactionId: 'expense-1',
    tagId: 'tag-1',
    tag: buildTag(),
    ...overrides,
  }) as TransactionTag;

const buildVault = (overrides: Partial<Vault> = {}): Vault =>
  ({
    id: 'vault-1',
    name: 'Main Stash',
    icon: 'shield',
    ...overrides,
  }) as Vault;

const buildExpense = (overrides: Partial<Expense> = {}): Expense =>
  ({
    id: 'expense-1',
    userId: 'user-1',
    title: 'rent',
    amount: 1000,
    type: 'expense' as TransactionType,
    date: null,
    interval: 'monthly' as RecurrenceInterval,
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    vaultId: null,
    sourceRecurringId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as Expense;

const buildExpenseWithRelations = (overrides: Partial<ExpenseWithRelations> = {}): ExpenseWithRelations =>
  ({
    ...buildExpense(),
    transactionTags: [],
    vault: null,
    ...overrides,
  }) as ExpenseWithRelations;

const isoDateOffset = (days: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

describe('RecurringService', () => {
  let recurrings: RecurringRepositoryMock;
  let service: RecurringService;
  const ensureUserTagsExistMock = jest.mocked(tagsService.ensureUserTagsExist);
  const scheduleRecurringMock = jest.mocked(scheduleRecurring);
  const cancelRecurringMock = jest.mocked(cancelRecurring);

  beforeEach(() => {
    recurrings = {
      findActiveForUser: jest.fn(),
      findAppliedOccurrence: jest.fn(),
      findAppliedOccurrences: jest.fn(),
      findManyForUser: jest.fn(),
      findOneForUser: jest.fn(),
      findOneWithRelations: jest.fn(),
      findSkip: jest.fn(),
      findSkips: jest.fn(),
      createEntity: jest.fn((data) => data as Expense),
      addTags: jest.fn(),
      remove: jest.fn(),
      replaceTags: jest.fn(),
      save: jest.fn(async (expense) => expense),
      saveSkip: jest.fn(),
    } as RecurringRepositoryMock;

    ensureUserTagsExistMock.mockReset();
    scheduleRecurringMock.mockReset();
    cancelRecurringMock.mockReset();

    service = new RecurringService(recurrings as unknown as RecurringRepository);
  });

  describe('list', () => {
    it('converts repository results into DTOs with tagIds and tags', async () => {
      const housingTag = buildTag();
      recurrings.findManyForUser.mockResolvedValue([
        buildExpenseWithRelations({
          transactionTags: [buildTransactionTag({ tagId: housingTag.id, tag: housingTag })],
        }),
      ]);

      const result = await service.list('user-1');

      expect(recurrings.findManyForUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([
        expect.objectContaining({
          id: 'expense-1',
          tagIds: ['tag-1'],
          tags: [housingTag],
        }),
      ]);
    });

    it('returns an empty array when the user has no recurring quests', async () => {
      recurrings.findManyForUser.mockResolvedValue([]);

      await expect(service.list('user-1')).resolves.toEqual([]);
    });
  });

  describe('create', () => {
    const input = {
      title: 'rent',
      amount: 1000,
      type: 'expense' as TransactionType,
      interval: 'monthly' as RecurrenceInterval,
      startDate: '2026-07-01',
    };

    it('throws a 400 AppError when tags are invalid', async () => {
      ensureUserTagsExistMock.mockResolvedValue(false);

      await expect(service.create('user-1', { ...input, tagIds: ['invalid-tag-id'] })).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 400,
      });
      expect(recurrings.save).not.toHaveBeenCalled();
      expect(scheduleRecurringMock).not.toHaveBeenCalled();
    });

    it('creates, saves and schedules a recurring with defaults for missing optional fields', async () => {
      const housingTag = buildTag();
      const groceriesTag = buildTag({ id: 'tag-2', name: 'Groceries' });
      ensureUserTagsExistMock.mockResolvedValue(true);

      const savedExpense = buildExpense({ endDate: '2027-06-30' });
      recurrings.save.mockResolvedValue(savedExpense);
      recurrings.findOneWithRelations.mockResolvedValue(
        buildExpenseWithRelations({
          endDate: '2027-06-30',
          transactionTags: [
            buildTransactionTag({ tagId: housingTag.id, tag: housingTag }),
            buildTransactionTag({ tagId: groceriesTag.id, tag: groceriesTag }),
          ],
        }),
      );

      const result = await service.create('user-1', {
        ...input,
        tagIds: [housingTag.id, housingTag.id, '', groceriesTag.id],
      });

      expect(ensureUserTagsExistMock).toHaveBeenCalledWith('user-1', [housingTag.id, groceriesTag.id]);
      expect(recurrings.createEntity).toHaveBeenCalledWith({
        userId: 'user-1',
        title: input.title,
        amount: input.amount,
        type: input.type,
        interval: input.interval,
        startDate: input.startDate,
        endDate: '2027-06-30',
        vaultId: null,
      });
      expect(recurrings.replaceTags).toHaveBeenCalledWith('expense-1', [housingTag.id, groceriesTag.id]);
      expect(scheduleRecurringMock).toHaveBeenCalledWith(savedExpense);
      expect(recurrings.findOneWithRelations).toHaveBeenCalledWith('user-1', 'expense-1');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'expense-1',
          tagIds: [housingTag.id, groceriesTag.id],
          tags: [housingTag, groceriesTag],
        }),
      );
    });
  });

  describe('update', () => {
    it('throws a 404 AppError when the recurring quest does not exist', async () => {
      recurrings.findOneForUser.mockResolvedValue(null);

      await expect(service.update('user-1', 'missing', { title: 'updated' })).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 404,
      });
    });

    it('throws a 400 AppError when updated tags are invalid', async () => {
      recurrings.findOneForUser.mockResolvedValue(buildExpense());
      ensureUserTagsExistMock.mockResolvedValue(false);

      await expect(service.update('user-1', 'expense-1', { tagIds: ['invalid-tag-id'] })).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 400,
      });
      expect(recurrings.save).not.toHaveBeenCalled();
      expect(recurrings.replaceTags).not.toHaveBeenCalled();
    });

    it('revalidates tags and reschedules when the recurring is still active', async () => {
      const existing = buildExpense({ title: 'old rent', vaultId: 'vault-1' });
      const housingTag = buildTag();
      const utilitiesTag = buildTag({ id: 'tag-2', name: 'Utilities' });
      recurrings.findOneForUser.mockResolvedValue(existing);
      ensureUserTagsExistMock.mockResolvedValue(true);
      recurrings.findOneWithRelations.mockResolvedValue(
        buildExpenseWithRelations({
          title: 'new rent',
          vaultId: 'vault-2',
          endDate: isoDateOffset(5),
          transactionTags: [
            buildTransactionTag({ tagId: housingTag.id, tag: housingTag }),
            buildTransactionTag({ tagId: utilitiesTag.id, tag: utilitiesTag }),
          ],
        }),
      );

      const result = await service.update('user-1', 'expense-1', {
        title: 'new rent',
        vaultId: 'vault-2',
        tagIds: [housingTag.id, utilitiesTag.id, utilitiesTag.id],
      });

      expect(ensureUserTagsExistMock).toHaveBeenCalledWith('user-1', [housingTag.id, utilitiesTag.id]);
      expect(recurrings.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'expense-1',
          title: 'new rent',
          vaultId: 'vault-2',
        }),
      );
      expect(recurrings.replaceTags).toHaveBeenCalledWith('expense-1', [housingTag.id, utilitiesTag.id]);
      expect(scheduleRecurringMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'expense-1',
          title: 'new rent',
        }),
      );
      expect(cancelRecurringMock).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          tagIds: [housingTag.id, utilitiesTag.id],
          tags: [housingTag, utilitiesTag],
        }),
      );
    });

    it('cancels the schedule when the updated recurring has already ended', async () => {
      recurrings.findOneForUser.mockResolvedValue(buildExpense());
      recurrings.findOneWithRelations.mockResolvedValue(
        buildExpenseWithRelations({
          endDate: isoDateOffset(-1),
        }),
      );

      await service.update('user-1', 'expense-1', { title: 'archived rent' });

      expect(cancelRecurringMock).toHaveBeenCalledWith('expense-1');
      expect(scheduleRecurringMock).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws a 404 AppError when the recurring quest does not exist', async () => {
      recurrings.findOneForUser.mockResolvedValue(null);

      await expect(service.remove('user-1', 'missing')).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 404,
      });
    });

    it('cancels the schedule and removes an existing recurring quest', async () => {
      const quest = buildExpense();
      recurrings.findOneForUser.mockResolvedValue(quest);

      await service.remove('user-1', 'expense-1');

      expect(cancelRecurringMock).toHaveBeenCalledWith('expense-1');
      expect(recurrings.remove).toHaveBeenCalledWith(quest);
    });
  });

  describe('occurrences', () => {
    it('returns only pending occurrences and keeps them sorted by date', async () => {
      const housingTag = buildTag();
      const recurringDaily = buildExpenseWithRelations({
        id: 'expense-1',
        interval: 'daily' as RecurrenceInterval,
        startDate: '2026-07-01',
        endDate: '2026-07-03',
        vaultId: 'vault-1',
        vault: buildVault(),
        transactionTags: [buildTransactionTag({ tagId: housingTag.id, tag: housingTag })],
      });
      const recurringMonthly = buildExpenseWithRelations({
        id: 'expense-2',
        title: 'subscription',
        amount: 35,
        interval: 'monthly' as RecurrenceInterval,
        startDate: '2026-07-10',
        endDate: '2026-12-31',
      });
      recurrings.findActiveForUser.mockResolvedValue([recurringMonthly, recurringDaily]);
      recurrings.findAppliedOccurrences.mockResolvedValue([
        buildExpense({ sourceRecurringId: 'expense-1', date: '2026-07-01' }),
      ]);
      recurrings.findSkips.mockResolvedValue([{ recurringId: 'expense-1', date: '2026-07-02' }] as never[]);

      const result = await service.occurrences('user-1', 2026, 7);

      expect(recurrings.findAppliedOccurrences).toHaveBeenCalledWith('user-1', ['expense-2', 'expense-1']);
      expect(recurrings.findSkips).toHaveBeenCalledWith('user-1', ['expense-2', 'expense-1']);
      expect(result).toEqual([
        expect.objectContaining({
          recurringId: 'expense-1',
          date: '2026-07-03',
          tags: [housingTag],
          vault: { id: 'vault-1', name: 'Main Stash', icon: 'shield' },
        }),
        expect.objectContaining({
          recurringId: 'expense-2',
          date: '2026-07-10',
          title: 'subscription',
          amount: 35,
          tags: [],
        }),
      ]);
    });

    it('returns an empty array when the user has no active recurring quests', async () => {
      recurrings.findActiveForUser.mockResolvedValue([]);

      await expect(service.occurrences('user-1', 2026, 7)).resolves.toEqual([]);
      expect(recurrings.findAppliedOccurrences).not.toHaveBeenCalled();
      expect(recurrings.findSkips).not.toHaveBeenCalled();
    });
  });

  describe('skip', () => {
    it('stores a skip for a valid occurrence that is not already skipped', async () => {
      recurrings.findOneWithRelations.mockResolvedValue(
        buildExpenseWithRelations({
          startDate: '2026-07-10',
          endDate: '2026-12-31',
        }),
      );
      recurrings.findSkip.mockResolvedValue(null);

      await service.skip('user-1', 'expense-1', '2026-07-10');

      expect(recurrings.findSkip).toHaveBeenCalledWith('expense-1', '2026-07-10');
      expect(recurrings.saveSkip).toHaveBeenCalledWith('user-1', 'expense-1', '2026-07-10');
    });

    it('does not save a duplicate skip for an already skipped occurrence', async () => {
      recurrings.findOneWithRelations.mockResolvedValue(
        buildExpenseWithRelations({
          startDate: '2026-07-10',
          endDate: '2026-12-31',
        }),
      );
      recurrings.findSkip.mockResolvedValue({ recurringId: 'expense-1', date: '2026-07-10' } as never);

      await service.skip('user-1', 'expense-1', '2026-07-10');

      expect(recurrings.saveSkip).not.toHaveBeenCalled();
    });
  });

  describe('apply', () => {
    it('rejects a date that is not a valid occurrence', async () => {
      recurrings.findOneWithRelations.mockResolvedValue(
        buildExpenseWithRelations({
          startDate: '2026-07-10',
          endDate: '2026-12-31',
        }),
      );

      await expect(service.apply('user-1', 'expense-1', '2026-07-11')).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 400,
      });
    });

    it('rejects an occurrence that was already applied', async () => {
      recurrings.findOneWithRelations.mockResolvedValue(
        buildExpenseWithRelations({
          startDate: '2026-07-10',
          endDate: '2026-12-31',
        }),
      );
      recurrings.findAppliedOccurrence.mockResolvedValue(buildExpense({ id: 'tx-1', date: '2026-07-10', sourceRecurringId: 'expense-1' }));

      await expect(service.apply('user-1', 'expense-1', '2026-07-10')).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 409,
      });
    });

    it('creates a transaction for a valid occurrence and copies tag links', async () => {
      const housingTag = buildTag();
      const utilitiesTag = buildTag({ id: 'tag-2', name: 'Utilities' });
      recurrings.findOneWithRelations.mockResolvedValue(
        buildExpenseWithRelations({
          startDate: '2026-07-10',
          endDate: '2026-12-31',
          transactionTags: [
            buildTransactionTag({ tagId: housingTag.id, tag: housingTag }),
            buildTransactionTag({ tagId: utilitiesTag.id, tag: utilitiesTag }),
          ],
        }),
      );
      recurrings.findAppliedOccurrence.mockResolvedValue(null);
      recurrings.save.mockResolvedValue(buildExpense({ id: 'tx-1', date: '2026-07-10', sourceRecurringId: 'expense-1' }));

      const result = await service.apply('user-1', 'expense-1', '2026-07-10');

      expect(recurrings.createEntity).toHaveBeenCalledWith({
        userId: 'user-1',
        title: 'rent',
        amount: 1000,
        type: 'expense',
        date: '2026-07-10',
        vaultId: null,
        sourceRecurringId: 'expense-1',
      });
      expect(recurrings.addTags).toHaveBeenCalledWith('tx-1', [housingTag.id, utilitiesTag.id]);
      expect(result).toEqual({ id: 'tx-1' });
    });
  });
});
