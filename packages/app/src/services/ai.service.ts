import type { ParsedEmailDto, ParsedTransaction, TagDto, TagKeywordRuleDto, VaultDto, WizardPromptKey } from '@expense-tracker/shared';
import { aiCredentialStore, type AiCredentialStore } from '../lib/ai/credential-store';
import { chat, complete, fetchUsage, listModels, type JsonSchemaResponseFormat, type OpenRouterModel, type OpenRouterUsage } from '../lib/ai/openrouter';
import { extractTransactionFromEmail, type ExtractorEmailInput } from '../lib/ai/gmail-extractor';
import { getWizardResponse, recapTask, runWizardTool, TASKS } from '../lib/ai/wizard';
import { analyticsRepository } from '../repositories';
import type { AnalyticsRepository } from '../repositories/analytics.repository';

/** The OpenRouter calls AiService makes, injectable so tests do not hit the network. */
export interface OpenRouterClient {
  chat: typeof chat;
  complete: typeof complete;
  listModels: typeof listModels;
  fetchUsage: typeof fetchUsage;
}

export interface AiStatus {
  hasKey: boolean;
  selectedModel: string | null;
}

export type EmailExtractOutcome = { status: 'success'; parsed: ParsedEmailDto } | { status: 'needs-ai-setup'; message: string } | { status: 'unmatched' };

export type WizardOutcome = { status: 'success'; answer: string } | { status: 'needs-ai-setup'; message: string };

export type TransactionPromptOutcome = { status: 'success'; transaction: ParsedTransaction } | { status: 'needs-ai-setup'; message: string } | { status: 'unparseable'; message: string };

// What the model returns: tags and vault by name, never by id.
interface ModelTransaction {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  tags: string[];
  vault: string | null;
}

// Only these models are offered in settings. Matched by substring in either direction so a dated suffix on OpenRouter's side does not drop a model.
const CURATED_MODEL_IDS = ['openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/gpt-5-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash'];

const isCuratedModel = (modelId: string): boolean => {
  const lowerId = modelId.toLowerCase();
  return CURATED_MODEL_IDS.some((curatedId) => lowerId.includes(curatedId) || curatedId.includes(lowerId));
};

export const AI_SETUP_MESSAGE = 'Set up your OpenRouter API key and pick a model in Settings before parsing prompts.';

/**
 * OpenRouter integration: key/model storage, model list, usage, and turning a
 * free-text prompt into a transaction. The key and model come from the injected
 * store (secure storage on device), the network from the injected client.
 */
export class AiService {
  constructor(
    private readonly store: AiCredentialStore = aiCredentialStore,
    private readonly client: OpenRouterClient = { chat, complete, listModels, fetchUsage },
    private readonly analytics: AnalyticsRepository = analyticsRepository,
  ) {}

  async getStatus(): Promise<AiStatus> {
    const [apiKey, selectedModel] = await Promise.all([this.store.getApiKey(), this.store.getModel()]);
    return { hasKey: Boolean(apiKey), selectedModel };
  }

  saveApiKey(apiKey: string): Promise<void> {
    return this.store.setApiKey(apiKey.trim());
  }

  setModel(model: string): Promise<void> {
    return this.store.setModel(model);
  }

  async listCuratedModels(): Promise<OpenRouterModel[]> {
    const models = await this.client.listModels();
    return models.filter((model) => isCuratedModel(model.id));
  }

  /** Spend for the saved key, or null when no key is saved. */
  async getUsage(): Promise<OpenRouterUsage | null> {
    const apiKey = await this.store.getApiKey();
    return apiKey ? this.client.fetchUsage(apiKey) : null;
  }

  /**
   * Sends `prompt` to the user's chosen model, constrained to a JSON schema built from
   * the existing tag/vault names so the model cannot invent any, then maps the result
   * back to ids. Throws on network/OpenRouter failures; the caller shows `err.message`.
   */
  async parseTransactionPrompt(prompt: string, tags: TagDto[], vaults: VaultDto[]): Promise<TransactionPromptOutcome> {
    const [apiKey, model] = await Promise.all([this.store.getApiKey(), this.store.getModel()]);
    if (!apiKey || !model) {
      return { status: 'needs-ai-setup', message: AI_SETUP_MESSAGE };
    }

    const tagList = tags.map((tag) => `- ${tag.name}`).join('\n');
    const vaultList = vaults.map((vault) => vault.name).join(', ');
    const seedPrompt = `This is an expense tracker app. Translate the user's prompt into a transaction.
Only pick existing tag names from this list. Do not create new tags:
${tagList}
User's vaults: ${vaultList}
Only pick a vault when the user explicitly names one from the list. Do not invent a vault, and return null when no vault is mentioned.
"title" should be a short 3-4 word description of the transaction.

prompt: ${prompt.trim()}`;

    // An empty enum is an invalid schema, so fall back to a plain string array (or nullable string) when there are no tags/vaults.
    const tagNames = tags.map((tag) => tag.name);
    const vaultNames = vaults.map((vault) => vault.name);
    const tagsSchema: Record<string, unknown> = tagNames.length > 0 ? { type: 'array', items: { type: 'string', enum: tagNames } } : { type: 'array', items: { type: 'string' } };
    const vaultSchema: Record<string, unknown> = vaultNames.length > 0 ? { type: ['string', 'null'], enum: [...vaultNames, null] } : { type: ['string', 'null'] };

    const responseFormat: JsonSchemaResponseFormat = {
      type: 'json_schema',
      json_schema: {
        name: 'transaction',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string', enum: ['expense', 'income'] },
            tags: tagsSchema,
            vault: vaultSchema,
          },
          required: ['title', 'amount', 'type', 'tags', 'vault'],
          additionalProperties: false,
        },
      },
    };

    const content = await this.client.chat({ apiKey, model, messages: [{ role: 'user', content: seedPrompt }], responseFormat });

    let candidate: ModelTransaction;
    try {
      candidate = JSON.parse(content) as ModelTransaction;
    } catch {
      return { status: 'unparseable', message: 'AI response could not be parsed. Please try again.' };
    }

    // Map names back to ids, case-insensitively, dropping anything the model invented.
    const tagIdsByName = new Map(tags.map((tag) => [tag.name.toLowerCase(), tag.id]));
    const vaultIdsByName = new Map(vaults.map((vault) => [vault.name.toLowerCase(), vault.id]));

    const tagIds = Array.isArray(candidate.tags)
      ? candidate.tags
          .filter((name): name is string => typeof name === 'string')
          .map((name) => tagIdsByName.get(name.toLowerCase()))
          .filter((id): id is string => typeof id === 'string')
      : [];

    const vaultId = typeof candidate.vault === 'string' ? (vaultIdsByName.get(candidate.vault.toLowerCase()) ?? null) : null;

    return { status: 'success', transaction: { title: candidate.title, amount: candidate.amount, type: candidate.type, tagIds, vaultId } };
  }

  /**
   * Runs the Gmail bank-alert extractor on one email (a pending item or a pasted
   * sample). `unmatched` covers a non-transaction email and an unusable model answer.
   * Throws on network/OpenRouter failures; the caller shows `err.message`.
   */
  async extractTransactionFromEmail(
    email: ExtractorEmailInput,
    tags: Pick<TagDto, 'id' | 'name'>[],
    guidanceHint: string | null,
    transactionDay: number | null = null,
    tagKeywords: TagKeywordRuleDto[] | null = null,
  ): Promise<EmailExtractOutcome> {
    const [apiKey, model] = await Promise.all([this.store.getApiKey(), this.store.getModel()]);
    if (!apiKey || !model) {
      return { status: 'needs-ai-setup', message: AI_SETUP_MESSAGE };
    }

    const parsed = await extractTransactionFromEmail({
      chat: this.client.chat,
      apiKey,
      model,
      email,
      tags: tags.map((tag) => ({ id: tag.id, name: tag.name })),
      guidanceHint,
      transactionDay,
      tagKeywords,
    });
    return parsed ? { status: 'success', parsed } : { status: 'unmatched' };
  }

  /**
   * Answers a wizard chat prompt. The model reads `userId`'s data through read-only
   * analytics tools (see lib/ai/wizard.ts). Throws on network/OpenRouter failures;
   * the caller shows `err.message`.
   */
  askWizard(userId: string, promptKey: WizardPromptKey): Promise<WizardOutcome> {
    return this.runWizard(userId, TASKS[promptKey]);
  }

  /** Same as `askWizard`, for a question the user typed. */
  askWizardQuestion(userId: string, question: string): Promise<WizardOutcome> {
    return this.runWizard(userId, question.trim());
  }

  /** The wizard's recap of `month` (`YYYY-MM`): top spending tags, change from the month before, and open debts. Same tools as the chat. */
  monthlyRecap(userId: string, month: string): Promise<WizardOutcome> {
    return this.runWizard(userId, recapTask(month));
  }

  private async runWizard(userId: string, task: string): Promise<WizardOutcome> {
    const [apiKey, model] = await Promise.all([this.store.getApiKey(), this.store.getModel()]);
    if (!apiKey || !model) {
      return { status: 'needs-ai-setup', message: AI_SETUP_MESSAGE };
    }

    const runTool = (name: string, args: string): Promise<string> => runWizardTool(this.analytics, userId, name, args);
    const answer = await getWizardResponse(this.client.complete, runTool, task, apiKey, model);
    return { status: 'success', answer };
  }
}
