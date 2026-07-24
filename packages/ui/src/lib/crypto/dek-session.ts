/**
 * Module-level singleton holding the unwrapped OpenRouter DEK for the current
 * session (see documentation/openrouter-ai-migration.md, decision #1).
 *
 * The `CryptoKey` instance itself cannot survive a page reload, so on a hard
 * refresh we rehydrate it from its raw bytes, base64-encoded in
 * `sessionStorage` — NOT `localStorage`, so the key is gone once the tab/
 * browser is closed. A module singleton (rather than a React context) is used
 * so any part of the app can read/observe the same in-memory DEK without a
 * provider wrapping the tree; `useDekSession` (in `@/hooks/useDekSession`)
 * exposes it to components.
 *
 * `setSessionDek` is called at login (after `unwrapDek`) and at first-time key
 * setup; `clearSessionDek` is called at logout. Wiring into the actual
 * login/logout flows happens in a later task — this module only exports the
 * holder.
 */
import { base64ToBuffer, bufferToBase64 } from './ai-key';

const SESSION_STORAGE_KEY = 'pocket_pixel_dek';
const PENDING_WRAP_STORAGE_KEY = 'pocket_pixel_dek_wrap_meta';
const AES_ALGO = 'AES-GCM';
const AES_KEY_LENGTH_BITS = 256;

/**
 * KEK-wrapping metadata computed at login/setup time when no `UserAiCredential`
 * row exists yet (so there is nothing to reuse from `GET /ai-credentials`).
 * Held only in `sessionStorage` until the user's first key save persists it.
 */
export interface PendingWrapMetadata {
  salt: string;
  kdfIterations: number;
  dekIv: string;
  wrappedDek: string;
}

type DekListener = (dek: CryptoKey | null) => void;

let currentDek: CryptoKey | null = null;
let pendingWrapMetadata: PendingWrapMetadata | null = null;
let hydrated = false;
let hydrationPromise: Promise<CryptoKey | null> | null = null;
const listeners = new Set<DekListener>();

function notify(): void {
  listeners.forEach((listener) => listener(currentDek));
}

async function importRawDek(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: AES_ALGO, length: AES_KEY_LENGTH_BITS }, true, ['encrypt', 'decrypt']);
}

/** Synchronous snapshot of the in-memory DEK, without triggering rehydration. */
export function peekSessionDek(): CryptoKey | null {
  return currentDek;
}

/** True once the initial `sessionStorage` rehydration attempt has completed. */
export function isSessionDekHydrated(): boolean {
  return hydrated;
}

/**
 * Stores the unwrapped DEK in memory and persists its raw bytes
 * (base64-encoded) to `sessionStorage`. Call at login and at first-time key
 * setup.
 */
export async function setSessionDek(dek: CryptoKey): Promise<void> {
  currentDek = dek;
  hydrated = true;
  if (typeof window !== 'undefined') {
    const raw = await crypto.subtle.exportKey('raw', dek);
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, bufferToBase64(raw));
  }
  notify();
}

/** Clears the DEK from memory and `sessionStorage`. Call at logout. */
export function clearSessionDek(): void {
  currentDek = null;
  hydrated = true;
  hydrationPromise = null;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
  clearPendingWrapMetadata();
  notify();
}

/**
 * Stores KEK-wrapping metadata generated at login/setup time for a user with
 * no existing `UserAiCredential` row yet. Consumed by the Settings AI section
 * on the user's first key save (combined with the freshly encrypted key
 * ciphertext into one `PUT /ai-credentials`), then cleared.
 */
export function setPendingWrapMetadata(meta: PendingWrapMetadata): void {
  pendingWrapMetadata = meta;
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(PENDING_WRAP_STORAGE_KEY, JSON.stringify(meta));
  }
}

/** Reads pending wrap metadata, rehydrating from `sessionStorage` if needed (e.g. after a refresh). */
export function getPendingWrapMetadata(): PendingWrapMetadata | null {
  if (pendingWrapMetadata) return pendingWrapMetadata;
  if (typeof window === 'undefined') return null;
  const stored = window.sessionStorage.getItem(PENDING_WRAP_STORAGE_KEY);
  if (!stored) return null;
  try {
    pendingWrapMetadata = JSON.parse(stored) as PendingWrapMetadata;
    return pendingWrapMetadata;
  } catch {
    return null;
  }
}

/** Clears pending wrap metadata once it has been persisted server-side (or at logout). */
export function clearPendingWrapMetadata(): void {
  pendingWrapMetadata = null;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(PENDING_WRAP_STORAGE_KEY);
  }
}

/**
 * Returns the in-memory DEK, rehydrating it from `sessionStorage` on first
 * access after a hard refresh. Safe to call repeatedly/concurrently — the
 * rehydration only runs once.
 */
export async function getSessionDek(): Promise<CryptoKey | null> {
  if (hydrated) return currentDek;
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      if (typeof window === 'undefined') {
        hydrated = true;
        return null;
      }
      const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) {
        hydrated = true;
        return null;
      }
      const dek = await importRawDek(base64ToBuffer(stored));
      currentDek = dek;
      hydrated = true;
      notify();
      return dek;
    })();
  }
  return hydrationPromise;
}

/** Subscribes to DEK changes (set/clear/rehydrate). Returns an unsubscribe function. */
export function subscribeSessionDek(listener: DekListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
