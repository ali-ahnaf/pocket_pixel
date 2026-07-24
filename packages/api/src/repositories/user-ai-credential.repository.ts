import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { UserAiCredential } from '../entities/UserAiCredential.entity';

/** Whitelisted, already-validated crypto blob fields + selected model — never the raw request body. */
export interface UserAiCredentialFields {
  salt: string;
  kdfIterations: number;
  dekIv: string;
  wrappedDek: string;
  keyIv: string;
  keyCiphertext: string;
  selectedModel: string | null;
}

/**
 * Data-access layer for the per-user, E2E-encrypted OpenRouter key blobs. This
 * repository is a pure persistence layer only — it never interprets, encrypts,
 * or decrypts the crypto fields; callers pass/read opaque ciphertext strings.
 *
 * The TypeORM repository is resolved lazily per call so the class can be
 * constructed before the DataSource is initialized, and so a different
 * DataSource can be injected in tests.
 */
export class UserAiCredentialRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<UserAiCredential> {
    return this.dataSource.getRepository(UserAiCredential);
  }

  findByUserId(userId: string): Promise<UserAiCredential | null> {
    return this.repo.findOneBy({ userId });
  }

  /** Upserts the encrypted key blobs + selected model for a user, keyed by `userId`. */
  async upsert(userId: string, fields: UserAiCredentialFields): Promise<UserAiCredential> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      Object.assign(existing, fields);
      return this.repo.save(existing);
    }

    const created = this.repo.create({ userId, ...fields });
    return this.repo.save(created);
  }

  /** Updates only the selected model for an existing row. Returns `null` if no row exists yet. */
  async updateModel(userId: string, selectedModel: string): Promise<UserAiCredential | null> {
    const existing = await this.findByUserId(userId);
    if (!existing) return null;

    existing.selectedModel = selectedModel;
    return this.repo.save(existing);
  }
}
