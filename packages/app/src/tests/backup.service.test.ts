import { DataSource } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { initDatabase } from '../db/init';
import { AppError } from '../errors/app-error';
import { InitialSchema1791849600000 } from '../migrations/1791849600000-InitialSchema';
import { authService, backupService, tagsService, transactionsService, vaultsService } from '../services';

// The app's tsconfig has no Node types, so the few fs/os calls are typed by hand.
const { mkdtempSync, rmSync } = jest.requireActual<{ mkdtempSync(prefix: string): string; rmSync(path: string, options: { recursive: boolean; force: boolean }): void }>('fs');
const { tmpdir } = jest.requireActual<{ tmpdir(): string }>('os');

// Same native-module stand-ins as offline-flows.test.ts.
jest.mock('../lib/ai/credential-store', () => ({ aiCredentialStore: {} }));
// MonthlyRecapService's default notifier loads expo-notifications.
jest.mock('../lib/notifications/recap-notifier', () => ({ recapNotifier: {} }));
// DebtsService's default notifier loads expo-notifications too; these flows only need it to resolve.
jest.mock('../lib/notifications/debt-notifier', () => ({ debtNotifier: { schedule: async () => undefined, cancel: async () => undefined } }));
jest.mock('../lib/auth/session-store', () => {
  let stored: string | null = null;
  return { sessionStore: { get: async () => stored, set: async (id: string) => void (stored = id), clear: async () => void (stored = null) } };
});
jest.mock('../lib/gmail/google-auth', () => ({ googleAuth: {} }));
jest.mock('../lib/gmail/connection-store', () => ({ gmailConnectionStore: {} }));

// Real SQL on both sides: the device DB is in memory, the backup is a file built from the initial schema,
// so it also checks that a backup without the newer Gmail tables still restores.
describe('BackupService.restore', () => {
  let dir: string;
  let backupPath: string;
  let userId: string;

  beforeAll(async () => {
    dir = mkdtempSync(`${tmpdir()}/pp-backup-`);
    backupPath = `${dir}/pocket pixel.bak`;

    const backup = new DataSource({ type: 'better-sqlite3', database: backupPath, migrations: [InitialSchema1791849600000], migrationsRun: true });
    await backup.initialize();
    await backup.query(`INSERT INTO users (id, name, email) VALUES ('srv-ada', 'Ada', 'ada@example.com'), ('srv-bob', 'Bob', 'bob@example.com')`);
    await backup.query(`INSERT INTO vaults (id, userId, name, description, isDefault) VALUES ('v-ada', 'srv-ada', 'Wallet', '', 1), ('v-bob', 'srv-bob', 'Bob Wallet', '', 1)`);
    await backup.query(`INSERT INTO tags (id, userId, name) VALUES ('t-food', 'srv-ada', 'Food')`);
    await backup.query(
      `INSERT INTO expenses (id, userId, title, amount, type, date, vaultId) VALUES ('e-1', 'srv-ada', 'Lunch', 12.5, 'expense', '2026-10-01', 'v-ada'), ('e-bob', 'srv-bob', 'Bob lunch', 9, 'expense', '2026-10-01', 'v-bob')`,
    );
    await backup.query(`INSERT INTO transaction_tags (transactionId, tagId) VALUES ('e-1', 't-food')`);
    await backup.destroy();

    await initDatabase();
    userId = await authService.signUp({ name: 'Ada', email: 'Ada@Example.com', password: 's3cret-pass' });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
    rmSync(dir, { recursive: true, force: true });
  });

  it("replaces the signed-in user's data with the matching backup user's rows", async () => {
    const counts = await backupService.restore(userId, `file://${encodeURI(backupPath)}`);

    expect(counts).toMatchObject({ vaults: 1, tags: 1, expenses: 1, transaction_tags: 1, vault_gmail_watchers: 0 });
    // The local Main Stash is gone, replaced by the backup's vault, re-owned by the local user.
    expect((await vaultsService.list(userId)).map((v) => v.name)).toEqual(['Wallet']);
    expect((await tagsService.list(userId)).map((t) => t.name)).toEqual(['Food']);
    const transactions = await transactionsService.list(userId, { month: 10, year: 2026 });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({ title: 'Lunch', amount: 12.5, userId });
  });

  it('can be restored twice without key conflicts', async () => {
    await expect(backupService.restore(userId, backupPath)).resolves.toMatchObject({ expenses: 1 });
  });

  it('exports the device DB to a file that restores back', async () => {
    const exportUri = `file://${encodeURI(`${dir}/pocket pixel export.db`)}`;
    await backupService.export(exportUri);

    await expect(backupService.restore(userId, exportUri)).resolves.toMatchObject({ vaults: 1, tags: 1, expenses: 1, transaction_tags: 1 });
  });

  it('rejects a backup with no account for the signed-in email', async () => {
    const otherId = await authService.signUp({ name: 'Cy', email: 'cy@example.com', password: 's3cret-pass' });
    await expect(backupService.restore(otherId, backupPath)).rejects.toThrow(AppError);
  });
});
