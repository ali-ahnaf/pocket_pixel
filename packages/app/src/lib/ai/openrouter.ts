/**
 * OpenRouter client for the app. Calls OpenRouter directly from the phone with the
 * user's own API key. Port of packages/ui/src/lib/ai/openrouter.ts.
 */

const CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS_URL = 'https://openrouter.ai/api/v1/models';
const KEY_URL = 'https://openrouter.ai/api/v1/key';
const CREDITS_URL = 'https://openrouter.ai/api/v1/credits';

const APP_TITLE = 'Pocket Pixel';
const APP_REFERER = 'https://pocketpixel.app';

// Without max_tokens OpenRouter reserves the model's full output limit (65536 on some models) and rejects keys with less credit.
const DEFAULT_MAX_TOKENS = 1500;

export interface ToolCall {
  readonly id: string;
  readonly type: 'function';
  readonly function: { readonly name: string; readonly arguments: string };
}

export interface ToolDefinition {
  readonly type: 'function';
  readonly function: { readonly name: string; readonly description: string; readonly parameters: Record<string, unknown> };
}

export type ChatMessage =
  | { readonly role: 'system' | 'user'; readonly content: string }
  | { readonly role: 'assistant'; readonly content: string | null; readonly tool_calls?: ToolCall[] }
  | { readonly role: 'tool'; readonly tool_call_id: string; readonly content: string };

/** One assistant turn: text, tool calls, or both. */
export interface Completion {
  readonly content: string | null;
  readonly toolCalls: ToolCall[];
}

export interface JsonSchemaResponseFormat {
  readonly type: 'json_schema';
  readonly json_schema: {
    readonly name: string;
    readonly strict?: boolean;
    readonly schema: Record<string, unknown>;
  };
}

export interface ChatParams {
  readonly apiKey: string;
  readonly model: string;
  readonly messages: ChatMessage[];
  readonly responseFormat?: JsonSchemaResponseFormat;
  readonly tools?: ToolDefinition[];
  readonly toolChoice?: 'auto' | 'none';
  readonly maxTokens?: number;
}

export interface OpenRouterModel {
  readonly id: string;
  readonly name: string;
}

/** Spend figures for one OpenRouter key. All values are in credits (1 credit = 1 USD). `total*` are null when the credits endpoint is unavailable for the key. */
export interface OpenRouterUsage {
  readonly label: string;
  readonly keyUsage: number;
  readonly keyLimit: number | null;
  readonly keyLimitRemaining: number | null;
  readonly isFreeTier: boolean;
  readonly totalCredits: number | null;
  readonly totalUsage: number | null;
}

interface OpenRouterChatCompletionResponse {
  readonly choices?: { readonly message?: { readonly content?: string | null; readonly tool_calls?: ToolCall[] } }[];
}

interface OpenRouterErrorBody {
  readonly error?: { readonly message?: string };
}

interface OpenRouterModelListResponse {
  readonly data: { readonly id: string; readonly name?: string }[];
}

interface OpenRouterKeyResponse {
  readonly data?: {
    readonly label?: string;
    readonly usage?: number;
    readonly limit?: number | null;
    readonly limit_remaining?: number | null;
    readonly is_free_tier?: boolean;
  };
}

interface OpenRouterCreditsResponse {
  readonly data?: { readonly total_credits?: number; readonly total_usage?: number };
}

/** Throws an Error carrying OpenRouter's own message so callers can show it verbatim. */
async function throwOpenRouterError(response: Response): Promise<never> {
  const fallbackMessage = `OpenRouter request failed with status ${response.status}`;
  let message = fallbackMessage;

  try {
    const body: OpenRouterErrorBody = await response.json();
    message = body?.error?.message || fallbackMessage;
  } catch {
    // Body was not valid JSON, keep the generic status message.
  }

  throw new Error(message);
}

/** Sends a chat completion and returns the assistant turn. Used directly for tool calling. */
export async function complete({ apiKey, model, messages, responseFormat, tools, toolChoice, maxTokens = DEFAULT_MAX_TOKENS }: ChatParams): Promise<Completion> {
  const response = await fetch(CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': APP_REFERER,
      'X-Title': APP_TITLE,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      ...(responseFormat ? { response_format: responseFormat } : {}),
      ...(tools ? { tools, tool_choice: toolChoice ?? 'auto' } : {}),
    }),
  });

  if (!response.ok) {
    await throwOpenRouterError(response);
  }

  const data: OpenRouterChatCompletionResponse = await response.json();
  const message = data.choices?.[0]?.message;
  const content = message?.content || null;
  const toolCalls = message?.tool_calls ?? [];

  if (!content && toolCalls.length === 0) {
    throw new Error('OpenRouter response did not include any message content');
  }

  return { content, toolCalls };
}

/** Sends a chat completion and returns the raw message content. Callers `JSON.parse` it when they asked for structured output. */
export async function chat(params: ChatParams): Promise<string> {
  const { content } = await complete(params);

  if (!content) {
    throw new Error('OpenRouter response did not include any message content');
  }

  return content;
}

/** Lists every model on OpenRouter. Public endpoint, no key needed. */
export async function listModels(): Promise<OpenRouterModel[]> {
  const response = await fetch(MODELS_URL, { headers: { 'HTTP-Referer': APP_REFERER, 'X-Title': APP_TITLE } });

  if (!response.ok) {
    await throwOpenRouterError(response);
  }

  const data: OpenRouterModelListResponse = await response.json();
  return data.data.map((entry) => ({ id: entry.id, name: entry.name || entry.id }));
}

/**
 * Spend and limit info for the given key. `/key` is authoritative and its failure
 * fails the call. `/credits` (account-wide balance) is best-effort: not every key
 * can read it, so a failure there only drops the totals.
 */
export async function fetchUsage(apiKey: string): Promise<OpenRouterUsage> {
  const headers = { Authorization: `Bearer ${apiKey}`, 'HTTP-Referer': APP_REFERER, 'X-Title': APP_TITLE };

  const [keyResponse, creditsResponse] = await Promise.all([fetch(KEY_URL, { headers }), fetch(CREDITS_URL, { headers }).catch(() => null)]);

  if (!keyResponse.ok) {
    await throwOpenRouterError(keyResponse);
  }

  const key = ((await keyResponse.json()) as OpenRouterKeyResponse).data;

  if (!key) {
    throw new Error('OpenRouter key usage response did not include any data');
  }

  let totalCredits: number | null = null;
  let totalUsage: number | null = null;

  if (creditsResponse?.ok) {
    try {
      const credits = ((await creditsResponse.json()) as OpenRouterCreditsResponse).data;
      totalCredits = credits?.total_credits ?? null;
      totalUsage = credits?.total_usage ?? null;
    } catch {
      // Credits body was not valid JSON, keep the per-key numbers.
    }
  }

  return {
    label: key.label || 'OpenRouter key',
    keyUsage: key.usage ?? 0,
    keyLimit: key.limit ?? null,
    keyLimitRemaining: key.limit_remaining ?? null,
    isFreeTier: key.is_free_tier ?? false,
    totalCredits,
    totalUsage,
  };
}
