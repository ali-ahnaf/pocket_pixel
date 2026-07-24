/**
 * Browser-side WebCrypto helpers for the E2E-encrypted OpenRouter key envelope.
 *
 * Scheme (see documentation/openrouter-ai-migration.md — "E2E encryption of
 * the OpenRouter key"):
 *   1. A random DEK (AES-256-GCM) is generated once per user.
 *   2. The OpenRouter key is encrypted under the DEK -> `keyCiphertext` + `keyIv`.
 *   3. A KEK is derived from the user's login password via PBKDF2 (per-user
 *      random `salt`, high iteration count).
 *   4. The DEK is wrapped (AES-GCM encrypted) under the KEK -> `wrappedDek` + `dekIv`.
 *
 * The server only ever stores/sees the opaque blobs above — never the
 * password, DEK, KEK, or plaintext key. Everything here runs in the browser
 * via `crypto.subtle`; no Node `Buffer` (base64 is done with `btoa`/`atob`).
 */

const PBKDF2_HASH = 'SHA-256';
const AES_ALGO = 'AES-GCM';
const AES_KEY_LENGTH_BITS = 256;
const GCM_IV_LENGTH_BYTES = 12;
const SALT_LENGTH_BYTES = 16;

/** Minimum PBKDF2 iteration count used when generating a brand-new salt. */
export const DEFAULT_KDF_ITERATIONS = 310_000;

/** Encodes raw bytes as a base64 string, browser-safe (no Node `Buffer`). */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Decodes a base64 string back into raw bytes, browser-safe (no Node `Buffer`). */
export function base64ToBuffer(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Generates a fresh, base64-encoded random salt for first-time PBKDF2 setup. */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  return bufferToBase64(salt);
}

/**
 * Derives the password-based KEK (key-encryption-key) via PBKDF2/SHA-256.
 * `salt` is base64-encoded, as stored server-side. `iterations` must accept
 * whatever value is already on file for existing credentials — only brand
 * new salts should be paired with `DEFAULT_KDF_ITERATIONS`.
 *
 * The returned key is used only to wrap/unwrap the DEK (never exported), so
 * it is created non-extractable.
 */
export async function deriveKek(password: string, salt: string, iterations: number): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToBuffer(salt),
      iterations,
      hash: PBKDF2_HASH,
    },
    baseKey,
    { name: AES_ALGO, length: AES_KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Generates a brand-new random AES-256-GCM data-encryption-key (DEK).
 * Extractable so it can later be exported (to wrap it, and to persist the
 * unwrapped key to `sessionStorage` for the session holder).
 */
export async function generateDek(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: AES_ALGO, length: AES_KEY_LENGTH_BITS }, true, ['encrypt', 'decrypt']);
}

/** Wraps (encrypts) the DEK under the KEK. Returns base64 ciphertext + IV. */
export async function wrapDek(dek: CryptoKey, kek: CryptoKey): Promise<{ wrappedDek: string; dekIv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH_BYTES));
  const rawDek = await crypto.subtle.exportKey('raw', dek);
  const ciphertext = await crypto.subtle.encrypt({ name: AES_ALGO, iv }, kek, rawDek);

  return { wrappedDek: bufferToBase64(ciphertext), dekIv: bufferToBase64(iv) };
}

/** Unwraps (decrypts) the DEK using the KEK. Inputs are base64. */
export async function unwrapDek(wrappedDek: string, dekIv: string, kek: CryptoKey): Promise<CryptoKey> {
  const iv = base64ToBuffer(dekIv);
  const ciphertext = base64ToBuffer(wrappedDek);
  const rawDek = await crypto.subtle.decrypt({ name: AES_ALGO, iv }, kek, ciphertext);

  return crypto.subtle.importKey('raw', rawDek, { name: AES_ALGO, length: AES_KEY_LENGTH_BITS }, true, ['encrypt', 'decrypt']);
}

/** Encrypts the plaintext OpenRouter API key under the DEK. Returns base64 ciphertext + IV. */
export async function encryptKey(plaintextKey: string, dek: CryptoKey): Promise<{ keyCiphertext: string; keyIv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH_BYTES));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: AES_ALGO, iv }, dek, encoder.encode(plaintextKey));

  return { keyCiphertext: bufferToBase64(ciphertext), keyIv: bufferToBase64(iv) };
}

/** Decrypts the OpenRouter API key ciphertext using the DEK. Inputs are base64. Returns the plaintext key string. */
export async function decryptKey(keyCiphertext: string, keyIv: string, dek: CryptoKey): Promise<string> {
  const iv = base64ToBuffer(keyIv);
  const ciphertext = base64ToBuffer(keyCiphertext);
  const plaintext = await crypto.subtle.decrypt({ name: AES_ALGO, iv }, dek, ciphertext);

  return new TextDecoder().decode(plaintext);
}
