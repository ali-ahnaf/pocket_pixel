import { SetVaultGmailWatcherInput, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { VaultGmailWatchersRepository } from '../repositories/vault-gmail-watchers.repository';
import { VaultsRepository } from '../repositories/vaults.repository';
import { vaultGmailWatchersRepository, vaultsRepository } from '../repositories';
import { GmailService } from './gmail.service';
import { gmailService, logger } from '.';

/**
 * Business logic for per-vault Gmail watchers. Each vault owns at most one
 * watcher (a Gmail label + optional subject filter + optional AI guidance hint);
 * a label may be shared across vaults and routed by subject at match time.
 * Any create/update/delete re-syncs the user's single mailbox watch so the
 * watched-label union stays in step with the watcher rows. Repositories and the
 * collaborating services are injected (defaulting to the shared singletons) so
 * the service is unit-testable with mocks.
 */
export class VaultWatchersService {
  constructor(
    private readonly watchers: VaultGmailWatchersRepository = vaultGmailWatchersRepository,
    private readonly vaults: VaultsRepository = vaultsRepository,
    private readonly gmail: GmailService = gmailService,
  ) {}

  /** Lists the user's watchers, joined to their vault names for the settings UI. */
  async listForUser(userId: string): Promise<VaultGmailWatcherDto[]> {
    const [watchers, vaults] = await Promise.all([this.watchers.findManyForUser(userId), this.vaults.findManyForUser(userId)]);
    const vaultNameById = new Map(vaults.map((vault) => [vault.id, vault.name]));

    return watchers.map((watcher) => ({
      vaultId: watcher.vaultId,
      vaultName: vaultNameById.get(watcher.vaultId) ?? '',
      gmailLabelId: watcher.gmailLabelId,
      gmailLabelName: watcher.gmailLabelName,
      subjectFilter: watcher.subjectFilter,
      guidanceHint: watcher.guidanceHint,
    }));
  }

  /**
   * Creates or updates the watcher for a vault, then re-syncs the mailbox watch.
   * Enforces that the vault belongs to the user. A label may be shared across
   * vaults (routed by `subjectFilter` at match time), so no cross-vault label
   * guard here.
   */
  async upsert(userId: string, vaultId: string, input: SetVaultGmailWatcherInput): Promise<VaultGmailWatcherDto> {
    const vault = await this.vaults.findOneForUser(userId, vaultId);
    if (!vault) throw new AppError('Vault not found', 404);

    const existing = await this.watchers.findByVault(userId, vaultId);
    const watcher = existing ?? this.watchers.createEntity({ userId, vaultId });
    // Revive a previously soft-deleted watcher: the (userId, vaultId) unique index
    // still counts deleted rows, so re-adding a removed watcher must reuse and
    // un-delete the existing row instead of inserting a duplicate.
    watcher.deletedAt = null as unknown as Date;
    watcher.gmailLabelId = input.gmailLabelId;
    watcher.gmailLabelName = input.gmailLabelName ?? null;
    watcher.subjectFilter = input.subjectFilter?.trim() || null;
    watcher.guidanceHint = input.guidanceHint?.trim() || null;

    await this.watchers.save(watcher);
    await this.gmail.resyncWatch(userId);
    logger.info('Saved vault Gmail watcher', { userId, vaultId, gmailLabelId: input.gmailLabelId });

    return {
      vaultId,
      vaultName: vault.name,
      gmailLabelId: watcher.gmailLabelId,
      gmailLabelName: watcher.gmailLabelName,
      subjectFilter: watcher.subjectFilter,
      guidanceHint: watcher.guidanceHint,
    };
  }

  /** Soft-deletes a vault's watcher, then re-syncs the mailbox watch. */
  async remove(userId: string, vaultId: string): Promise<void> {
    await this.watchers.softDelete(userId, vaultId);
    await this.gmail.resyncWatch(userId);
    logger.info('Removed vault Gmail watcher', { userId, vaultId });
  }
}
