import OpenAI from 'openai';
import { AppError } from '../errors/app-error';
import { Expense } from '../entities/Expense.entity';
import { Vault } from '../entities/Vault.entity';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { VaultsRepository } from '../repositories/vaults.repository';
import { WizardService, WIZARD_MODEL } from '../services/wizard.service';

const mockResponsesCreate = jest.fn();

jest.mock('openai');

const mockedOpenAI = OpenAI as unknown as jest.Mock;

// Minimal builders so tests only specify the fields the service reads.
const expense = (amount: number, tagNames: string[], extra: Partial<Expense> = {}): Expense =>
  ({
    type: 'expense',
    amount: amount as unknown as number,
    transactionTags: tagNames.map((name) => ({ tag: { name } })),
    ...extra,
  }) as unknown as Expense;

describe('WizardService', () => {
  let service: WizardService;
  let transactions: { findManyForUser: jest.Mock };
  let vaults: { findManyForUser: jest.Mock };
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    mockedOpenAI.mockImplementation(() => ({ responses: { create: mockResponsesCreate } }));
    transactions = { findManyForUser: jest.fn() };
    vaults = { findManyForUser: jest.fn() };
    service = new WizardService(transactions as unknown as TransactionsRepository, vaults as unknown as VaultsRepository);
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  });

  it('throws a 500 AppError when OPENAI_API_KEY is not set', async () => {
    await expect(service.chat('user-1', 'spending_breakdown')).rejects.toMatchObject({
      constructor: AppError,
      statusCode: 500,
    });
    expect(transactions.findManyForUser).not.toHaveBeenCalled();
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it('sends the wizard persona and model, returning the model message', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    transactions.findManyForUser.mockResolvedValue([expense(30, ['Food']), expense(20, ['Food']), expense(50, ['Travel'])]);
    mockResponsesCreate.mockResolvedValue({ output_text: '  Ah, brave traveler!  ' });

    const result = await service.chat('user-1', 'spending_breakdown');

    expect(result).toEqual({ message: 'Ah, brave traveler!' });
    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.model).toBe(WIZARD_MODEL);
    expect(call.instructions).toContain('Aldric the Wise');
    // Top categories ranked by total spend, an expense counting toward each tag.
    const payload = JSON.parse(call.input);
    expect(payload.task).toContain('spends most');
    expect(payload.data.topCategories).toEqual([
      { category: 'Food', total: 50 },
      { category: 'Travel', total: 50 },
    ]);
  });

  it('computes spend vs budget per vault for budget_adherence', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    transactions.findManyForUser.mockResolvedValue([expense(40, ['Food'], { vaultId: 'v1' }), expense(10, ['Food'], { vaultId: 'v1' }), expense(5, [], { vaultId: 'v2' })]);
    vaults.findManyForUser.mockResolvedValue([
      { id: 'v1', name: 'Essentials', monthlyBudget: 100 as unknown as number },
      { id: 'v2', name: 'Fun', monthlyBudget: null },
    ] as unknown as Vault[]);
    mockResponsesCreate.mockResolvedValue({ output_text: 'On track!' });

    await service.chat('user-1', 'budget_adherence');

    const payload = JSON.parse(mockResponsesCreate.mock.calls[0][0].input);
    // Only vaults with a budget are reported; spend is summed per vault.
    expect(payload.data.coffers).toEqual([{ vault: 'Essentials', budget: 100, spent: 50 }]);
  });

  it('throws a 502 AppError when the model returns an empty message', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    transactions.findManyForUser.mockResolvedValue([]);
    mockResponsesCreate.mockResolvedValue({ output_text: '   ' });

    await expect(service.chat('user-1', 'spending_breakdown')).rejects.toMatchObject({
      constructor: AppError,
      statusCode: 502,
    });
  });
});
