import type { UserOAuthCredential } from '../entities/UserOAuthCredential.entity';
import type { UserOAuthCredentialRepository } from '../repositories/user-oauth-credential.repository';
import type { UserOAuthCredentialService } from '../services/user-oauth-credential.service';
import type { TransactionsService } from '../services/transactions.service';
import type { ProcessedGmailMessageRepository } from '../repositories/processed-gmail-message.repository';
import { GmailService, GMAIL_API_BASE, GmailMessage } from '../services/gmail.service';

jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  userOAuthCredentialService: {},
}));

type CredentialsMock = jest.Mocked<Pick<UserOAuthCredentialRepository, 'findByUserId' | 'findByGoogleEmail' | 'save'>>;
type OAuthMock = jest.Mocked<Pick<UserOAuthCredentialService, 'authorizedGoogleFetch'>>;

const buildCredential = (overrides: Partial<UserOAuthCredential> = {}): UserOAuthCredential =>
  ({
    id: 'cred-1',
    userId: 'user-1',
    gmailLabelIds: ['Label_1'],
    gmailHistoryId: null,
    gmailWatchExpiry: null,
    ...overrides,
  }) as UserOAuthCredential;

const jsonResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

describe('GmailService', () => {
  let credentials: CredentialsMock;
  let oauth: OAuthMock;
  let service: GmailService;

  beforeEach(() => {
    process.env.GMAIL_PUBSUB_TOPIC = 'projects/app/topics/pp-gmail-incoming';
    credentials = {
      findByUserId: jest.fn(),
      findByGoogleEmail: jest.fn(),
      save: jest.fn((c) => Promise.resolve(c as UserOAuthCredential)),
    };
    oauth = { authorizedGoogleFetch: jest.fn() };
    service = new GmailService(oauth as unknown as UserOAuthCredentialService, credentials as unknown as UserOAuthCredentialRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.GMAIL_PUBSUB_TOPIC;
  });

  describe('startWatch', () => {
    it('posts watch with the topic + chosen labels and persists the returned historyId and expiry', async () => {
      const credential = buildCredential({ gmailLabelIds: ['Label_1', 'Label_2'], googleEmail: null });
      credentials.findByUserId.mockResolvedValue(credential);
      const expiration = '1893456000000'; // epoch millis
      oauth.authorizedGoogleFetch.mockImplementation((_userId, url) =>
        Promise.resolve(url.endsWith('/profile') ? jsonResponse(200, { emailAddress: 'me@example.com' }) : jsonResponse(200, { historyId: '424242', expiration })),
      );

      const result = await service.startWatch('user-1');

      expect(oauth.authorizedGoogleFetch).toHaveBeenCalledWith('user-1', `${GMAIL_API_BASE}/watch`, expect.objectContaining({ method: 'POST' }));
      const watchCall = oauth.authorizedGoogleFetch.mock.calls.find(([, url]) => url.endsWith('/watch'));
      const body = JSON.parse((watchCall![2] as RequestInit).body as string);
      expect(body).toEqual({ topicName: 'projects/app/topics/pp-gmail-incoming', labelIds: ['Label_1', 'Label_2'], labelFilterBehavior: 'INCLUDE' });
      expect(credential.googleEmail).toBe('me@example.com');
      expect(credential.gmailHistoryId).toBe('424242');
      expect(credential.gmailWatchExpiry).toEqual(new Date(Number(expiration)));
      expect(credentials.save).toHaveBeenCalledWith(credential);
      expect(result).toEqual({ historyId: '424242', expiry: new Date(Number(expiration)) });
    });

    it('throws when the user has selected no labels to watch', async () => {
      credentials.findByUserId.mockResolvedValue(buildCredential({ gmailLabelIds: [] }));

      await expect(service.startWatch('user-1')).rejects.toThrow('Select at least one Gmail label to watch');
      expect(oauth.authorizedGoogleFetch).not.toHaveBeenCalled();
    });

    it('throws when no credential row exists', async () => {
      credentials.findByUserId.mockResolvedValue(null);

      await expect(service.startWatch('user-1')).rejects.toThrow('Google OAuth client not configured');
    });

    it('throws when the Pub/Sub topic env is not configured', async () => {
      delete process.env.GMAIL_PUBSUB_TOPIC;
      credentials.findByUserId.mockResolvedValue(buildCredential());

      await expect(service.startWatch('user-1')).rejects.toThrow('Gmail Pub/Sub topic is not configured');
      expect(oauth.authorizedGoogleFetch).not.toHaveBeenCalled();
    });

    it('throws and does not persist when Gmail rejects the watch', async () => {
      const credential = buildCredential();
      credentials.findByUserId.mockResolvedValue(credential);
      oauth.authorizedGoogleFetch.mockImplementation((_userId, url) =>
        Promise.resolve(url.endsWith('/profile') ? jsonResponse(200, { emailAddress: 'me@example.com' }) : jsonResponse(403, { error: 'forbidden' })),
      );

      await expect(service.startWatch('user-1')).rejects.toThrow('Gmail watch request failed: HTTP 403');
      expect(credentials.save).not.toHaveBeenCalled();
    });
  });

  describe('listLabels', () => {
    it('returns only labels that have both an id and a name', async () => {
      credentials.findByUserId.mockResolvedValue(buildCredential());
      oauth.authorizedGoogleFetch.mockResolvedValue(jsonResponse(200, { labels: [{ id: 'L1', name: 'Bank Alerts', type: 'user' }, { id: 'L2' }, { name: 'nameless' }] }));

      const labels = await service.listLabels('user-1');

      expect(labels).toEqual([{ id: 'L1', name: 'Bank Alerts' }]);
    });
  });

  describe('getWatchStatus', () => {
    it('reports watching with an ISO expiry and the chosen labels when the watch is live', async () => {
      const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      credentials.findByUserId.mockResolvedValue(buildCredential({ gmailWatchExpiry: future, gmailLabelIds: ['L1', 'L2'] }));

      const status = await service.getWatchStatus('user-1');

      expect(status).toEqual({ watching: true, expiry: future.toISOString(), labelIds: ['L1', 'L2'] });
    });

    it('reports not watching when there is no expiry', async () => {
      credentials.findByUserId.mockResolvedValue(buildCredential({ gmailWatchExpiry: null, gmailLabelIds: null }));

      expect(await service.getWatchStatus('user-1')).toEqual({ watching: false, expiry: null, labelIds: [] });
    });
  });

  describe('setWatchedLabels', () => {
    it('persists the chosen labels, starts the watch and returns the resulting status', async () => {
      const credential = buildCredential({ gmailLabelIds: null });
      credentials.findByUserId.mockResolvedValue(credential);
      oauth.authorizedGoogleFetch.mockImplementation((_userId, url) =>
        Promise.resolve(url.endsWith('/profile') ? jsonResponse(200, { emailAddress: 'me@example.com' }) : jsonResponse(200, { historyId: '900', expiration: '1893456000000' })),
      );

      const status = await service.setWatchedLabels('user-1', ['L1', 'L2']);

      expect(credential.gmailLabelIds).toEqual(['L1', 'L2']);
      const watchCall = oauth.authorizedGoogleFetch.mock.calls.find(([, url]) => url.endsWith('/watch'));
      const watchBody = JSON.parse((watchCall![2] as RequestInit).body as string);
      expect(watchBody.labelIds).toEqual(['L1', 'L2']);
      expect(status).toEqual({ watching: true, expiry: new Date(1893456000000).toISOString(), labelIds: ['L1', 'L2'] });
    });

    it('throws when no labels are provided', async () => {
      credentials.findByUserId.mockResolvedValue(buildCredential());

      await expect(service.setWatchedLabels('user-1', [])).rejects.toThrow('Select at least one Gmail label to watch');
      expect(oauth.authorizedGoogleFetch).not.toHaveBeenCalled();
    });
  });

  describe('stopWatch', () => {
    it('posts stop and clears the local watch expiry', async () => {
      const credential = buildCredential({ gmailWatchExpiry: new Date() });
      credentials.findByUserId.mockResolvedValue(credential);
      oauth.authorizedGoogleFetch.mockResolvedValue(jsonResponse(204, {}));

      await service.stopWatch('user-1');

      expect(oauth.authorizedGoogleFetch).toHaveBeenCalledWith('user-1', `${GMAIL_API_BASE}/stop`, { method: 'POST' });
      expect(credential.gmailWatchExpiry).toBeNull();
      expect(credentials.save).toHaveBeenCalledWith(credential);
    });

    it('treats a 404 (no active watch) as already stopped', async () => {
      const credential = buildCredential({ gmailWatchExpiry: new Date() });
      credentials.findByUserId.mockResolvedValue(credential);
      oauth.authorizedGoogleFetch.mockResolvedValue(jsonResponse(404, {}));

      await service.stopWatch('user-1');

      expect(credential.gmailWatchExpiry).toBeNull();
      expect(credentials.save).toHaveBeenCalledWith(credential);
    });

    it('no-ops when no credential row exists', async () => {
      credentials.findByUserId.mockResolvedValue(null);

      await service.stopWatch('user-1');

      expect(oauth.authorizedGoogleFetch).not.toHaveBeenCalled();
      expect(credentials.save).not.toHaveBeenCalled();
    });
  });

  describe('handlePushNotification', () => {
    // The history diff runs inside a private method; spy on it so these tests
    // exercise the routing/gating without depending on the diff implementation.
    const spyProcessHistory = (impl: () => Promise<void>) => jest.spyOn(service as unknown as { processHistory: () => Promise<void> }, 'processHistory').mockImplementation(impl);

    it('drops a notification for an unknown mailbox', async () => {
      credentials.findByGoogleEmail.mockResolvedValue(null);
      const process = spyProcessHistory(() => Promise.resolve());

      await service.handlePushNotification({ emailAddress: 'nobody@example.com', historyId: '100' });

      expect(credentials.findByGoogleEmail).toHaveBeenCalledWith('nobody@example.com');
      expect(process).not.toHaveBeenCalled();
      expect(credentials.save).not.toHaveBeenCalled();
    });

    it('skips when the incoming historyId is not newer than the stored one', async () => {
      credentials.findByGoogleEmail.mockResolvedValue(buildCredential({ googleEmail: 'me@example.com', gmailHistoryId: '200' }));
      const process = spyProcessHistory(() => Promise.resolve());

      await service.handlePushNotification({ emailAddress: 'me@example.com', historyId: '200' });

      expect(process).not.toHaveBeenCalled();
      expect(credentials.save).not.toHaveBeenCalled();
    });

    it('diffs and advances the stored historyId when the notification is newer', async () => {
      const credential = buildCredential({ googleEmail: 'me@example.com', gmailHistoryId: '200' });
      credentials.findByGoogleEmail.mockResolvedValue(credential);
      const process = spyProcessHistory(() => Promise.resolve());

      await service.handlePushNotification({ emailAddress: 'me@example.com', historyId: '250' });

      expect(process).toHaveBeenCalledWith(credential, '200');
      expect(credential.gmailHistoryId).toBe('250');
      expect(credentials.save).toHaveBeenCalledWith(credential);
    });

    it('swallows processing errors and does NOT advance the historyId', async () => {
      const credential = buildCredential({ googleEmail: 'me@example.com', gmailHistoryId: '200' });
      credentials.findByGoogleEmail.mockResolvedValue(credential);
      spyProcessHistory(() => Promise.reject(new Error('boom')));

      await expect(service.handlePushNotification({ emailAddress: 'me@example.com', historyId: '250' })).resolves.toBeUndefined();

      expect(credential.gmailHistoryId).toBe('200');
      expect(credentials.save).not.toHaveBeenCalled();
    });
  });

  describe('history diff (processHistory driven via a push)', () => {
    // handleMessage (the parse/transaction step) is private; spy it so these
    // tests exercise the diff/fetch logic independently of the parser phase.
    const spyHandleMessage = () => jest.spyOn(service as unknown as { handleMessage: (u: string, m: GmailMessage) => Promise<void> }, 'handleMessage').mockResolvedValue(undefined);

    const routeFetch = (routes: { match: RegExp; response: Response }[]): void => {
      oauth.authorizedGoogleFetch.mockImplementation((_userId, url) => {
        const found = routes.find((r) => r.match.test(url as string));
        if (!found) return Promise.reject(new Error(`unexpected url ${String(url)}`));
        return Promise.resolve(found.response);
      });
    };

    it('collects added message ids across history pages, fetches each in full, and dispatches them', async () => {
      const credential = buildCredential({ googleEmail: 'me@example.com', gmailHistoryId: '200', gmailLabelIds: ['L1'] });
      credentials.findByGoogleEmail.mockResolvedValue(credential);
      const handle = spyHandleMessage();

      routeFetch([
        { match: /\/history\?/, response: jsonResponse(200, { history: [{ messagesAdded: [{ message: { id: 'm1' } }, { message: { id: 'm2' } }] }] }) },
        { match: /\/messages\/m1\?/, response: jsonResponse(200, { id: 'm1' }) },
        { match: /\/messages\/m2\?/, response: jsonResponse(200, { id: 'm2' }) },
      ]);

      await service.handlePushNotification({ emailAddress: 'me@example.com', historyId: '250' });

      expect(handle).toHaveBeenCalledTimes(2);
      expect(handle.mock.calls.map((c) => (c[1] as GmailMessage).id).sort()).toEqual(['m1', 'm2']);
      expect(credential.gmailHistoryId).toBe('250');
    });

    it('falls back to a bounded messages.list when the stored historyId is too old (404)', async () => {
      const credential = buildCredential({ googleEmail: 'me@example.com', gmailHistoryId: '1', gmailLabelIds: ['L1'] });
      credentials.findByGoogleEmail.mockResolvedValue(credential);
      const handle = spyHandleMessage();

      routeFetch([
        { match: /\/history\?/, response: jsonResponse(404, {}) },
        { match: /\/messages\?/, response: jsonResponse(200, { messages: [{ id: 'r1' }, { id: 'r2' }] }) },
        { match: /\/messages\/r1\?/, response: jsonResponse(200, { id: 'r1' }) },
        { match: /\/messages\/r2\?/, response: jsonResponse(200, { id: 'r2' }) },
      ]);

      await service.handlePushNotification({ emailAddress: 'me@example.com', historyId: '999' });

      expect(handle.mock.calls.map((c) => (c[1] as GmailMessage).id).sort()).toEqual(['r1', 'r2']);
      expect(credential.gmailHistoryId).toBe('999');
    });

    it('does nothing to diff on a freshly started watch (null baseline) but still advances the id', async () => {
      const credential = buildCredential({ googleEmail: 'me@example.com', gmailHistoryId: null, gmailLabelIds: ['L1'] });
      credentials.findByGoogleEmail.mockResolvedValue(credential);
      const handle = spyHandleMessage();

      await service.handlePushNotification({ emailAddress: 'me@example.com', historyId: '250' });

      expect(oauth.authorizedGoogleFetch).not.toHaveBeenCalled();
      expect(handle).not.toHaveBeenCalled();
      expect(credential.gmailHistoryId).toBe('250');
    });
  });

  describe('handleMessage — parse + idempotency (via push, real parser)', () => {
    const b64url = (s: string): string => Buffer.from(s).toString('base64url');

    const bracMessage: GmailMessage = {
      id: 'm1',
      payload: {
        mimeType: 'text/plain',
        headers: [
          { name: 'From', value: 'alerts@bracbank.com' },
          { name: 'Subject', value: 'BRAC Bank Transaction Alert' },
          { name: 'Date', value: 'Sun, 12 Jul 2026 10:00:00 +0600' },
        ],
        body: { data: b64url('Your Account No. XXXX1234 has been debited BDT 1,500.00 on 12-Jul-2026 at DARAZ ONLINE. Available Balance BDT 5,000.00.') },
      },
    };

    let transactions: jest.Mocked<Pick<TransactionsService, 'create'>>;
    let processed: jest.Mocked<Pick<ProcessedGmailMessageRepository, 'exists' | 'record'>>;
    let svc: GmailService;

    beforeEach(() => {
      transactions = { create: jest.fn().mockResolvedValue({}) } as unknown as jest.Mocked<Pick<TransactionsService, 'create'>>;
      processed = { exists: jest.fn(), record: jest.fn().mockResolvedValue(undefined) };
      svc = new GmailService(
        oauth as unknown as UserOAuthCredentialService,
        credentials as unknown as UserOAuthCredentialRepository,
        transactions as unknown as TransactionsService,
        processed as unknown as ProcessedGmailMessageRepository,
      );

      credentials.findByGoogleEmail.mockResolvedValue(buildCredential({ googleEmail: 'me@example.com', gmailHistoryId: '200', gmailLabelIds: ['L1'] }));
      oauth.authorizedGoogleFetch.mockImplementation((_userId, url) => {
        if (/\/history\?/.test(url as string)) return Promise.resolve(jsonResponse(200, { history: [{ messagesAdded: [{ message: { id: 'm1' } }] }] }));
        if (/\/messages\/m1\?/.test(url as string)) return Promise.resolve(jsonResponse(200, bracMessage));
        return Promise.reject(new Error(`unexpected url ${String(url)}`));
      });
    });

    it('creates a transaction via TransactionsService for a new bank message and records it in the ledger', async () => {
      processed.exists.mockResolvedValue(false);

      await svc.handlePushNotification({ emailAddress: 'me@example.com', historyId: '250' });

      expect(transactions.create).toHaveBeenCalledWith('user-1', { amount: 1500, type: 'expense', title: 'BRAC Bank — DARAZ ONLINE', date: '2026-07-12' });
      expect(processed.record).toHaveBeenCalledWith('user-1', 'm1');
    });

    it('skips a message already in the ledger (replay) without creating a duplicate', async () => {
      processed.exists.mockResolvedValue(true);

      await svc.handlePushNotification({ emailAddress: 'me@example.com', historyId: '250' });

      expect(transactions.create).not.toHaveBeenCalled();
      expect(processed.record).not.toHaveBeenCalled();
    });
  });
});
