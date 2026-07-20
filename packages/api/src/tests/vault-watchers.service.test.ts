import type { VaultGmailWatchersRepository } from '../repositories/vault-gmail-watchers.repository';
import type { VaultsRepository } from '../repositories/vaults.repository';
import type { GmailScriptRunnerService } from '../services/gmail-script-runner.service';
import type { GmailService } from '../services/gmail.service';
import type { VaultGmailWatcher } from '../entities/VaultGmailWatcher.entity';
import type { Vault } from '../entities/Vault.entity';
import { VaultWatchersService } from '../services/vault-watchers.service';
import { AppError } from '../errors/app-error';

jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  gmailScriptRunnerService: {},
  gmailService: {},
}));

type WatchersMock = jest.Mocked<Pick<VaultGmailWatchersRepository, 'findManyForUser' | 'findByVault' | 'createEntity' | 'save' | 'softDelete'>>;
type VaultsMock = jest.Mocked<Pick<VaultsRepository, 'findManyForUser' | 'findOneForUser'>>;
type RunnerMock = jest.Mocked<Pick<GmailScriptRunnerService, 'run'>>;
type GmailMock = jest.Mocked<Pick<GmailService, 'resyncWatch'>>;

const vault = (overrides: Partial<Vault> = {}): Vault => ({ id: 'v1', userId: 'user-1', name: 'MAIN STASH', ...overrides }) as Vault;
const watcher = (overrides: Partial<VaultGmailWatcher> = {}): VaultGmailWatcher =>
  ({ userId: 'user-1', vaultId: 'v1', gmailLabelId: 'L1', gmailLabelName: 'BANK/EBL', subjectFilter: null, parseScript: 'function parse(e){}', ...overrides }) as VaultGmailWatcher;

describe('VaultWatchersService', () => {
  let watchers: WatchersMock;
  let vaults: VaultsMock;
  let runner: RunnerMock;
  let gmail: GmailMock;
  let service: VaultWatchersService;

  beforeEach(() => {
    watchers = {
      findManyForUser: jest.fn(),
      findByVault: jest.fn(),
      createEntity: jest.fn((data) => ({ ...data }) as VaultGmailWatcher),
      save: jest.fn((w) => Promise.resolve(w as VaultGmailWatcher)),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    vaults = { findManyForUser: jest.fn(), findOneForUser: jest.fn() };
    runner = { run: jest.fn() };
    gmail = { resyncWatch: jest.fn().mockResolvedValue(undefined) };
    service = new VaultWatchersService(
      watchers as unknown as VaultGmailWatchersRepository,
      vaults as unknown as VaultsRepository,
      runner as unknown as GmailScriptRunnerService,
      gmail as unknown as GmailService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('listForUser', () => {
    it('joins each watcher to its vault name', async () => {
      watchers.findManyForUser.mockResolvedValue([watcher({ vaultId: 'v1' }), watcher({ vaultId: 'v2', gmailLabelId: 'L2' })]);
      vaults.findManyForUser.mockResolvedValue([vault({ id: 'v1', name: 'MAIN STASH' }), vault({ id: 'v2', name: 'SAVINGS' })]);

      const result = await service.listForUser('user-1');

      expect(result).toEqual([
        { vaultId: 'v1', vaultName: 'MAIN STASH', gmailLabelId: 'L1', gmailLabelName: 'BANK/EBL', subjectFilter: null, parseScript: 'function parse(e){}', tagIds: [] },
        { vaultId: 'v2', vaultName: 'SAVINGS', gmailLabelId: 'L2', gmailLabelName: 'BANK/EBL', subjectFilter: null, parseScript: 'function parse(e){}', tagIds: [] },
      ]);
    });
  });

  describe('upsert', () => {
    it('creates a new watcher, re-syncs the watch, and returns the DTO', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      watchers.findByVault.mockResolvedValue(null);

      const result = await service.upsert('user-1', 'v1', { gmailLabelId: 'L1', gmailLabelName: 'BANK/EBL', subjectFilter: 'Debit Alert', parseScript: 'function parse(e){ return null; }' });

      expect(watchers.createEntity).toHaveBeenCalledWith({ userId: 'user-1', vaultId: 'v1' });
      expect(watchers.save).toHaveBeenCalledWith(
        expect.objectContaining({ gmailLabelId: 'L1', gmailLabelName: 'BANK/EBL', subjectFilter: 'Debit Alert', parseScript: 'function parse(e){ return null; }' }),
      );
      expect(gmail.resyncWatch).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        vaultId: 'v1',
        vaultName: 'MAIN STASH',
        gmailLabelId: 'L1',
        gmailLabelName: 'BANK/EBL',
        subjectFilter: 'Debit Alert',
        parseScript: 'function parse(e){ return null; }',
        tagIds: [],
      });
    });

    it('persists and returns the selected tag ids', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      watchers.findByVault.mockResolvedValue(null);

      const result = await service.upsert('user-1', 'v1', { gmailLabelId: 'L1', parseScript: 's', tagIds: ['t1', 't2'] });

      expect(watchers.save).toHaveBeenCalledWith(expect.objectContaining({ tagIds: ['t1', 't2'] }));
      expect(result.tagIds).toEqual(['t1', 't2']);
    });

    it('defaults tag ids to an empty array when omitted', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      watchers.findByVault.mockResolvedValue(null);

      await service.upsert('user-1', 'v1', { gmailLabelId: 'L1', parseScript: 's' });

      expect(watchers.save).toHaveBeenCalledWith(expect.objectContaining({ tagIds: [] }));
    });

    it('normalizes a blank or omitted subject filter to null', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      watchers.findByVault.mockResolvedValue(null);

      await service.upsert('user-1', 'v1', { gmailLabelId: 'L1', subjectFilter: '   ', parseScript: 's' });

      expect(watchers.save).toHaveBeenCalledWith(expect.objectContaining({ subjectFilter: null }));
    });

    it('updates the existing watcher in place when one already exists for the vault', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      const existing = watcher({ gmailLabelId: 'OLD', parseScript: 'old' });
      watchers.findByVault.mockResolvedValue(existing);

      await service.upsert('user-1', 'v1', { gmailLabelId: 'L1', parseScript: 'new' });

      expect(watchers.createEntity).not.toHaveBeenCalled();
      expect(existing.gmailLabelId).toBe('L1');
      expect(existing.parseScript).toBe('new');
      expect(existing.gmailLabelName).toBeNull();
      expect(watchers.save).toHaveBeenCalledWith(existing);
    });

    it('throws 404 when the vault does not belong to the user', async () => {
      vaults.findOneForUser.mockResolvedValue(null);

      await expect(service.upsert('user-1', 'nope', { gmailLabelId: 'L1', parseScript: 's' })).rejects.toThrow(AppError);
      expect(gmail.resyncWatch).not.toHaveBeenCalled();
    });

    it('allows the same label on a different vault (shared label, routed by subject)', async () => {
      vaults.findOneForUser.mockResolvedValue(vault({ id: 'v2' }));
      watchers.findByVault.mockResolvedValue(null);

      await expect(service.upsert('user-1', 'v2', { gmailLabelId: 'L1', subjectFilter: 'Savings', parseScript: 's' })).resolves.toBeDefined();
      expect(watchers.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft-deletes the vault watcher and re-syncs the watch', async () => {
      await service.remove('user-1', 'v1');

      expect(watchers.softDelete).toHaveBeenCalledWith('user-1', 'v1');
      expect(gmail.resyncWatch).toHaveBeenCalledWith('user-1');
    });
  });

  describe('testScript', () => {
    const input = { script: 's', sample: { from: 'a', subject: 'b', bodyText: 'c' } };

    it('reports ok with the parsed result', () => {
      runner.run.mockReturnValue({ title: 't', amount: 5, type: 'expense', date: '2026-07-12' });

      expect(service.testScript(input)).toEqual({ ok: true, result: { title: 't', amount: 5, type: 'expense', date: '2026-07-12' } });
    });

    it('reports not-ok when the script returns null (skip/throw/timeout)', () => {
      runner.run.mockReturnValue(null);

      expect(service.testScript(input)).toEqual({ ok: false, error: expect.stringContaining('did not return a transaction') });
    });

    it('reports not-ok with the AppError message on an invalid returned shape', () => {
      runner.run.mockImplementation(() => {
        throw new AppError('Parsed "amount" must be a number greater than 0', 400);
      });

      expect(service.testScript(input)).toEqual({ ok: false, error: 'Parsed "amount" must be a number greater than 0' });
    });
  });
});
