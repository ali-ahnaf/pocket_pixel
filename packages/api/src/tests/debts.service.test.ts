import type { Debt } from '../entities/Debt.entity';
import type { Expense } from '../entities/Expense.entity';
import { TransactionType } from '../entities/Expense.entity';
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
  Pick<DebtsRepository, 'findOneForUser' | 'remove'>
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
      findOneForUser: jest.fn(),
      remove: jest.fn(),
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
  });
});