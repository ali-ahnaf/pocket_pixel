/**
 * Client-side prompt-to-transaction parser, extracted from `LogResourceModal`
 * so any component can turn a free-text prompt into a `ParsedTransaction` via
 * the user's own OpenRouter key. Port of the old server-side
 * `prompt.service.ts` (see documentation/openrouter-ai-migration.md, T9).
 */

import type { TagDto, VaultDto, ParsedTransaction } from '@expense-tracker/shared';
import { profileApi } from '../api';
import { decryptKey } from '../crypto/ai-key';
import { chat, type JsonSchemaResponseFormat } from './openrouter';

// What the model returns: tags and vault by name, never by id.
interface ModelTransaction {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  tags: string[];
  vault: string | null;
}

export type TransactionPromptOutcome =
  | { status: 'success'; transaction: ParsedTransaction }
  | { status: 'needs-ai-setup'; message: string }
  | { status: 'dek-loading'; message: string }
  | { status: 'dek-unavailable'; message: string }
  | { status: 'unparseable'; message: string };

export interface ParseTransactionPromptParams {
  userId: string;
  promptText: string;
  availableTags: TagDto[];
  vaults: VaultDto[];
  dek: CryptoKey | null;
  dekLoading: boolean;
}

/**
 * Sends `promptText` to the user's chosen OpenRouter model, constrained to a
 * JSON schema built from `availableTags`/`vaults` so the model can only pick
 * existing tag/vault names, then maps the result back to ids. Throws on
 * network/decrypt/chat failures — callers should surface those via
 * `profileApi.parseError(err)`, same as any other API call.
 */
export async function parseTransactionPrompt({ userId, promptText, availableTags, vaults, dek, dekLoading }: ParseTransactionPromptParams): Promise<TransactionPromptOutcome> {
  const status = await profileApi.getAiCredentialStatus(userId);
  if (!status.hasKey || !status.selectedModel || !status.keyCiphertext || !status.keyIv) {
    return { status: 'needs-ai-setup', message: 'Set up your OpenRouter API key and pick a model in Settings before parsing prompts.' };
  }

  if (dekLoading) {
    return { status: 'dek-loading', message: 'Still unlocking your encryption key — try again in a moment.' };
  }

  if (!dek) {
    return { status: 'dek-unavailable', message: 'Your encryption key is not unlocked in this session. Please log out and log back in to unlock it, then try again.' };
  }

  const apiKey = await decryptKey(status.keyCiphertext, status.keyIv, dek);

  const tagList = availableTags.map((tag) => `- ${tag.name}`).join('\n');
  const vaultList = vaults.map((vault) => vault.name).join(', ');
  const seedPrompt = `This is an expense tracker app. Translate the user's prompt into a transaction.
Only pick existing tag names from this list. Do not create new tags:
${tagList}
User's vaults: ${vaultList}
Only pick a vault when the user explicitly names one from the list. Do not invent a vault, and return null when no vault is mentioned.
"title" should be a short 3-4 word description of the transaction.

prompt: ${promptText.trim()}`;

  // Constrain tags/vault to existing names via an enum so the model cannot
  // invent any. An empty enum is an invalid schema, so fall back to a plain
  // string array (or nullable string) when empty.
  const tagNames = availableTags.map((tag) => tag.name);
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

  const content = await chat({
    apiKey,
    model: status.selectedModel,
    messages: [{ role: 'user', content: seedPrompt }],
    responseFormat,
  });

  let candidate: ModelTransaction;
  try {
    candidate = JSON.parse(content) as ModelTransaction;
  } catch {
    return { status: 'unparseable', message: 'AI response could not be parsed. Please try again.' };
  }

  // Map tag/vault names back to ids, case-insensitively, dropping anything the model invented.
  const tagIdsByName = new Map(availableTags.map((tag) => [tag.name.toLowerCase(), tag.id]));
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
