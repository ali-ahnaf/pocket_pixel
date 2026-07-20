import type { VaultGmailWatchersRepository } from '../repositories/vault-gmail-watchers.repository';
import type { VaultsRepository } from '../repositories/vaults.repository';
import type { GmailService } from '../services/gmail.service';
import type { VaultGmailWatcher } from '../entities/VaultGmailWatcher.entity';
import type { Vault } from '../entities/Vault.entity';
import { VaultWatchersService } from '../services/vault-watchers.service';
import { AppError } from '../errors/app-error';

jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  gmailService: {},
}));

type WatchersMock = jest.Mocked<Pick<VaultGmailWatchersRepository, 'findManyForUser' | 'findByVault' | 'createEntity' | 'save' | 'softDelete'>>;
type VaultsMock = jest.Mocked<Pick<VaultsRepository, 'findManyForUser' | 'findOneForUser'>>;
type GmailMock = jest.Mocked<Pick<GmailService, 'resyncWatch'>>;

const vault = (overrides: Partial<Vault> = {}): Vault => ({ id: 'v1', userId: 'user-1', name: 'MAIN STASH', ...overrides }) as Vault;
const watcher = (overrides: Partial<VaultGmailWatcher> = {}): VaultGmailWatcher =>
  ({ userId: 'user-1', vaultId: 'v1', gmailLabelId: 'L1', gmailLabelName: 'BANK/EBL', subjectFilter: null, guidanceHint: null, ...overrides }) as VaultGmailWatcher;

describe('VaultWatchersService', () => {
  let watchers: WatchersMock;
  let vaults: VaultsMock;
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
    gmail = { resyncWatch: jest.fn().mockResolvedValue(undefined) };
    service = new VaultWatchersService(watchers as unknown as VaultGmailWatchersRepository, vaults as unknown as VaultsRepository, gmail as unknown as GmailService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listForUser', () => {
    it('joins each watcher to its vault name', async () => {
      watchers.findManyForUser.mockResolvedValue([watcher({ vaultId: 'v1' }), watcher({ vaultId: 'v2', gmailLabelId: 'L2' })]);
      vaults.findManyForUser.mockResolvedValue([vault({ id: 'v1', name: 'MAIN STASH' }), vault({ id: 'v2', name: 'SAVINGS' })]);

      const result = await service.listForUser('user-1');

      expect(result).toEqual([
        { vaultId: 'v1', vaultName: 'MAIN STASH', gmailLabelId: 'L1', gmailLabelName: 'BANK/EBL', subjectFilter: null, guidanceHint: null },
        { vaultId: 'v2', vaultName: 'SAVINGS', gmailLabelId: 'L2', gmailLabelName: 'BANK/EBL', subjectFilter: null, guidanceHint: null },
      ]);
    });
  });

  describe('upsert', () => {
    it('creates a new watcher, re-syncs the watch, and returns the DTO', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      watchers.findByVault.mockResolvedValue(null);

      const result = await service.upsert('user-1', 'v1', { gmailLabelId: 'L1', gmailLabelName: 'BANK/EBL', subjectFilter: 'Debit Alert', guidanceHint: 'these are always groceries' });

      expect(watchers.createEntity).toHaveBeenCalledWith({ userId: 'user-1', vaultId: 'v1' });
      expect(watchers.save).toHaveBeenCalledWith(expect.objectContaining({ gmailLabelId: 'L1', gmailLabelName: 'BANK/EBL', subjectFilter: 'Debit Alert', guidanceHint: 'these are always groceries' }));
      expect(gmail.resyncWatch).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        vaultId: 'v1',
        vaultName: 'MAIN STASH',
        gmailLabelId: 'L1',
        gmailLabelName: 'BANK/EBL',
        subjectFilter: 'Debit Alert',
        guidanceHint: 'these are always groceries',
      });
    });

    it('defaults guidance hint to null when omitted', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      watchers.findByVault.mockResolvedValue(null);

      const result = await service.upsert('user-1', 'v1', { gmailLabelId: 'L1' });

      expect(watchers.save).toHaveBeenCalledWith(expect.objectContaining({ guidanceHint: null }));
      expect(result.guidanceHint).toBeNull();
    });

    it('normalizes a blank guidance hint to null', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      watchers.findByVault.mockResolvedValue(null);

      await service.upsert('user-1', 'v1', { gmailLabelId: 'L1', guidanceHint: '   ' });

      expect(watchers.save).toHaveBeenCalledWith(expect.objectContaining({ guidanceHint: null }));
    });

    it('normalizes a blank or omitted subject filter to null', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      watchers.findByVault.mockResolvedValue(null);

      await service.upsert('user-1', 'v1', { gmailLabelId: 'L1', subjectFilter: '   ' });

      expect(watchers.save).toHaveBeenCalledWith(expect.objectContaining({ subjectFilter: null }));
    });

    it('updates the existing watcher in place when one already exists for the vault', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      const existing = watcher({ gmailLabelId: 'OLD', guidanceHint: 'old hint' });
      watchers.findByVault.mockResolvedValue(existing);

      await service.upsert('user-1', 'v1', { gmailLabelId: 'L1', guidanceHint: 'new hint' });

      expect(watchers.createEntity).not.toHaveBeenCalled();
      expect(existing.gmailLabelId).toBe('L1');
      expect(existing.guidanceHint).toBe('new hint');
      expect(existing.gmailLabelName).toBeNull();
      expect(watchers.save).toHaveBeenCalledWith(existing);
    });

    it('revives a soft-deleted watcher instead of inserting a duplicate', async () => {
      vaults.findOneForUser.mockResolvedValue(vault());
      const softDeleted = watcher({ gmailLabelId: 'OLD', deletedAt: new Date() });
      watchers.findByVault.mockResolvedValue(softDeleted);

      await service.upsert('user-1', 'v1', { gmailLabelId: 'L1' });

      expect(watchers.createEntity).not.toHaveBeenCalled();
      expect(softDeleted.deletedAt).toBeNull();
      expect(softDeleted.gmailLabelId).toBe('L1');
      expect(watchers.save).toHaveBeenCalledWith(softDeleted);
    });

    it('throws 404 when the vault does not belong to the user', async () => {
      vaults.findOneForUser.mockResolvedValue(null);

      await expect(service.upsert('user-1', 'nope', { gmailLabelId: 'L1' })).rejects.toThrow(AppError);
      expect(gmail.resyncWatch).not.toHaveBeenCalled();
    });

    it('allows the same label on a different vault (shared label, routed by subject)', async () => {
      vaults.findOneForUser.mockResolvedValue(vault({ id: 'v2' }));
      watchers.findByVault.mockResolvedValue(null);

      await expect(service.upsert('user-1', 'v2', { gmailLabelId: 'L1', subjectFilter: 'Savings' })).resolves.toBeDefined();
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
});
