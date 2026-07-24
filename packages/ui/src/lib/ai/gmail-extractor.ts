/**
 * Client-side Gmail bank-alert extractor. Ports `EXTRACTOR_INSTRUCTIONS` +
 * `RESPONSE_SCHEMA` + `validate()` verbatim from the old server-side
 * `gmail-ai-extractor.service.ts` so both the pending-expense parse flow and
 * the watcher dry-run (`TestExtractModal`) share the exact same
 * prompt/schema/validation logic, running entirely in the browser with the
 * user's own OpenRouter key/model. See documentation/openrouter-ai-migration.md (T12).
 */

import type { AiExtractResultDto, ParsedEmailDto } from '@expense-tracker/shared';
import { chat, type JsonSchemaResponseFormat } from './openrouter';

/** One alert email — either the live Gmail re-fetch or a pasted dry-run sample. */
export interface ExtractorEmailInput {
  from: string;
  subject: string;
  bodyText: string;
  emailDate: string | null;
}

export interface ExtractTransactionParams {
  apiKey: string;
  model: string;
  email: ExtractorEmailInput;
  tags: { id: string; name: string }[];
  guidanceHint?: string | null;
}

const RESPONSE_SCHEMA_NAME = 'gmail_transaction_extraction';

/**
 * System prompt: extracts exactly one transaction from a bank/card alert email,
 * or reports `matched=false` for anything that isn't a transaction. Verbatim
 * port of the server-side `EXTRACTOR_INSTRUCTIONS`.
 */
const EXTRACTOR_INSTRUCTIONS = `You are a bank/card transaction email parser. You receive one alert email plus the user's tag list. Extract exactly one transaction. "amount" = the transaction amount only — never the account balance, available limit, reward points, or any phone/reference number; strip thousands separators; positive and finite. "type" = "expense" when money leaves (spent, debited, purchase, withdrawn, card transaction, paid), "income" when money enters (credited, received, deposit, refund, salary). "title" = merchant/payee, stripped of trailing numeric terminal codes; fall back to "Bank transaction". "tagIds" = the subset of the provided tag ids whose names best fit this spend; [] if none fit. If the email is not a transaction (OTP, promo, statement, balance-only), set matched=false. Invent nothing not present in the email.`;

/** Strict JSON schema for the structured-output response. Verbatim port of `RESPONSE_SCHEMA`. */
const RESPONSE_SCHEMA: Record<string, unknown> = {
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

/** Raw shape the model's structured output is parsed into before validation. */
interface AiExtractorRawOutput {
  matched: boolean;
  title: string;
  amount: number;
  type: string;
  tagIds: string[];
}

/** Validates and normalises the model's output into a `ParsedEmailDto`, or `null` to skip. Verbatim port of the server-side `validate()`. */
function validate(raw: AiExtractorRawOutput, tagIdSet: Set<string>): ParsedEmailDto | null {
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

/**
 * Runs the client-side extractor against one email using the user's own
 * OpenRouter key/model. Returns a validated `ParsedEmailDto`, or `null` when
 * the model reports `matched: false`, returns unparsable JSON, or fails
 * validation — callers treat all three as "skip". Mirrors
 * `GmailAiExtractorService.extract`'s return contract.
 */
export async function extractTransactionFromEmail({ apiKey, model, email, tags, guidanceHint }: ExtractTransactionParams): Promise<ParsedEmailDto | null> {
  const input = JSON.stringify({
    email: { from: email.from, subject: email.subject, bodyText: email.bodyText, emailDate: email.emailDate },
    availableTags: tags,
    guidance: guidanceHint ?? null,
  });

  const responseFormat: JsonSchemaResponseFormat = {
    type: 'json_schema',
    json_schema: {
      name: RESPONSE_SCHEMA_NAME,
      strict: true,
      schema: RESPONSE_SCHEMA,
    },
  };

  const content = await chat({
    apiKey,
    model,
    messages: [
      { role: 'system', content: EXTRACTOR_INSTRUCTIONS },
      { role: 'user', content: input },
    ],
    responseFormat,
  });

  let raw: AiExtractorRawOutput;
  try {
    raw = JSON.parse(content) as AiExtractorRawOutput;
  } catch {
    return null;
  }

  if (!raw || raw.matched === false) return null;

  const tagIdSet = new Set(tags.map((tag) => tag.id));
  return validate(raw, tagIdSet);
}

/** Converts an extraction result into the dry-run preview shape used by `TestExtractModal`. */
export function toAiExtractResult(parsed: ParsedEmailDto | null): AiExtractResultDto {
  return parsed ? { matched: true, title: parsed.title, amount: parsed.amount, type: parsed.type, tagIds: parsed.tagIds } : { matched: false };
}
