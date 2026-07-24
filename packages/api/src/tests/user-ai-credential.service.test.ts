import type { SetAiCredentialInput, SetAiModelInput } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import type { UserAiCredential } from '../entities/UserAiCredential.entity';
import type { UserAiCredentialRepository } from '../repositories/user-ai-credential.repository';
import { UserAiCredentialService } from '../services/user-ai-credential.service';

jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

type UserAiCredentialRepositoryMock = jest.Mocked<Pick<UserAiCredentialRepository, 'findByUserId' | 'upsert' | 'updateModel'>>;

const buildCredential = (overrides: Partial<UserAiCredential> = {}): UserAiCredential =>
  ({
    id: 'cred-1',
    userId: 'user-1',
    salt: 'salt-1',
    kdfIterations: 310_000,
    dekIv: 'dek-iv-1',
    wrappedDek: 'wrapped-dek-1',
    keyIv: 'key-iv-1',
    keyCiphertext: 'key-ciphertext-1',
    selectedModel: 'openai/gpt-4o',
    ...overrides,
  }) as UserAiCredential;

describe('UserAiCredentialService', () => {
  let credentials: UserAiCredentialRepositoryMock;
  let service: UserAiCredentialService;

  beforeEach(() => {
    credentials = {
      findByUserId: jest.fn(),
      upsert: jest.fn(),
      updateModel: jest.fn(),
    };
    service = new UserAiCredentialService(credentials as unknown as UserAiCredentialRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getStatus', () => {
    it('returns the credential status shape when a row exists', async () => {
      credentials.findByUserId.mockResolvedValue(buildCredential());

      const result = await service.getStatus('user-1');

      expect(credentials.findByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        hasKey: true,
        selectedModel: 'openai/gpt-4o',
        salt: 'salt-1',
        kdfIterations: 310_000,
        dekIv: 'dek-iv-1',
        wrappedDek: 'wrapped-dek-1',
        keyIv: 'key-iv-1',
        keyCiphertext: 'key-ciphertext-1',
      });
    });

    it('reports hasKey: false when keyCiphertext is empty on an existing row', async () => {
      credentials.findByUserId.mockResolvedValue(buildCredential({ keyCiphertext: '' }));

      const result = await service.getStatus('user-1');

      expect(result.hasKey).toBe(false);
    });

    it('returns hasKey: false and all-null crypto fields when no row exists', async () => {
      credentials.findByUserId.mockResolvedValue(null);

      const result = await service.getStatus('user-1');

      expect(result).toEqual({
        hasKey: false,
        selectedModel: null,
        salt: null,
        kdfIterations: null,
        dekIv: null,
        wrappedDek: null,
        keyIv: null,
        keyCiphertext: null,
      });
    });
  });

  describe('setCredential', () => {
    it('upserts only the whitelisted fields for the given userId', async () => {
      credentials.upsert.mockResolvedValue(buildCredential());
      credentials.findByUserId.mockResolvedValue(buildCredential());

      const input: SetAiCredentialInput = {
        salt: 'new-salt',
        kdfIterations: 350_000,
        dekIv: 'new-dek-iv',
        wrappedDek: 'new-wrapped-dek',
        keyIv: 'new-key-iv',
        keyCiphertext: 'new-key-ciphertext',
        selectedModel: 'openai/gpt-5-mini',
      };

      await service.setCredential('user-1', input);

      expect(credentials.upsert).toHaveBeenCalledWith('user-1', {
        salt: 'new-salt',
        kdfIterations: 350_000,
        dekIv: 'new-dek-iv',
        wrappedDek: 'new-wrapped-dek',
        keyIv: 'new-key-iv',
        keyCiphertext: 'new-key-ciphertext',
        selectedModel: 'openai/gpt-5-mini',
      });
    });

    it('defaults selectedModel to null when omitted', async () => {
      credentials.upsert.mockResolvedValue(buildCredential({ selectedModel: null }));
      credentials.findByUserId.mockResolvedValue(buildCredential({ selectedModel: null }));

      const input: SetAiCredentialInput = {
        salt: 'salt-2',
        kdfIterations: 310_000,
        dekIv: 'dek-iv-2',
        wrappedDek: 'wrapped-dek-2',
        keyIv: 'key-iv-2',
        keyCiphertext: 'key-ciphertext-2',
      };

      await service.setCredential('user-1', input);

      expect(credentials.upsert).toHaveBeenCalledWith('user-1', {
        salt: 'salt-2',
        kdfIterations: 310_000,
        dekIv: 'dek-iv-2',
        wrappedDek: 'wrapped-dek-2',
        keyIv: 'key-iv-2',
        keyCiphertext: 'key-ciphertext-2',
        selectedModel: null,
      });
    });

    it('never forwards extra or plaintext-key-shaped fields from a malicious input object', async () => {
      credentials.upsert.mockResolvedValue(buildCredential());
      credentials.findByUserId.mockResolvedValue(buildCredential());

      const maliciousInput = {
        salt: 'salt-3',
        kdfIterations: 310_000,
        dekIv: 'dek-iv-3',
        wrappedDek: 'wrapped-dek-3',
        keyIv: 'key-iv-3',
        keyCiphertext: 'key-ciphertext-3',
        selectedModel: 'openai/gpt-4o',
        // Attacker-controlled extras that must never reach the repository.
        apiKey: 'sk-plaintext-should-never-be-stored',
        plaintextKey: 'sk-plaintext-should-never-be-stored',
        userId: 'someone-elses-user-id',
        id: 'attacker-chosen-id',
      } as unknown as SetAiCredentialInput;

      await service.setCredential('user-1', maliciousInput);

      const [, writtenFields] = credentials.upsert.mock.calls[0];

      expect(writtenFields).toEqual({
        salt: 'salt-3',
        kdfIterations: 310_000,
        dekIv: 'dek-iv-3',
        wrappedDek: 'wrapped-dek-3',
        keyIv: 'key-iv-3',
        keyCiphertext: 'key-ciphertext-3',
        selectedModel: 'openai/gpt-4o',
      });
      expect(writtenFields).not.toHaveProperty('apiKey');
      expect(writtenFields).not.toHaveProperty('plaintextKey');
      expect(writtenFields).not.toHaveProperty('id');
      expect(Object.keys(writtenFields)).toHaveLength(7);
    });

    it('returns the fresh status after upserting', async () => {
      credentials.upsert.mockResolvedValue(buildCredential());
      const statusAfterWrite = buildCredential({ selectedModel: 'openai/gpt-4o' });
      credentials.findByUserId.mockResolvedValue(statusAfterWrite);

      const input: SetAiCredentialInput = {
        salt: 'salt-1',
        kdfIterations: 310_000,
        dekIv: 'dek-iv-1',
        wrappedDek: 'wrapped-dek-1',
        keyIv: 'key-iv-1',
        keyCiphertext: 'key-ciphertext-1',
        selectedModel: 'openai/gpt-4o',
      };

      const result = await service.setCredential('user-1', input);

      expect(result).toEqual({
        hasKey: true,
        selectedModel: 'openai/gpt-4o',
        salt: 'salt-1',
        kdfIterations: 310_000,
        dekIv: 'dek-iv-1',
        wrappedDek: 'wrapped-dek-1',
        keyIv: 'key-iv-1',
        keyCiphertext: 'key-ciphertext-1',
      });
    });
  });

  describe('setModel', () => {
    it('updates only the selected model for the given userId', async () => {
      credentials.updateModel.mockResolvedValue(buildCredential({ selectedModel: 'openai/gpt-5-mini' }));
      credentials.findByUserId.mockResolvedValue(buildCredential({ selectedModel: 'openai/gpt-5-mini' }));

      const input: SetAiModelInput = { selectedModel: 'openai/gpt-5-mini' };

      const result = await service.setModel('user-1', input);

      expect(credentials.updateModel).toHaveBeenCalledWith('user-1', 'openai/gpt-5-mini');
      expect(result.selectedModel).toBe('openai/gpt-5-mini');
    });

    it('throws a 400 AppError when no credential row exists yet', async () => {
      credentials.updateModel.mockResolvedValue(null);

      await expect(service.setModel('user-1', { selectedModel: 'openai/gpt-4o' })).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 400,
        message: 'AI credential not configured',
      });

      expect(credentials.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('owner-scoping', () => {
    it('flows the caller-supplied userId through to every repository call', async () => {
      credentials.findByUserId.mockResolvedValue(buildCredential({ userId: 'user-42' }));
      credentials.upsert.mockResolvedValue(buildCredential({ userId: 'user-42' }));
      credentials.updateModel.mockResolvedValue(buildCredential({ userId: 'user-42' }));

      await service.getStatus('user-42');
      expect(credentials.findByUserId).toHaveBeenLastCalledWith('user-42');

      await service.setCredential('user-42', {
        salt: 's',
        kdfIterations: 310_000,
        dekIv: 'i',
        wrappedDek: 'w',
        keyIv: 'ki',
        keyCiphertext: 'kc',
      });
      expect(credentials.upsert).toHaveBeenCalledWith('user-42', expect.anything());

      await service.setModel('user-42', { selectedModel: 'openai/gpt-4o' });
      expect(credentials.updateModel).toHaveBeenCalledWith('user-42', 'openai/gpt-4o');
    });
  });
});
