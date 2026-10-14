import type { TagDto, VaultDto } from '@expense-tracker/shared';
import type { AiCredentialStore } from '../lib/ai/credential-store';
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
  let service: AiService;

  beforeEach(() => {
    store = { getApiKey: jest.fn(), setApiKey: jest.fn(), getModel: jest.fn(), setModel: jest.fn() };
    client = { chat: jest.fn(), listModels: jest.fn(), fetchUsage: jest.fn() };
    service = new AiService(store, client);
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
});
