import { AiCredentialStatusDto, SetAiCredentialInput, SetAiModelInput } from '@expense-tracker/shared';
import { UserAiCredentialRepository } from '../repositories/user-ai-credential.repository';
import { userAiCredentialRepository } from '../repositories';
import { AppError } from '../errors/app-error';
import { logger } from '.';

/**
 * Business logic for the per-user, E2E-encrypted OpenRouter key + selected
 * model. The server only ever stores/returns opaque ciphertext blobs — it
 * never sees the plaintext key. Writes always whitelist fields explicitly
 * (never the raw request body) so the repository/entity only ever persist
 * the documented columns.
 */
export class UserAiCredentialService {
  constructor(private readonly credentials: UserAiCredentialRepository = userAiCredentialRepository) {}

  async getStatus(userId: string): Promise<AiCredentialStatusDto> {
    const existing = await this.credentials.findByUserId(userId);
    if (!existing) {
      return {
        hasKey: false,
        selectedModel: null,
        salt: null,
        kdfIterations: null,
        dekIv: null,
        wrappedDek: null,
        keyIv: null,
        keyCiphertext: null,
      };
    }

    return {
      hasKey: Boolean(existing.keyCiphertext),
      selectedModel: existing.selectedModel,
      salt: existing.salt,
      kdfIterations: existing.kdfIterations,
      dekIv: existing.dekIv,
      wrappedDek: existing.wrappedDek,
      keyIv: existing.keyIv,
      keyCiphertext: existing.keyCiphertext,
    };
  }

  /** Upserts the encrypted key blobs + selected model, selectively mapping only the whitelisted fields. */
  async setCredential(userId: string, input: SetAiCredentialInput): Promise<AiCredentialStatusDto> {
    await this.credentials.upsert(userId, {
      salt: input.salt,
      kdfIterations: input.kdfIterations,
      dekIv: input.dekIv,
      wrappedDek: input.wrappedDek,
      keyIv: input.keyIv,
      keyCiphertext: input.keyCiphertext,
      selectedModel: input.selectedModel ?? null,
    });
    logger.info('Saved OpenRouter key blobs', { userId });
    return this.getStatus(userId);
  }

  async setModel(userId: string, input: SetAiModelInput): Promise<AiCredentialStatusDto> {
    const updated = await this.credentials.updateModel(userId, input.selectedModel);
    if (!updated) throw new AppError('AI credential not configured', 400);

    logger.info('Updated selected AI model', { userId, selectedModel: input.selectedModel });
    return this.getStatus(userId);
  }
}
