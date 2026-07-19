import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { ProcessedGmailMessage } from '../entities/ProcessedGmailMessage.entity';

/**
 * Idempotency ledger for the Gmail push pipeline. `exists` guards a message from
 * being parsed twice; `record` marks it handled (whether or not it produced a
 * transaction). The unique `(userId, gmailMessageId)` index is the backstop
 * against concurrent double-inserts. Resolved lazily so it can be built before
 * the DataSource initializes and injected in tests.
 */
export class ProcessedGmailMessageRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<ProcessedGmailMessage> {
    return this.dataSource.getRepository(ProcessedGmailMessage);
  }

  async exists(userId: string, gmailMessageId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { userId, gmailMessageId } });
    return count > 0;
  }

  async record(userId: string, gmailMessageId: string): Promise<void> {
    await this.repo.save(this.repo.create({ userId, gmailMessageId }));
  }
}
