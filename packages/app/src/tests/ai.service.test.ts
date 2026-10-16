import type { TagDto, VaultDto } from '@expense-tracker/shared';
import type { AiCredentialStore } from '../lib/ai/credential-store';
import type { AnalyticsRepository } from '../repositories/analytics.repository';
import { applyTransactionDay, matchTagKeywords } from '../lib/ai/gmail-extractor';
import { recapMonthDue } from '../lib/ai/wizard';
import { AI_SETUP_MESSAGE, AiService, type OpenRouterClient } from '../services/ai.service';

// Keeps expo-secure-store (a native module) out of the Jest run; the service gets an in-memory store below.
jest.mock('../lib/ai/credential-store', () => ({ aiCredentialStore: {} }));

const tags = [
  { id: 'tag-food', name: 'FOOD' },
  { id: 'tag-fun', name: 'FUN' },
] as TagDto[];
const vaults = [
  { id: 'vault-main', name: 'Main' },
  { id: 'vault-trip', name: 'Trip' },
] as VaultDto[];

describe('AiService', () => {
  let store: jest.Mocked<AiCredentialStore>;
  let client: jest.Mocked<OpenRouterClient>;
  let analytics: jest.Mocked<Pick<AnalyticsRepository, 'tagTotals' | 'monthTotals' | 'vaultSpend' | 'findTransactions' | 'openDebts'>>;
  let service: AiService;

  beforeEach(() => {
    store = { getApiKey: jest.fn(), setApiKey: jest.fn(), getModel: jest.fn(), setModel: jest.fn() };
    client = { chat: jest.fn(), complete: jest.fn(), listModels: jest.fn(), fetchUsage: jest.fn() };
    analytics = { tagTotals: jest.fn(), monthTotals: jest.fn(), vaultSpend: jest.fn(), findTransactions: jest.fn(), openDebts: jest.fn() };
    service = new AiService(store, client, analytics as unknown as AnalyticsRepository);
  });

  describe('getStatus', () => {
    it('reports hasKey without exposing the key', async () => {
      store.getApiKey.mockResolvedValue('sk-or-secret');
      store.getModel.mockResolvedValue('openai/gpt-4o-mini');

      expect(await service.getStatus()).toEqual({ hasKey: true, selectedModel: 'openai/gpt-4o-mini' });
    });

    it('reports no key when none is stored', async () => {
      store.getApiKey.mockResolvedValue(null);
      store.getModel.mockResolvedValue(null);

      expect(await service.getStatus()).toEqual({ hasKey: false, selectedModel: null });
    });
  });

  it('saveApiKey stores the trimmed key', async () => {
    await service.saveApiKey('  sk-or-abc \n');

    expect(store.setApiKey).toHaveBeenCalledWith('sk-or-abc');
  });

  it('listCuratedModels drops models outside the curated list', async () => {
    client.listModels.mockResolvedValue([
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o-mini' },
      { id: 'meta/llama-3', name: 'Llama 3' },
    ]);

    expect(await service.listCuratedModels()).toEqual([{ id: 'openai/gpt-4o-mini', name: 'GPT-4o-mini' }]);
  });

  describe('getUsage', () => {
    it('returns null without calling OpenRouter when no key is saved', async () => {
      store.getApiKey.mockResolvedValue(null);

      expect(await service.getUsage()).toBeNull();
      expect(client.fetchUsage).not.toHaveBeenCalled();
    });

    it('fetches usage with the saved key', async () => {
      store.getApiKey.mockResolvedValue('sk-or-abc');

      await service.getUsage();

      expect(client.fetchUsage).toHaveBeenCalledWith('sk-or-abc');
    });
  });

  describe('parseTransactionPrompt', () => {
    it.each([
      ['key', null, 'openai/gpt-4o'],
      ['model', 'sk-or-abc', null],
    ])('asks for AI setup when the %s is missing', async (_name, apiKey, model) => {
      store.getApiKey.mockResolvedValue(apiKey);
      store.getModel.mockResolvedValue(model);

      expect(await service.parseTransactionPrompt('lunch 12', tags, vaults)).toEqual({ status: 'needs-ai-setup', message: AI_SETUP_MESSAGE });
      expect(client.chat).not.toHaveBeenCalled();
    });

    it('maps tag and vault names back to ids case-insensitively and drops invented ones', async () => {
      store.getApiKey.mockResolvedValue('sk-or-abc');
      store.getModel.mockResolvedValue('openai/gpt-4o');
      client.chat.mockResolvedValue(JSON.stringify({ title: 'Lunch', amount: 12, type: 'expense', tags: ['food', 'invented'], vault: 'TRIP' }));

      const outcome = await service.parseTransactionPrompt('lunch 12 on the trip', tags, vaults);

      expect(outcome).toEqual({ status: 'success', transaction: { title: 'Lunch', amount: 12, type: 'expense', tagIds: ['tag-food'], vaultId: 'vault-trip' } });
      expect(client.chat).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'sk-or-abc', model: 'openai/gpt-4o' }));
    });

    it('returns a null vault when the model names none or an unknown one', async () => {
      store.getApiKey.mockResolvedValue('sk-or-abc');
      store.getModel.mockResolvedValue('openai/gpt-4o');
      client.chat.mockResolvedValue(JSON.stringify({ title: 'Salary', amount: 900, type: 'income', tags: [], vault: 'Nope' }));

      const outcome = await service.parseTransactionPrompt('salary 900', tags, vaults);

      expect(outcome).toMatchObject({ status: 'success', transaction: { vaultId: null, tagIds: [] } });
    });

    it('falls back to plain schemas when there are no tags or vaults', async () => {
      store.getApiKey.mockResolvedValue('sk-or-abc');
      store.getModel.mockResolvedValue('openai/gpt-4o');
      client.chat.mockResolvedValue(JSON.stringify({ title: 'Tea', amount: 2, type: 'expense', tags: [], vault: null }));

      await service.parseTransactionPrompt('tea 2', [], []);

      const { properties } = client.chat.mock.calls[0][0].responseFormat!.json_schema.schema as { properties: Record<string, unknown> };
      expect(properties.tags).toEqual({ type: 'array', items: { type: 'string' } });
      expect(properties.vault).toEqual({ type: ['string', 'null'] });
    });

    it('reports unparseable when the model returns invalid JSON', async () => {
      store.getApiKey.mockResolvedValue('sk-or-abc');
      store.getModel.mockResolvedValue('openai/gpt-4o');
      client.chat.mockResolvedValue('not json');

      expect(await service.parseTransactionPrompt('lunch 12', tags, vaults)).toMatchObject({ status: 'unparseable' });
    });

    it('lets OpenRouter errors propagate', async () => {
      store.getApiKey.mockResolvedValue('sk-or-abc');
      store.getModel.mockResolvedValue('openai/gpt-4o');
      client.chat.mockRejectedValue(new Error('Invalid API key'));

      await expect(service.parseTransactionPrompt('lunch 12', tags, vaults)).rejects.toThrow('Invalid API key');
    });
  });

  describe('extractTransactionFromEmail', () => {
    const email = { from: 'alerts@bank.example', subject: 'Debit alert', bodyText: 'BDT 450 at CITY GROCERS', emailDate: '2026-10-12' };

    it('asks for AI setup without calling OpenRouter when no model is picked', async () => {
      store.getApiKey.mockResolvedValue('sk-or-key');
      store.getModel.mockResolvedValue(null);

      expect(await service.extractTransactionFromEmail(email, tags, null)).toEqual({ status: 'needs-ai-setup', message: AI_SETUP_MESSAGE });
      expect(client.chat).not.toHaveBeenCalled();
    });

    it('sends the guidance and tags, and drops tag ids the model invented', async () => {
      store.getApiKey.mockResolvedValue('sk-or-key');
      store.getModel.mockResolvedValue('openai/gpt-4o-mini');
      client.chat.mockResolvedValue(JSON.stringify({ matched: true, title: ' City Grocers ', amount: 450, type: 'expense', tagIds: ['tag-food', 'made-up'], date: 'not-a-date' }));

      expect(await service.extractTransactionFromEmail(email, tags, 'always groceries')).toEqual({
        status: 'success',
        parsed: { title: 'City Grocers', amount: 450, type: 'expense', tagIds: ['tag-food'], date: '2026-10-12' },
      });
      const userMessage = JSON.parse(client.chat.mock.calls[0][0].messages[1].content as string);
      expect(userMessage).toMatchObject({
        referenceDate: '2026-10-12',
        guidance: 'always groceries',
        availableTags: [
          { id: 'tag-food', name: 'FOOD' },
          { id: 'tag-fun', name: 'FUN' },
        ],
      });
    });
  });

  describe('matchTagKeywords', () => {
    const tagIdSet = new Set(['tag-food', 'tag-fun']);
    const rules = [
      { tagId: 'tag-fun', keywords: ['cinema'] },
      { tagId: 'tag-food', keywords: ['grocer', 'mart'] },
      { tagId: 'tag-deleted', keywords: ['city'] },
    ];

    it('returns every owned tag with a keyword in the subject or body, case-insensitively', () => {
      expect(matchTagKeywords({ subject: 'CINEMA tickets', bodyText: 'BDT 450 at CITY GROCERS' }, rules, tagIdSet)).toEqual(['tag-fun', 'tag-food']);
    });

    it('returns nothing when no keyword appears', () => {
      expect(matchTagKeywords({ subject: 'Debit alert', bodyText: 'BDT 450 at PHARMACY' }, rules, tagIdSet)).toEqual([]);
    });
  });

  describe('applyTransactionDay', () => {
    it("books on the fixed day of the next month whatever the email's day", () => {
      expect(applyTransactionDay('2026-10-01', 25)).toBe('2026-11-25');
      expect(applyTransactionDay('2026-10-31', 25)).toBe('2026-11-25');
      expect(applyTransactionDay('2026-12-15', 5)).toBe('2027-01-05');
    });

    it('clamps a day past the end of a short next month to its last day', () => {
      expect(applyTransactionDay('2026-01-10', 31)).toBe('2026-02-28');
    });
  });

  describe('askWizard', () => {
    const toolCall = (id: string, name: string, args: object) => ({ id, type: 'function' as const, function: { name, arguments: JSON.stringify(args) } });

    beforeEach(() => {
      analytics.tagTotals.mockResolvedValue([{ tag: 'FOOD', total: 40, count: 1 }]);
      analytics.vaultSpend.mockResolvedValue([{ vault: 'Main', monthlyBudget: 100, spent: 40 }]);
    });

    it('returns needs-ai-setup without calling OpenRouter when no key is saved', async () => {
      store.getApiKey.mockResolvedValue(null);
      store.getModel.mockResolvedValue('openai/gpt-4o-mini');

      expect(await service.askWizard('user-1', 'spending_breakdown')).toEqual({ status: 'needs-ai-setup', message: AI_SETUP_MESSAGE });
      expect(client.complete).not.toHaveBeenCalled();
    });

    it('runs the requested tools for the user, sends the results back, and returns the trimmed answer', async () => {
      store.getApiKey.mockResolvedValue('sk-or-secret');
      store.getModel.mockResolvedValue('openai/gpt-4o-mini');
      client.complete
        .mockResolvedValueOnce({ content: null, toolCalls: [toolCall('c1', 'spending_by_tag', { from: '2026-10-01', to: '2026-10-16' }), toolCall('c2', 'vault_budgets', {})] })
        .mockResolvedValueOnce({ content: '  Thy gold flows to FOOD.  ', toolCalls: [] });

      expect(await service.askWizard('user-1', 'budget_adherence')).toEqual({ status: 'success', answer: 'Thy gold flows to FOOD.' });

      expect(analytics.tagTotals).toHaveBeenCalledWith('user-1', { from: '2026-10-01', to: '2026-10-16' }, 'expense', 8);
      expect(analytics.vaultSpend).toHaveBeenCalledWith('user-1', expect.objectContaining({ from: expect.stringMatching(/^\d{4}-\d{2}-01$/) }));

      const first = client.complete.mock.calls[0][0];
      expect({ apiKey: first.apiKey, model: first.model, systemRole: first.messages[0].role, toolChoice: first.toolChoice, maxTokens: first.maxTokens }).toEqual({
        apiKey: 'sk-or-secret',
        model: 'openai/gpt-4o-mini',
        systemRole: 'system',
        toolChoice: 'auto',
        maxTokens: 1500,
      });
      expect(client.complete.mock.calls[1][0].messages.slice(2)).toEqual([
        { role: 'assistant', content: null, tool_calls: [expect.objectContaining({ id: 'c1' }), expect.objectContaining({ id: 'c2' })] },
        { role: 'tool', tool_call_id: 'c1', content: JSON.stringify([{ tag: 'FOOD', total: 40, count: 1 }]) },
        { role: 'tool', tool_call_id: 'c2', content: JSON.stringify([{ vault: 'Main', monthlyBudget: 100, spent: 40 }]) },
      ]);
    });

    it('turns tools off after the last tool round so the model has to answer', async () => {
      store.getApiKey.mockResolvedValue('sk-or-secret');
      store.getModel.mockResolvedValue('openai/gpt-4o-mini');
      client.complete.mockImplementation(async ({ toolChoice }) =>
        toolChoice === 'none' ? { content: 'Enough scrying.', toolCalls: [] } : { content: null, toolCalls: [toolCall('c', 'spending_by_tag', {})] },
      );

      expect(await service.askWizard('user-1', 'spending_patterns')).toEqual({ status: 'success', answer: 'Enough scrying.' });
      expect(client.complete.mock.calls.map(([params]) => params.toolChoice)).toEqual(['auto', 'auto', 'auto', 'auto', 'none']);
    });

    it('throws when the model returns only whitespace', async () => {
      store.getApiKey.mockResolvedValue('sk-or-secret');
      store.getModel.mockResolvedValue('openai/gpt-4o-mini');
      client.complete.mockResolvedValue({ content: '   ', toolCalls: [] });

      await expect(service.askWizard('user-1', 'spending_patterns')).rejects.toThrow('The wizard could not conjure a response');
    });
  });

  describe('monthlyRecap', () => {
    it('asks for the given month with explicit ranges and answers from the debt tool', async () => {
      store.getApiKey.mockResolvedValue('sk-or-secret');
      store.getModel.mockResolvedValue('openai/gpt-4o-mini');
      analytics.openDebts.mockResolvedValue([{ title: 'Owe Sam', amount: 25, type: 'expense', dueDate: null }]);
      client.complete
        .mockResolvedValueOnce({ content: null, toolCalls: [{ id: 'c1', type: 'function', function: { name: 'open_debts', arguments: '{}' } }] })
        .mockResolvedValueOnce({ content: 'Thou owest Sam 25 gold.', toolCalls: [] });

      expect(await service.monthlyRecap('user-1', '2026-01')).toEqual({ status: 'success', answer: 'Thou owest Sam 25 gold.' });

      const task = client.complete.mock.calls[0][0].messages[1].content;
      expect(task).toContain('January 2026');
      expect(task).toContain('from 2026-01-01 to 2026-01-31');
      expect(task).toContain('from 2025-12-01 to 2026-01-31');
      expect(analytics.openDebts).toHaveBeenCalledWith('user-1', 25);
    });

    it('returns needs-ai-setup without calling OpenRouter when no model is picked', async () => {
      store.getApiKey.mockResolvedValue('sk-or-secret');
      store.getModel.mockResolvedValue(null);

      expect(await service.monthlyRecap('user-1', '2026-01')).toEqual({ status: 'needs-ai-setup', message: AI_SETUP_MESSAGE });
      expect(client.complete).not.toHaveBeenCalled();
    });
  });
});

describe('recapMonthDue', () => {
  it.each([
    ['off', null, null, new Date(2026, 9, 16), null],
    ['before the day', 20, null, new Date(2026, 9, 16), null],
    ['on the day', 16, null, new Date(2026, 9, 16), '2026-09'],
    ['after the day', 1, '2026-08', new Date(2026, 9, 16), '2026-09'],
    ['already delivered', 1, '2026-09', new Date(2026, 9, 16), null],
    ['January recaps December', 1, '2025-11', new Date(2026, 0, 3), '2025-12'],
  ])('%s', (_name, day, last, today, expected) => {
    expect(recapMonthDue(day, last, today)).toBe(expected);
  });
});
