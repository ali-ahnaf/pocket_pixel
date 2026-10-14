/**
 * Gmail message shapes and body decoding. Port of
 * packages/api/src/utils/gmail-message.util.ts, without Node's `Buffer`.
 */

/** A single MIME node of a Gmail message payload (headers + inline/base64 body). */
export interface GmailMessagePart {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
}

/** A `format=full` or `format=metadata` Gmail message. Only the fields the app reads are typed. */
export interface GmailMessage {
  id: string;
  labelIds?: string[];
  internalDate?: string;
  payload?: GmailMessagePart;
}

/** Normalised, decoded view of a Gmail message the AI extractor reads from. */
export interface GmailMessageContent {
  from: string;
  subject: string;
  bodyText: string;
  /** The message `Date` header (or internalDate ISO), used as a date fallback. */
  emailDate: string | null;
}

/** Case-insensitive header lookup on a Gmail payload part. */
export const readHeader = (part: GmailMessagePart | undefined, name: string): string | undefined => part?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

/**
 * Decodes Gmail's base64url body data as UTF-8. Hermes has `atob` but no
 * `Buffer`, so the bytes are percent-encoded and handed to `decodeURIComponent`.
 * Bodies that are not valid UTF-8 (old Latin-1 alerts) fall back to the raw bytes.
 */
export const decodeBase64Url = (data: string): string => {
  const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  try {
    return decodeURIComponent(binary.replace(/[\s\S]/g, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`));
  } catch {
    return binary;
  }
};

/** Collapses HTML to readable text so the AI sees the alert text, not markup. */
const stripHtml = (html: string): string =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Walks the MIME tree gathering decoded text from every text part (plain text as
 * is, HTML stripped to text) so the extractor gets a single body string
 * regardless of whether the alert is plain, HTML, or multipart.
 */
const collectText = (part: GmailMessagePart | undefined): string => {
  if (!part) return '';
  const chunks: string[] = [];

  const walk = (node: GmailMessagePart): void => {
    if (node.body?.data) {
      const decoded = decodeBase64Url(node.body.data);
      if (node.mimeType === 'text/html') chunks.push(stripHtml(decoded));
      else if (!node.mimeType || node.mimeType.startsWith('text/')) chunks.push(decoded);
    }
    for (const child of node.parts ?? []) walk(child);
  };

  walk(part);
  return chunks.join('\n').trim();
};

/** Extracts the sender, subject, decoded body and a date from a full Gmail message. */
export const extractMessageContent = (message: GmailMessage): GmailMessageContent => {
  const payload = message.payload;
  const emailDate = readHeader(payload, 'Date') ?? (message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null);

  return {
    from: readHeader(payload, 'From') ?? '',
    subject: readHeader(payload, 'Subject') ?? '',
    bodyText: collectText(payload),
    emailDate,
  };
};
