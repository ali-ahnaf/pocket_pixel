import { AppDataSource } from '../db/data-source';
import { initDatabase } from '../db/init';
import { Expense } from '../entities/Expense.entity';
import { Tag } from '../entities/Tag.entity';
import { User } from '../entities/User.entity';
import { Vault } from '../entities/Vault.entity';
import { AppError } from '../errors/app-error';
import type { AiCredentialStore } from '../lib/ai/credential-store';
import type { GmailConnection, GmailConnectionStore } from '../lib/gmail/connection-store';
import type { GoogleAuth } from '../lib/gmail/google-auth';
import { PendingGmailExpenseRepository, TagsRepository, TransactionsRepository, VaultGmailWatchersRepository, VaultsRepository } from '../repositories';
import { AiService, type OpenRouterClient } from '../services/ai.service';
import { GMAIL_API_BASE, GmailService } from '../services/gmail.service';
import { PendingGmailExpenseService } from '../services/pending-gmail-expense.service';
import { TransactionsService } from '../services/transactions.service';
import { VaultWatchersService } from '../services/vault-watchers.service';

// Every collaborator is built explicitly below; this keeps the real service singletons (and their native modules) out of the run.
jest.mock('../services', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('../lib/ai/credential-store', () => ({ aiCredentialStore: {} }));
jest.mock('../lib/gmail/google-auth', () => ({ googleAuth: {} }));
jest.mock('../lib/gmail/connection-store', () => ({ gmailConnectionStore: {} }));

// Gmail's base64url of the UTF-8 bytes, built without Node's Buffer (the app's tsconfig has no Node types).
const base64Url = (value: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const json = (body: unknown, status = 200): Response => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

interface FakeMessage {
  id: string;
  labelIds: string[];
  subject: string;
  html: string;
}

// Real SQL against the in-memory DB (see jest.config.js); only Google and OpenRouter are faked.
describe('Gmail on device', () => {
  let userId: string;
  let catchAllVault: Vault;
  let debitVault: Vault;
  let foodTag: Tag;

  let connections: Map<string, GmailConnection>;
  let auth: jest.Mocked<GoogleAuth>;
  let mailbox: FakeMessage[];
  let request: jest.Mock<Promise<Response>, [string, RequestInit?]>;
  let chat: jest.Mock;
  let gmail: GmailService;
  let watchers: VaultWatchersService;
  let pending: PendingGmailExpenseService;

  // A fake Gmail REST API over `mailbox`. messages.list ignores `after:`; the tests assert on the query instead.
  const fakeGmail = async (url: string): Promise<Response> => {
    const { pathname, searchParams } = new URL(url);
    const path = pathname.replace(new URL(GMAIL_API_BASE).pathname, '');
    if (path === '/labels') return json({ labels: [{ id: 'Label_1', name: 'Bank Alerts' }, { id: 'Label_2' }] });
    if (path === '/messages') return json({ messages: mailbox.filter((m) => m.labelIds.includes(searchParams.get('labelIds') ?? '')).map((m) => ({ id: m.id })) });

    const message = mailbox.find((m) => path === `/messages/${m.id}`);
    if (!message) return json({}, 404);
    const headers = [
      { name: 'Subject', value: message.subject },
      { name: 'From', value: 'alerts@bank.example' },
      { name: 'Date', value: 'Mon, 12 Oct 2026 09:30:00 +0600' },
    ];
    if (searchParams.get('format') === 'metadata') return json({ id: message.id, labelIds: message.labelIds, payload: { headers: headers.slice(0, 1) } });
    return json({ id: message.id, labelIds: message.labelIds, payload: { mimeType: 'multipart/alternative', headers, parts: [{ mimeType: 'text/html', body: { data: base64Url(message.html) } }] } });
  };

  beforeAll(async () => {
    await initDatabase();
    const user = await AppDataSource.getRepository(User).save({ name: 'Ada', email: 'ada@example.com', password: null });
    userId = user.id;
    const vaultRepo = AppDataSource.getRepository(Vault);
    catchAllVault = await vaultRepo.save({ userId, name: 'Main', description: '' });
    debitVault = await vaultRepo.save({ userId, name: 'Card', description: '' });
    foodTag = await AppDataSource.getRepository(Tag).save({ userId, name: 'FOOD' });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(() => {
    connections = new Map();
    const store: GmailConnectionStore = { get: async (id) => connections.get(id) ?? null, set: async (id, c) => void connections.set(id, { ...c }) };
    auth = { signIn: jest.fn().mockResolvedValue('ada@gmail.com'), getAccessToken: jest.fn().mockResolvedValue('token-1'), clearAccessToken: jest.fn() };
    mailbox = [];
    request = jest.fn(fakeGmail);
    chat = jest.fn();

    const aiStore: AiCredentialStore = { getApiKey: async () => 'sk-or-key', getModel: async () => 'openai/gpt-4o-mini', setApiKey: jest.fn(), setModel: jest.fn() };
    const client: OpenRouterClient = { chat, complete: jest.fn(), listModels: jest.fn(), fetchUsage: jest.fn() };
    const watcherRepo = new VaultGmailWatchersRepository();
    const pendingRepo = new PendingGmailExpenseRepository();

    gmail = new GmailService(auth, store, watcherRepo, pendingRepo, request as unknown as typeof fetch);
    watchers = new VaultWatchersService(watcherRepo, new VaultsRepository(), new TagsRepository());
    pending = new PendingGmailExpenseService(pendingRepo, new TagsRepository(), gmail, new AiService(aiStore, client), new TransactionsService(new TransactionsRepository(), new VaultsRepository()));
  });

  const connectAndBaseline = async (): Promise<void> => {
    await gmail.connect(userId);
    await gmail.sync(userId);
  };

  it('connects, then only sets the baseline on the first sync', async () => {
    expect(await gmail.getStatus(userId)).toEqual({ configured: true, connected: false, googleEmail: undefined, reconnectRequired: false });

    expect(await gmail.connect(userId)).toEqual({ configured: true, connected: true, googleEmail: 'ada@gmail.com', reconnectRequired: false });
    await watchers.upsert(userId, catchAllVault.id, { gmailLabelId: 'Label_1', gmailLabelName: 'Bank Alerts' });
    mailbox = [{ id: 'old', labelIds: ['Label_1'], subject: 'Old alert', html: '<p>BDT 10</p>' }];

    await gmail.sync(userId);

    expect(request).not.toHaveBeenCalled();
    expect(connections.get(userId)?.syncedAt).toEqual(expect.any(Number));
    expect(await pending.list(userId)).toEqual([]);
  });

  it('does not touch the network for a user who never connected', async () => {
    await gmail.sync(userId);

    expect(auth.getAccessToken).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('routes new mail to vaults by label and subject, once per message', async () => {
    await connectAndBaseline();
    await watchers.upsert(userId, catchAllVault.id, { gmailLabelId: 'Label_1', guidanceHint: 'groceries' });
    await watchers.upsert(userId, debitVault.id, { gmailLabelId: 'Label_1', subjectFilter: 'debit', guidanceHint: '  ' });
    mailbox = [
      { id: 'm-debit', labelIds: ['Label_1'], subject: 'Card DEBIT Alert', html: '<p>BDT 450</p>' },
      { id: 'm-other', labelIds: ['Label_1'], subject: 'Statement ready', html: '<p>Hi</p>' },
      { id: 'm-unwatched', labelIds: ['Label_2'], subject: 'Debit alert', html: '<p>BDT 5</p>' },
    ];
    const syncedAt = connections.get(userId)?.syncedAt ?? 0;

    await gmail.sync(userId);
    await gmail.sync(userId);

    const listCall = request.mock.calls.map(([url]) => url).find((url) => url.includes('/messages?'));
    expect(new URL(listCall ?? '').searchParams.get('q')).toBe(`after:${Math.floor((syncedAt - 10 * 60 * 1000) / 1000)}`);

    const items = await pending.list(userId);
    expect(items.map(({ gmailMessageId, vaultName, subject, guidanceHint }) => ({ gmailMessageId, vaultName, subject, guidanceHint }))).toEqual([
      { gmailMessageId: 'm-debit', vaultName: 'Card', subject: 'Card DEBIT Alert', guidanceHint: null },
      { gmailMessageId: 'm-other', vaultName: 'Main', subject: 'Statement ready', guidanceHint: 'groceries' },
    ]);
  });

  it('never re-enqueues a dismissed email', async () => {
    await connectAndBaseline();
    await watchers.upsert(userId, catchAllVault.id, { gmailLabelId: 'Label_1' });
    mailbox = [{ id: 'm-dismiss', labelIds: ['Label_1'], subject: 'Promo', html: '<p>Sale</p>' }];
    await gmail.sync(userId);
    const item = (await pending.list(userId)).find((i) => i.gmailMessageId === 'm-dismiss');

    await pending.resolve(userId, item?.id ?? '');
    await gmail.sync(userId);

    expect((await pending.list(userId)).some((i) => i.gmailMessageId === 'm-dismiss')).toBe(false);
  });

  it('re-fetches and decodes the email, then parses it into a transaction in the item vault', async () => {
    await connectAndBaseline();
    await watchers.upsert(userId, debitVault.id, { gmailLabelId: 'Label_1', subjectFilter: 'purchase' });
    mailbox = [{ id: 'm-buy', labelIds: ['Label_1'], subject: 'Card purchase', html: '<style>p{}</style><p>Spent ৳ 450.00 at CAFÉ&nbsp;ONE</p>' }];
    await gmail.sync(userId);
    const item = (await pending.list(userId)).find((i) => i.gmailMessageId === 'm-buy');
    if (!item) throw new Error('expected a pending item');

    const email = await pending.getEmail(userId, item.id);
    expect(email).toEqual({ from: 'alerts@bank.example', subject: 'Card purchase', bodyText: 'Spent ৳ 450.00 at CAFÉ ONE', emailDate: 'Mon, 12 Oct 2026 09:30:00 +0600' });

    chat.mockResolvedValue(JSON.stringify({ matched: true, title: 'Cafe One', amount: 450, type: 'expense', tagIds: [foodTag.id, 'invented'], date: '2026-10-12' }));
    expect(await pending.parse(userId, item.id, email)).toMatchObject({ status: 'success' });

    const created = await AppDataSource.getRepository(Expense).findOneByOrFail({ userId, title: 'Cafe One' });
    expect(created).toMatchObject({ vaultId: debitVault.id, type: 'expense', date: '2026-10-12' });
    expect(Number(created.amount)).toBe(450);
    expect((await pending.list(userId)).some((i) => i.id === item.id)).toBe(false);
  });

  it("books on the watcher's transaction day of the month after the email", async () => {
    await connectAndBaseline();
    await watchers.upsert(userId, debitVault.id, { gmailLabelId: 'Label_1', subjectFilter: 'purchase', transactionDay: 10 });
    mailbox = [{ id: 'm-late', labelIds: ['Label_1'], subject: 'Card purchase', html: '<p>Spent 450 at CAFE TWO</p>' }];
    await gmail.sync(userId);
    const item = (await pending.list(userId)).find((i) => i.gmailMessageId === 'm-late');
    if (!item) throw new Error('expected a pending item');

    chat.mockResolvedValue(JSON.stringify({ matched: true, title: 'Cafe Two', amount: 450, type: 'expense', tagIds: [], date: '2026-10-12' }));
    expect(await pending.parse(userId, item.id, await pending.getEmail(userId, item.id))).toMatchObject({ status: 'success', parsed: { date: '2026-11-10' } });
  });

  it("tags by the watcher's keywords instead of the AI's pick", async () => {
    await connectAndBaseline();
    await watchers.upsert(userId, debitVault.id, {
      gmailLabelId: 'Label_1',
      subjectFilter: 'purchase',
      tagKeywords: [
        { tagId: foodTag.id, keywords: [' Cafe ', '', 'CAFE'] },
        { tagId: 'not-my-tag', keywords: ['cafe'] },
      ],
    });
    expect((await watchers.listForUser(userId)).find((w) => w.vaultId === debitVault.id)?.tagKeywords).toEqual([{ tagId: foodTag.id, keywords: ['cafe'] }]);

    mailbox = [{ id: 'm-kw', labelIds: ['Label_1'], subject: 'Card purchase', html: '<p>Spent 120 at BEAN CAFE</p>' }];
    await gmail.sync(userId);
    const item = (await pending.list(userId)).find((i) => i.gmailMessageId === 'm-kw');
    if (!item) throw new Error('expected a pending item');

    chat.mockResolvedValue(JSON.stringify({ matched: true, title: 'Bean Cafe', amount: 120, type: 'expense', tagIds: [], date: '2026-10-12' }));
    expect(await pending.parse(userId, item.id, await pending.getEmail(userId, item.id))).toMatchObject({ status: 'success', parsed: { tagIds: [foodTag.id] } });
    expect(JSON.parse(chat.mock.calls[0][0].messages[1].content as string).availableTags).toEqual([]);
  });

  it('keeps the item when the AI says the email is not a transaction', async () => {
    await connectAndBaseline();
    await watchers.upsert(userId, catchAllVault.id, { gmailLabelId: 'Label_1' });
    mailbox = [{ id: 'm-otp', labelIds: ['Label_1'], subject: 'Your OTP', html: '<p>123456</p>' }];
    await gmail.sync(userId);
    const item = (await pending.list(userId)).find((i) => i.gmailMessageId === 'm-otp');
    if (!item) throw new Error('expected a pending item');
    chat.mockResolvedValue(JSON.stringify({ matched: false, title: '', amount: 0, type: 'expense', tagIds: [], date: '' }));

    expect(await pending.parse(userId, item.id, await pending.getEmail(userId, item.id))).toEqual({ status: 'unmatched' });
    expect((await pending.list(userId)).some((i) => i.id === item.id)).toBe(true);
  });

  it('retries once with a fresh token when Gmail answers 401', async () => {
    await gmail.connect(userId);
    auth.getAccessToken.mockResolvedValueOnce('stale').mockResolvedValueOnce('fresh');
    request.mockResolvedValueOnce(json({}, 401));

    expect(await gmail.listLabels(userId)).toEqual([{ id: 'Label_1', name: 'Bank Alerts' }]);
    expect(auth.clearAccessToken).toHaveBeenCalledWith('stale');
    expect(request.mock.calls[1][1]).toEqual({ headers: { Authorization: 'Bearer fresh' } });
  });

  it('flags the connection for reconnect when Google stops issuing tokens, and stops syncing', async () => {
    await connectAndBaseline();
    await watchers.upsert(userId, catchAllVault.id, { gmailLabelId: 'Label_1' });
    auth.getAccessToken.mockResolvedValue(null);

    await expect(gmail.sync(userId)).rejects.toMatchObject({ constructor: AppError, statusCode: 401 });
    expect(await gmail.getStatus(userId)).toMatchObject({ connected: false, reconnectRequired: true, googleEmail: 'ada@gmail.com' });

    auth.getAccessToken.mockClear();
    await gmail.sync(userId);
    expect(auth.getAccessToken).not.toHaveBeenCalled();

    expect(await gmail.connect(userId)).toMatchObject({ connected: true, reconnectRequired: false });
  });

  it('rejects a watcher on a vault the user does not own', async () => {
    await expect(watchers.upsert(userId, 'missing-vault', { gmailLabelId: 'Label_1' })).rejects.toMatchObject({ constructor: AppError, statusCode: 404 });
  });
});
