import OpenAI from 'openai';
import { ParsedTransaction, ModelUsage, UsageReport } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { logger, tagsService } from '.';

export type { ParsedTransaction, ModelUsage, UsageReport };

export const OPENAI_MODEL = 'gpt-5.4-nano';

// What the model returns: tags by name, never by id.
interface ModelTransaction {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  tags: string[];
}

/**
 * AI assistance: turns a free-text prompt into a transaction (with tags
 * resolved to the user's existing tag ids) and reports OpenAI usage. The OpenAI
 * clients are created lazily so the server can boot without the keys set.
 */
export class PromptService {
  private client: OpenAI | null = null;
  private adminClient: OpenAI | null = null;

  // The SDK reads OPENAI_API_KEY from the environment automatically.
  private openai(): OpenAI {
    if (!this.client) this.client = new OpenAI();
    return this.client;
  }

  // The organization usage/cost endpoints reject normal API keys, so the admin
  // client is authenticated with a separate Admin API key.
  private openaiAdmin(): OpenAI {
    if (!this.adminClient) this.adminClient = new OpenAI({ adminAPIKey: process.env.OPENAI_ADMIN_KEY });
    return this.adminClient;
  }

  async parseTransaction(userId: string, prompt: string): Promise<ParsedTransaction> {
    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OPENAI_API_KEY is not configured', 500);
    }

    const tags = await tagsService.listCached(userId);
    // Resolve names back to ids; lowercased so the model's casing doesn't matter.
    const tagIdsByName = new Map(tags.map((tag) => [tag.name.toLowerCase(), tag.id]));
    const tagList = tags.map((tag) => `- ${tag.name}`).join('\n');

    const seedPrompt = `This is an expense tracker app. Translate the user's prompt into a transaction.
Only pick existing tag names from this list. Do not create new tags:
${tagList}
"title" should be a short 3-4 word description of the transaction.

prompt: ${prompt}`;

    // Constrain tags to existing names via an enum so the model cannot invent any.
    // An empty enum is an invalid schema, so fall back to a plain string array when
    // the user has no tags yet.
    const tagNames = tags.map((tag) => tag.name);
    const tagsSchema = tagNames.length > 0 ? { type: 'array', items: { type: 'string', enum: tagNames } } : { type: 'array', items: { type: 'string' } };

    const response = await this.openai().responses.create({
      model: OPENAI_MODEL,
      input: seedPrompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'transaction',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              amount: { type: 'number' },
              type: { type: 'string', enum: ['expense', 'income'] },
              tags: tagsSchema,
            },
            required: ['title', 'amount', 'type', 'tags'],
            additionalProperties: false,
          },
        },
      },
    });

    // Structured outputs guarantee valid JSON matching the schema, so a direct
    // parse is safe; the guard only handles an empty/refusal response.
    let candidate: ModelTransaction;
    try {
      candidate = JSON.parse(response.output_text ?? '') as ModelTransaction;
    } catch {
      throw new AppError('Failed to parse AI response', 502);
    }

    // Map the returned tag names back to ids, dropping any the model invented.
    const tagIds = Array.isArray(candidate.tags)
      ? candidate.tags
          .filter((name): name is string => typeof name === 'string')
          .map((name) => tagIdsByName.get(name.toLowerCase()))
          .filter((id): id is string => typeof id === 'string')
      : [];

    logger.debug('Parsed AI transaction', { userId, tagCount: tagIds.length });
    return { title: candidate.title, amount: candidate.amount, type: candidate.type, tagIds };
  }

  /**
   * Reports this month's OpenAI token consumption, broken down per model.
   * https://platform.openai.com/docs/api-reference/usage/completions
   */
  async usage(): Promise<UsageReport> {
    if (!process.env.OPENAI_ADMIN_KEY) {
      throw new AppError('OPENAI_ADMIN_KEY is not configured', 500);
    }

    const startTime = this.startOfMonthUnix();
    const byModel = new Map<string, ModelUsage>();
    let inputTokens = 0;
    let outputTokens = 0;
    let requests = 0;
    let page: string | undefined;

    // Usage is bucketed by day and paginated; walk every page so totals are complete.
    do {
      const response = await this.openaiAdmin().admin.organization.usage.completions({
        start_time: startTime,
        bucket_width: '1d',
        limit: 31,
        group_by: ['model'],
        ...(page ? { page } : {}),
      });

      for (const bucket of response.data) {
        for (const result of bucket.results) {
          if (result.object !== 'organization.usage.completions.result') continue;

          inputTokens += result.input_tokens;
          outputTokens += result.output_tokens;
          requests += result.num_model_requests;

          const name = result.model ?? 'unknown';
          const entry = byModel.get(name) ?? { model: name, inputTokens: 0, outputTokens: 0, totalTokens: 0, requests: 0 };
          entry.inputTokens += result.input_tokens;
          entry.outputTokens += result.output_tokens;
          entry.totalTokens += result.input_tokens + result.output_tokens;
          entry.requests += result.num_model_requests;
          byModel.set(name, entry);
        }
      }

      page = response.next_page ?? undefined;
    } while (page);

    return {
      periodStart: startTime,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      requests,
      models: [...byModel.values()].sort((a, b) => b.totalTokens - a.totalTokens),
    };
  }

  // First second of the current UTC month — the window the report covers.
  private startOfMonthUnix(): number {
    const now = new Date();
    return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000);
  }
}
