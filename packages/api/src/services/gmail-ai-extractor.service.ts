import OpenAI from 'openai';
import { ParsedEmailDto } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { GmailMessageContent } from '../utils/gmail-message.util';
import { logger } from '.';

/**
 * Small, cheap model — strict JSON schema does the accuracy work, so a nano-tier
 * model is enough for this single-transaction extraction. Step up to a larger
 * model only if accuracy drops on messy bank emails.
 */
export const GMAIL_EXTRACTOR_MODEL = 'gpt-5.4-nano';

/** Response is a tiny JSON object; cap output so a runaway generation can't cost. */
const MAX_OUTPUT_TOKENS = 200;

const RESPONSE_SCHEMA_NAME = 'gmail_transaction_extraction';

/**
 * System prompt: extracts exactly one transaction from a bank/card alert email,
 * or reports `matched=false` for anything that isn't a transaction.
 */
const EXTRACTOR_INSTRUCTIONS = `You are a bank/card transaction email parser. You receive one alert email plus the user's tag list. Extract exactly one transaction. "amount" = the transaction amount only — never the account balance, available limit, reward points, or any phone/reference number; strip thousands separators; positive and finite. "type" = "expense" when money leaves (spent, debited, purchase, withdrawn, card transaction, paid), "income" when money enters (credited, received, deposit, refund, salary). "title" = merchant/payee, stripped of trailing numeric terminal codes; fall back to "Bank transaction". "tagIds" = the subset of the provided tag ids whose names best fit this spend; [] if none fit. If the email is not a transaction (OTP, promo, statement, balance-only), set matched=false. Invent nothing not present in the email.`;

/** Strict JSON schema for the structured-output response. */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    matched: { type: 'boolean' },
    title: { type: 'string' },
    amount: { type: 'number' },
    type: { type: 'string', enum: ['income', 'expense'] },
    tagIds: { type: 'array', items: { type: 'string' } },
  },
  required: ['matched', 'title', 'amount', 'type', 'tagIds'],
  additionalProperties: false,
};

interface AiExtractorRawOutput {
  matched: boolean;
  title: string;
  amount: number;
  type: string;
  tagIds: string[];
}

/**
 * Turns one matching Gmail message into a transaction using an OpenAI structured
 * extraction call, given the user's tag list for AI-driven categorisation.
 *
 * Same lazy-client / `OPENAI_API_KEY` wiring as `WizardService`, but a separate
 * service — the wizard is an NPC chat, this is a structured extraction pipeline.
 * Return contract mirrors the old `GmailScriptRunnerService`:
 *  - a validated `ParsedEmailDto` for a matching, well-formed transaction;
 *  - `null` for `matched: false`, unparsable output, or a validation failure —
 *    the caller (`GmailService.handleMessage`) treats all of these as "skip".
 */
export class GmailAiExtractorService {
  private client: OpenAI | null = null;

  // The SDK reads OPENAI_API_KEY from the environment automatically.
  private openai(): OpenAI {
    if (!this.client) this.client = new OpenAI();
    return this.client;
  }

  async extract(email: GmailMessageContent, tags: { id: string; name: string }[], guidanceHint?: string | null): Promise<ParsedEmailDto | null> {
    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OPENAI_API_KEY is not configured', 500);
    }

    const input = JSON.stringify({
      email: { from: email.from, subject: email.subject, bodyText: email.bodyText, emailDate: email.emailDate },
      availableTags: tags,
      guidance: guidanceHint ?? null,
    });

    const response = await this.openai().responses.create({
      model: GMAIL_EXTRACTOR_MODEL,
      instructions: EXTRACTOR_INSTRUCTIONS,
      input,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      text: {
        format: {
          type: 'json_schema',
          name: RESPONSE_SCHEMA_NAME,
          schema: RESPONSE_SCHEMA,
          strict: true,
        },
      },
    });

    this.logUsage(response.usage);

    const raw = this.parse(response.output_text);
    if (!raw || raw.matched === false) return null;

    const tagIdSet = new Set(tags.map((tag) => tag.id));
    return this.validate(raw, tagIdSet);
  }

  /** Logs token usage so real per-email cost and cache-hit rate are measurable. */
  private logUsage(usage: OpenAI.Responses.ResponseUsage | undefined): void {
    if (!usage) return;
    logger.info('Gmail AI extractor usage', {
      model: GMAIL_EXTRACTOR_MODEL,
      inputTokens: usage.input_tokens,
      cachedTokens: usage.input_tokens_details?.cached_tokens ?? 0,
      outputTokens: usage.output_tokens,
      totalTokens: usage.total_tokens,
    });
  }

  /** Parses the model's JSON text; malformed output is treated as "skip", not an error. */
  private parse(outputText: string | undefined): AiExtractorRawOutput | null {
    if (!outputText) return null;
    try {
      return JSON.parse(outputText) as AiExtractorRawOutput;
    } catch (err) {
      logger.warn('Gmail AI extractor returned unparsable JSON, skipping', { err });
      return null;
    }
  }

  /** Validates and normalises the model's output into a `ParsedEmailDto`, or `null` to skip. */
  private validate(raw: AiExtractorRawOutput, tagIdSet: Set<string>): ParsedEmailDto | null {
    if (typeof raw.title !== 'string' || raw.title.trim().length === 0) return null;
    if (typeof raw.amount !== 'number' || !Number.isFinite(raw.amount) || raw.amount <= 0) return null;
    if (raw.type !== 'income' && raw.type !== 'expense') return null;

    const tagIds = Array.isArray(raw.tagIds) ? raw.tagIds.filter((id) => tagIdSet.has(id)) : [];

    return {
      title: raw.title.trim(),
      amount: raw.amount,
      type: raw.type,
      date: new Date().toISOString().split('T')[0],
      tagIds,
    };
  }
}
