import { SetVaultGmailWatcherInput, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { VaultGmailWatchersRepository } from '../repositories/vault-gmail-watchers.repository';
import { TagsRepository } from '../repositories/tags.repository';
import { VaultsRepository } from '../repositories/vaults.repository';
import { tagsRepository, vaultGmailWatchersRepository, vaultsRepository } from '../repositories';
import { logger } from '.';

/**
 * Business logic for per-vault Gmail watchers. Port of
 * packages/api/src/services/vault-watchers.service.ts without the mailbox
 * watch re-sync: the app has no push watch, `GmailService.sync` reads the
 * watcher rows each time it polls.
 */
export class VaultWatchersService {
  constructor(
    private readonly watchers: VaultGmailWatchersRepository = vaultGmailWatchersRepository,
    private readonly vaults: VaultsRepository = vaultsRepository,
    private readonly tags: TagsRepository = tagsRepository,
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
      transactionDay: watcher.transactionDay,
      tagKeywords: watcher.tagKeywords,
    }));
  }

  /** Creates or updates the watcher for a vault. Enforces that the vault belongs to the user. */
  async upsert(userId: string, vaultId: string, input: SetVaultGmailWatcherInput): Promise<VaultGmailWatcherDto> {
    const vault = await this.vaults.findOneForUser(userId, vaultId);
    if (!vault) throw new AppError('Vault not found', 404);
    if (input.transactionDay !== undefined && !(Number.isInteger(input.transactionDay) && input.transactionDay >= 1 && input.transactionDay <= 31)) {
      throw new AppError('Transaction day must be a whole number from 1 to 31', 400);
    }

    const [existing, tags] = await Promise.all([this.watchers.findByVault(userId, vaultId), this.tags.findManyForUser(userId)]);
    const tagIds = new Set(tags.map((tag) => tag.id));
    const watcher = existing ?? this.watchers.createEntity({ userId, vaultId });
    // Revive a previously soft-deleted watcher: the (userId, vaultId) unique index
    // still counts deleted rows, so re-adding a removed watcher must reuse and
    // un-delete the existing row instead of inserting a duplicate.
    watcher.deletedAt = null as unknown as Date;
    watcher.gmailLabelId = input.gmailLabelId;
    watcher.gmailLabelName = input.gmailLabelName ?? null;
    watcher.subjectFilter = input.subjectFilter?.trim() || null;
    watcher.guidanceHint = input.guidanceHint?.trim() || null;
    watcher.transactionDay = input.transactionDay ?? null;
    // Store only tags the user owns, with lowercased keywords, so matching at parse time is a plain substring check.
    const tagKeywords = (input.tagKeywords ?? [])
      .filter((rule) => tagIds.has(rule.tagId))
      .map((rule) => ({ tagId: rule.tagId, keywords: [...new Set(rule.keywords.map((keyword) => keyword.trim().toLowerCase()).filter(Boolean))] }))
      .filter((rule) => rule.keywords.length > 0);
    watcher.tagKeywords = tagKeywords.length > 0 ? tagKeywords : null;

    await this.watchers.save(watcher);
    logger.info('Saved vault Gmail watcher', { userId, vaultId, gmailLabelId: input.gmailLabelId });

    return {
      vaultId,
      vaultName: vault.name,
      gmailLabelId: watcher.gmailLabelId,
      gmailLabelName: watcher.gmailLabelName,
      subjectFilter: watcher.subjectFilter,
      guidanceHint: watcher.guidanceHint,
      transactionDay: watcher.transactionDay,
      tagKeywords: watcher.tagKeywords,
    };
  }

  /** Soft-deletes a vault's watcher, scoped to its owning user. */
  async remove(userId: string, vaultId: string): Promise<void> {
    await this.watchers.softDelete(userId, vaultId);
    logger.info('Removed vault Gmail watcher', { userId, vaultId });
  }
}
