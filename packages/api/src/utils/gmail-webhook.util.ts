import '../env';
import jwt, { JwtHeader } from 'jsonwebtoken';
import { AppError } from '../errors/app-error';

/**
 * Verification + decoding helpers for the Gmail Pub/Sub push webhook. Google
 * signs every push request with an OIDC bearer token; we verify it against
 * Google's published certificates before trusting the body, because the payload
 * itself carries no proof of origin.
 */

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs';
const GOOGLE_ISSUERS: [string, string] = ['https://accounts.google.com', 'accounts.google.com'];

interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}

let certCache: CertCache | null = null;

const parseMaxAgeSeconds = (cacheControl: string | null): number => {
  const match = cacheControl?.match(/max-age=(\d+)/);
  return match ? Number(match[1]) : 3600;
};

/** Fetches Google's x509 signing certs (kid → PEM), honouring the Cache-Control max-age. */
const fetchGoogleCerts = async (): Promise<Record<string, string>> => {
  const now = Date.now();
  if (certCache && certCache.expiresAt > now) return certCache.certs;

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) throw new AppError('Failed to fetch Google OIDC certificates', 502);

  const certs = (await response.json()) as Record<string, string>;
  certCache = { certs, expiresAt: now + parseMaxAgeSeconds(response.headers.get('cache-control')) * 1000 };
  return certs;
};

export interface PubSubOidcClaims {
  email?: string;
  email_verified?: boolean;
  aud?: string;
  iss?: string;
}

/**
 * Verifies the Pub/Sub OIDC bearer token: RS256 signature against Google's certs,
 * the expected `audience`, and a Google issuer. Throws `AppError(401)` on any
 * failure so a forged or unsigned request never reaches the processing path.
 */
export const verifyPubSubOidcToken = async (token: string, audience: string | undefined): Promise<PubSubOidcClaims> => {
  if (!audience) throw new AppError('Gmail Pub/Sub audience is not configured', 500);

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') throw new AppError('Invalid Pub/Sub OIDC token', 401);

  const { kid } = decoded.header as JwtHeader;
  const certs = await fetchGoogleCerts();
  const cert = kid ? certs[kid] : undefined;
  if (!cert) throw new AppError('Unknown Pub/Sub OIDC signing key', 401);

  try {
    return jwt.verify(token, cert, { algorithms: ['RS256'], audience, issuer: GOOGLE_ISSUERS }) as PubSubOidcClaims;
  } catch {
    throw new AppError('Pub/Sub OIDC token verification failed', 401);
  }
};

/** Extracts the raw token from an `Authorization: Bearer <token>` header. */
export const extractBearerToken = (header: string | undefined): string => {
  if (!header?.startsWith('Bearer ')) throw new AppError('Missing Pub/Sub bearer token', 401);
  return header.slice('Bearer '.length).trim();
};

export interface PubSubNotification {
  emailAddress: string;
  historyId: string;
}

/**
 * Decodes the base64 Pub/Sub message payload into the Gmail notification. Returns
 * `null` on any malformation so the webhook can ack-and-drop instead of throwing.
 */
export const decodePubSubMessage = (message: unknown): PubSubNotification | null => {
  if (!message || typeof message !== 'object') return null;
  const { data } = message as { data?: unknown };
  if (typeof data !== 'string') return null;

  try {
    const json = JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as { emailAddress?: unknown; historyId?: unknown };
    if (typeof json.emailAddress !== 'string') return null;
    if (typeof json.historyId !== 'string' && typeof json.historyId !== 'number') return null;
    return { emailAddress: json.emailAddress, historyId: String(json.historyId) };
  } catch {
    return null;
  }
};
