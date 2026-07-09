import type { ImportDataRequest } from '@expense-tracker/shared';
import { AppDataSource } from '../data-source';
import { AppError } from '../errors/app-error';
import { Debt } from '../entities/Debt.entity';
import { Expense } from '../entities/Expense.entity';
import { RecurringOccurrenceSkip } from '../entities/RecurringOccurrenceSkip.entity';
import { Tag } from '../entities/Tag.entity';
import { TransactionTag } from '../entities/TransactionTag.entity';
import { User } from '../entities/User.entity';
import { UserPreference } from '../entities/UserPreference.entity';
import { Vault } from '../entities/Vault.entity';
import { BackupService } from '../services/backup.service';

jest.mock('../services', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  debtsService: {},
  preferencesService: {},
  recurringService: {},
  tagsService: {},
  transactionsService: {},
  usersService: {},
  vaultsService: {},
}));

jest.mock('../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  },
}));

const buildImportRequest = (overrides: Partial<ImportDataRequest> = {}): ImportDataRequest => ({
  appVersion: '1.0',
  exportedAt: '2026-07-08T00:00:00.000Z',
  data: {
    user: {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      avatar: 'avatar.png',
      disableAiPrompt: true,
    },
    debts: [
      {
        id: 'debt-1',
        userId: 'user-1',
        title: 'Water bill',
        amount: 50,
        type: 'expense',
        notes: 'July',
        createdAt: '2026-07-01T00:00:00.000Z',
        completed: true,
        discarded: false,
      },
    ],
    vaults: [
      {
        id: 'vault-1',
        userId: 'user-1',
        name: 'Main',
        description: 'Main vault',
        icon: 'wallet',
        backgroundColor: '#000000',
        isDefault: true,
        monthlyBudget: 1000,
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        userId: 'user-1',
        title: 'Salary',
        amount: 5000,
        type: 'income',
        date: '2026-07-01',
        vaultId: 'vault-1',
        vault: { id: 'vault-1', name: 'Main', icon: 'wallet' },
        tags: [
          {
            id: 'tag-1',
            userId: 'user-1',
            name: 'Income',
            icon: 'sparkles',
            backgroundColor: '#ffffff',
          },
        ],
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
        sourceRecurringId: 'recurring-1',
      },
    ],
    recurrings: [
      {
        id: 'recurring-1',
        userId: 'user-1',
        title: 'Rent',
        amount: 1200,
        type: 'expense',
        date: null as unknown as string,
        interval: 'monthly',
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        vaultId: 'vault-1',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
        deletedAt: '2026-12-01T00:00:00.000Z',
        tagIds: ['tag-1'],
        tags: [
          {
            id: 'tag-1',
            userId: 'user-1',
            name: 'Income',
            icon: 'sparkles',
            backgroundColor: '#ffffff',
          },
        ],
      },
    ],
    preference: {
      showIncome: true,
      showExpense: false,
    },
    recurringSkips: [
      {
        recurringId: 'recurring-1',
        date: '2026-08-01',
        userId: 'user-1',
      },
    ],
    tags: [
      {
        id: 'tag-1',
        userId: 'user-1',
        name: 'Income',
        icon: 'sparkles',
        backgroundColor: '#ffffff',
      },
    ],
  },
  ...overrides,
});

describe('BackupService', () => {
  const getRepositoryMock = jest.mocked(AppDataSource.getRepository);
  const transactionMock = jest.mocked(AppDataSource.transaction);
  const getById = jest.fn();
  const debtsList = jest.fn();
  const vaultsList = jest.fn();
  const getOrCreate = jest.fn();
  const tagsList = jest.fn();

  const service = new BackupService({ getById } as never, { list: debtsList } as never, { list: vaultsList } as never, { getOrCreate } as never, { list: tagsList } as never);

  beforeEach(() => {
    jest.clearAllMocks();
    getById.mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      avatar: 'avatar.png',
      password: 'secret',
      disableAiPrompt: true,
    });
    debtsList.mockResolvedValue([]);
    vaultsList.mockResolvedValue([]);
    getOrCreate.mockResolvedValue({ showIncome: true, showExpense: false });
    tagsList.mockResolvedValue([]);
  });

  describe('exportData', () => {
    it('includes backup-only recurring state and strips the password field from the user payload', async () => {
      const expenseRepo = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'tx-1',
              userId: 'user-1',
              title: 'Salary',
              amount: 5000,
              type: 'income',
              date: '2026-07-01',
              vaultId: 'vault-1',
              sourceRecurringId: 'recurring-1',
              vault: { id: 'vault-1', name: 'Main', icon: 'wallet' },
              transactionTags: [{ tagId: 'tag-1', tag: { id: 'tag-1', userId: 'user-1', name: 'Income', icon: 'sparkles', backgroundColor: '#ffffff' } }],
              createdAt: new Date('2026-07-01T00:00:00.000Z'),
              updatedAt: new Date('2026-07-01T00:00:00.000Z'),
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'recurring-1',
              userId: 'user-1',
              title: 'Rent',
              amount: 1200,
              type: 'expense',
              date: null,
              interval: 'monthly',
              startDate: '2026-07-01',
              endDate: '2027-06-30',
              vaultId: 'vault-1',
              deletedAt: new Date('2026-12-01T00:00:00.000Z'),
              vault: { id: 'vault-1', name: 'Main', icon: 'wallet' },
              transactionTags: [{ tagId: 'tag-1', tag: { id: 'tag-1', userId: 'user-1', name: 'Income', icon: 'sparkles', backgroundColor: '#ffffff' } }],
              createdAt: new Date('2026-07-01T00:00:00.000Z'),
              updatedAt: new Date('2026-07-01T00:00:00.000Z'),
            },
          ]),
      };
      const skipRepo = {
        find: jest.fn().mockResolvedValue([{ recurringId: 'recurring-1', date: '2026-08-01', userId: 'user-1' }]),
      };

      getRepositoryMock.mockImplementation((entity) => {
        if (entity === Expense) return expenseRepo as never;
        if (entity === RecurringOccurrenceSkip) return skipRepo as never;
        throw new Error('Unexpected repository');
      });

      const result = await service.exportData('user-1');

      expect(debtsList).toHaveBeenCalledWith('user-1', 'all');
      expect(result.data.debts).toEqual([]);
      expect(result.data.user).toEqual({
        id: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        avatar: 'avatar.png',
        disableAiPrompt: true,
      });
      expect(result.data.transactions[0]).toEqual(
        expect.objectContaining({
          id: 'tx-1',
          sourceRecurringId: 'recurring-1',
        }),
      );
      expect(result.data.recurrings[0]).toEqual(
        expect.objectContaining({
          id: 'recurring-1',
          deletedAt: '2026-12-01T00:00:00.000Z',
        }),
      );
      expect(result.data.recurringSkips).toEqual([{ recurringId: 'recurring-1', date: '2026-08-01', userId: 'user-1' }]);
      expect(result.data.user).not.toHaveProperty('password');
    });
  });

  describe('importData', () => {
    it('throws a 400 AppError when the backup version is unsupported', async () => {
      const dto = buildImportRequest({ appVersion: '0.9' });

      await expect(service.importData('user-1', dto)).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 400,
      });

      expect(transactionMock).not.toHaveBeenCalled();
    });

    it('throws a 400 AppError when a transaction references a missing vault', async () => {
      const dto = buildImportRequest();
      dto.data.transactions[0].vaultId = 'missing-vault';

      await expect(service.importData('user-1', dto)).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 400,
      });

      expect(transactionMock).not.toHaveBeenCalled();
    });

    it('throws a 400 AppError when a transaction references a missing recurring source', async () => {
      const dto = buildImportRequest();
      dto.data.transactions[0].sourceRecurringId = 'missing-recurring';

      await expect(service.importData('user-1', dto)).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 400,
      });

      expect(transactionMock).not.toHaveBeenCalled();
    });

    it('throws a 400 AppError when a recurring skip references a missing recurring', async () => {
      const dto = buildImportRequest();
      dto.data.recurringSkips[0].recurringId = 'missing-recurring';

      await expect(service.importData('user-1', dto)).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 400,
      });

      expect(transactionMock).not.toHaveBeenCalled();
    });

    it('upserts the imported records in a single transaction', async () => {
      const dto = buildImportRequest();
      const entityManager = {
        find: jest.fn().mockResolvedValue([{ id: 'legacy-transaction' }, { id: 'tx-1' }, { id: 'recurring-1' }]),
        restore: jest.fn(),
        save: jest.fn(),
        softDelete: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      };

      transactionMock.mockImplementation(async (firstArg, secondArg) => {
        const callback = typeof firstArg === 'function' ? firstArg : secondArg;
        return callback!(entityManager as never);
      });

      await service.importData('user-1', dto);

      expect(getById).toHaveBeenCalledWith('user-1');
      expect(transactionMock).toHaveBeenCalledTimes(1);
      expect(entityManager.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        expect.objectContaining({
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          avatar: 'avatar.png',
          disableAiPrompt: true,
        }),
      );
      expect(entityManager.find).toHaveBeenCalledWith(
        Expense,
        expect.objectContaining({
          where: { userId: 'user-1' },
          withDeleted: true,
        }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(TransactionTag, {
        transactionId: expect.anything(),
      });
      expect(entityManager.softDelete).toHaveBeenCalledWith(
        RecurringOccurrenceSkip,
        expect.objectContaining({
          userId: 'user-1',
        }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(Expense, { userId: 'user-1' });
      expect(entityManager.softDelete).toHaveBeenCalledWith(Debt, { userId: 'user-1' });
      expect(entityManager.softDelete).toHaveBeenCalledWith(Vault, { userId: 'user-1' });
      expect(entityManager.softDelete).toHaveBeenCalledWith(Tag, { userId: 'user-1' });
      expect(entityManager.softDelete).toHaveBeenCalledWith(UserPreference, { userId: 'user-1' });
      expect(entityManager.save).toHaveBeenCalledWith(Tag, [
        expect.objectContaining({
          id: 'tag-1',
          userId: 'user-1',
          name: 'Income',
          deletedAt: null,
        }),
      ]);
      expect(entityManager.save).toHaveBeenCalledWith(Vault, [
        expect.objectContaining({
          id: 'vault-1',
          userId: 'user-1',
          name: 'Main',
          deletedAt: null,
        }),
      ]);
      expect(entityManager.save).toHaveBeenCalledWith(
        Expense,
        expect.arrayContaining([
          expect.objectContaining({
            id: 'tx-1',
            userId: 'user-1',
            interval: null,
            sourceRecurringId: 'recurring-1',
          }),
        ]),
      );
      expect(entityManager.save).toHaveBeenCalledWith(
        Expense,
        expect.arrayContaining([
          expect.objectContaining({
            id: 'recurring-1',
            userId: 'user-1',
            interval: 'monthly',
            deletedAt: new Date('2026-12-01T00:00:00.000Z'),
          }),
        ]),
      );
      expect(entityManager.save).toHaveBeenCalledWith(Debt, [
        expect.objectContaining({
          id: 'debt-1',
          userId: 'user-1',
          title: 'Water bill',
          deletedAt: new Date('2026-07-08T00:00:00.000Z'),
        }),
      ]);
      expect(entityManager.upsert).toHaveBeenCalledWith(
        UserPreference,
        [
          expect.objectContaining({
            userId: 'user-1',
            showIncome: true,
            showExpense: false,
          }),
        ],
        expect.objectContaining({ conflictPaths: ['userId'] }),
      );
      expect(entityManager.restore).toHaveBeenCalledWith(UserPreference, { userId: 'user-1' });
      expect(entityManager.save).toHaveBeenCalledWith(
        TransactionTag,
        expect.arrayContaining([
          expect.objectContaining({ transactionId: 'tx-1', tagId: 'tag-1', deletedAt: null }),
          expect.objectContaining({ transactionId: 'recurring-1', tagId: 'tag-1', deletedAt: null }),
        ]),
      );
      expect(entityManager.save).toHaveBeenCalledWith(RecurringOccurrenceSkip, [
        expect.objectContaining({
          recurringId: 'recurring-1',
          date: '2026-08-01',
          userId: 'user-1',
          deletedAt: null,
        }),
      ]);
    });
  });
});
