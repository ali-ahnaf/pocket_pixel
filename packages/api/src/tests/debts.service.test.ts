import type { Debt } from '../entities/Debt.entity';
import type { Expense } from '../entities/Expense.entity';
import { TransactionType } from '../entities/Expense.entity';
import { AppError } from '../errors/app-error';
import type { DebtsRepository } from '../repositories/debts.repository';
import type { TransactionsRepository } from '../repositories/transactions.repository';
import { DebtsService } from '../services/debts.service';

// Mock logger just like auth.service.test.ts
jest.mock('../services', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

type DebtsRepositoryMock = jest.Mocked<
  Pick<DebtsRepository, 'findManyForUser' | 'findOneForUser' | 'createEntity' | 'remove' | 'save'>
>;

type TransactionsRepositoryMock = jest.Mocked<
  Pick<TransactionsRepository, 'createEntity' | 'save'>
>;

const buildDebt = (overrides: Partial<Debt> = {}): Debt =>
  ({
    id: 'debt-1',
    userId: 'user-1',
    title: 'Internet Bill',
    amount: 1000,
    type: 'expense' as TransactionType,
    createdAt: new Date(),
    ...overrides,
  }) as Debt;

const buildExpense = (overrides: Partial<Expense> = {}): Expense =>
  ({
    id: 'expense-1',
    userId: 'user-1',
    title: 'Internet Bill',
    amount: 1000,
    type: 'expense' as TransactionType,
    date: '2026-06-27',
    vaultId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Expense;

describe('DebtsService', () => {
  let debts: DebtsRepositoryMock;
  let transactions: TransactionsRepositoryMock;
  let service: DebtsService;

  beforeEach(() => {
    debts = {
      findManyForUser: jest.fn(),
      findOneForUser: jest.fn(),
      createEntity: jest.fn((data) => data as Debt),
      remove: jest.fn(),
      save: jest.fn(),
    } as DebtsRepositoryMock;

    transactions = {
      createEntity: jest.fn(),
      save: jest.fn(),
    } as TransactionsRepositoryMock;

    service = new DebtsService(
      debts as unknown as DebtsRepository,
      transactions as unknown as TransactionsRepository,
    );
  });

  describe('list', () => {
    it("returns the user's debts", async () => {
      const debt = buildDebt();
      debts.findManyForUser.mockResolvedValue([debt]);

      const result = await service.list('user-1');

      expect(result).toEqual([debt]);
      expect(debts.findManyForUser).toHaveBeenCalledWith('user-1');
    });

    it('returns an empty array if no debt is found', async () => {
      const emptyDebts = [] as Debt[];
      debts.findManyForUser.mockResolvedValue(emptyDebts);

      const result = await service.list('user-1');

      expect(result).toEqual(emptyDebts);
      expect(debts.findManyForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('create', () => {
    const input = {title: 'Internet Bill', amount: 1000, type: 'expense' as TransactionType};
    it('creates a new debt and returns it as a DTO', async () => {
      const saved = buildDebt();
      debts.save.mockResolvedValue(saved);

      const result = await service.create('user-1', input);
      expect(debts.createEntity).toHaveBeenCalledWith(
        expect.objectContaining({title: input.title, amount: input.amount, type: input.type})
      );
      expect(debts.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: saved.id,
        userId: saved.userId,
        title: saved.title,
        amount: saved.amount,
        type: saved.type,
        createdAt: saved.createdAt,
      });
    });

    it('persists only the expected fields even when extra input is present', async () => {
      const saved = buildDebt();
      const inputWithExtra = {
        ...input,
        unexpected: 'ignore me',
      };
      debts.save.mockResolvedValue(saved);

      await service.create('user-1', inputWithExtra);

      expect(debts.createEntity).toHaveBeenCalledWith({
        userId: 'user-1',
        title: input.title,
        amount: input.amount,
        type: input.type,
      });
    });
  });

  describe('remove', () => {
    it('remove the debt when it exists', async () => {
      const debt = buildDebt();

      debts.findOneForUser.mockResolvedValue(debt);
      debts.remove.mockResolvedValue(debt);

      const result = await service.remove('user-1', 'debt-1');

      expect(result).toBeUndefined();
      expect(debts.remove).toHaveBeenCalledTimes(1);
      expect(debts.remove).toHaveBeenCalledWith(debt);
    });

    it('throws the right error when the debt is missing', async () => {
      debts.findOneForUser.mockResolvedValue(null);

      await expect(service.remove('user-1', 'debe-1')).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 404,
      });
    });
  });

  describe('apply', () => {
    it('removes the debt without creating a transaction when skipTransaction is true', async () => {
      const debt = buildDebt();

      debts.findOneForUser.mockResolvedValue(debt);
      debts.remove.mockResolvedValue(debt);

      const result = await service.apply('user-1', debt.id, {
        skipTransaction: true,
      });

      expect(transactions.createEntity).not.toHaveBeenCalled();
      expect(transactions.save).not.toHaveBeenCalled();

      expect(debts.remove).toHaveBeenCalledWith(debt);

      expect(result).toEqual({
        id: debt.id,
      });
    });

    it('creates a transaction and removes the debt when skipTransaction is false', async () => {
      const debt = buildDebt();
      const expense = buildExpense();

      debts.findOneForUser.mockResolvedValue(debt);

      transactions.createEntity.mockReturnValue(expense);
      transactions.save.mockResolvedValue(expense);

      debts.remove.mockResolvedValue(debt);

      const result = await service.apply('user-1', debt.id, {});

      expect(transactions.createEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: debt.title,
          amount: debt.amount,
          type: debt.type,
          vaultId: null,
        }),
      );

      expect(transactions.save).toHaveBeenCalledWith(expense);

      expect(debts.remove).toHaveBeenCalledWith(debt);

      expect(result).toEqual({
        id: expense.id,
      });
    });

    it('throws when the debt is missing', async () => {
      debts.findOneForUser.mockResolvedValue(null);

      await expect(service.apply('user-1', 'debt-1', {})).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 404,
      });
    });
  });
});
