import { PendingExpenseEmailDto, PendingGmailExpenseDto } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { extractMessageContent } from '../lib/gmail/message';
import { PendingGmailExpenseRepository } from '../repositories/pending-gmail-expense.repository';
import { TagsRepository } from '../repositories/tags.repository';
import { pendingGmailExpenseRepository, tagsRepository } from '../repositories';
import type { AiService, EmailExtractOutcome } from './ai.service';
import type { GmailService } from './gmail.service';
import type { TransactionsService } from './transactions.service';
import { aiService, gmailService, logger, transactionsService } from '.';

/**
 * Business logic for the Gmail bank-alert review queue. Port of
 * packages/api/src/services/pending-gmail-expense.service.ts, plus `parse`,
 * which the web runs in its review modal: the AI extraction, creating the
 * transaction and resolving the item now live here so screens only call one method.
 */
export class PendingGmailExpenseService {
  constructor(
    private readonly pending: PendingGmailExpenseRepository = pendingGmailExpenseRepository,
    private readonly tags: TagsRepository = tagsRepository,
    private readonly gmail: GmailService = gmailService,
    private readonly ai: AiService = aiService,
    private readonly transactions: TransactionsService = transactionsService,
  ) {}

  async list(userId: string): Promise<PendingGmailExpenseDto[]> {
    const rows = await this.pending.findManyForUser(userId);
    return rows.map((row) => ({
      id: row.id,
      gmailMessageId: row.gmailMessageId,
      vaultId: row.vaultId,
      vaultName: row.vault?.name ?? 'Unknown vault',
      subject: row.subject ?? null,
      guidanceHint: row.guidanceHint,
    }));
  }

  /** Re-fetches the Gmail message body for review. Persists nothing. */
  async getEmail(userId: string, id: string): Promise<PendingExpenseEmailDto> {
    const row = await this.pending.findByIdForUser(userId, id);
    if (!row) throw new AppError('Pending expense not found', 404);

    const message = await this.gmail.fetchMessage(userId, row.gmailMessageId, 'full');
    if (!message) throw new AppError('This email is no longer in Gmail. Dismiss it.', 404);

    const content = extractMessageContent(message);
    return {
      from: content.from,
      subject: content.subject,
      bodyText: content.bodyText,
      emailDate: content.emailDate ?? new Date().toISOString(),
    };
  }

  /**
   * Runs the AI extractor on the reviewed email and, on a match, creates the
   * transaction in the item's vault and resolves the item. Any other outcome
   * leaves the item in the queue.
   */
  async parse(userId: string, id: string, email: PendingExpenseEmailDto): Promise<EmailExtractOutcome> {
    const row = await this.pending.findByIdForUser(userId, id);
    if (!row) throw new AppError('Pending expense not found', 404);

    const tags = await this.tags.findManyForUser(userId);
    const outcome = await this.ai.extractTransactionFromEmail(email, tags, row.guidanceHint);
    if (outcome.status !== 'success') return outcome;

    const { title, amount, type, date, tagIds } = outcome.parsed;
    await this.transactions.create(userId, { title, amount, type, date, tagIds, vaultId: row.vaultId });
    await this.resolve(userId, id);
    return outcome;
  }

  /** Soft-deletes the pending row, scoped to `userId`. Used both on successful parse and on dismiss. */
  async resolve(userId: string, id: string): Promise<void> {
    const row = await this.pending.findByIdForUser(userId, id);
    if (!row) throw new AppError('Pending expense not found', 404);

    await this.pending.softDelete(userId, id);
    logger.info('Resolved pending Gmail expense', { userId, id });
  }
}
