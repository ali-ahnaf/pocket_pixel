import { CreateRecurringInput, UpdateRecurringInput, RecurringDto, OccurrenceDto } from '@expense-tracker/shared';
import { Expense, RecurrenceInterval } from '../entities/Expense.entity';
import { Tag } from '../entities/Tag.entity';
import { AppError } from '../errors/app-error';
import { RecurringRepository } from '../repositories/recurring.repository';
import { recurringRepository } from '../repositories';
import { cancelRecurring, scheduleRecurring } from '../scheduler/recurring-scheduler';
import { logger, tagsService } from '.';

export type { CreateRecurringInput, UpdateRecurringInput, RecurringDto, OccurrenceDto };

/**
 * Business logic for recurring expenses ("quests"): templates, their generated
 * occurrences, skips and applications. The repository is injected (defaults to
 * the shared singleton) so the service can be unit-tested against a mock.
 */
export class RecurringService {
  constructor(private readonly recurring: RecurringRepository = recurringRepository) {}

  async list(userId: string): Promise<RecurringDto[]> {
    const quests = await this.recurring.findManyForUser(userId);
    return quests.map((quest) => {
      const transactionTags = quest.transactionTags ?? [];
      const tags = transactionTags.map((tt) => tt.tag).filter((tag): tag is Tag => Boolean(tag));
      const tagIds = transactionTags.map((tt) => tt.tagId);
      return {
        ...quest,
        tagIds,
        tags,
        createdAt: quest.createdAt.toISOString(),
        updatedAt: quest.updatedAt.toISOString(),
        deletedAt: quest.deletedAt ? quest.deletedAt.toISOString() : null,
      };
    });
  }

  async create(userId: string, input: CreateRecurringInput): Promise<RecurringDto | null> {
    const tagIds = this.normalizeTagIds(input.tagIds);
    const hasValidTags = await tagsService.ensureUserTagsExist(userId, tagIds);
    if (!hasValidTags) {
      throw new AppError('One or more tags are invalid', 400);
    }

    const startDate = input.startDate;
    const endDate = input.endDate ?? this.defaultEndDate(startDate);

    const expense = this.recurring.createEntity({
      userId,
      title: input.title,
      amount: input.amount,
      type: input.type,
      interval: input.interval,
      startDate,
      endDate,
      vaultId: input.vaultId ?? null,
    });
    const saved = await this.recurring.save(expense);
    await this.recurring.replaceTags(saved.id, tagIds);

    scheduleRecurring(saved);
    logger.info('Created recurring quest', { userId, recurringId: saved.id });

    const withRelations = await this.recurring.findOneWithRelations(userId, saved.id);
    if (!withRelations) return null;
    const relatedTags = withRelations.transactionTags ?? [];
    const tags = relatedTags.map((tt) => tt.tag).filter((tag): tag is Tag => Boolean(tag));
    const returnTagIds = relatedTags.map((tt) => tt.tagId);
    return {
      ...withRelations,
      tagIds: returnTagIds,
      tags,
      createdAt: withRelations.createdAt.toISOString(),
      updatedAt: withRelations.updatedAt.toISOString(),
      deletedAt: withRelations.deletedAt ? withRelations.deletedAt.toISOString() : null,
    };
  }

  async update(userId: string, id: string, input: UpdateRecurringInput): Promise<RecurringDto | null> {
    const expense = await this.recurring.findOneForUser(userId, id);
    if (!expense) {
      throw new AppError('Recurring quest not found', 404);
    }

    const shouldUpdateTags = 'tagIds' in input;
    const tagIds = shouldUpdateTags ? this.normalizeTagIds(input.tagIds) : null;

    if (tagIds) {
      const hasValidTags = await tagsService.ensureUserTagsExist(userId, tagIds);
      if (!hasValidTags) {
        throw new AppError('One or more tags are invalid', 400);
      }
    }

    Object.assign(expense, {
      title: input.title ?? expense.title,
      amount: input.amount ?? expense.amount,
      type: input.type ?? expense.type,
      interval: input.interval ?? expense.interval,
      startDate: input.startDate !== undefined ? input.startDate : expense.startDate,
      endDate: input.endDate !== undefined ? input.endDate : expense.endDate,
      vaultId: input.vaultId !== undefined ? input.vaultId : expense.vaultId,
    });
    await this.recurring.save(expense);

    if (tagIds) {
      await this.recurring.replaceTags(expense.id, tagIds);
    }

    const updated = await this.recurring.findOneWithRelations(userId, id);
    if (updated) {
      const today = new Date().toISOString().slice(0, 10);
      if (updated.endDate && today > updated.endDate) {
        cancelRecurring(updated.id);
      } else {
        scheduleRecurring(updated);
      }
    }

    logger.info('Updated recurring quest', { userId, recurringId: id });
    if (!updated) return null;
    const relatedTags = updated.transactionTags ?? [];
    const tags = relatedTags.map((tt) => tt.tag).filter((tag): tag is Tag => Boolean(tag));
    const returnTagIds = relatedTags.map((tt) => tt.tagId);
    return {
      ...updated,
      tagIds: returnTagIds,
      tags,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const expense = await this.recurring.findOneForUser(userId, id);
    if (!expense) {
      throw new AppError('Recurring quest not found', 404);
    }

    cancelRecurring(expense.id);
    await this.recurring.remove(expense);
    logger.info('Deleted recurring quest', { userId, recurringId: id });
  }

  /** Pending (not yet applied or skipped) occurrences for a given month. */
  async occurrences(userId: string, year: number, month: number): Promise<OccurrenceDto[]> {
    const quests = await this.recurring.findActiveForUser(userId);
    if (quests.length === 0) return [];

    const questIds = quests.map((quest) => quest.id);
    const applied = await this.recurring.findAppliedOccurrences(userId, questIds);
    const skips = await this.recurring.findSkips(userId, questIds);

    const resolved = new Set<string>();
    for (const tx of applied) resolved.add(`${tx.sourceRecurringId}:${tx.date}`);
    for (const skip of skips) resolved.add(`${skip.recurringId}:${skip.date}`);

    const result: OccurrenceDto[] = [];
    for (const quest of quests) {
      const occurrences = this.computeOccurrencesInMonth(quest.interval, quest.startDate, quest.endDate, year, month);
      const tags = (quest.transactionTags ?? []).map((tt) => tt.tag).filter((tag): tag is Tag => Boolean(tag));
      for (const date of occurrences) {
        if (resolved.has(`${quest.id}:${date}`)) continue;
        result.push({
          recurringId: quest.id,
          date,
          title: quest.title,
          amount: parseFloat(String(quest.amount)),
          type: quest.type,
          vaultId: quest.vaultId,
          vault: quest.vault ? { id: quest.vault.id, name: quest.vault.name, icon: quest.vault.icon } : null,
          tags,
        });
      }
    }

    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }

  async skip(userId: string, id: string, date: string): Promise<void> {
    const quest = await this.requireOccurrence(userId, id, date);

    const existing = await this.recurring.findSkip(quest.id, date);
    if (!existing) {
      await this.recurring.saveSkip(userId, quest.id, date);
    }
    logger.info('Skipped recurring occurrence', { userId, recurringId: id, date });
  }

  async apply(userId: string, id: string, date: string): Promise<{ id: string }> {
    const quest = await this.requireOccurrence(userId, id, date);

    const existing = await this.recurring.findAppliedOccurrence(userId, quest.id, date);
    if (existing) {
      throw new AppError('Occurrence already applied', 409);
    }

    const transaction = this.recurring.createEntity({
      userId,
      title: quest.title,
      amount: quest.amount,
      type: quest.type,
      date,
      vaultId: quest.vaultId,
      sourceRecurringId: quest.id,
    });
    const saved = await this.recurring.save(transaction);

    const tagIds = (quest.transactionTags ?? []).map((tt) => tt.tagId);
    await this.recurring.addTags(saved.id, tagIds);

    logger.info('Applied recurring occurrence', { userId, recurringId: id, date, transactionId: saved.id });
    return { id: saved.id };
  }

  /** Load a quest and assert that `date` is one of its valid occurrences. */
  private async requireOccurrence(userId: string, id: string, date: string): Promise<Expense> {
    const quest = await this.recurring.findOneWithRelations(userId, id);
    if (!quest || !quest.interval) {
      throw new AppError('Recurring quest not found', 404);
    }

    const [year, month] = date.split('-').map(Number);
    const validOccurrences = this.computeOccurrencesInMonth(quest.interval, quest.startDate, quest.endDate, year, month);
    if (!validOccurrences.includes(date)) {
      throw new AppError('Date is not a valid occurrence for this quest', 400);
    }

    return quest;
  }

  private defaultEndDate(startDate: string): string {
    const d = this.parseDateOnly(startDate);
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    d.setUTCDate(d.getUTCDate() - 1);
    return this.formatDate(d);
  }

  private normalizeTagIds(tagIds?: string[] | null): string[] {
    if (Array.isArray(tagIds)) {
      return [...new Set(tagIds.filter(Boolean))];
    }
    return [];
  }

  private computeOccurrencesInMonth(interval: RecurrenceInterval, startDate: string, endDate: string | null, year: number, month: number): string[] {
    if (!interval || !startDate) return [];

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const monthEnd = new Date(Date.UTC(year, month - 1, lastDayOfMonth));

    const start = this.parseDateOnly(startDate);
    const end = endDate ? this.parseDateOnly(endDate) : null;

    const rangeStart = start > monthStart ? start : monthStart;
    const rangeEnd = end && end < monthEnd ? end : monthEnd;

    if (rangeStart > rangeEnd) return [];

    const dates: string[] = [];

    switch (interval) {
      case 'daily': {
        const cur = new Date(rangeStart);
        while (cur <= rangeEnd) {
          dates.push(this.formatDate(cur));
          cur.setUTCDate(cur.getUTCDate() + 1);
        }
        break;
      }
      case 'weekly': {
        const cur = new Date(start);
        while (cur < rangeStart) cur.setUTCDate(cur.getUTCDate() + 7);
        while (cur <= rangeEnd) {
          dates.push(this.formatDate(cur));
          cur.setUTCDate(cur.getUTCDate() + 7);
        }
        break;
      }
      case 'monthly': {
        const dom = start.getUTCDate();
        if (dom <= lastDayOfMonth) {
          const candidate = new Date(Date.UTC(year, month - 1, dom));
          if (candidate >= rangeStart && candidate <= rangeEnd) {
            dates.push(this.formatDate(candidate));
          }
        }
        break;
      }
      case 'yearly': {
        if (start.getUTCMonth() === month - 1) {
          const dom = start.getUTCDate();
          if (dom <= lastDayOfMonth) {
            const candidate = new Date(Date.UTC(year, month - 1, dom));
            if (candidate >= rangeStart && candidate <= rangeEnd) {
              dates.push(this.formatDate(candidate));
            }
          }
        }
        break;
      }
    }

    return dates;
  }

  private formatDate(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseDateOnly(s: string): Date {
    return new Date(s.slice(0, 10) + 'T00:00:00Z');
  }
}
