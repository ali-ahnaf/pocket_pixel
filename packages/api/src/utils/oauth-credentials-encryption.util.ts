import crypto from 'crypto';
import '../env';
import { logger } from '../services/logger.service';

// AES-256-GCM: 32-byte key, 12-byte IV (NIST-recommended for GCM), 16-byte auth tag.
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

const loadEncryptionKey = (): Buffer => {
  const raw = process.env.OAUTH_CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('OAUTH_CREDENTIALS_ENCRYPTION_KEY is not set. Refusing to start without an encryption key for stored OAuth credentials.');
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(`OAUTH_CREDENTIALS_ENCRYPTION_KEY must decode (base64) to exactly ${KEY_LENGTH_BYTES} bytes, got ${key.length}.`);
  }

  return key;
};

const encryptionKey = loadEncryptionKey();

/**
 * Encrypts `plaintext` with AES-256-GCM. Output is a single base64 string
 * containing iv || authTag || ciphertext, so the entity only needs one
 * column per secret.
 */
export const encrypt = (plaintext: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
};

/**
 * Decrypts a value produced by `encrypt`. Throws if the payload is malformed
 * or the auth tag doesn't verify (tampering/corruption/wrong key) — logged
 * for observability without leaking the ciphertext or key material.
 */
export const decrypt = (ciphertext: string): string => {
  const payload = Buffer.from(ciphertext, 'base64');
  if (payload.length < IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES) {
    logger.warn('Rejected OAuth credential ciphertext: payload too short to contain iv + authTag');
    throw new Error('Invalid encrypted payload');
  }

  const iv = payload.subarray(0, IV_LENGTH_BYTES);
  const authTag = payload.subarray(IV_LENGTH_BYTES, IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);
  const encrypted = payload.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    logger.error('Failed to decrypt OAuth credential: auth tag verification failed', { reason: (err as Error).message });
    throw new Error('Failed to decrypt OAuth credential');
  }
};
