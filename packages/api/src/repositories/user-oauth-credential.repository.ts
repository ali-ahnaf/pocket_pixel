import { DataSource, Repository, UpdateResult } from 'typeorm';
import { AppDataSource } from '../data-source';
import { UserOAuthCredential } from '../entities/UserOAuthCredential.entity';

/**
 * Data-access layer for per-user Google OAuth credentials. This repository is
 * a thin persistence layer only — it never encrypts or decrypts. Callers must
 * pass already-encrypted values for `googleClientIdEncrypted` /
 * `googleClientSecretEncrypted` (see `utils/oauth-credentials-encryption.util.ts`)
 * and are responsible for decrypting whatever is read back.
 *
 * The TypeORM repository is resolved lazily per call so the class can be
 * constructed before the DataSource is initialized, and so a different
 * DataSource can be injected in tests.
 */
export class UserOAuthCredentialRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<UserOAuthCredential> {
    return this.dataSource.getRepository(UserOAuthCredential);
  }

  findByUserId(userId: string): Promise<UserOAuthCredential | null> {
    return this.repo.findOneBy({ userId });
  }

  /** Resolves a credential by the connected Gmail address (used to route push notifications). */
  findByGoogleEmail(googleEmail: string): Promise<UserOAuthCredential | null> {
    return this.repo.findOneBy({ googleEmail });
  }

  createEntity(data: Partial<UserOAuthCredential>): UserOAuthCredential {
    return this.repo.create(data);
  }

  save(credential: UserOAuthCredential): Promise<UserOAuthCredential> {
    return this.repo.save(credential);
  }

  /** Soft-deletes the credential row scoped to its owning user. */
  softDeleteForUser(userId: string): Promise<UpdateResult> {
    return this.repo.softDelete({ userId });
  }
}
