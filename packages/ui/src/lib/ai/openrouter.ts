/**
 * Browser-side OpenRouter client. Calls OpenRouter directly from the user's browser
 * using their own (already-decrypted) API key — no server round-trip. See
 * documentation/openrouter-ai-migration.md (T7).
 */

const CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS_URL = 'https://openrouter.ai/api/v1/models';

const APP_TITLE = 'Pocket Pixel';
const APP_REFERER = typeof window !== 'undefined' ? window.location.origin : 'https://pocketpixel.app';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  readonly role: ChatRole;
  readonly content: string;
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
}

export interface OpenRouterModel {
  readonly id: string;
  readonly name: string;
  readonly contextLength?: number;
}

interface OpenRouterChatCompletionChoice {
  readonly index: number;
  readonly finish_reason: string | null;
  readonly message: {
    readonly role: ChatRole;
    readonly content: string | null;
  };
}

interface OpenRouterChatCompletionResponse {
  readonly id: string;
  readonly model: string;
  readonly choices: OpenRouterChatCompletionChoice[];
}

interface OpenRouterErrorBody {
  readonly error?: {
    readonly message?: string;
    readonly code?: number | string;
    readonly type?: string;
  };
}

interface OpenRouterModelListEntry {
  readonly id: string;
  readonly name?: string;
  readonly context_length?: number;
}

interface OpenRouterModelListResponse {
  readonly data: OpenRouterModelListEntry[];
}

/**
 * Parse an OpenRouter error response body and throw an Error carrying
 * OpenRouter's own message, so callers can surface it verbatim in the UI.
 */
async function throwOpenRouterError(response: Response): Promise<never> {
  const fallbackMessage = `OpenRouter request failed with status ${response.status}`;
  let message = fallbackMessage;

  try {
    const body: OpenRouterErrorBody = await response.json();
    message = body?.error?.message || fallbackMessage;
  } catch {
    // Body wasn't valid JSON — fall back to the generic status message.
  }

  throw new Error(message);
}

/**
 * Send a chat completion request to OpenRouter and return the assistant's raw
 * message content. When `responseFormat` requests structured JSON output, the
 * content is still returned as a raw string — callers know their own schema
 * shape and are responsible for `JSON.parse`-ing it.
 */
export async function chat({ apiKey, model, messages, responseFormat }: ChatParams): Promise<string> {
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
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  });

  if (!response.ok) {
    await throwOpenRouterError(response);
  }

  const data: OpenRouterChatCompletionResponse = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter response did not include any message content');
  }

  return content;
}

/**
 * Fetch the list of models available on OpenRouter. Public endpoint — no
 * Authorization header required.
 */
export async function listModels(): Promise<OpenRouterModel[]> {
  const response = await fetch(MODELS_URL, {
    method: 'GET',
    headers: {
      'HTTP-Referer': APP_REFERER,
      'X-Title': APP_TITLE,
    },
  });

  if (!response.ok) {
    await throwOpenRouterError(response);
  }

  const data: OpenRouterModelListResponse = await response.json();

  return data.data.map((entry) => ({
    id: entry.id,
    name: entry.name || entry.id,
    contextLength: entry.context_length,
  }));
}
