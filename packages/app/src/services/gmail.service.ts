import { GmailLabelDto, OAuthCredentialsStatusDto } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { VaultGmailWatcher } from '../entities/VaultGmailWatcher.entity';
import { googleAuth, type GoogleAuth } from '../lib/gmail/google-auth';
import { gmailConnectionStore, type GmailConnectionStore } from '../lib/gmail/connection-store';
import { readHeader, type GmailMessage } from '../lib/gmail/message';
import { PendingGmailExpenseRepository } from '../repositories/pending-gmail-expense.repository';
import { VaultGmailWatchersRepository } from '../repositories/vault-gmail-watchers.repository';
import { pendingGmailExpenseRepository, vaultGmailWatchersRepository } from '../repositories';
import { logger } from '.';

export interface GmailSyncResult {
  readonly enqueued: number;
  readonly syncedAt: number | null;
}

/** A recent message on a watched label, for the manual "parse this email" list. */
export interface GmailRecentMessage {
  readonly id: string;
  readonly subject: string | null;
  /** ISO time Gmail received the message, null when Gmail omits it. */
  readonly receivedAt: string | null;
}

/** Base for all `users.me` Gmail REST calls. */
export const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

/**
 * Each sync re-reads this much before the previous sync's start, so mail Gmail
 * indexed a little late is not missed. Re-seen messages are deduped by the
 * pending queue's unique index.
 */
const SYNC_OVERLAP_MS = 10 * 60 * 1000;

const RECONNECT_MESSAGE = 'Gmail connection expired, please reconnect';

/**
 * Gmail on the phone. The server version is push-driven (Pub/Sub watch +
 * webhook); a phone cannot receive those, so `sync` polls each watched label
 * for mail newer than the last sync and runs when the app comes to the
 * foreground. A matching message is enqueued as a `PendingGmailExpense`
 * pointer; the body is re-fetched and parsed with AI only when the user
 * reviews it. Google Sign-In, the connection store and `fetch` are injected
 * so the service is unit-testable without the network.
 */
export class GmailService {
  private readonly runningSyncs = new Map<string, Promise<GmailSyncResult>>();

  constructor(
    private readonly auth: GoogleAuth = googleAuth,
    private readonly connections: GmailConnectionStore = gmailConnectionStore,
    private readonly watchers: VaultGmailWatchersRepository = vaultGmailWatchersRepository,
    private readonly pending: PendingGmailExpenseRepository = pendingGmailExpenseRepository,
    private readonly request: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  /** Same shape as the web's OAuth status. There is no client id/secret to bring, so `configured` is always true. */
  async getStatus(userId: string): Promise<OAuthCredentialsStatusDto> {
    const connection = await this.connections.get(userId);
    return {
      configured: true,
      connected: !!connection && !connection.reconnectRequired,
      googleEmail: connection?.email,
      reconnectRequired: !!connection?.reconnectRequired,
    };
  }

  /**
   * Runs the Google consent flow and links the account to this user. Returns
   * null when the user cancels. Switching to a different account resets the
   * sync baseline so the new mailbox is not read from the old account's cursor.
   */
  async connect(userId: string): Promise<OAuthCredentialsStatusDto | null> {
    const email = await this.auth.signIn();
    if (!email) return null;

    const existing = await this.connections.get(userId);
    await this.connections.set(userId, { email, syncedAt: existing?.email === email ? existing.syncedAt : null, reconnectRequired: false });
    logger.info('Connected Gmail', { userId });
    return this.getStatus(userId);
  }

  /** Lists the user's Gmail labels so the settings screen can offer a picker. */
  async listLabels(userId: string): Promise<GmailLabelDto[]> {
    const response = await this.authorizedFetch(userId, `${GMAIL_API_BASE}/labels`);
    if (!response.ok) throw new AppError(`Gmail labels request failed: HTTP ${response.status}`, 502);

    const data = (await response.json()) as { labels?: { id?: string; name?: string }[] };
    return (data.labels ?? [])
      .filter((label): label is { id: string; name: string } => typeof label.id === 'string' && typeof label.name === 'string')
      .map((label) => ({ id: label.id, name: label.name }));
  }

  /** One Gmail message, or null when it no longer exists (deleted from the mailbox). */
  async fetchMessage(userId: string, id: string, format: 'full' | 'metadata'): Promise<GmailMessage | null> {
    const query = format === 'metadata' ? 'format=metadata&metadataHeaders=Subject' : 'format=full';
    const response = await this.authorizedFetch(userId, `${GMAIL_API_BASE}/messages/${id}?${query}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new AppError(`Gmail messages.get failed: HTTP ${response.status}`, 502);
    return (await response.json()) as GmailMessage;
  }

  /** The newest `limit` messages on `labelId`, newest first, regardless of the sync baseline. */
  async listRecentMessages(userId: string, labelId: string, limit = 10): Promise<GmailRecentMessage[]> {
    const params = new URLSearchParams({ labelIds: labelId, maxResults: String(limit) });
    const response = await this.authorizedFetch(userId, `${GMAIL_API_BASE}/messages?${params.toString()}`);
    if (!response.ok) throw new AppError(`Gmail messages.list failed: HTTP ${response.status}`, 502);

    const data = (await response.json()) as { messages?: { id?: string }[] };
    const ids = (data.messages ?? []).flatMap((message) => (message.id ? [message.id] : []));
    const messages = await Promise.all(ids.map((id) => this.fetchMessage(userId, id, 'metadata')));
    return messages
      .filter((message): message is GmailMessage => message !== null)
      .map((message) => ({
        id: message.id,
        subject: readHeader(message.payload, 'Subject') ?? null,
        receivedAt: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
      }));
  }

  /**
   * The listener whose settings parse a message the user picked from `listRecentMessages`. The user chose
   * the message, so when no listener's subject filter matches, the label's first listener is used.
   */
  async findWatcherForMessage(userId: string, labelId: string, subject: string): Promise<VaultGmailWatcher> {
    const watchers = await this.watchers.findManyForUser(userId);
    const watcher = matchWatcher(watchers, [labelId], subject) ?? watchers.find((w) => w.gmailLabelId === labelId);
    if (!watcher) throw new AppError('No listener watches this label', 400);
    return watcher;
  }

  /**
   * Polls Gmail for new matching mail. Calls made while a sync for the user is running share it.
   * Resolves with how many emails were queued and the saved sync time (null when Gmail is not connected).
   */
  sync(userId: string): Promise<GmailSyncResult> {
    const running = this.runningSyncs.get(userId);
    if (running) return running;

    const run = this.runSync(userId).finally(() => this.runningSyncs.delete(userId));
    this.runningSyncs.set(userId, run);
    return run;
  }

  private async runSync(userId: string): Promise<GmailSyncResult> {
    const connection = await this.connections.get(userId);
    if (!connection || connection.reconnectRequired) return { enqueued: 0, syncedAt: connection?.syncedAt ?? null };

    const startedAt = Date.now();
    const watchers = await this.watchers.findManyForUser(userId);

    // Like the server's watch, only mail from now on is imported: the first sync
    // (or one with nothing to watch) just sets the baseline.
    if (watchers.length === 0 || connection.syncedAt === null) {
      await this.connections.set(userId, { ...connection, syncedAt: startedAt });
      return { enqueued: 0, syncedAt: startedAt };
    }

    const afterSeconds = Math.floor((connection.syncedAt - SYNC_OVERLAP_MS) / 1000);
    const labelIds = [...new Set(watchers.map((watcher) => watcher.gmailLabelId))];
    const messageIds = new Set<string>();
    for (const labelId of labelIds) {
      for (const id of await this.listMessageIdsSince(userId, labelId, afterSeconds)) messageIds.add(id);
    }

    const messages = await Promise.all([...messageIds].map((id) => this.fetchMessage(userId, id, 'metadata')));
    let enqueued = 0;
    for (const message of messages) {
      if (!message) continue;
      const subject = readHeader(message.payload, 'Subject') ?? '';
      const watcher = matchWatcher(watchers, message.labelIds ?? [], subject);
      if (!watcher) continue;

      const created = await this.pending.insertIfNotExists(userId, {
        gmailMessageId: message.id,
        vaultId: watcher.vaultId,
        subject: subject || null,
        guidanceHint: watcher.guidanceHint,
        transactionDay: watcher.transactionDay,
        tagKeywords: watcher.tagKeywords,
      });
      if (created) enqueued += 1;
    }

    await this.connections.set(userId, { ...connection, syncedAt: startedAt });
    logger.info('Gmail sync finished', { userId, scanned: messageIds.size, enqueued });
    return { enqueued, syncedAt: startedAt };
  }

  /** Every message id on `labelId` received after `afterSeconds` (epoch seconds), following all pages. */
  private async listMessageIdsSince(userId: string, labelId: string, afterSeconds: number): Promise<string[]> {
    const ids: string[] = [];
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({ labelIds: labelId, q: `after:${afterSeconds}` });
      if (pageToken) params.set('pageToken', pageToken);

      const response = await this.authorizedFetch(userId, `${GMAIL_API_BASE}/messages?${params.toString()}`);
      if (!response.ok) throw new AppError(`Gmail messages.list failed: HTTP ${response.status}`, 502);

      const data = (await response.json()) as { messages?: { id?: string }[]; nextPageToken?: string };
      for (const message of data.messages ?? []) if (message.id) ids.push(message.id);
      pageToken = data.nextPageToken;
    } while (pageToken);
    return ids;
  }

  /**
   * A Gmail API request with the user's access token. On a 401 the cached token
   * is dropped and the call retried once. When Google will not issue a token at
   * all, the connection is flagged for reconnect and a 401 `AppError` is thrown.
   */
  private async authorizedFetch(userId: string, url: string): Promise<Response> {
    const send = (token: string): Promise<Response> => this.request(url, { headers: { Authorization: `Bearer ${token}` } });

    const token = await this.auth.getAccessToken();
    if (!token) return this.requireReconnect(userId);

    const response = await send(token);
    if (response.status !== 401) return response;

    await this.auth.clearAccessToken(token);
    const freshToken = await this.auth.getAccessToken();
    if (!freshToken) return this.requireReconnect(userId);
    return send(freshToken);
  }

  private async requireReconnect(userId: string): Promise<never> {
    const connection = await this.connections.get(userId);
    if (connection && !connection.reconnectRequired) {
      await this.connections.set(userId, { ...connection, reconnectRequired: true });
      logger.warn('Gmail token unavailable, reconnect required', { userId });
    }
    throw new AppError(RECONNECT_MESSAGE, 401);
  }
}

/**
 * The vault watcher to fire for a message, matched by label + subject. Port of
 * the server's `matchWatcher`: a watcher with a `subjectFilter` matches only when
 * the subject contains it (case-insensitive) and wins over a catch-all watcher
 * on the same label; ties go to the earliest-created watcher (rows come back in
 * `createdAt` order).
 */
const matchWatcher = (watchers: VaultGmailWatcher[], labelIds: string[], subject: string): VaultGmailWatcher | null => {
  const candidates = watchers.filter((watcher) => labelIds.includes(watcher.gmailLabelId));
  const subjectLower = subject.toLowerCase();
  const specific = candidates.find((watcher) => watcher.subjectFilter && subjectLower.includes(watcher.subjectFilter.toLowerCase()));
  return specific ?? candidates.find((watcher) => !watcher.subjectFilter) ?? null;
};
