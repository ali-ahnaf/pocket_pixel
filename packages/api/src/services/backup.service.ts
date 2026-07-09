import { BackupDebtDto, BackupRecurringSkipDto, BackupTransactionDto, ExportDataResponse, ImportDataRequest, RecurringDto, TransactionDto } from '@expense-tracker/shared';
import { EntityManager, In, IsNull, Not } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Debt } from '../entities/Debt.entity';
import { Expense } from '../entities/Expense.entity';
import { RecurringOccurrenceSkip } from '../entities/RecurringOccurrenceSkip.entity';
import { Tag } from '../entities/Tag.entity';
import { TransactionTag } from '../entities/TransactionTag.entity';
import { User } from '../entities/User.entity';
import { UserPreference } from '../entities/UserPreference.entity';
import { Vault } from '../entities/Vault.entity';
import { AppError } from '../errors/app-error';
import { debtsService, logger, preferencesService, tagsService, usersService, vaultsService } from '../services';
import { DebtsService } from './debts.service';
import { PreferencesService } from './preferences.service';
import { TagsService } from './tags.service';
import { UsersService } from './users.service';
import { VaultsService } from './vaults.service';

type ImportedTagLink = Pick<TransactionTag, 'transactionId' | 'tagId'>;

export class BackupService {
  private readonly appVersion = '1.0';

  constructor(
    private readonly users: UsersService = usersService,
    private readonly debts: DebtsService = debtsService,
    private readonly vaults: VaultsService = vaultsService,
    private readonly preference: PreferencesService = preferencesService,
    private readonly tags: TagsService = tagsService,
  ) {}

  async exportData(userId: string): Promise<ExportDataResponse> {
    const user = await this.users.getById(userId);
    const debts = await this.listDebtsForBackup(userId);
    const vaults = await this.vaults.list(userId);
    const transactions = await this.listTransactionsForBackup(userId);
    const recurrings = await this.listRecurringsForBackup(userId);
    const recurringSkips = await this.listRecurringSkipsForBackup(userId);
    const preference = await this.preference.getOrCreate(userId);
    const tags = await this.tags.list(userId);

    return {
      appVersion: this.appVersion,
      exportedAt: new Date().toISOString(),
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          disableAiPrompt: user.disableAiPrompt,
        },
        debts,
        vaults,
        transactions,
        recurrings,
        recurringSkips,
        preference,
        tags,
      },
    };
  }

  async importData(userId: string, dto: ImportDataRequest): Promise<void> {
    this.validateImportPayload(userId, dto);
    await this.users.getById(userId);

    logger.info('Starting backup import', {
      userId,
      debts: dto.data.debts.length,
      recurrings: dto.data.recurrings.length,
      recurringSkips: dto.data.recurringSkips.length,
      tags: dto.data.tags.length,
      transactions: dto.data.transactions.length,
      vaults: dto.data.vaults.length,
    });

    await AppDataSource.transaction(async (entityManager: EntityManager) => {
      const existingExpenseIds = await this.listExistingExpenseIds(entityManager, userId);

      await entityManager.update(
        User,
        { id: userId },
        {
          name: dto.data.user.name,
          email: dto.data.user.email,
          avatar: dto.data.user.avatar,
          disableAiPrompt: dto.data.user.disableAiPrompt ?? false,
        },
      );

      await this.resetBackupData(entityManager, userId, existingExpenseIds);
      logger.debug('Reset existing backup data before restore', {
        userId,
        existingExpenses: existingExpenseIds.length,
      });

      await this.upsertTags(entityManager, userId, dto);
      await this.upsertVaults(entityManager, userId, dto);
      await this.upsertTransactions(entityManager, userId, dto);
      await this.upsertRecurrings(entityManager, userId, dto);
      await this.upsertDebts(entityManager, userId, dto);
      await this.upsertPreference(entityManager, userId, dto);
      await this.replaceTransactionTags(entityManager, dto);
      await this.replaceRecurringSkips(entityManager, userId, dto);
    });

    logger.info('Completed backup import', { userId });
  }

  private validateImportPayload(userId: string, dto: ImportDataRequest): void {
    if (dto.appVersion !== this.appVersion) {
      throw new AppError(`Unsupported backup version: ${dto.appVersion}`, 400);
    }

    if (dto.data.user.id !== userId) {
      throw new AppError('Backup user does not match the requested user', 400);
    }

    this.ensureUniqueIds(
      'tags',
      dto.data.tags.map((tag) => tag.id),
    );
    this.ensureUniqueIds(
      'vaults',
      dto.data.vaults.map((vault) => vault.id),
    );
    this.ensureUniqueIds(
      'transactions',
      dto.data.transactions.map((transaction) => transaction.id),
    );
    this.ensureUniqueIds(
      'recurrings',
      dto.data.recurrings.map((recurring) => recurring.id),
    );
    this.ensureUniqueIds(
      'debts',
      dto.data.debts.map((debt) => debt.id),
    );
    this.ensureUniqueIds(
      'recurring skips',
      dto.data.recurringSkips.map((skip) => `${skip.recurringId}:${skip.date}`),
    );

    this.ensureOwnedByUser(
      'tags',
      userId,
      dto.data.tags.map((tag) => tag.userId),
    );
    this.ensureOwnedByUser(
      'vaults',
      userId,
      dto.data.vaults.map((vault) => vault.userId),
    );
    this.ensureOwnedByUser(
      'transactions',
      userId,
      dto.data.transactions.map((transaction) => transaction.userId),
    );
    this.ensureOwnedByUser(
      'recurrings',
      userId,
      dto.data.recurrings.map((recurring) => recurring.userId),
    );
    this.ensureOwnedByUser(
      'debts',
      userId,
      dto.data.debts.map((debt) => debt.userId),
    );
    this.ensureOwnedByUser(
      'recurring skips',
      userId,
      dto.data.recurringSkips.map((skip) => skip.userId),
    );

    const tagIds = new Set(dto.data.tags.map((tag) => tag.id));
    const vaultIds = new Set(dto.data.vaults.map((vault) => vault.id));
    const recurringIds = new Set(dto.data.recurrings.map((recurring) => recurring.id));

    for (const transaction of dto.data.transactions) {
      this.ensureVaultExists('transactions', transaction.id, transaction.vaultId, vaultIds);
      if (transaction.sourceRecurringId && !recurringIds.has(transaction.sourceRecurringId)) {
        throw new AppError(`Transaction ${transaction.id} references an unknown recurring source`, 400);
      }
      for (const tag of transaction.tags) {
        if (!tagIds.has(tag.id)) {
          throw new AppError(`Transaction ${transaction.id} references an unknown tag`, 400);
        }
      }
    }

    for (const recurring of dto.data.recurrings) {
      this.ensureVaultExists('recurrings', recurring.id, recurring.vaultId, vaultIds);
      for (const tagId of this.normalizeTagIds(recurring.tagIds)) {
        if (!tagIds.has(tagId)) {
          throw new AppError(`Recurring ${recurring.id} references an unknown tag`, 400);
        }
      }
    }

    for (const skip of dto.data.recurringSkips) {
      if (!recurringIds.has(skip.recurringId)) {
        throw new AppError(`Recurring skip ${skip.recurringId}:${skip.date} references an unknown recurring`, 400);
      }
    }
  }

  private ensureUniqueIds(label: string, ids: string[]): void {
    if (new Set(ids).size !== ids.length) {
      throw new AppError(`Backup ${label} contains duplicate ids`, 400);
    }
  }

  private ensureOwnedByUser(label: string, userId: string, recordUserIds: string[]): void {
    if (recordUserIds.some((recordUserId) => recordUserId !== userId)) {
      throw new AppError(`Backup ${label} contains records for a different user`, 400);
    }
  }

  private ensureVaultExists(label: string, recordId: string, vaultId: string | null, vaultIds: Set<string>): void {
    if (vaultId && !vaultIds.has(vaultId)) {
      throw new AppError(`${label} ${recordId} references an unknown vault`, 400);
    }
  }

  private async listExistingExpenseIds(entityManager: EntityManager, userId: string): Promise<string[]> {
    const expenses = await entityManager.find(Expense, {
      select: { id: true },
      where: { userId },
      withDeleted: true,
    });

    return expenses.map((expense) => expense.id);
  }

  private async resetBackupData(entityManager: EntityManager, userId: string, existingExpenseIds: string[]): Promise<void> {
    if (existingExpenseIds.length > 0) {
      await entityManager.softDelete(TransactionTag, { transactionId: In(existingExpenseIds) });
    }

    await entityManager.softDelete(RecurringOccurrenceSkip, { userId });
    await entityManager.softDelete(Expense, { userId });
    await entityManager.softDelete(Debt, { userId });
    await entityManager.softDelete(Vault, { userId });
    await entityManager.softDelete(Tag, { userId });
    await entityManager.softDelete(UserPreference, { userId });
  }

  private async upsertTags(entityManager: EntityManager, userId: string, dto: ImportDataRequest): Promise<void> {
    if (dto.data.tags.length === 0) return;

    await entityManager.save(
      Tag,
      dto.data.tags.map((tag) =>
        Object.assign(new Tag(), {
          id: tag.id,
          userId,
          name: tag.name,
          icon: tag.icon ?? null,
          backgroundColor: tag.backgroundColor ?? null,
          deletedAt: null,
        }),
      ),
    );
  }

  private async upsertVaults(entityManager: EntityManager, userId: string, dto: ImportDataRequest): Promise<void> {
    if (dto.data.vaults.length === 0) return;

    await entityManager.save(
      Vault,
      dto.data.vaults.map((vault) =>
        Object.assign(new Vault(), {
          id: vault.id,
          userId,
          name: vault.name,
          description: vault.description,
          icon: vault.icon ?? null,
          backgroundColor: vault.backgroundColor ?? null,
          isDefault: vault.isDefault,
          monthlyBudget: vault.monthlyBudget ?? null,
          deletedAt: null,
        }),
      ),
    );
  }

  private async upsertTransactions(entityManager: EntityManager, userId: string, dto: ImportDataRequest): Promise<void> {
    if (dto.data.transactions.length === 0) return;

    await entityManager.save(
      Expense,
      dto.data.transactions.map((transaction) =>
        Object.assign(new Expense(), {
          id: transaction.id,
          userId,
          title: transaction.title,
          amount: transaction.amount,
          type: transaction.type,
          date: transaction.date,
          interval: null,
          startDate: null,
          endDate: null,
          vaultId: transaction.vaultId ?? null,
          sourceRecurringId: transaction.sourceRecurringId ?? null,
          createdAt: new Date(transaction.createdAt),
          updatedAt: new Date(transaction.updatedAt),
          deletedAt: null,
        }),
      ),
    );
  }

  private async upsertRecurrings(entityManager: EntityManager, userId: string, dto: ImportDataRequest): Promise<void> {
    if (dto.data.recurrings.length === 0) return;

    await entityManager.save(
      Expense,
      dto.data.recurrings.map((recurring) =>
        Object.assign(new Expense(), {
          id: recurring.id,
          userId,
          title: recurring.title,
          amount: recurring.amount,
          type: recurring.type,
          date: recurring.date ?? null,
          interval: recurring.interval,
          startDate: recurring.startDate,
          endDate: recurring.endDate ?? null,
          vaultId: recurring.vaultId ?? null,
          sourceRecurringId: null,
          createdAt: new Date(recurring.createdAt),
          updatedAt: new Date(recurring.updatedAt),
          deletedAt: recurring.deletedAt ? new Date(recurring.deletedAt) : null,
        }),
      ),
    );
  }

  private async upsertDebts(entityManager: EntityManager, userId: string, dto: ImportDataRequest): Promise<void> {
    if (dto.data.debts.length === 0) return;

    await entityManager.save(
      Debt,
      dto.data.debts.map((debt) =>
        Object.assign(new Debt(), {
          id: debt.id,
          userId,
          title: debt.title,
          amount: debt.amount,
          type: debt.type,
          notes: debt.notes ?? null,
          completed: debt.completed ?? false,
          createdAt: new Date(debt.createdAt),
          deletedAt: debt.completed || debt.discarded ? new Date(dto.exportedAt) : null,
        }),
      ),
    );
  }

  private async upsertPreference(entityManager: EntityManager, userId: string, dto: ImportDataRequest): Promise<void> {
    await entityManager.upsert(
      UserPreference,
      [
        {
          userId,
          showIncome: dto.data.preference.showIncome,
          showExpense: dto.data.preference.showExpense,
        },
      ],
      {
        conflictPaths: ['userId'],
        skipUpdateIfNoValuesChanged: true,
      },
    );

    await entityManager.restore(UserPreference, { userId });
  }

  private async replaceTransactionTags(entityManager: EntityManager, dto: ImportDataRequest): Promise<void> {
    const links = this.buildImportedTagLinks(dto.data.transactions, dto.data.recurrings);
    if (links.length === 0) return;

    await entityManager.save(
      TransactionTag,
      links.map((link) =>
        Object.assign(new TransactionTag(), {
          transactionId: link.transactionId,
          tagId: link.tagId,
          deletedAt: null,
        }),
      ),
    );
  }

  private async replaceRecurringSkips(entityManager: EntityManager, userId: string, dto: ImportDataRequest): Promise<void> {
    if (dto.data.recurringSkips.length === 0) return;

    await entityManager.save(
      RecurringOccurrenceSkip,
      dto.data.recurringSkips.map((skip) =>
        Object.assign(new RecurringOccurrenceSkip(), {
          recurringId: skip.recurringId,
          date: skip.date,
          userId,
          deletedAt: null,
        }),
      ),
    );
  }

  private buildImportedTagLinks(transactions: TransactionDto[], recurrings: RecurringDto[]): ImportedTagLink[] {
    const dedupedLinks = new Map<string, ImportedTagLink>();

    for (const transaction of transactions) {
      for (const tag of transaction.tags) {
        dedupedLinks.set(`${transaction.id}:${tag.id}`, {
          transactionId: transaction.id,
          tagId: tag.id,
        });
      }
    }

    for (const recurring of recurrings) {
      for (const tagId of this.normalizeTagIds(recurring.tagIds)) {
        dedupedLinks.set(`${recurring.id}:${tagId}`, {
          transactionId: recurring.id,
          tagId,
        });
      }
    }

    return [...dedupedLinks.values()];
  }

  private normalizeTagIds(tagIds?: string[] | null): string[] {
    if (!Array.isArray(tagIds)) {
      return [];
    }

    return [...new Set(tagIds.filter(Boolean))];
  }

  private async listDebtsForBackup(userId: string): Promise<BackupDebtDto[]> {
    const debts = await this.debts.list(userId, 'all');

    return debts.map((debt) => ({
      ...debt,
      createdAt: debt.createdAt.toISOString(),
    }));
  }

  private async listTransactionsForBackup(userId: string): Promise<BackupTransactionDto[]> {
    const transactions = await AppDataSource.getRepository(Expense).find({
      where: { userId, interval: IsNull(), date: Not(IsNull()) },
      relations: ['transactionTags', 'transactionTags.tag', 'vault'],
      order: { updatedAt: 'DESC' },
    });

    return transactions.map((transaction) => ({
      id: transaction.id,
      userId: transaction.userId,
      title: transaction.title,
      amount: parseFloat(String(transaction.amount)),
      type: transaction.type,
      date: transaction.date,
      vaultId: transaction.vaultId,
      vault: transaction.vault ? { id: transaction.vault.id, name: transaction.vault.name, icon: transaction.vault.icon } : null,
      tags: transaction.transactionTags?.map((transactionTag) => transactionTag.tag).filter((tag): tag is Tag => Boolean(tag)) ?? [],
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      sourceRecurringId: transaction.sourceRecurringId ?? null,
    }));
  }

  private async listRecurringsForBackup(userId: string): Promise<RecurringDto[]> {
    const recurrings = await AppDataSource.getRepository(Expense).find({
      where: { userId, interval: Not(IsNull()) },
      relations: ['transactionTags', 'transactionTags.tag', 'vault'],
      order: { title: 'ASC' },
      withDeleted: true,
    });

    return recurrings.map((recurring) => ({
      ...recurring,
      tagIds: recurring.transactionTags?.map((transactionTag) => transactionTag.tagId) ?? [],
      tags: recurring.transactionTags?.map((transactionTag) => transactionTag.tag).filter((tag): tag is Tag => Boolean(tag)) ?? [],
      createdAt: recurring.createdAt.toISOString(),
      updatedAt: recurring.updatedAt.toISOString(),
      deletedAt: recurring.deletedAt ? recurring.deletedAt.toISOString() : null,
    }));
  }

  private async listRecurringSkipsForBackup(userId: string): Promise<BackupRecurringSkipDto[]> {
    const skips = await AppDataSource.getRepository(RecurringOccurrenceSkip).find({
      where: { userId },
      order: { recurringId: 'ASC', date: 'ASC' },
    });

    return skips.map((skip) => ({
      recurringId: skip.recurringId,
      date: skip.date,
      userId: skip.userId,
    }));
  }
}
