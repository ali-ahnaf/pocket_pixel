import type { GmailMessage, GmailMessagePart } from '../services/gmail.service';

/** Normalised, decoded view of a Gmail message a watcher's parse script reads from. */
export interface GmailMessageContent {
  from: string;
  subject: string;
  bodyText: string;
  /** The message `Date` header (or internalDate ISO), used as a date fallback. */
  emailDate: string | null;
}

/** Case-insensitive header lookup on a Gmail payload part. */
const readHeader = (part: GmailMessagePart | undefined, name: string): string | undefined => part?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

const decodeBase64Url = (data: string): string => Buffer.from(data, 'base64url').toString('utf8');

/** Collapses HTML to readable text so the amount/keyword regexes can match. */
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
 * is, HTML stripped to text) so parsers can match on a single body string
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
