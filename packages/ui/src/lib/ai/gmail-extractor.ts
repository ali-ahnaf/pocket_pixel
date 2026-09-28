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
 * or reports `matched=false` for anything that isn't a transaction. Ported from
 * the server-side `EXTRACTOR_INSTRUCTIONS`, extended with guidance-aware `date`.
 */
const EXTRACTOR_INSTRUCTIONS = `You are a bank/card transaction email parser. You receive one alert email plus the user's tag list. Extract exactly one transaction. "amount" = the transaction amount only — never the account balance, available limit, reward points, or any phone/reference number; strip thousands separators; positive and finite. "type" = "expense" when money leaves (spent, debited, purchase, withdrawn, card transaction, paid), "income" when money enters (credited, received, deposit, refund, salary). "title" = merchant/payee, stripped of trailing numeric terminal codes; fall back to "Bank transaction". "tagIds" = the subset of the provided tag ids whose names best fit this spend; [] if none fit. "date" = the booking date as yyyy-mm-dd; defaults to "referenceDate" (the date the email was sent). If "guidance" is provided, follow it — it may override title, type, tagIds, or date (e.g. shift the date to a billing cycle); compute any relative date from "referenceDate", never from today. If the email is not a transaction (OTP, promo, statement, balance-only), set matched=false. Apart from what the guidance asks for, invent nothing not present in the email.`;

/** Strict JSON schema for the structured-output response. Ported from `RESPONSE_SCHEMA`, plus `date`. */
const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    matched: { type: 'boolean' },
    title: { type: 'string' },
    amount: { type: 'number' },
    type: { type: 'string', enum: ['income', 'expense'] },
    tagIds: { type: 'array', items: { type: 'string' } },
    date: { type: 'string' },
  },
  required: ['matched', 'title', 'amount', 'type', 'tagIds', 'date'],
  additionalProperties: false,
};

/** Raw shape the model's structured output is parsed into before validation. */
interface AiExtractorRawOutput {
  matched: boolean;
  title: string;
  amount: number;
  type: string;
  tagIds: string[];
  date: string;
}

const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True when `value` is a real calendar date in `yyyy-mm-dd` form (rejects e.g. `2026-02-30`). */
function isValidYmd(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = YMD_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * Resolves the email's date (raw RFC 2822 `Date` header, ISO string, or a bare
 * `yyyy-mm-dd`) to a local `yyyy-mm-dd`, falling back to today. Uses local date
 * parts rather than `toISOString()`, which converts to UTC and can shift the day.
 */
export function toReferenceDate(emailDate: string | null, now: Date = new Date()): string {
  if (emailDate && isValidYmd(emailDate)) return emailDate;
  const parsed = emailDate ? new Date(emailDate) : now;
  const date = Number.isNaN(parsed.getTime()) ? now : parsed;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Validates and normalises the model's output into a `ParsedEmailDto`, or `null` to skip. An invalid model date falls back to `referenceDate`. */
function validate(raw: AiExtractorRawOutput, tagIdSet: Set<string>, referenceDate: string): ParsedEmailDto | null {
  if (typeof raw.title !== 'string' || raw.title.trim().length === 0) return null;
  if (typeof raw.amount !== 'number' || !Number.isFinite(raw.amount) || raw.amount <= 0) return null;
  if (raw.type !== 'income' && raw.type !== 'expense') return null;

  const tagIds = Array.isArray(raw.tagIds) ? raw.tagIds.filter((id) => tagIdSet.has(id)) : [];

  return {
    title: raw.title.trim(),
    amount: raw.amount,
    type: raw.type,
    date: isValidYmd(raw.date) ? raw.date : referenceDate,
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
  const referenceDate = toReferenceDate(email.emailDate);
  const input = JSON.stringify({
    referenceDate,
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
  return validate(raw, tagIdSet, referenceDate);
}

/** Converts an extraction result into the dry-run preview shape used by `TestExtractModal`. */
export function toAiExtractResult(parsed: ParsedEmailDto | null): AiExtractResultDto {
  return parsed ? { matched: true, title: parsed.title, amount: parsed.amount, type: parsed.type, tagIds: parsed.tagIds, date: parsed.date } : { matched: false };
}
