/**
 * Populates the session DEK right after a successful sign-in/sign-up, while
 * the plaintext password is still available in memory (per
 * documentation/openrouter-ai-migration.md — the KEK can only ever be derived
 * at this moment, never later from Settings).
 *
 * - Existing `UserAiCredential` row: derive the KEK from the password and
 *   unwrap the DEK on file.
 * - No row yet: generate a fresh DEK + salt, wrap it under a KEK derived from
 *   this password, and stash the wrap metadata (not yet persisted — there's no
 *   key to encrypt yet) for the Settings AI section to combine with the key
 *   ciphertext on first save.
 *
 * Failures here must never block sign-in/sign-up; callers should catch and
 * log, leaving the DEK unset (AI features stay locked until the user retries).
 */
import { profileApi } from '@/lib/api';
import { DEFAULT_KDF_ITERATIONS, deriveKek, generateDek, generateSalt, unwrapDek, wrapDek } from './ai-key';
import { setPendingWrapMetadata, setSessionDek } from './dek-session';

export async function setupOrUnwrapDekAtLogin(userId: string, password: string): Promise<void> {
  const status = await profileApi.getAiCredentialStatus(userId);

  if (status.salt && status.kdfIterations && status.dekIv && status.wrappedDek) {
    const kek = await deriveKek(password, status.salt, status.kdfIterations);
    const dek = await unwrapDek(status.wrappedDek, status.dekIv, kek);
    await setSessionDek(dek);
    return;
  }

  const salt = generateSalt();
  const kdfIterations = DEFAULT_KDF_ITERATIONS;
  const dek = await generateDek();
  const kek = await deriveKek(password, salt, kdfIterations);
  const { wrappedDek, dekIv } = await wrapDek(dek, kek);

  await setSessionDek(dek);
  setPendingWrapMetadata({ salt, kdfIterations, dekIv, wrappedDek });
}
