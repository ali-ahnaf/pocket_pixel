import { OAuthCredentialsStatusDto, SetOAuthCredentialsInput } from '@expense-tracker/shared';
import { UserOAuthCredential } from '../entities/UserOAuthCredential.entity';
import { UserOAuthCredentialRepository } from '../repositories/user-oauth-credential.repository';
import { userOAuthCredentialRepository } from '../repositories';
import { encrypt } from '../utils/oauth-credentials-encryption.util';
import { logger } from '.';

export type { SetOAuthCredentialsInput };

/**
 * Business logic for per-user Google OAuth client credentials. The repository
 * is a pure persistence layer (never encrypts/decrypts), so this service is
 * the only place `encrypt()` is called before a write. Reads never decrypt —
 * callers only ever need a configured/not-configured boolean, never the
 * plaintext id/secret.
 */
export class UserOAuthCredentialService {
  constructor(private readonly credentials: UserOAuthCredentialRepository = userOAuthCredentialRepository) {}

  async setCredentials(userId: string, input: SetOAuthCredentialsInput): Promise<UserOAuthCredential> {
    const googleClientIdEncrypted = encrypt(input.clientId);
    const googleClientSecretEncrypted = encrypt(input.clientSecret);

    const existing = await this.credentials.findByUserId(userId);
    if (existing) {
      existing.googleClientIdEncrypted = googleClientIdEncrypted;
      existing.googleClientSecretEncrypted = googleClientSecretEncrypted;
      const saved = await this.credentials.save(existing);
      logger.info('Updated Google OAuth credentials', { userId });
      return saved;
    }

    const created = this.credentials.createEntity({ userId, googleClientIdEncrypted, googleClientSecretEncrypted });
    const saved = await this.credentials.save(created);
    logger.info('Created Google OAuth credentials', { userId });
    return saved;
  }

  async getStatus(userId: string): Promise<OAuthCredentialsStatusDto> {
    const existing = await this.credentials.findByUserId(userId);
    return { configured: existing !== null };
  }
}
