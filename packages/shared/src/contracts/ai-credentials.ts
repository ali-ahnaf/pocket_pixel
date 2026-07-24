/**
 * Per-user OpenRouter key, stored E2E-encrypted: the server only ever sees
 * ciphertext blobs. The browser derives a KEK from the user's login password
 * (PBKDF2), unwraps the DEK, and decrypts the OpenRouter key locally.
 */
export interface AiCredentialStatusDto {
  hasKey: boolean;
  selectedModel: string | null;
  /** Base64 PBKDF2 salt. `null` when no credential has been saved yet. */
  salt: string | null;
  kdfIterations: number | null;
  /** Base64 IV used to encrypt `wrappedDek`. */
  dekIv: string | null;
  /** DEK encrypted under the password-derived KEK. */
  wrappedDek: string | null;
  /** Base64 IV used to encrypt `keyCiphertext`. */
  keyIv: string | null;
  /** OpenRouter API key encrypted under the DEK. */
  keyCiphertext: string | null;
}

/** Upsert payload for the encrypted key blobs + selected model. Never a plaintext key field. */
export interface SetAiCredentialInput {
  salt: string;
  kdfIterations: number;
  dekIv: string;
  wrappedDek: string;
  keyIv: string;
  keyCiphertext: string;
  selectedModel?: string;
}

export interface SetAiModelInput {
  selectedModel: string;
}
